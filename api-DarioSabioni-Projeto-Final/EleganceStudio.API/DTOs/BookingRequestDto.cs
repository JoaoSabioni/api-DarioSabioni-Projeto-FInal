using System.ComponentModel.DataAnnotations;

namespace EleganceStudio.API.DTOs;

public class BookingRequestDto
{
    [Required] public Guid BarberId { get; set; }
    [Required] public Guid ServiceId { get; set; }
    [Required] public DateOnly BookingDate { get; set; }
    [Required] public TimeOnly BookingTime { get; set; }
    [Required, MaxLength(100)] public string ClientName { get; set; } = string.Empty;
    [Required, RegularExpression(@"^\+351\d{9}$", ErrorMessage = "Formato inválido. Use +351XXXXXXXXX")]
    public string ClientPhone { get; set; } = string.Empty;
}