using EleganceStudio.API.Models;
using Microsoft.EntityFrameworkCore;

namespace EleganceStudio.API.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        await db.Database.MigrateAsync();

        if (!await db.Barbers.AnyAsync())
        {
            var barbers = new List<Barber>
            {
                new Barber { Id = Guid.Parse("a1a1a1a1-0000-0000-0000-000000000001"), Name = "Edi",   Phone = "+351910000001", IsActive = true },
                new Barber { Id = Guid.Parse("a1a1a1a1-0000-0000-0000-000000000002"), Name = "Tomas", Phone = "+351910000002", IsActive = true },
                new Barber { Id = Guid.Parse("a1a1a1a1-0000-0000-0000-000000000003"), Name = "Abreu", Phone = "+351910000003", IsActive = true }
            };
            var services = new List<Service>
            {
                new Service { Id = Guid.Parse("b2b2b2b2-0000-0000-0000-000000000001"), Name = "Corte Simples",      Price = 10, DurationMinutes = 30 },
                new Service { Id = Guid.Parse("b2b2b2b2-0000-0000-0000-000000000002"), Name = "Corte + Barba",      Price = 15, DurationMinutes = 45 },
                new Service { Id = Guid.Parse("b2b2b2b2-0000-0000-0000-000000000003"), Name = "Barba",              Price = 8,  DurationMinutes = 20 },
                new Service { Id = Guid.Parse("b2b2b2b2-0000-0000-0000-000000000004"), Name = "Corte Infantil",     Price = 8,  DurationMinutes = 25 },
                new Service { Id = Guid.Parse("b2b2b2b2-0000-0000-0000-000000000005"), Name = "Tratamento Capilar", Price = 20, DurationMinutes = 60 }
            };
            await db.Barbers.AddRangeAsync(barbers);
            await db.Services.AddRangeAsync(services);
        }

        if (!await db.Users.AnyAsync())
        {
            var users = new List<User>
            {
                new User { Id = Guid.NewGuid(), Username = "admin", PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"), Role = "Admin",  BarberId = null },
                new User { Id = Guid.NewGuid(), Username = "edi",   PasswordHash = BCrypt.Net.BCrypt.HashPassword("edi123"),   Role = "Barber", BarberId = Guid.Parse("a1a1a1a1-0000-0000-0000-000000000001") },
                new User { Id = Guid.NewGuid(), Username = "tomas", PasswordHash = BCrypt.Net.BCrypt.HashPassword("tomas123"), Role = "Barber", BarberId = Guid.Parse("a1a1a1a1-0000-0000-0000-000000000002") },
                new User { Id = Guid.NewGuid(), Username = "abreu", PasswordHash = BCrypt.Net.BCrypt.HashPassword("abreu123"), Role = "Barber", BarberId = Guid.Parse("a1a1a1a1-0000-0000-0000-000000000003") }
            };
            await db.Users.AddRangeAsync(users);
        }

        await db.SaveChangesAsync();
    }
}