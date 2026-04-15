using EleganceStudio.API.Interfaces;

namespace EleganceStudio.API.Services;


public class SmsService : ISmsService
{
    private readonly HttpClient _http;
    private readonly string _baseUrl;

    public SmsService(HttpClient http, IConfiguration config)
    {
        _http = http;
        _baseUrl = config["Mountebank:Url"] ?? "http://localhost:2525";
    }

    public async Task SendToClientAsync(string phone, string message)
    {
        await SendAsync(phone, message, "client");
    }

    public async Task SendToBarberAsync(string phone, string message)
    {
        await SendAsync(phone, message, "barber");
    }

    private async Task SendAsync(string phone, string message, string type)
    {
        try
        {
            var payload = new { to = phone, body = message, type };
            await _http.PostAsJsonAsync($"{_baseUrl}/sms/{type}", payload);
        }
        catch
        {
            // Mountebank offline não bloqueia a operação
        }
    }
}