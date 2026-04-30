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
        _db    = db;
        _redis = redis.GetDatabase();
        _sms   = sms;
        _hub   = hub;
    }

    // ─── HELPERS ─────────────────────────────────────────────────────────

    private static BookingPublicDto ToPublicDto(Booking b) => new()
    {
        Id          = b.Id,
        BarberName  = b.Barber.Name,
        ServiceName = b.Service.Name,
        BookingDate = b.BookingDate,
        BookingTime = b.BookingTime,
        Status      = b.Status,
        ClientName  = b.ClientName
    };

    private static BookingBarberDto ToBarberDto(Booking b) => new()
    {
        Id                     = b.Id,
        BarberName             = b.Barber.Name,
        ServiceName            = b.Service.Name,
        ServiceDurationMinutes = b.Service.DurationMinutes,
        BookingDate            = b.BookingDate,
        BookingTime            = b.BookingTime,
        Status                 = b.Status,
        ClientName             = b.ClientName,
        ClientPhone            = b.ClientPhone,
        CreatedAt              = b.CreatedAt,
        UpdatedAt              = b.UpdatedAt
    };

    private static readonly TimeZoneInfo LisbonTz =
        TimeZoneInfo.FindSystemTimeZoneById("Europe/Lisbon");

    private static DateOnly TodayInLisbon() =>
        DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, LisbonTz));

    private static List<TimeOnly> GetOccupiedSlots(TimeOnly start, int durationMinutes, int slotInterval = 30)
    {
        var slots = new List<TimeOnly>();
        for (int m = 0; m < durationMinutes; m += slotInterval)
            slots.Add(start.AddMinutes(m));
        return slots;
    }

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
    /// POST /api/bookings — Criar marcação com múltiplos serviços sequenciais
    /// </summary>
    [HttpPost]
    [EnableRateLimiting("bookings")]
    public async Task<IActionResult> Create([FromBody] BookingRequestDto dto)
    {
        var barber = await _db.Barbers.FindAsync(dto.BarberId);
        if (barber == null) return NotFound(new ProblemDetails
            { Status = 404, Title = "Barbeiro não encontrado." });

        if (dto.ServiceIds == null || dto.ServiceIds.Count == 0)
            return BadRequest(new ProblemDetails
                { Status = 400, Title = "Indica pelo menos um serviço." });

        var distinctIds = dto.ServiceIds.Distinct().ToList();
        var services = await _db.Services
            .Where(s => distinctIds.Contains(s.Id))
            .ToListAsync();

        if (services.Count != distinctIds.Count)
            return NotFound(new ProblemDetails
                { Status = 404, Title = "Um ou mais serviços não encontrados." });

        var orderedServices = distinctIds
            .Select(id => services.First(s => s.Id == id))
            .ToList();

        var today = TodayInLisbon();
        if (dto.BookingDate < today)
            return BadRequest(new ProblemDetails
                { Status = 400, Title = "Não é possível marcar no passado." });
        if (dto.BookingDate > today.AddDays(60))
            return BadRequest(new ProblemDetails
                { Status = 400, Title = "Máximo 60 dias no futuro." });

        if (dto.BookingTime.Minute % 30 != 0)
            return BadRequest(new ProblemDetails
                { Status = 400, Title = "Horário inválido. Use intervalos de 30 minutos." });

        var allRequestedSlots = new List<(TimeOnly start, Service service, List<TimeOnly> slots)>();
        var cursor = dto.BookingTime;
        foreach (var svc in orderedServices)
        {
            var slots = GetOccupiedSlots(cursor, svc.DurationMinutes);
            allRequestedSlots.Add((cursor, svc, slots));
            cursor = cursor.AddMinutes(svc.DurationMinutes);
        }

        await using var transaction = await _db.Database
            .BeginTransactionAsync(System.Data.IsolationLevel.RepeatableRead);

        try
        {
            // Global filter já exclui IsDeleted=true automaticamente
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

            var flatRequestedSlots = allRequestedSlots.SelectMany(x => x.slots).ToList();

            foreach (var existing in activeBookings)
            {
                var existingSlots = GetOccupiedSlots(existing.BookingTime,
                    existing.Service.DurationMinutes);

                if (flatRequestedSlots.Any(rs => existingSlots.Contains(rs)))
                {
                    await transaction.RollbackAsync();
                    return Conflict(new ProblemDetails
                    {
                        Status = 409,
                        Title  = "Slot indisponível",
                        Detail = "Um dos horários pedidos já está reservado."
                    });
                }
            }

            var createdBookings = new List<Booking>();
            foreach (var (start, svc, _) in allRequestedSlots)
            {
                var booking = new Booking
                {
                    ClientName  = dto.ClientName,
                    ClientPhone = dto.ClientPhone,
                    BarberId    = dto.BarberId,
                    ServiceId   = svc.Id,
                    BookingDate = dto.BookingDate,
                    BookingTime = start,
                    Status      = "Pending",
                    CreatedAt   = DateTime.UtcNow
                };
                _db.Bookings.Add(booking);
                createdBookings.Add(booking);
            }

            await _db.SaveChangesAsync();
            await transaction.CommitAsync();

            var firstBooking = createdBookings.First();
            var token = Guid.NewGuid().ToString();
            await _redis.StringSetAsync(
                $"confirm:{token}",
                firstBooking.Id.ToString(),
                TimeSpan.FromMinutes(15));

            var serviceNames = string.Join(" + ", orderedServices.Select(s => s.Name));
            var confirmLink  = $"https://elegancestudio.pt/confirmar/{token}";
            await _sms.SendToClientAsync(dto.ClientPhone,
                $"Marcação recebida! {serviceNames} — Confirme aqui: {confirmLink} (válido 15 min)");

            await _sms.SendToBarberAsync(barber.Phone,
                $"Nova marcação! {dto.ClientName} — {serviceNames} — " +
                $"{dto.BookingDate} às {dto.BookingTime:HH\\:mm}");

            var createdIds = createdBookings.Select(b => b.Id).ToList();
            var fullBookings = await _db.Bookings
                .Include(b => b.Barber)
                .Include(b => b.Service)
                .Where(b => createdIds.Contains(b.Id))
                .OrderBy(b => b.BookingTime)
                .ToListAsync();

            var dateStr = dto.BookingDate.ToString("yyyy-MM-dd");
            foreach (var fb in fullBookings)
                await _hub.Clients
                    .Group($"barber-{dto.BarberId}")
                    .SendAsync("NewBooking", ToBarberDto(fb));

            foreach (var slot in flatRequestedSlots)
                await _hub.Clients
                    .Group($"availability-{dto.BarberId}-{dateStr}")
                    .SendAsync("SlotUnavailable", slot.ToString("HH\\:mm"));

            return CreatedAtAction(nameof(GetById),
                new { id = firstBooking.Id },
                fullBookings.Select(ToPublicDto));
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    /// <summary>
    /// GET /api/bookings/{id}
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        // Global filter já exclui IsDeleted
        var booking = await _db.Bookings
            .Include(b => b.Barber)
            .Include(b => b.Service)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (booking == null) return NotFound();
        return Ok(ToPublicDto(booking));
    }

    /// <summary>
    /// GET /api/bookings/lookup?phone=...
    /// </summary>
    [HttpGet("lookup")]
    [EnableRateLimiting("lookup")]
    public async Task<IActionResult> Lookup([FromQuery] string phone)
    {
        if (string.IsNullOrWhiteSpace(phone))
            return Ok(Array.Empty<BookingPublicDto>());

        var hashBytes = SHA256.HashData(Encoding.UTF8.GetBytes(phone));
        var cacheKey  = $"lookup:{Convert.ToHexString(hashBytes)}";

        var cached = await _redis.StringGetAsync(cacheKey);
        if (cached.HasValue)
        {
            var cachedResult = System.Text.Json.JsonSerializer
                .Deserialize<List<BookingPublicDto>>((string)cached!);
            return Ok(cachedResult);
        }

        // Global filter já exclui IsDeleted
        var bookings = await _db.Bookings
            .Include(b => b.Barber)
            .Include(b => b.Service)
            .Where(b => b.ClientPhone == phone && b.Status != "Cancelled")
            .OrderByDescending(b => b.BookingDate)
            .ThenByDescending(b => b.BookingTime)
            .ToListAsync();

        var result = bookings.Select(ToPublicDto).ToList();

        await _redis.StringSetAsync(cacheKey,
            System.Text.Json.JsonSerializer.Serialize(result),
            TimeSpan.FromMinutes(2));

        return Ok(result);
    }

    /// <summary>
    /// GET /api/bookings/confirm/{token}
    /// </summary>
    [HttpGet("confirm/{token}")]
    public async Task<IActionResult> ConfirmByToken(string token)
    {
        var bookingIdStr = await _redis.StringGetAsync($"confirm:{token}");
        if (!bookingIdStr.HasValue)
            return NotFound(new ProblemDetails
                { Status = 404, Title = "Link inválido ou expirado." });

        await _redis.KeyDeleteAsync($"confirm:{token}");

        var bookingId = Guid.Parse((string)bookingIdStr!);

        // .IgnoreQueryFilters() — token de confirmação pode chegar antes do
        // IsDeleted ser limpo; não queremos falhar aqui
        var booking = await _db.Bookings
            .IgnoreQueryFilters()
            .Include(b => b.Barber)
            .Include(b => b.Service)
            .FirstOrDefaultAsync(b => b.Id == bookingId && !b.IsDeleted);

        if (booking == null)
            return NotFound(new ProblemDetails
                { Status = 404, Title = "Marcação não encontrada." });

        booking.Status    = "Confirmed";
        booking.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        await _sms.SendToBarberAsync(booking.Barber.Phone,
            $"Marcação confirmada! {booking.ClientName} — {booking.Service.Name} — " +
            $"{booking.BookingDate} às {booking.BookingTime:HH\\:mm}");

        await _hub.Clients
            .Group($"barber-{booking.BarberId}")
            .SendAsync("BookingUpdated", ToBarberDto(booking));

        return Ok(ToPublicDto(booking));
    }

    // ═════════════════════════════════════════════════════════════════════
    //  ENDPOINTS AUTENTICADOS
    // ═════════════════════════════════════════════════════════════════════

    /// <summary>
    /// GET /api/bookings/barber/{barberId}
    /// </summary>
    [HttpGet("barber/{barberId}")]
    [Authorize(Roles = "Barber,Admin")]
    public async Task<IActionResult> GetByBarber(Guid barberId)
    {
        if (!IsAuthorizedForBarber(barberId)) return Forbid();

        // Global filter já exclui IsDeleted
        var bookings = await _db.Bookings
            .Include(b => b.Barber)
            .Include(b => b.Service)
            .Where(b => b.BarberId == barberId)
            .OrderByDescending(b => b.BookingDate)
            .ThenBy(b => b.BookingTime)
            .ToListAsync();

        return Ok(bookings.Select(ToBarberDto));
    }

    /// <summary>
    /// GET /api/bookings/barber/{barberId}/day/{date}
    /// </summary>
    [HttpGet("barber/{barberId}/day/{date}")]
    [Authorize(Roles = "Barber,Admin")]
    public async Task<IActionResult> GetByBarberDay(Guid barberId, DateOnly date)
    {
        if (!IsAuthorizedForBarber(barberId)) return Forbid();

        var bookings = await _db.Bookings
            .Include(b => b.Barber)
            .Include(b => b.Service)
            .Where(b => b.BarberId == barberId && b.BookingDate == date)
            .OrderBy(b => b.BookingTime)
            .ToListAsync();

        return Ok(bookings.Select(ToBarberDto));
    }

    /// <summary>
    /// PUT /api/bookings/{id}/confirm — Barbeiro confirma
    /// </summary>
    [HttpPut("{id}/confirm")]
    [Authorize(Roles = "Barber,Admin")]
    public async Task<IActionResult> ConfirmByBarber(Guid id)
    {
        var booking = await _db.Bookings
            .Include(b => b.Barber)
            .Include(b => b.Service)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (booking == null) return NotFound();
        if (!IsAuthorizedForBarber(booking.BarberId)) return Forbid();

        booking.Status    = "Confirmed";
        booking.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        await _sms.SendToClientAsync(booking.ClientPhone,
            $"A sua marcação foi confirmada! {booking.Service.Name} — " +
            $"{booking.BookingDate} às {booking.BookingTime:HH\\:mm}. Obrigado!");

        await _hub.Clients
            .Group($"barber-{booking.BarberId}")
            .SendAsync("BookingUpdated", ToBarberDto(booking));

        return Ok(ToBarberDto(booking));
    }

    /// <summary>
    /// PUT /api/bookings/{id}/cancel — Barbeiro cancela
    /// </summary>
    [HttpPut("{id}/cancel")]
    [Authorize(Roles = "Barber,Admin")]
    public async Task<IActionResult> Cancel(Guid id)
    {
        var booking = await _db.Bookings
            .Include(b => b.Barber)
            .Include(b => b.Service)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (booking == null) return NotFound();
        if (!IsAuthorizedForBarber(booking.BarberId)) return Forbid();

        booking.Status    = "Cancelled";
        booking.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        await _sms.SendToClientAsync(booking.ClientPhone,
            $"A sua marcação de {booking.BookingDate} às {booking.BookingTime:HH\\:mm} " +
            $"foi cancelada. Contacte-nos para reagendar.");

        var dateStr    = booking.BookingDate.ToString("yyyy-MM-dd");
        var freedSlots = GetOccupiedSlots(booking.BookingTime, booking.Service.DurationMinutes);
        foreach (var slot in freedSlots)
            await _hub.Clients
                .Group($"availability-{booking.BarberId}-{dateStr}")
                .SendAsync("SlotAvailable", slot.ToString("HH\\:mm"));

        await _hub.Clients
            .Group($"barber-{booking.BarberId}")
            .SendAsync("BookingUpdated", ToBarberDto(booking));

        return Ok(ToBarberDto(booking));
    }

    /// <summary>
    /// PUT /api/bookings/{id} — Editar marcação
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "Barber,Admin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] BookingUpdateDto dto)
    {
        var booking = await _db.Bookings
            .Include(b => b.Barber)
            .Include(b => b.Service)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (booking == null) return NotFound();
        if (!IsAuthorizedForBarber(booking.BarberId)) return Forbid();

        var newDate      = dto.BookingDate ?? booking.BookingDate;
        var newTime      = dto.BookingTime ?? booking.BookingTime;
        var newServiceId = dto.ServiceId   ?? booking.ServiceId;

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
                        Title  = "Slot indisponível",
                        Detail = "O novo horário já está ocupado."
                    });
                }
            }

            var oldDate  = booking.BookingDate;
            var oldSlots = GetOccupiedSlots(booking.BookingTime, booking.Service.DurationMinutes);

            booking.BookingDate = newDate;
            booking.BookingTime = newTime;
            booking.ServiceId   = newServiceId;
            booking.UpdatedAt   = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            await transaction.CommitAsync();

            var oldDateStr = oldDate.ToString("yyyy-MM-dd");
            foreach (var slot in oldSlots)
                await _hub.Clients
                    .Group($"availability-{booking.BarberId}-{oldDateStr}")
                    .SendAsync("SlotAvailable", slot.ToString("HH\\:mm"));

            var newDateStr = newDate.ToString("yyyy-MM-dd");
            foreach (var slot in requestedSlots)
                await _hub.Clients
                    .Group($"availability-{booking.BarberId}-{newDateStr}")
                    .SendAsync("SlotUnavailable", slot.ToString("HH\\:mm"));

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
    /// GET /api/bookings?date=YYYY-MM-DD — Todas as marcações (Admin)
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAll([FromQuery] string? date = null)
    {
        // Global filter já exclui IsDeleted
        var query = _db.Bookings
            .Include(b => b.Barber)
            .Include(b => b.Service)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(date) && DateOnly.TryParse(date, out var parsedDate))
            query = query.Where(b => b.BookingDate == parsedDate);

        var bookings = await query
            .OrderByDescending(b => b.BookingDate)
            .ThenBy(b => b.BookingTime)
            .ToListAsync();

        return Ok(bookings.Select(ToBarberDto));
    }

    /// <summary>
    /// DELETE /api/bookings/{id} — Soft delete (Admin ou Barbeiro dono)
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Barber,Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        // .IgnoreQueryFilters() para conseguir encontrar mesmo que já esteja deleted
        var booking = await _db.Bookings
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(b => b.Id == id);

        if (booking == null || booking.IsDeleted) return NotFound();
        if (!IsAuthorizedForBarber(booking.BarberId)) return Forbid();

        booking.IsDeleted = true;
        booking.DeletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return NoContent();
    }
}