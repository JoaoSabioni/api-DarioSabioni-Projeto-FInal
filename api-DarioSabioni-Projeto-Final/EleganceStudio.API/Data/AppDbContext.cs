using EleganceStudio.API.Models;
using Microsoft.EntityFrameworkCore;

namespace EleganceStudio.API.Data;

public class AppDbContext : DbContext
{
    private const string AdminHash = "$2a$11$F/3ALbxtG0XpFPvj7tuu8ONJDu2ibccJ5N8k8zMXuNxb1Ov9E1yH2";
    private const string EdiHash   = "$2a$11$WXBksBKQ34WTNrK6RIzMW.69t8rkf9YExC76gCorB2X8qmc.hC8OC";
    private const string TomasHash = "$2a$11$EVSVBwepA4jz0NmsYc5Z7uzNbGgJsiZ7ATTdFuD.GCg.OtpnzjhQi";
    private const string AbreuHash = "$2a$11$mg0855dOiHUJrpllFodIK.6o9AZE9LcHpatNSqhBe76Y946OfgFf.";

    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Barber>     Barbers     => Set<Barber>();
    public DbSet<Service>    Services    => Set<Service>();
    public DbSet<Booking>    Bookings    => Set<Booking>();
    public DbSet<User>       Users       => Set<User>();
    public DbSet<BookingLog> BookingLogs => Set<BookingLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // ─── Global Query Filter ─────────────────────────────────────────────
        modelBuilder.Entity<Booking>()
            .HasQueryFilter(b => !b.IsDeleted);

        // ─── Seed — Barbeiros ────────────────────────────────────────────────
        modelBuilder.Entity<Barber>().HasData(
            new Barber { Id = Guid.Parse("a1a1a1a1-0000-0000-0000-000000000001"), Name = "Edi",   Phone = "+351933320269" },
            new Barber { Id = Guid.Parse("a1a1a1a1-0000-0000-0000-000000000002"), Name = "Tomas", Phone = "+351914302079" },
            new Barber { Id = Guid.Parse("a1a1a1a1-0000-0000-0000-000000000003"), Name = "Abreu", Phone = "+351913388301" }
        );

        // ─── Seed — Serviços ─────────────────────────────────────────────────
        modelBuilder.Entity<Service>().HasData(
            new Service { Id = Guid.Parse("b2b2b2b2-0000-0000-0000-000000000001"), Name = "Sobrancelhas",  Price = 3,  DurationMinutes = 30 },
            new Service { Id = Guid.Parse("b2b2b2b2-0000-0000-0000-000000000002"), Name = "Barba",         Price = 6,  DurationMinutes = 30 },
            new Service { Id = Guid.Parse("b2b2b2b2-0000-0000-0000-000000000003"), Name = "Corte Simples", Price = 10, DurationMinutes = 30 },
            new Service { Id = Guid.Parse("b2b2b2b2-0000-0000-0000-000000000004"), Name = "Corte/Degradê", Price = 15, DurationMinutes = 45 },
            new Service { Id = Guid.Parse("b2b2b2b2-0000-0000-0000-000000000005"), Name = "Corte & Barba", Price = 17, DurationMinutes = 60 }
        );

        // ─── Seed — Utilizadores ─────────────────────────────────────────────
        modelBuilder.Entity<User>().HasData(
            new User { Id = Guid.Parse("c0c0c0c0-0000-0000-0000-000000000001"), Username = "admin", PasswordHash = AdminHash, Role = "Admin",  BarberId = null },
            new User { Id = Guid.Parse("c0c0c0c0-0000-0000-0000-000000000002"), Username = "edi",   PasswordHash = EdiHash,   Role = "Barber", BarberId = Guid.Parse("a1a1a1a1-0000-0000-0000-000000000001") },
            new User { Id = Guid.Parse("c0c0c0c0-0000-0000-0000-000000000003"), Username = "tomas", PasswordHash = TomasHash, Role = "Barber", BarberId = Guid.Parse("a1a1a1a1-0000-0000-0000-000000000002") },
            new User { Id = Guid.Parse("c0c0c0c0-0000-0000-0000-000000000004"), Username = "abreu", PasswordHash = AbreuHash, Role = "Barber", BarberId = Guid.Parse("a1a1a1a1-0000-0000-0000-000000000003") }
        );

        // ─── Bookings — índice único de constraint ───────────────────────────
        modelBuilder.Entity<Booking>()
            .HasIndex(b => new { b.BarberId, b.BookingDate, b.BookingTime })
            .HasFilter("\"Status\" != 'Cancelled' AND \"IsDeleted\" = false")
            .IsUnique();

        // ─── Bookings — índices de performance ──────────────────────────────
        // Lookup por telefone: GET /api/bookings/lookup?phone=...
        modelBuilder.Entity<Booking>()
            .HasIndex(b => b.ClientPhone);

        // Dashboard do barbeiro: GET /api/bookings/barber/{id}
        // e queries de disponibilidade por data
        modelBuilder.Entity<Booking>()
            .HasIndex(b => new { b.BarberId, b.BookingDate });

        // Arquivo automático à meia-noite: WHERE BookingDate < today
        modelBuilder.Entity<Booking>()
            .HasIndex(b => b.BookingDate);

        // ─── BookingLog — índices ────────────────────────────────────────────
        modelBuilder.Entity<BookingLog>().HasIndex(l => l.BarberId);
        modelBuilder.Entity<BookingLog>().HasIndex(l => l.BookingDate);
        modelBuilder.Entity<BookingLog>().HasIndex(l => l.ArchivedAt);
    }
}