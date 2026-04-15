using EleganceStudio.API.DTOs;
using EleganceStudio.API.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace EleganceStudio.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AvailabilityController : ControllerBase
{
    private readonly IAvailabilityService _availability;

    public AvailabilityController(IAvailabilityService availability)
    {
        _availability = availability;
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
        // O AvailabilityService já faz todas as validações
        // (barbeiro existe, serviço existe, data válida, fuso horário PT)
        try
        {
            var slots = await _availability.GetAvailableSlotsAsync(
                barberId, date, serviceId);

            // Buscar duração do serviço para incluir no response
            // (o serviço já foi validado dentro do service)
            var response = new AvailabilityResponseDto
            {
                Date = date,
                BarberId = barberId,
                ServiceId = serviceId,
                AvailableSlots = slots.Select(s => s.ToString("HH:mm")).ToList()
            };

            return Ok(response);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ProblemDetails
            {
                Status = 400,
                Title = "Parâmetros inválidos.",
                Detail = ex.Message
            });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new ProblemDetails
            {
                Status = 404,
                Title = "Recurso não encontrado.",
                Detail = ex.Message
            });
        }
    }
}