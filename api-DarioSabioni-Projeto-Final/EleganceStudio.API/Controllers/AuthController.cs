using EleganceStudio.API.Controllers;
using EleganceStudio.API.Data;
using EleganceStudio.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System.IdentityModel.Tokens.Jwt;

namespace EleganceStudio.Tests;

public class AuthControllerTests : IDisposable
{
    // ─── Setup ───────────────────────────────────────────────────────────────

    private readonly AppDbContext _db;
    private readonly AuthController _sut;

    private static readonly Guid AdminId  = Guid.Parse("c3c3c3c3-0000-0000-0000-000000000001");
    private static readonly Guid BarberId = Guid.Parse("a1a1a1a1-0000-0000-0000-000000000001");
    private static readonly Guid EdiUserId = Guid.Parse("d4d4d4d4-0000-0000-0000-000000000001");

    public AuthControllerTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        _db = new AppDbContext(options);

        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:SecretKey"] = "EleganceStudio2026SuperSecretKey!",
                ["Jwt:Issuer"]    = "EleganceStudio.API",
                ["Jwt:Audience"]  = "EleganceStudio.Client",
            })
            .Build();

        _sut = new AuthController(_db, config);

        SeedUsers();
    }

    private void SeedUsers()
    {
        // Admin — sem BarberId
        _db.Users.Add(new User
        {
            Id           = AdminId,
            Username     = "admin",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
            Role         = "Admin",
            BarberId     = null
        });

        // Barbeiro Edi — com BarberId
        _db.Users.Add(new User
        {
            Id           = EdiUserId,
            Username     = "edi",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("edi123"),
            Role         = "Barber",
            BarberId     = BarberId
        });

        _db.SaveChanges();
    }

    public void Dispose() => _db.Dispose();

    // ─── Helper ──────────────────────────────────────────────────────────────

    private JwtSecurityToken ParseToken(OkObjectResult ok)
    {
        var response = ok.Value!;
        var tokenStr = (string)response.GetType().GetProperty("token")!.GetValue(response)!;
        return new JwtSecurityTokenHandler().ReadJwtToken(tokenStr);
    }

    // ─── Testes: login válido ─────────────────────────────────────────────────

    [Fact]
    public async Task Login_AdminValido_Retorna200ComToken()
    {
        var result = await _sut.Login(new LoginRequest("admin", "admin123"));

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(200, ok.StatusCode);

        var jwt = ParseToken(ok);
        Assert.NotNull(jwt);
    }

    [Fact]
    public async Task Login_BarberValido_Retorna200ComToken()
    {
        var result = await _sut.Login(new LoginRequest("edi", "edi123"));

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(200, ok.StatusCode);
    }

    // ─── Testes: credenciais inválidas ───────────────────────────────────────

    [Fact]
    public async Task Login_PasswordErrada_Retorna401()
    {
        var result = await _sut.Login(new LoginRequest("admin", "wrongpassword"));

        var unauthorized = Assert.IsType<UnauthorizedObjectResult>(result);
        Assert.Equal(401, unauthorized.StatusCode);
    }

    [Fact]
    public async Task Login_UtilizadorInexistente_Retorna401()
    {
        var result = await _sut.Login(new LoginRequest("fantasma", "qualquercoisa"));

        var unauthorized = Assert.IsType<UnauthorizedObjectResult>(result);
        Assert.Equal(401, unauthorized.StatusCode);
    }

    [Fact]
    public async Task Login_PasswordErrada_MensagemGenerica_NaoRevela_SeUserExiste()
    {
        // Segurança: mensagem igual para user inexistente e password errada
        var resultUserOk  = await _sut.Login(new LoginRequest("admin", "errada")) as UnauthorizedObjectResult;
        var resultUserNok = await _sut.Login(new LoginRequest("naoexiste", "errada")) as UnauthorizedObjectResult;

        var problemOk  = resultUserOk?.Value  as ProblemDetails;
        var problemNok = resultUserNok?.Value as ProblemDetails;

        Assert.Equal(problemOk?.Title, problemNok?.Title);
    }

    // ─── Testes: case-insensitive ─────────────────────────────────────────────

    [Fact]
    public async Task Login_UsernameEmMaiusculas_FuncioaCorrectamente()
    {
        var result = await _sut.Login(new LoginRequest("ADMIN", "admin123"));

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task Login_UsernameMisto_FuncionaCorrectamente()
    {
        var result = await _sut.Login(new LoginRequest("AdMiN", "admin123"));

        Assert.IsType<OkObjectResult>(result);
    }

    // ─── Testes: claims do token ──────────────────────────────────────────────

    [Fact]
    public async Task Login_Admin_TokenContemRoleAdmin()
    {
        var result = await _sut.Login(new LoginRequest("admin", "admin123"));
        var ok     = Assert.IsType<OkObjectResult>(result);
        var jwt    = ParseToken(ok);

        var roleClaim = jwt.Claims.FirstOrDefault(c => c.Type == "role");
        Assert.NotNull(roleClaim);
        Assert.Equal("Admin", roleClaim.Value);
    }

    [Fact]
    public async Task Login_Barber_TokenContemRoleBarber()
    {
        var result = await _sut.Login(new LoginRequest("edi", "edi123"));
        var ok     = Assert.IsType<OkObjectResult>(result);
        var jwt    = ParseToken(ok);

        var roleClaim = jwt.Claims.FirstOrDefault(c => c.Type == "role");
        Assert.NotNull(roleClaim);
        Assert.Equal("Barber", roleClaim.Value);
    }

    [Fact]
    public async Task Login_Barber_TokenContemBarberId()
    {
        var result = await _sut.Login(new LoginRequest("edi", "edi123"));
        var ok     = Assert.IsType<OkObjectResult>(result);
        var jwt    = ParseToken(ok);

        var barberIdClaim = jwt.Claims.FirstOrDefault(c => c.Type == "barberId");
        Assert.NotNull(barberIdClaim);
        Assert.Equal(BarberId.ToString(), barberIdClaim.Value);
    }

    [Fact]
    public async Task Login_Admin_TokenNaoContemBarberId()
    {
        var result = await _sut.Login(new LoginRequest("admin", "admin123"));
        var ok     = Assert.IsType<OkObjectResult>(result);
        var jwt    = ParseToken(ok);

        var barberIdClaim = jwt.Claims.FirstOrDefault(c => c.Type == "barberId");
        Assert.Null(barberIdClaim);
    }

    // ─── Testes: expiração do token ───────────────────────────────────────────

    [Fact]
    public async Task Login_Admin_TokenExpiraEm4Horas()
    {
        var before = DateTime.UtcNow.AddHours(4).AddMinutes(-1);
        var after  = DateTime.UtcNow.AddHours(4).AddMinutes(1);

        var result = await _sut.Login(new LoginRequest("admin", "admin123"));
        var ok     = Assert.IsType<OkObjectResult>(result);
        var jwt    = ParseToken(ok);

        Assert.True(jwt.ValidTo >= before && jwt.ValidTo <= after,
            $"Expiração esperada ~4h, foi: {jwt.ValidTo}");
    }

    [Fact]
    public async Task Login_Barber_TokenExpiraEm8Horas()
    {
        var before = DateTime.UtcNow.AddHours(8).AddMinutes(-1);
        var after  = DateTime.UtcNow.AddHours(8).AddMinutes(1);

        var result = await _sut.Login(new LoginRequest("edi", "edi123"));
        var ok     = Assert.IsType<OkObjectResult>(result);
        var jwt    = ParseToken(ok);

        Assert.True(jwt.ValidTo >= before && jwt.ValidTo <= after,
            $"Expiração esperada ~8h, foi: {jwt.ValidTo}");
    }

    // ─── Testes: resposta correcta ────────────────────────────────────────────

    [Fact]
    public async Task Login_Barber_RespostaContemBarberId()
    {
        var result = await _sut.Login(new LoginRequest("edi", "edi123"));
        var ok     = Assert.IsType<OkObjectResult>(result);

        var response  = ok.Value!;
        var barberId  = response.GetType().GetProperty("barberId")!.GetValue(response);

        Assert.Equal(BarberId, barberId);
    }

    [Fact]
    public async Task Login_Admin_RespostaBarberidENull()
    {
        var result = await _sut.Login(new LoginRequest("admin", "admin123"));
        var ok     = Assert.IsType<OkObjectResult>(result);

        var response = ok.Value!;
        var barberId = response.GetType().GetProperty("barberId")!.GetValue(response);

        Assert.Null(barberId);
    }
}