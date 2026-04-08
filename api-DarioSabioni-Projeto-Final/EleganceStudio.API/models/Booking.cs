namespace EleganceStudio.API.Models;

public class Booking
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string ClientName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public Guid BarberId { get; set; }
    public Barber Barber { get; set; } = null!;
    public Guid ServiceId { get; set; }
    public Service Service { get; set; } = null!;
    public DateOnly BookingDate { get; set; }
    public TimeOnly BookingTime { get; set; }
    public string Status { get; set; } = "pending";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}