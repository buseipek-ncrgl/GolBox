using GolBox.Application.Common;
using GolBox.Application.Interfaces;
using GolBox.Domain.Entities;
using GolBox.Persistence.Context;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace GolBox.Tests;

internal sealed class FakeCurrentUser : ICurrentUserService
{
    public Guid? UserId { get; set; }
    public string? Email { get; set; } = "staff@test.local";
    public string? Role { get; set; } = "Staff";
    public bool IsAuthenticated => UserId.HasValue;
    public bool IsAdmin => Role == "Admin";
    public bool IsStaff => Role == "Staff";
    public bool IsStaffOrAdmin => IsAdmin || IsStaff;
    public bool IsCitizen => Role is "User" or "Citizen";
    public bool CanAccessUser(Guid resourceUserId) => IsStaffOrAdmin || UserId == resourceUserId;
}

internal sealed class StubPasswordHasher : IPasswordHasher
{
    public string Hash(string password) => $"hash:{password}";
    public bool Verify(string password, string hashedPassword) => hashedPassword == $"hash:{password}";
}

internal static class TestDb
{
    public static (SqliteConnection Connection, AppDbContext Db) OpenMigrated()
    {
        var connection = new SqliteConnection("DataSource=:memory:");
        connection.Open();
        var options = new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options;
        var db = new AppDbContext(options);
        db.Database.Migrate();
        return (connection, db);
    }

    public static (SqliteConnection Connection, AppDbContext Db) OpenCreated()
    {
        var connection = new SqliteConnection("DataSource=:memory:");
        connection.Open();
        var options = new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options;
        var db = new AppDbContext(options);
        db.Database.EnsureCreated();
        return (connection, db);
    }

    public static string FileConnection(string path) =>
        $"Data Source={path};Cache=Shared;Pooling=False";

    public static async Task EnableWalAsync(SqliteConnection connection)
    {
        await using var cmd = connection.CreateCommand();
        cmd.CommandText = "PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;";
        await cmd.ExecuteNonQueryAsync();
    }

    public static IConfiguration QrConfig(bool allowLegacy = false) =>
        new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Security:DynamicQr:HmacKey"] = "unit_test_dynamic_qr_hmac_key_change_me_32",
                ["Security:DynamicQr:AllowLegacyGuid"] = allowLegacy ? "true" : "false"
            })
            .Build();
}

internal static class TestData
{
    public static readonly Guid OrgId = KnownOrganizations.Sehitkamil;

    public static Organization Org() => new()
    {
        Id = OrgId,
        Name = "Şehitkamil",
        CreatedDate = DateTime.UtcNow
    };

    public static User Citizen(Guid? id = null, int points = 100, string role = "User") => new()
    {
        Id = id ?? Guid.NewGuid(),
        OrganizationId = OrgId,
        Email = $"{Guid.NewGuid():N}@test.local",
        NormalizedEmail = Guid.NewGuid().ToString("N").ToUpperInvariant(),
        PasswordHash = "x",
        FirstName = "Vatandas",
        LastName = "Test",
        Role = role,
        PointsBalance = points,
        CreatedDate = DateTime.UtcNow
    };

    public static Cafe Cafe(Guid? id = null) => new()
    {
        Id = id ?? Guid.NewGuid(),
        OrganizationId = OrgId,
        Name = "Test Kafe",
        Address = "Test",
        Latitude = 37.0750m,
        Longitude = 37.3825m,
        IsActive = true,
        CreatedDate = DateTime.UtcNow,
        CategoryId = Guid.NewGuid()
    };

    public static Place Place(Guid? id = null, string name = "Test Tesis", string address = "Tesis Adresi") => new()
    {
        Id = id ?? Guid.NewGuid(),
        OrganizationId = OrgId,
        Name = name,
        Slug = name.ToLowerInvariant().Replace(' ', '-'),
        Category = "Park",
        Address = address,
        SearchNormalized = name.ToLowerInvariant(),
        IsActive = true,
        IsPublished = true,
        CreatedDate = DateTime.UtcNow
    };

    public static CafeCategory Category() => new()
    {
        Id = Guid.NewGuid(),
        OrganizationId = OrgId,
        Name = "Kafe"
    };
}

internal static class ActionResultAssert
{
    public static int Status(IActionResult result) =>
        result switch
        {
            ObjectResult o => o.StatusCode ?? 200,
            StatusCodeResult s => s.StatusCode,
            _ => 200
        };

    public static Result<object> Body(IActionResult result)
    {
        var value = Assert.IsType<Result<object>>((result as ObjectResult)?.Value);
        return value;
    }
}

internal sealed class FakeClientProxy : Microsoft.AspNetCore.SignalR.IClientProxy
{
    public Task SendCoreAsync(string method, object?[] args, CancellationToken cancellationToken = default) =>
        Task.CompletedTask;
}

internal sealed class FakeHubClients : Microsoft.AspNetCore.SignalR.IHubClients
{
    private readonly FakeClientProxy _proxy = new();
    public Microsoft.AspNetCore.SignalR.IClientProxy All => _proxy;
    public Microsoft.AspNetCore.SignalR.IClientProxy AllExcept(IReadOnlyList<string> excludedConnectionIds) => _proxy;
    public Microsoft.AspNetCore.SignalR.IClientProxy Client(string connectionId) => _proxy;
    public Microsoft.AspNetCore.SignalR.IClientProxy Clients(IReadOnlyList<string> connectionIds) => _proxy;
    public Microsoft.AspNetCore.SignalR.IClientProxy Group(string groupName) => _proxy;
    public Microsoft.AspNetCore.SignalR.IClientProxy GroupExcept(string groupName, IReadOnlyList<string> excludedConnectionIds) => _proxy;
    public Microsoft.AspNetCore.SignalR.IClientProxy Groups(IReadOnlyList<string> groupNames) => _proxy;
    public Microsoft.AspNetCore.SignalR.IClientProxy User(string userId) => _proxy;
    public Microsoft.AspNetCore.SignalR.IClientProxy Users(IReadOnlyList<string> userIds) => _proxy;
}

internal sealed class FakeGroupManager : Microsoft.AspNetCore.SignalR.IGroupManager
{
    public Task AddToGroupAsync(string connectionId, string groupName, CancellationToken cancellationToken = default) => Task.CompletedTask;
    public Task RemoveFromGroupAsync(string connectionId, string groupName, CancellationToken cancellationToken = default) => Task.CompletedTask;
}

internal sealed class FakeHubContext<THub> : Microsoft.AspNetCore.SignalR.IHubContext<THub>
    where THub : Microsoft.AspNetCore.SignalR.Hub
{
    public Microsoft.AspNetCore.SignalR.IHubClients Clients { get; } = new FakeHubClients();
    public Microsoft.AspNetCore.SignalR.IGroupManager Groups { get; } = new FakeGroupManager();
}
