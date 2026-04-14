namespace EleganceStudio.API.DTOs;

public class BookingUpdateDto
{
    public DateOnly? BookingDate { get; set; }
    public TimeOnly? BookingTime { get; set; }
    public Guid? ServiceId { get; set; }
}