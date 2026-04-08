using EleganceStudio.API.Data;
using EleganceStudio.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;

namespace EleganceStudio.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BookingsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IDistributedCache _cache;
    private readonly IHttpClientFactory _httpClientFactory;

    public BookingsController(AppDbContext db, IDistributedCache cache, IHttpClientFactory httpClientFactory)
    {
        _db = db;
        _cache = cache;
        _httpClientFactory = httpClientFactory;
    }

    // POST /api/bookings
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateBookingRequest request)
    {
        var barber = await _db.Barbers.FindAsync(request.BarberId);
        if (barber == null) return NotFound("Barbeiro não encontrado.");

        var service = await _db.Services.FindAsync(request.ServiceId);
        if (service == null) return NotFound("Serviço não encontrado.");

        var booking = new Booking
        {
            ClientName = request.ClientName,
            PhoneNumber = request.PhoneNumber,
            BarberId = request.BarberId,
            ServiceId = request.ServiceId,
            BookingDate = request.BookingDate,
            BookingTime = request.BookingTime,
            Status = "pending"
        };

        _db.Bookings.Add(booking);
        await _db.SaveChangesAsync();

        // Gerar token e guardar no Redis (TTL 24h)
        var token = Guid.NewGuid().ToString();
        await _cache.SetStringAsync(
            $"conf_token:{token}",
            booking.Id.ToString(),
            new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(24)
            });

        // Enviar SMS via Mountebank
        await SendSmsViaMountebank(barber.Phone, booking, service, token);

        return CreatedAtAction(nameof(GetById), new { id = booking.Id }, new { booking.Id, booking.Status });
    }

    // GET /api/bookings/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var booking = await _db.Bookings
            .Include(b => b.Barber)
            .Include(b => b.Service)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (booking == null) return NotFound();
        return Ok(booking);
    }

    // GET /api/bookings/lookup?phone=...
    [HttpGet("lookup")]
    public async Task<IActionResult> Lookup([FromQuery] string phone)
    {
        var bookings = await _db.Bookings
            .Include(b => b.Barber)
            .Include(b => b.Service)
            .Where(b => b.PhoneNumber == phone && b.Status != "cancelled")
            .OrderByDescending(b => b.BookingDate)
            .ToListAsync();

        return Ok(bookings);
    }

    // GET /api/bookings/confirm/{token}
    [HttpGet("confirm/{token}")]
    public async Task<IActionResult> Confirm(string token)
    {
        var bookingIdStr = await _cache.GetStringAsync($"conf_token:{token}");
        if (bookingIdStr == null)
            return Content("<h1>Link inválido ou expirado.</h1>", "text/html");

        var bookingId = Guid.Parse(bookingIdStr);
        var booking = await _db.Bookings.FindAsync(bookingId);
        if (booking == null)
            return Content("<h1>Marcação não encontrada.</h1>", "text/html");

        booking.Status = "confirmed";
        await _db.SaveChangesAsync();
        await _cache.RemoveAsync($"conf_token:{token}");

        return Content("<h1>✅ Marcação Confirmada!</h1><p>Obrigado, " + booking.ClientName + "!</p>", "text/html");
    }

    private async Task SendSmsViaMountebank(string phone, Booking booking, Service service, string token)
    {
        try
        {
            var client = _httpClientFactory.CreateClient();
            var message = new
            {
                to = phone,
                body = $"Nova marcação! {booking.ClientName} — {service.Name} — {booking.BookingDate} às {booking.BookingTime}\nConfirmar: http://localhost:5000/api/bookings/confirm/{token}"
            };
            await client.PostAsJsonAsync("http://localhost:2525/sms", message);
        }
        catch { /* Mountebank offline não bloqueia a marcação */ }
    }
}

public record CreateBookingRequest(
    string ClientName,
    string PhoneNumber,
    Guid BarberId,
    Guid ServiceId,
    DateOnly BookingDate,
    TimeOnly BookingTime
);