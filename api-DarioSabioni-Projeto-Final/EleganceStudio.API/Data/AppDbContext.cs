using EleganceStudio.API.Models;
using Microsoft.EntityFrameworkCore;

namespace EleganceStudio.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Barber> Barbers => Set<Barber>();
    public DbSet<Service> Services => Set<Service>();
    public DbSet<Booking> Bookings => Set<Booking>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Seed — Barbeiros
        modelBuilder.Entity<Barber>().HasData(
            new Barber { Id = Guid.Parse("a1a1a1a1-0000-0000-0000-000000000001"), Name = "Edi", Phone = "+351933320269" },
            new Barber { Id = Guid.Parse("a1a1a1a1-0000-0000-0000-000000000002"), Name = "Tomas", Phone = "+351914302079" },
            new Barber { Id = Guid.Parse("a1a1a1a1-0000-0000-0000-000000000003"), Name = "Abreu", Phone = "+351913388301" }
        );

        // Seed — Serviços
        modelBuilder.Entity<Service>().HasData(
            new Service { Id = Guid.Parse("b2b2b2b2-0000-0000-0000-000000000001"), Name = "Sobrancelhas", Price = 3 },
            new Service { Id = Guid.Parse("b2b2b2b2-0000-0000-0000-000000000002"), Name = "Barba", Price = 6 },
            new Service { Id = Guid.Parse("b2b2b2b2-0000-0000-0000-000000000003"), Name = "Corte Simples", Price = 10 },
            new Service { Id = Guid.Parse("b2b2b2b2-0000-0000-0000-000000000004"), Name = "Corte/Degradê", Price = 15 },
            new Service { Id = Guid.Parse("b2b2b2b2-0000-0000-0000-000000000005"), Name = "Corte & Barba", Price = 17 }
        );
    }
}