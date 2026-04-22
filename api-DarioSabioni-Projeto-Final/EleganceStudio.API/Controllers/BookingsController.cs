using EleganceStudio.API.Data;
using EleganceStudio.API.DTOs;
using EleganceStudio.API.Hubs;
using EleganceStudio.API.Interfaces;
using EleganceStudio.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using StackExchange.Redis;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace EleganceStudio.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BookingsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IDatabase _redis;
    private readonly ISmsService _sms;
    private readonly IHubContext<BookingHub> _hub;

    public BookingsController(
        AppDbContext db,
        IConnectionMultiplexer redis,
        ISmsService sms,
        IHubContext<BookingHub> hub)
    {
        _db = db;
        _redis = redis.GetDatabase();
        _sms = sms;
        _hub = hub;
    }

    // ─── HELPER: Mapear Booking → BookingPublicDto ───────────────────────
    private static BookingPublicDto ToPublicDto(Booking b) => new()
    {
        Id = b.Id,
        BarberName = b.Barber.Name,
        ServiceName = b.Service.Name,
        BookingDate = b.BookingDate,
        BookingTime = b.BookingTime,
        Status = b.Status,
        ClientName = b.ClientName
    };

    // ─── HELPER: Mapear Booking → BookingBarberDto ───────────────────────
    private static BookingBarberDto ToBarberDto(Booking b) => new()
    {
        Id = b.Id,
        BarberName = b.Barber.Name,
        ServiceName = b.Service.Name,
        ServiceDurationMinutes = b.Service.DurationMinutes,
        BookingDate = b.BookingDate,
        BookingTime = b.BookingTime,
        Status = b.Status,
        ClientName = b.ClientName,
        ClientPhone = b.ClientPhone,
        CreatedAt = b.CreatedAt,
        UpdatedAt = b.UpdatedAt
    };

    // ─── HELPER: Fuso horário de Portugal ────────────────────────────────
    private static readonly TimeZoneInfo LisbonTz =
        TimeZoneInfo.FindSystemTimeZoneById("Europe/Lisbon");

    private static DateOnly TodayInLisbon() =>
        DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, LisbonTz));

    // ─── HELPER: Calcular slots ocupados por uma marcação ────────────────
    private static List<TimeOnly> GetOccupiedSlots(TimeOnly start, int durationMinutes, int slotInterval = 30)
    {
        var slots = new List<TimeOnly>();
        for (int m = 0; m < durationMinutes; m += slotInterval)
            slots.Add(start.AddMinutes(m));
        return slots;
    }

    // ─── HELPER: Validar que barbeiro do JWT == barberId do URL ──────────
    private bool IsAuthorizedForBarber(Guid barberId)
    {
        if (User.IsInRole("Admin")) return true;
        var tokenBarberId = User.FindFirstValue("barberId");
        return tokenBarberId != null && Guid.TryParse(tokenBarberId, out var tid) && tid == barberId;
    }

    // ═════════════════════════════════════════════════════════════════════
    //  ENDPOINTS PÚBLICOS
    // ═════════════════════════════════════════════════════════════════════

    /// <summary>
    /// POST /api/bookings — Criar marcação (atómico, com confirmação SMS)
    /// </summary>
    [HttpPost]
    [EnableRateLimiting("bookings")]
    public async Task<IActionResult> Create([FromBody] BookingRequestDto dto)
    {
        // 1. Validar existência do barbeiro e serviço
        var barber = await _db.Barbers.FindAsync(dto.BarberId);
        if (barber == null) return NotFound(new ProblemDetails
        { Status = 404, Title = "Barbeiro não encontrado." });

        var service = await _db.Services.FindAsync(dto.ServiceId);
        if (service == null) return NotFound(new ProblemDetails
        { Status = 404, Title = "Serviço não encontrado." });

        // 2. Validar data
        var today = TodayInLisbon();
        if (dto.BookingDate < today)
            return BadRequest(new ProblemDetails
            { Status = 400, Title = "Não é possível marcar no passado." });
        if (dto.BookingDate > today.AddDays(60))
            return BadRequest(new ProblemDetails
            { Status = 400, Title = "Máximo 60 dias no futuro." });

        // 3. Validar slot (minutos devem ser 00 ou 30)
        if (dto.BookingTime.Minute % 30 != 0)
            return BadRequest(new ProblemDetails
            { Status = 400, Title = "Horário inválido. Use intervalos de 30 minutos." });

        // 4. Transacção atómica — RepeatableRead + FOR UPDATE
        await using var transaction = await _db.Database
            .BeginTransactionAsync(System.Data.IsolationLevel.RepeatableRead);

        try
        {
            // SELECT FOR UPDATE: bloqueia as linhas de marcações activas deste barbeiro/dia
            var activeBookings = await _db.Bookings
                .FromSqlInterpolated($@"
                    SELECT * FROM ""Bookings""
                    WHERE ""BarberId"" = {dto.BarberId}
                      AND ""BookingDate"" = {dto.BookingDate}
                      AND ""Status"" != 'Cancelled'
                      AND ""IsDeleted"" = false
                    FOR UPDATE")
                .Include(b => b.Service)
                .ToListAsync();

            // 5. Verificar sobreposição (incluindo slots intermédios)
            var requestedSlots = GetOccupiedSlots(dto.BookingTime,
                service.DurationMinutes);

            foreach (var existing in activeBookings)
            {
                var existingSlots = GetOccupiedSlots(existing.BookingTime,
                    existing.Service.DurationMinutes);

                if (requestedSlots.Any(rs => existingSlots.Contains(rs)))
                {
                    await transaction.RollbackAsync();
                    return Conflict(new ProblemDetails
                    {
                        Status = 409,
                        Title = "Slot indisponível",
                        Detail = "Este horário já foi reservado. Por favor escolha outro."
                    });
                }
            }

            // 6. INSERT
            var booking = new Booking
            {
                ClientName = dto.ClientName,
                ClientPhone = dto.ClientPhone,
                BarberId = dto.BarberId,
                ServiceId = dto.ServiceId,
                BookingDate = dto.BookingDate,
                BookingTime = dto.BookingTime,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow
            };

            _db.Bookings.Add(booking);
            await _db.SaveChangesAsync();
            await transaction.CommitAsync();

            // 7. Token de confirmação (Redis, TTL 15 min)
            var token = Guid.NewGuid().ToString();
            await _redis.StringSetAsync(
                $"confirm:{token}",
                booking.Id.ToString(),
                TimeSpan.FromMinutes(15));

            // 8. SMS ao cliente com link de confirmação
            var confirmLink = $"https://elegancestudio.pt/confirmar/{token}";
            await _sms.SendToClientAsync(dto.ClientPhone,
                $"Marcação recebida! Confirme aqui: {confirmLink} (válido 15 min)");

            // 9. SMS ao barbeiro
            await _sms.SendToBarberAsync(barber.Phone,
                $"Nova marcação! {dto.ClientName} — {service.Name} — " +
                $"{dto.BookingDate} às {dto.BookingTime:HH:mm}");

            // 10. SignalR — notificar barbeiro (agenda)
            var full = await _db.Bookings
                .Include(b => b.Barber)
                .Include(b => b.Service)
                .FirstAsync(b => b.Id == booking.Id);

            await _hub.Clients
                .Group($"barber-{dto.BarberId}")
                .SendAsync("NewBooking", ToBarberDto(full));

            // 11. SignalR — notificar clientes (slots desaparecem)
            var dateStr = dto.BookingDate.ToString("yyyy-MM-dd");
            foreach (var slot in requestedSlots)
            {
                await _hub.Clients
                    .Group($"availability-{dto.BarberId}-{dateStr}")
                    .SendAsync("SlotUnavailable", slot.ToString("HH:mm"));
            }

            return CreatedAtAction(nameof(GetById), new { id = booking.Id },
                ToPublicDto(full));
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    /// <summary>
    /// GET /api/bookings/{id} — Detalhe de uma marcação (público)
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var booking = await _db.Bookings
            .Include(b => b.Barber)
            .Include(b => b.Service)
            .FirstOrDefaultAsync(b => b.Id == id && !b.IsDeleted);

        if (booking == null) return NotFound();
        return Ok(ToPublicDto(booking));
    }

    /// <summary>
    /// GET /api/bookings/lookup?phone=... — Consulta por telefone (público)
    /// Chave Redis: SHA-256 do telefone (PII protegida)
    /// </summary>
    [HttpGet("lookup")]
    [EnableRateLimiting("lookup")]
    public async Task<IActionResult> Lookup([FromQuery] string phone)
    {
        if (string.IsNullOrWhiteSpace(phone))
            return Ok(Array.Empty<BookingPublicDto>());

        // Cache Redis com SHA-256 do telefone (nunca plaintext em logs/keys)
        var hashBytes = SHA256.HashData(Encoding.UTF8.GetBytes(phone));
        var cacheKey = $"lookup:{Convert.ToHexString(hashBytes)}";

        var cached = await _redis.StringGetAsync(cacheKey);
        if (cached.HasValue)
        {
            // ✅ FIX: cast explícito para string — RedisValue é ambíguo
            var cachedResult = System.Text.Json.JsonSerializer
                .Deserialize<List<BookingPublicDto>>((string)cached!);
            return Ok(cachedResult);
        }

        // Resposta genérica: número inválido e sem marcações devolvem 200 []
        var bookings = await _db.Bookings
            .Include(b => b.Barber)
            .Include(b => b.Service)
            .Where(b => b.ClientPhone == phone
                     && b.Status != "Cancelled"
                     && !b.IsDeleted)
            .OrderByDescending(b => b.BookingDate)
            .ThenByDescending(b => b.BookingTime)
            .ToListAsync();

        var result = bookings.Select(ToPublicDto).ToList();

        // Cache 2 minutos
        await _redis.StringSetAsync(cacheKey,
            System.Text.Json.JsonSerializer.Serialize(result),
            TimeSpan.FromMinutes(2));

        return Ok(result);
    }

    /// <summary>
    /// GET /api/bookings/confirm/{token} — Confirmação via link SMS (uso único)
    /// </summary>
    [HttpGet("confirm/{token}")]
    public async Task<IActionResult> ConfirmByToken(string token)
    {
        // 1. Buscar token na Redis
        var bookingIdStr = await _redis.StringGetAsync($"confirm:{token}");
        if (!bookingIdStr.HasValue)
            return NotFound(new ProblemDetails
            { Status = 404, Title = "Link inválido ou expirado." });

        // 2. Apagar imediatamente (uso único)
        await _redis.KeyDeleteAsync($"confirm:{token}");

        // 3. Actualizar marcação
        // ✅ FIX: cast explícito para string — RedisValue é ambíguo com Guid.Parse
        var bookingId = Guid.Parse((string)bookingIdStr!);
        var booking = await _db.Bookings
            .Include(b => b.Barber)
            .Include(b => b.Service)
            .FirstOrDefaultAsync(b => b.Id == bookingId);

        if (booking == null)
            return NotFound(new ProblemDetails
            { Status = 404, Title = "Marcação não encontrada." });

        booking.Status = "Confirmed";
        booking.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        // 4. SMS ao barbeiro
        await _sms.SendToBarberAsync(booking.Barber.Phone,
            $"Marcação confirmada! {booking.ClientName} — {booking.Service.Name} — " +
            $"{booking.BookingDate} às {booking.BookingTime:HH:mm}");

        // 5. SignalR — actualizar agenda do barbeiro
        await _hub.Clients
            .Group($"barber-{booking.BarberId}")
            .SendAsync("BookingUpdated", ToBarberDto(booking));

        return Ok(ToPublicDto(booking));
    }

    // ═════════════════════════════════════════════════════════════════════
    //  ENDPOINTS AUTENTICADOS — BARBEIRO / ADMIN
    // ═════════════════════════════════════════════════════════════════════

    /// <summary>
    /// GET /api/bookings/barber/{barberId} — Agenda completa do barbeiro
    /// </summary>
    [HttpGet("barber/{barberId}")]
    [Authorize(Roles = "Barber,Admin")]
    public async Task<IActionResult> GetByBarber(Guid barberId)
    {
        if (!IsAuthorizedForBarber(barberId))
            return Forbid();

        var bookings = await _db.Bookings
            .Include(b => b.Barber)
            .Include(b => b.Service)
            .Where(b => b.BarberId == barberId && !b.IsDeleted)
            .OrderByDescending(b => b.BookingDate)
            .ThenBy(b => b.BookingTime)
            .ToListAsync();

        return Ok(bookings.Select(ToBarberDto));
    }

    /// <summary>
    /// GET /api/bookings/barber/{barberId}/day/{date} — Marcações de um dia
    /// </summary>
    [HttpGet("barber/{barberId}/day/{date}")]
    [Authorize(Roles = "Barber,Admin")]
    public async Task<IActionResult> GetByBarberDay(Guid barberId, DateOnly date)
    {
        if (!IsAuthorizedForBarber(barberId))
            return Forbid();

        var bookings = await _db.Bookings
            .Include(b => b.Barber)
            .Include(b => b.Service)
            .Where(b => b.BarberId == barberId
                     && b.BookingDate == date
                     && !b.IsDeleted)
            .OrderBy(b => b.BookingTime)
            .ToListAsync();

        return Ok(bookings.Select(ToBarberDto));
    }

    /// <summary>
    /// PUT /api/bookings/{id}/confirm — Barbeiro confirma marcação
    /// </summary>
    [HttpPut("{id}/confirm")]
    [Authorize(Roles = "Barber,Admin")]
    public async Task<IActionResult> ConfirmByBarber(Guid id)
    {
        var booking = await _db.Bookings
            .Include(b => b.Barber)
            .Include(b => b.Service)
            .FirstOrDefaultAsync(b => b.Id == id && !b.IsDeleted);

        if (booking == null) return NotFound();
        if (!IsAuthorizedForBarber(booking.BarberId)) return Forbid();

        booking.Status = "Confirmed";
        booking.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        // SMS ao cliente
        await _sms.SendToClientAsync(booking.ClientPhone,
            $"A sua marcação foi confirmada! {booking.Service.Name} — " +
            $"{booking.BookingDate} às {booking.BookingTime:HH:mm}. Obrigado!");

        // SignalR
        await _hub.Clients
            .Group($"barber-{booking.BarberId}")
            .SendAsync("BookingUpdated", ToBarberDto(booking));

        return Ok(ToBarberDto(booking));
    }

    /// <summary>
    /// PUT /api/bookings/{id}/cancel — Barbeiro cancela marcação
    /// </summary>
    [HttpPut("{id}/cancel")]
    [Authorize(Roles = "Barber,Admin")]
    public async Task<IActionResult> Cancel(Guid id)
    {
        var booking = await _db.Bookings
            .Include(b => b.Barber)
            .Include(b => b.Service)
            .FirstOrDefaultAsync(b => b.Id == id && !b.IsDeleted);

        if (booking == null) return NotFound();
        if (!IsAuthorizedForBarber(booking.BarberId)) return Forbid();

        booking.Status = "Cancelled";
        booking.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        // SMS ao cliente
        await _sms.SendToClientAsync(booking.ClientPhone,
            $"A sua marcação de {booking.BookingDate} às {booking.BookingTime:HH:mm} " +
            $"foi cancelada. Contacte-nos para reagendar.");

        // SignalR — slot(s) voltam a ficar disponíveis
        var dateStr = booking.BookingDate.ToString("yyyy-MM-dd");
        var freedSlots = GetOccupiedSlots(booking.BookingTime,
            booking.Service.DurationMinutes);

        foreach (var slot in freedSlots)
        {
            await _hub.Clients
                .Group($"availability-{booking.BarberId}-{dateStr}")
                .SendAsync("SlotAvailable", slot.ToString("HH:mm"));
        }

        // SignalR — actualizar agenda do barbeiro
        await _hub.Clients
            .Group($"barber-{booking.BarberId}")
            .SendAsync("BookingUpdated", ToBarberDto(booking));

        return Ok(ToBarberDto(booking));
    }

    /// <summary>
    /// PUT /api/bookings/{id} — Editar marcação (re-valida disponibilidade)
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "Barber,Admin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] BookingUpdateDto dto)
    {
        var booking = await _db.Bookings
            .Include(b => b.Barber)
            .Include(b => b.Service)
            .FirstOrDefaultAsync(b => b.Id == id && !b.IsDeleted);

        if (booking == null) return NotFound();
        if (!IsAuthorizedForBarber(booking.BarberId)) return Forbid();

        var newDate = dto.BookingDate ?? booking.BookingDate;
        var newTime = dto.BookingTime ?? booking.BookingTime;
        var newServiceId = dto.ServiceId ?? booking.ServiceId;

        var newService = await _db.Services.FindAsync(newServiceId);
        if (newService == null)
            return NotFound(new ProblemDetails
            { Status = 404, Title = "Serviço não encontrado." });

        var today = TodayInLisbon();
        if (newDate < today)
            return BadRequest(new ProblemDetails
            { Status = 400, Title = "Não é possível marcar no passado." });

        await using var transaction = await _db.Database
            .BeginTransactionAsync(System.Data.IsolationLevel.RepeatableRead);

        try
        {
            var activeBookings = await _db.Bookings
                .FromSqlInterpolated($@"
                    SELECT * FROM ""Bookings""
                    WHERE ""BarberId"" = {booking.BarberId}
                      AND ""BookingDate"" = {newDate}
                      AND ""Status"" != 'Cancelled'
                      AND ""IsDeleted"" = false
                      AND ""Id"" != {id}
                    FOR UPDATE")
                .Include(b => b.Service)
                .ToListAsync();

            var requestedSlots = GetOccupiedSlots(newTime, newService.DurationMinutes);

            foreach (var existing in activeBookings)
            {
                var existingSlots = GetOccupiedSlots(existing.BookingTime,
                    existing.Service.DurationMinutes);

                if (requestedSlots.Any(rs => existingSlots.Contains(rs)))
                {
                    await transaction.RollbackAsync();
                    return Conflict(new ProblemDetails
                    {
                        Status = 409,
                        Title = "Slot indisponível",
                        Detail = "O novo horário já está ocupado."
                    });
                }
            }

            var oldDate = booking.BookingDate;
            var oldSlots = GetOccupiedSlots(booking.BookingTime,
                booking.Service.DurationMinutes);

            booking.BookingDate = newDate;
            booking.BookingTime = newTime;
            booking.ServiceId = newServiceId;
            booking.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            await transaction.CommitAsync();

            // SignalR — libertar slots antigos
            var oldDateStr = oldDate.ToString("yyyy-MM-dd");
            foreach (var slot in oldSlots)
            {
                await _hub.Clients
                    .Group($"availability-{booking.BarberId}-{oldDateStr}")
                    .SendAsync("SlotAvailable", slot.ToString("HH:mm"));
            }

            // SignalR — bloquear novos slots
            var newDateStr = newDate.ToString("yyyy-MM-dd");
            foreach (var slot in requestedSlots)
            {
                await _hub.Clients
                    .Group($"availability-{booking.BarberId}-{newDateStr}")
                    .SendAsync("SlotUnavailable", slot.ToString("HH:mm"));
            }

            var updated = await _db.Bookings
                .Include(b => b.Barber)
                .Include(b => b.Service)
                .FirstAsync(b => b.Id == id);

            await _hub.Clients
                .Group($"barber-{booking.BarberId}")
                .SendAsync("BookingUpdated", ToBarberDto(updated));

            return Ok(ToBarberDto(updated));
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    // ═════════════════════════════════════════════════════════════════════
    //  ENDPOINTS ADMIN
    // ═════════════════════════════════════════════════════════════════════

    /// <summary>
    /// GET /api/bookings — Todas as marcações (Admin)
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAll()
    {
        var bookings = await _db.Bookings
            .Include(b => b.Barber)
            .Include(b => b.Service)
            .Where(b => !b.IsDeleted)
            .OrderByDescending(b => b.BookingDate)
            .ThenBy(b => b.BookingTime)
            .ToListAsync();

        return Ok(bookings.Select(ToBarberDto));
    }

    /// <summary>
    /// DELETE /api/bookings/{id} — Soft delete (Admin)
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var booking = await _db.Bookings.FindAsync(id);
        if (booking == null || booking.IsDeleted) return NotFound();

        booking.IsDeleted = true;
        booking.DeletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return NoContent();
    }
}