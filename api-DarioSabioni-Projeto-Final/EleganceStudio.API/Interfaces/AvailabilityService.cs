using EleganceStudio.API.Data;
using EleganceStudio.API.Models;
using EleganceStudio.API.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace EleganceStudio.Tests;

public class AvailabilityServiceTests : IDisposable
{
    // ─── Setup ───────────────────────────────────────────────────────────────

    private readonly AppDbContext _db;
    private readonly AvailabilityService _sut;

    // IDs fixos para os testes
    private static readonly Guid BarberId  = Guid.Parse("a1a1a1a1-0000-0000-0000-000000000001");
    private static readonly Guid ServiceId = Guid.Parse("b2b2b2b2-0000-0000-0000-000000000001");

    public AvailabilityServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()) // BD isolada por teste
            .Options;

        _db = new AppDbContext(options);

        // Configuração dos horários de trabalho (igual ao appsettings.Development.json)
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["WorkingHours:Start"]               = "09:00",
                ["WorkingHours:End"]                 = "19:00",
                ["WorkingHours:SlotIntervalMinutes"] = "30",
            })
            .Build();

        _sut = new AvailabilityService(_db, config);

        SeedDatabase();
    }

    private void SeedDatabase()
    {
        _db.Barbers.Add(new Barber
        {
            Id        = BarberId,
            Name      = "Edi",
            Phone     = "+351933320269",
            Specialty = "Corte clássico"
        });

        _db.Services.Add(new Service
        {
            Id              = ServiceId,
            Name            = "Corte",
            Price           = 15,
            DurationMinutes = 30
        });

        _db.SaveChanges();
    }

    public void Dispose() => _db.Dispose();

    // ─── Helper ──────────────────────────────────────────────────────────────

    private DateOnly TomorrowLocal()
    {
        var lisbon = TimeZoneInfo.FindSystemTimeZoneById("Europe/Lisbon");
        var now    = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, lisbon);
        return DateOnly.FromDateTime(now).AddDays(1);
    }

    // ─── Testes: validações de entrada ───────────────────────────────────────

    [Fact]
    public async Task GetAvailableSlots_BarbeiroInexistente_RetornaListaVazia()
    {
        var result = await _sut.GetAvailableSlotsAsync(
            Guid.NewGuid(), TomorrowLocal(), ServiceId);

        Assert.Empty(result);
    }

    [Fact]
    public async Task GetAvailableSlots_ServicioInexistente_RetornaListaVazia()
    {
        var result = await _sut.GetAvailableSlotsAsync(
            BarberId, TomorrowLocal(), Guid.NewGuid());

        Assert.Empty(result);
    }

    [Fact]
    public async Task GetAvailableSlots_DataNoPassado_RetornaListaVazia()
    {
        var yesterday = TomorrowLocal().AddDays(-2); // ontem

        var result = await _sut.GetAvailableSlotsAsync(BarberId, yesterday, ServiceId);

        Assert.Empty(result);
    }

    [Fact]
    public async Task GetAvailableSlots_DataAlem60Dias_RetornaListaVazia()
    {
        var tooFar = TomorrowLocal().AddDays(61);

        var result = await _sut.GetAvailableSlotsAsync(BarberId, tooFar, ServiceId);

        Assert.Empty(result);
    }

    // ─── Testes: slots gerados correctamente ─────────────────────────────────

    [Fact]
    public async Task GetAvailableSlots_DiaSemMarcacoes_RetornaTodosOsSlots()
    {
        var result = await _sut.GetAvailableSlotsAsync(
            BarberId, TomorrowLocal(), ServiceId);

        // 09:00 → 19:00, intervalos de 30 min, serviço de 30 min
        // Último slot válido: 18:30 (18:30 + 30 = 19:00 ≤ 19:00)
        // Total: (19:00 - 09:00) / 0:30 = 20 slots
        Assert.Equal(20, result.Count);
        Assert.Equal(new TimeOnly(9, 0),  result.First());
        Assert.Equal(new TimeOnly(18, 30), result.Last());
    }

    [Fact]
    public async Task GetAvailableSlots_PrimeiroSlotOcupado_NaoAparece()
    {
        _db.Bookings.Add(new Booking
        {
            Id          = Guid.NewGuid(),
            BarberId    = BarberId,
            ServiceId   = ServiceId,
            ClientName  = "Teste",
            ClientPhone = "+351912345678",
            BookingDate = TomorrowLocal(),
            BookingTime = new TimeOnly(9, 0),
            Status      = "Confirmed",
            CreatedAt   = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();

        var result = await _sut.GetAvailableSlotsAsync(
            BarberId, TomorrowLocal(), ServiceId);

        Assert.DoesNotContain(new TimeOnly(9, 0), result);
        Assert.Equal(19, result.Count); // 20 - 1
        Assert.Equal(new TimeOnly(9, 30), result.First());
    }

    [Fact]
    public async Task GetAvailableSlots_MarcacaoCancelada_SlotContinuaDisponivel()
    {
        _db.Bookings.Add(new Booking
        {
            Id          = Guid.NewGuid(),
            BarberId    = BarberId,
            ServiceId   = ServiceId,
            ClientName  = "Teste",
            ClientPhone = "+351912345678",
            BookingDate = TomorrowLocal(),
            BookingTime = new TimeOnly(10, 0),
            Status      = "Cancelled", // Cancelada → não bloqueia
            CreatedAt   = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();

        var result = await _sut.GetAvailableSlotsAsync(
            BarberId, TomorrowLocal(), ServiceId);

        Assert.Contains(new TimeOnly(10, 0), result);
        Assert.Equal(20, result.Count); // nenhum slot removido
    }

    [Fact]
    public async Task GetAvailableSlots_ServicoLongo_BloqueiaMultiplosSlots()
    {
        // Serviço de 60 min bloqueia 2 slots de 30 min
        var longServiceId = Guid.Parse("b2b2b2b2-0000-0000-0000-000000000002");
        _db.Services.Add(new Service
        {
            Id              = longServiceId,
            Name            = "Barba + Corte",
            Price           = 25,
            DurationMinutes = 60
        });

        _db.Bookings.Add(new Booking
        {
            Id          = Guid.NewGuid(),
            BarberId    = BarberId,
            ServiceId   = longServiceId,
            ClientName  = "Teste",
            ClientPhone = "+351912345678",
            BookingDate = TomorrowLocal(),
            BookingTime = new TimeOnly(11, 0), // ocupa 11:00 e 11:30
            Status      = "Confirmed",
            CreatedAt   = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();

        // Testar com o serviço de 30 min — 11:00 e 11:30 devem estar bloqueados
        var result = await _sut.GetAvailableSlotsAsync(
            BarberId, TomorrowLocal(), ServiceId);

        Assert.DoesNotContain(new TimeOnly(11, 0),  result);
        Assert.DoesNotContain(new TimeOnly(11, 30), result);
        Assert.Contains(new TimeOnly(12, 0), result);
    }

    [Fact]
    public async Task GetAvailableSlots_BarbeirosDiferentes_NaoSeInterferem()
    {
        var outroBarber = Guid.Parse("a1a1a1a1-0000-0000-0000-000000000002");
        _db.Barbers.Add(new Barber
        {
            Id        = outroBarber,
            Name      = "Tomas",
            Phone     = "+351912000000",
            Specialty = "Barbas"
        });

        // Marcação do Tomas às 09:00 — não deve afectar o Edi
        _db.Bookings.Add(new Booking
        {
            Id          = Guid.NewGuid(),
            BarberId    = outroBarber,
            ServiceId   = ServiceId,
            ClientName  = "Cliente do Tomas",
            ClientPhone = "+351912345678",
            BookingDate = TomorrowLocal(),
            BookingTime = new TimeOnly(9, 0),
            Status      = "Confirmed",
            CreatedAt   = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();

        var result = await _sut.GetAvailableSlotsAsync(
            BarberId, TomorrowLocal(), ServiceId);

        // Edi deve ter todos os slots livres
        Assert.Equal(20, result.Count);
        Assert.Contains(new TimeOnly(9, 0), result);
    }

    [Fact]
    public async Task GetAvailableSlots_SlotsOrdenadosCronologicamente()
    {
        var result = await _sut.GetAvailableSlotsAsync(
            BarberId, TomorrowLocal(), ServiceId);

        var sorted = result.OrderBy(t => t).ToList();
        Assert.Equal(sorted, result);
    }
}