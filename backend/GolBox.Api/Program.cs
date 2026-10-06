using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using GolBox.Api.Hubs;
using GolBox.Api.Middlewares;
using GolBox.Api.Security;
using GolBox.Api.Services;
using GolBox.Application.Authorization;
using GolBox.Application.Common;
using GolBox.Application.Interfaces;
using GolBox.Infrastructure.Services;
using GolBox.Persistence.Context;

var builder = WebApplication.CreateBuilder(args);

StartupSecrets.Validate(builder.Configuration, builder.Environment);

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

builder.Services.AddControllers();
builder.Services.AddHttpContextAccessor();
builder.Services.AddSingleton<IUserIdProvider, NameIdentifierUserIdProvider>();
builder.Services.AddSignalR();

var configuredOrigins = builder.Configuration.GetSection("Security:Cors:AllowedOrigins").Get<string[]>()
    ?? Array.Empty<string>();
if (configuredOrigins.Length == 0 && builder.Environment.IsDevelopment())
{
    configuredOrigins =
    [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173"
    ];
}

builder.Services.AddCors(options =>
{
    options.AddPolicy("AppCors", policy =>
    {
        policy.WithOrigins(configuredOrigins)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

var connStr = DatabaseProvider.ResolveConnectionString(builder.Configuration, optional: !builder.Environment.IsProduction());
if (builder.Environment.IsProduction())
{
    if (string.IsNullOrWhiteSpace(connStr) || DatabaseProvider.IsSqlite(connStr))
        throw new InvalidOperationException("Production requires ConnectionStrings:Default as SQL Server.");
}

builder.Services.AddDbContext<AppDbContext>(options =>
{
    if (!builder.Environment.IsProduction() && (string.IsNullOrWhiteSpace(connStr) || DatabaseProvider.IsSqlite(connStr!)))
        options.UseSqlite(string.IsNullOrWhiteSpace(connStr) ? "Data Source=golbox.db" : connStr);
    else
        options.UseSqlServer(connStr);
});

builder.Services.AddScoped<IAppDbContext>(provider => provider.GetRequiredService<AppDbContext>());
builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddMemoryCache();
builder.Services.AddSingleton<ICityContentCache, CityContentCache>();
builder.Services.AddSingleton<IPlaceCache, PlaceCache>();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<ITokenDecoder, TokenDecoder>();
builder.Services.AddSingleton<IDynamicQrService, DynamicQrService>();
builder.Services.AddHostedService<ExpiredItemsCleanupService>();
builder.Services.AddHostedService<GolBox.Api.Services.ScheduledNotificationDispatcher>();

builder.Services.AddMediatR(cfg =>
    cfg.RegisterServicesFromAssembly(typeof(Result).Assembly));

var jwtSettings = builder.Configuration.GetSection("Jwt");
var secretKey = jwtSettings["Key"]!;
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

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(AuthorizationPolicies.CitizenOnly, policy =>
        policy.RequireRole(AuthorizationPolicies.RoleCitizen, AuthorizationPolicies.RoleUser));
    options.AddPolicy(AuthorizationPolicies.StaffOrAdmin, policy =>
        policy.RequireRole(AuthorizationPolicies.RoleStaff, AuthorizationPolicies.RoleAdmin));
    options.AddPolicy(AuthorizationPolicies.AdminOnly, policy =>
        policy.RequireRole(AuthorizationPolicies.RoleAdmin));
});

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("auth", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 8,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));
    options.AddPolicy("qr", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 30,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));
    options.AddPolicy("capture", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 15,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));
});

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

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var context = services.GetRequiredService<AppDbContext>();
    var logger = services.GetRequiredService<ILoggerFactory>().CreateLogger("Startup");
    await context.Database.MigrateAsync();
    if (context.Database.IsSqlite())
    {
        try
        {
            await context.Database.ExecuteSqlRawAsync("ALTER TABLE ProductOptionGroups DROP COLUMN MinSelect;");
            await context.Database.ExecuteSqlRawAsync("ALTER TABLE ProductOptionGroups DROP COLUMN MaxSelect;");
            await context.Database.ExecuteSqlRawAsync("ALTER TABLE ProductOptionGroups DROP COLUMN IsRequired;");
        }
        catch
        {
            try
            {
                await context.Database.ExecuteSqlRawAsync(@"
                    PRAGMA foreign_keys=OFF;
                    CREATE TABLE IF NOT EXISTS ProductOptionGroups_clean (
                        Id TEXT NOT NULL PRIMARY KEY,
                        MenuItemId TEXT NOT NULL,
                        Name TEXT NOT NULL,
                        SelectionType TEXT NOT NULL,
                        Required INTEGER NOT NULL,
                        MinSelections INTEGER NOT NULL,
                        MaxSelections INTEGER NOT NULL,
                        DisplayOrder INTEGER NOT NULL,
                        IsDeleted INTEGER NOT NULL,
                        CreatedAt TEXT NOT NULL,
                        UpdatedAt TEXT NULL,
                        CreatedBy TEXT NULL,
                        UpdatedBy TEXT NULL,
                        DeletedDate TEXT NULL,
                        FOREIGN KEY (MenuItemId) REFERENCES MenuItems (Id) ON DELETE CASCADE
                    );
                    INSERT OR IGNORE INTO ProductOptionGroups_clean 
                    SELECT Id, MenuItemId, Name, SelectionType, Required, MinSelections, MaxSelections, DisplayOrder, IsDeleted, CreatedAt, UpdatedAt, CreatedBy, UpdatedBy, DeletedDate 
                    FROM ProductOptionGroups;
                    DROP TABLE ProductOptionGroups;
                    ALTER TABLE ProductOptionGroups_clean RENAME TO ProductOptionGroups;
                    PRAGMA foreign_keys=ON;
                ");
            }
            catch { }
        }
        try
        {
            await context.Database.ExecuteSqlRawAsync("ALTER TABLE ProductOptions DROP COLUMN PriceAdjustment;");
            await context.Database.ExecuteSqlRawAsync("ALTER TABLE ProductOptions DROP COLUMN IsDefault;");
            await context.Database.ExecuteSqlRawAsync("ALTER TABLE ProductOptions DROP COLUMN IsAvailable;");
        }
        catch { }
    }
    logger.LogInformation("Database migrations applied.");

    var passwordHasher = services.GetRequiredService<IPasswordHasher>();
    var forceRefresh = args.Contains("--reset-seed") || args.Contains("--seed-refresh") || builder.Configuration.GetValue<bool>("ResetSeedOnStartup");
    await DbInitializer.SeedAsync(
        context,
        passwordHasher,
        app.Environment.IsDevelopment(),
        forceRefresh,
        app.Configuration["BootstrapAdmin:Email"],
        app.Configuration["BootstrapAdmin:Password"]);
}

app.UseForwardedHeaders();
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
var uploadsPath = app.Configuration["Storage:UploadsPath"];
if (!string.IsNullOrWhiteSpace(uploadsPath))
{
    Directory.CreateDirectory(uploadsPath);
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new PhysicalFileProvider(Path.GetFullPath(uploadsPath)),
        RequestPath = "/uploads"
    });
}
app.UseCors("AppCors");
app.UseRateLimiter();
app.UseAuthentication();
app.UseMiddleware<CorrelationIdMiddleware>();
app.UseAuthorization();

app.MapControllers();
app.MapHub<OrderHub>("/hubs/orders").RequireAuthorization();
app.MapHub<NotificationHub>("/hubs/notifications").RequireAuthorization();

app.Run();

public partial class Program;
