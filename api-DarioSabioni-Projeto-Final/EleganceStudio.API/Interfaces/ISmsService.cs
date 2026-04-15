namespace EleganceStudio.API.Interfaces;

public interface ISmsService
{
    Task SendToClientAsync(string phone, string message);
    Task SendToBarberAsync(string phone, string message);
}