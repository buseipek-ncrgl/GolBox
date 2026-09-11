using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using GolBox.Api.Middlewares;
using GolBox.Api.Services;
using GolBox.Application.Common;
using GolBox.Application.Interfaces;
using GolBox.Infrastructure.Services;
using GolBox.Persistence.Context;

var builder = WebApplication.CreateBuilder(args);

// 1. Controller ve HttpContextAccessor Servisleri
builder.Services.AddControllers();
builder.Services.AddHttpContextAccessor();
builder.Services.AddSignalR();

// CORS Yapılandırması
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// 2. DbContext Tanımlaması (SQLite & MSSQL Desteği)
var connStr = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<AppDbContext>(options =>
{
    if (string.IsNullOrEmpty(connStr) || connStr.Contains("golbox.db") || connStr.Contains("Data Source="))
    {
        options.UseSqlite(connStr ?? "Data Source=golbox.db");
    }
    else
    {
        options.UseSqlServer(connStr);
    }
});

// Interface ve Context mapping
builder.Services.AddScoped<IAppDbContext>(provider => provider.GetRequiredService<AppDbContext>());

// 3. Katmanlar Arası Bağımlılık Enjeksiyonları (Dependency Injection)
builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<ITokenDecoder, TokenDecoder>();
builder.Services.AddSingleton<IDynamicQrService, DynamicQrService>();
builder.Services.AddHostedService<ExpiredItemsCleanupService>();

// 4. MediatR CQRS Kaydı (Application Katmanındaki tüm handler'ları tarar)
builder.Services.AddMediatR(cfg => 
    cfg.RegisterServicesFromAssembly(typeof(Result).Assembly));

// 5. JWT Authentication Yapılandırması
var jwtSettings = builder.Configuration.GetSection("Jwt");
var secretKey = jwtSettings["Key"] ?? "default_very_long_security_key_for_testing_purposes_only";
var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = key,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// 6. Swagger / OpenAPI Yapılandırması (Bearer Auth desteği ile)
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Version = "v1",
        Title = "GölBox API",
        Description = "GölBox Sadakat ve Ön Sipariş Uygulaması API Dokümantasyonu"
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Description = "Lütfen Bearer şemasını kullanın: Bearer {token}",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// Veritabanı Seed İşlemleri
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();
        var passwordHasher = services.GetRequiredService<IPasswordHasher>();
        await DbInitializer.SeedAsync(context, passwordHasher);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Veritabanı seed edilirken bir hata oluştu.");
    }
}

// 7. HTTP Pipeline Yapılandırması
app.UseMiddleware<GlobalExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "GölBox API v1");
    });
}

app.UseStaticFiles();

app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<GolBox.Api.Hubs.OrderHub>("/hubs/orders");
app.MapHub<GolBox.Api.Hubs.NotificationHub>("/hubs/notifications");

app.Run();
