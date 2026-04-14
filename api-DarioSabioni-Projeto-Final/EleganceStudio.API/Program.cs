using EleganceStudio.API.Data;
using EleganceStudio.API.Interfaces;
using EleganceStudio.API.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using StackExchange.Redis;
using System.Text;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

// Controllers + Swagger
builder.Services.AddControllers();
builder.Services.AddOpenApi();

// PostgreSQL + EF Core
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Redis
builder.Services.AddSingleton<IConnectionMultiplexer>(sp =>
    ConnectionMultiplexer.Connect(builder.Configuration["Redis:ConnectionString"]!));
builder.Services.AddStackExchangeRedisCache(options =>
    options.Configuration = builder.Configuration["Redis:ConnectionString"]);

// JWT
var jwtKey = builder.Configuration["Jwt:SecretKey"]!;
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer           = true,
            ValidateAudience         = true,
            ValidateLifetime         = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer              = builder.Configuration["Jwt:Issuer"],
            ValidAudience            = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
        // Necessário para SignalR (token via query string)
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                    context.Token = accessToken;
                return Task.CompletedTask;
            }
        };
    });
builder.Services.AddAuthorization();

// CORS (cliente + dashboard + SignalR)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontends", policy =>
        policy.WithOrigins("http://localhost:3000", "http://localhost:3001")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials());
});

// SignalR
builder.Services.AddSignalR();

// Rate Limiting
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("bookings",    o => { o.PermitLimit = 10; o.Window = TimeSpan.FromMinutes(1); o.QueueProcessingOrder = QueueProcessingOrder.OldestFirst; o.QueueLimit = 0; });
    options.AddFixedWindowLimiter("availability",o => { o.PermitLimit = 30; o.Window = TimeSpan.FromMinutes(1); o.QueueProcessingOrder = QueueProcessingOrder.OldestFirst; o.QueueLimit = 0; });
    options.AddFixedWindowLimiter("lookup",      o => { o.PermitLimit = 5;  o.Window = TimeSpan.FromMinutes(1); o.QueueProcessingOrder = QueueProcessingOrder.OldestFirst; o.QueueLimit = 0; });
    options.AddFixedWindowLimiter("login",       o => { o.PermitLimit = 5;  o.Window = TimeSpan.FromMinutes(1); o.QueueProcessingOrder = QueueProcessingOrder.OldestFirst; o.QueueLimit = 0; });
});

// Services
builder.Services.AddScoped<IAvailabilityService, AvailabilityService>();
builder.Services.AddHttpClient();

var app = builder.Build();

if (app.Environment.IsDevelopment())
    app.MapOpenApi();

app.UseHttpsRedirection();
app.UseRateLimiter();
app.UseCors("AllowFrontends");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();