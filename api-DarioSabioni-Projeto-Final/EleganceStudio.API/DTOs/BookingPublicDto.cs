namespace EleganceStudio.API.DTOs;

public class BookingPublicDto
{
    public Guid Id { get; set; }
    public string BarberName { get; set; } = string.Empty;
    public string ServiceName { get; set; } = string.Empty;
    public DateOnly BookingDate { get; set; }
    public TimeOnly BookingTime { get; set; }
    public string Status { get; set; } = string.Empty;
    public string ClientName { get; set; } = string.Empty;
}