using EleganceStudio.API.Data;
using EleganceStudio.API.DTOs;
using EleganceStudio.API.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace EleganceStudio.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AvailabilityController : ControllerBase
{
    private readonly IAvailabilityService _availability;
    private readonly AppDbContext _db;

    public AvailabilityController(IAvailabilityService availability, AppDbContext db)
    {
        _availability = availability;
        _db = db;
    }

    /// <summary>
    /// GET /api/availability?barberId=...&date=...&serviceId=...
    /// Devolve os slots disponíveis para um barbeiro/serviço/data.
    /// </summary>
    [HttpGet]
    [EnableRateLimiting("availability")]
    public async Task<IActionResult> GetAvailable(
        [FromQuery] Guid barberId,
        [FromQuery] Guid serviceId,
        [FromQuery] DateOnly date)
    {
        // Validar que barbeiro existe
        var barberExists = await _db.Barbers.AnyAsync(b => b.Id == barberId);
        if (!barberExists)
            return NotFound(new ProblemDetails
            { Status = 404, Title = "Barbeiro não encontrado." });

        // Validar que serviço existe
        var service = await _db.Services.FindAsync(serviceId);
        if (service == null)
            return NotFound(new ProblemDetails
            { Status = 404, Title = "Serviço não encontrado." });

        // Buscar slots disponíveis
        var slots = await _availability.GetAvailableSlotsAsync(
            barberId, date, serviceId);

        var response = new AvailabilityResponseDto
        {
            Date = date,
            BarberId = barberId,
            ServiceId = serviceId,
            ServiceDurationMinutes = service.DurationMinutes,
            AvailableSlots = slots.Select(s => s.ToString("HH:mm")).ToList()
        };

        return Ok(response);
    }
}