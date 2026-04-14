using EleganceStudio.API.Data;
using EleganceStudio.API.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace EleganceStudio.API.Services;

public class AvailabilityService : IAvailabilityService
{
    private readonly AppDbContext _db;
    private readonly TimeZoneInfo _lisbon;
    private readonly TimeOnly _workStart;
    private readonly TimeOnly _workEnd;
    private readonly int _slotInterval;

    public AvailabilityService(AppDbContext db, IConfiguration config)
    {
        _db = db;
        _lisbon = TimeZoneInfo.FindSystemTimeZoneById("Europe/Lisbon");

        var wh = config.GetSection("WorkingHours");
        _workStart   = TimeOnly.Parse(wh["Start"] ?? "09:00");
        _workEnd     = TimeOnly.Parse(wh["End"]   ?? "19:00");
        _slotInterval = int.Parse(wh["SlotIntervalMinutes"] ?? "30");
    }

    public async Task<List<TimeOnly>> GetAvailableSlotsAsync(
        Guid barberId, DateOnly date, Guid serviceId)
    {
      
        var barberExists = await _db.Barbers.AnyAsync(b => b.Id == barberId);
        if (!barberExists) return new List<TimeOnly>();

        var service = await _db.Services.FindAsync(serviceId);
        if (service == null) return new List<TimeOnly>();

        var nowLocal = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, _lisbon);
        var today    = DateOnly.FromDateTime(nowLocal);
        if (date < today || date > today.AddDays(60)) return new List<TimeOnly>();

        
        var slots = new List<TimeOnly>();
        var current = _workStart;
        while (current.AddMinutes(service.DurationMinutes) <= _workEnd)
        {
            slots.Add(current);
            current = current.AddMinutes(_slotInterval);
        }

    
        if (date == today)
        {
            var nowTime = TimeOnly.FromDateTime(nowLocal);
            slots = slots.Where(s => s > nowTime).ToList();
        }

        
        var activeBookings = await _db.Bookings
            .Include(b => b.Service)
            .Where(b => b.BarberId == barberId
                     && b.BookingDate == date
                     && b.Status != "Cancelled"
                     && !b.IsDeleted)
            .ToListAsync();

    
        var blocked = new HashSet<TimeOnly>();
        foreach (var booking in activeBookings)
        {
            var duration = booking.Service.DurationMinutes;
            var slotCursor = booking.BookingTime;
            while (slotCursor < booking.BookingTime.AddMinutes(duration))
            {
                blocked.Add(slotCursor);
                slotCursor = slotCursor.AddMinutes(_slotInterval);
            }
        }

        // 7. Devolver apenas slots livres
        return slots.Where(s => !blocked.Contains(s)).ToList();
    }
}