using System.Security.Cryptography;
using System.Text;
using GolBox.Application.Common;
using GolBox.Application.Features.Qr.Commands;
using GolBox.Application.Security;
using GolBox.Domain.Entities;
using GolBox.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace GolBox.Tests;

public class QrAndSecurityTests
{
    [Fact]
    public void Parser_Rejects_Raw_Guid_By_Default()
    {
        var service = new DynamicQrService(TestDb.QrConfig());
        var userId = Guid.NewGuid();
        var parsed = QrTokenParser.Resolve(userId.ToString(), service);
        Assert.False(parsed.IsValid);
        Assert.Contains("GUID", parsed.ErrorMessage, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Parser_Rejects_Random_And_User_Guid_Unless_Flag()
    {
        var service = new DynamicQrService(TestDb.QrConfig());
        Assert.False(QrTokenParser.Resolve(Guid.NewGuid().ToString(), service).IsValid);

        var allowed = QrTokenParser.Resolve(Guid.NewGuid().ToString(), service, allowLegacyGuid: true);
        Assert.True(allowed.IsValid);
        Assert.Equal("legacy-guid", allowed.Kind);
    }

    [Fact]
    public void Parser_Accepts_Valid_Hmac_And_Rejects_Tampered_Expired()
    {
        var service = new DynamicQrService(TestDb.QrConfig());
        var userId = Guid.NewGuid();
        var token = service.GenerateDynamicQrToken(userId);
        var ok = QrTokenParser.Resolve(token, service);
        Assert.True(ok.IsValid);
        Assert.Equal("hmac", ok.Kind);

        Assert.False(QrTokenParser.Resolve(token[..^2] + "xx", service).IsValid);

        var expired = BuildHmac(userId, DateTimeOffset.UtcNow.ToUnixTimeSeconds() / 30 - 5);
        Assert.False(QrTokenParser.Resolve(expired, service).IsValid);
    }

    [Fact]
    public async Task Scan_Valid_Hmac_Awards_Visit_Bonus_And_Ledger()
    {
        var (conn, db) = TestDb.OpenMigrated();
        await using var _ = conn;
        await using var __ = db;

        var citizen = TestData.Citizen(points: 10);
        var cafeCategory = new CafeCategory { Id = Guid.NewGuid(), OrganizationId = TestData.OrgId, Name = "Kafe" };
        var cafe = TestData.Cafe();
        cafe.CategoryId = cafeCategory.Id;
        db.Organizations.Add(TestData.Org());
        db.CafeCategories.Add(cafeCategory);
        db.Cafes.Add(cafe);
        db.Users.Add(citizen);
        db.Settings.Add(new Setting { OrganizationId = TestData.OrgId, Key = "visitBonusPoints", Value = "15" });
        db.Settings.Add(new Setting { OrganizationId = TestData.OrgId, Key = "spendEarnRatePercent", Value = "0" });
        await db.SaveChangesAsync();

        var config = TestDb.QrConfig();
        var qr = new DynamicQrService(config);
        var token = qr.GenerateDynamicQrToken(citizen.Id);
        var staff = new FakeCurrentUser { UserId = Guid.NewGuid(), Role = "Staff" };
        var handler = new ScanQrCommandHandler(db, qr, staff, config, NullLogger<ScanQrCommandHandler>.Instance);

        var result = await handler.Handle(new ScanQrCommand(token, cafe.Id, 0, false, null), CancellationToken.None);
        Assert.True(result.Success, result.Message);
        Assert.Equal(25, result.Data!.NewPointsBalance);

        var ledger = await db.PointTransactions.Where(t => t.UserId == citizen.Id).ToListAsync();
        Assert.Contains(ledger, t => t.Type == "Earn" && t.Amount == 15);
    }

    [Fact]
    public async Task Scan_Coupon_Redeem_And_Reject_Raw_Guid()
    {
        var (conn, db) = TestDb.OpenMigrated();
        await using var _ = conn;
        await using var __ = db;

        var citizen = TestData.Citizen(points: 0);
        var cafeCategory = new CafeCategory { Id = Guid.NewGuid(), OrganizationId = TestData.OrgId, Name = "Kafe" };
        var cafe = TestData.Cafe();
        cafe.CategoryId = cafeCategory.Id;
        var reward = new Reward
        {
            Id = Guid.NewGuid(),
            OrganizationId = TestData.OrgId,
            Title = "Çay",
            Description = "x",
            RequiredPoints = 10,
            Status = "Active"
        };
        db.Organizations.Add(TestData.Org());
        db.CafeCategories.Add(cafeCategory);
        db.Cafes.Add(cafe);
        db.Users.Add(citizen);
        db.Rewards.Add(reward);
        db.UserRewards.Add(new UserReward
        {
            UserId = citizen.Id,
            RewardId = reward.Id,
            OrganizationId = TestData.OrgId,
            Status = "Claimed",
            RedeemCode = "TESTCODE1",
            ClaimedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(30)
        });
        db.Settings.Add(new Setting { OrganizationId = TestData.OrgId, Key = "visitBonusPoints", Value = "5" });
        await db.SaveChangesAsync();

        var config = TestDb.QrConfig();
        var qr = new DynamicQrService(config);
        var handler = new ScanQrCommandHandler(db, qr, new FakeCurrentUser { UserId = Guid.NewGuid(), Role = "Staff" }, config, NullLogger<ScanQrCommandHandler>.Instance);

        var guidReject = await handler.Handle(new ScanQrCommand(citizen.Id.ToString(), cafe.Id, 0, false, null), CancellationToken.None);
        Assert.False(guidReject.Success);

        var token = qr.GenerateDynamicQrToken(citizen.Id);
        var redeem = await handler.Handle(new ScanQrCommand(token, cafe.Id, 0, false, "TESTCODE1"), CancellationToken.None);
        Assert.True(redeem.Success, redeem.Message);
        Assert.Equal("coupon-redeem", redeem.Data!.Operation);
        var stored = await db.UserRewards.AsNoTracking().FirstAsync();
        Assert.Equal("Redeemed", stored.Status);
    }

    [Fact]
    public async Task Scan_Expired_Coupon_Rejects_As_Expired_Not_Cancelled()
    {
        var (conn, db) = TestDb.OpenMigrated();
        await using var _ = conn;
        await using var __ = db;

        var citizen = TestData.Citizen(points: 0);
        var cafeCategory = new CafeCategory { Id = Guid.NewGuid(), OrganizationId = TestData.OrgId, Name = "Kafe" };
        var cafe = TestData.Cafe();
        cafe.CategoryId = cafeCategory.Id;
        var reward = new Reward
        {
            Id = Guid.NewGuid(),
            OrganizationId = TestData.OrgId,
            Title = "Cay",
            Description = "x",
            RequiredPoints = 10,
            Status = "Active"
        };
        db.Organizations.Add(TestData.Org());
        db.CafeCategories.Add(cafeCategory);
        db.Cafes.Add(cafe);
        db.Users.Add(citizen);
        db.Rewards.Add(reward);
        db.UserRewards.Add(new UserReward
        {
            UserId = citizen.Id,
            RewardId = reward.Id,
            OrganizationId = TestData.OrgId,
            Status = "Claimed",
            RedeemCode = "EXPIRED1",
            ClaimedAt = DateTime.UtcNow.AddDays(-40),
            ExpiresAt = DateTime.UtcNow.AddMinutes(-1)
        });
        db.Settings.Add(new Setting { OrganizationId = TestData.OrgId, Key = "visitBonusPoints", Value = "5" });
        await db.SaveChangesAsync();

        var config = TestDb.QrConfig();
        var qr = new DynamicQrService(config);
        var token = qr.GenerateDynamicQrToken(citizen.Id);
        var handler = new ScanQrCommandHandler(
            db,
            qr,
            new FakeCurrentUser { UserId = Guid.NewGuid(), Role = "Staff" },
            config,
            NullLogger<ScanQrCommandHandler>.Instance);

        var redeem = await handler.Handle(new ScanQrCommand(token, cafe.Id, 0, false, "EXPIRED1"), CancellationToken.None);
        Assert.False(redeem.Success);
        Assert.Contains("süresi dolmuş", redeem.Message, StringComparison.OrdinalIgnoreCase);

        var stored = await db.UserRewards.AsNoTracking().FirstAsync();
        Assert.Equal(UserRewardStatuses.Expired, stored.Status);
        Assert.NotEqual(UserRewardStatuses.Cancelled, stored.Status);
        Assert.Null(stored.RedeemedAt);
    }

    [Fact]
    public async Task Scan_Citizen_Is_Forbidden()
    {
        var (conn, db) = TestDb.OpenMigrated();
        await using var _ = conn;
        await using var __ = db;
        var citizen = TestData.Citizen();
        db.Organizations.Add(TestData.Org());
        db.Users.Add(citizen);
        await db.SaveChangesAsync();

        var config = TestDb.QrConfig();
        var qr = new DynamicQrService(config);
        var token = qr.GenerateDynamicQrToken(citizen.Id);
        var handler = new ScanQrCommandHandler(
            db,
            qr,
            new FakeCurrentUser { UserId = citizen.Id, Role = "User" },
            config,
            NullLogger<ScanQrCommandHandler>.Instance);

        var result = await handler.Handle(new ScanQrCommand(token, Guid.NewGuid(), 0, false, null), CancellationToken.None);
        Assert.False(result.Success);
        Assert.True(result.IsForbidden);
    }

    [Fact]
    public void Qr_Scan_Endpoint_Is_Staff_Only()
    {
        var method = typeof(GolBox.Api.Controllers.QrController).GetMethod("ScanQr");
        Assert.NotNull(method);
        var authorize = method!.GetCustomAttributes(typeof(Microsoft.AspNetCore.Authorization.AuthorizeAttribute), true)
            .Cast<Microsoft.AspNetCore.Authorization.AuthorizeAttribute>()
            .ToList();
        Assert.Contains(authorize, a => a.Policy == GolBox.Application.Authorization.AuthorizationPolicies.StaffOrAdmin);
    }

    [Fact]
    public void Settings_Endpoint_Is_Admin_Only()
    {
        var method = typeof(GolBox.Api.Controllers.SettingsController).GetMethod("UpdateSetting");
        var authorize = method!.GetCustomAttributes(typeof(Microsoft.AspNetCore.Authorization.AuthorizeAttribute), true)
            .Cast<Microsoft.AspNetCore.Authorization.AuthorizeAttribute>();
        Assert.Contains(authorize, a => a.Policy == GolBox.Application.Authorization.AuthorizationPolicies.AdminOnly);
    }

    private static string BuildHmac(Guid userId, long timeStep)
    {
        var key = Encoding.UTF8.GetBytes("unit_test_dynamic_qr_hmac_key_change_me_32");
        var rawPayload = $"{userId:D}:{timeStep}";
        using var hmac = new HMACSHA256(key);
        var hash = Convert.ToBase64String(hmac.ComputeHash(Encoding.UTF8.GetBytes(rawPayload)))
            .Replace("+", "-")
            .Replace("/", "_")
            .TrimEnd('=');
        return $"GBQR:{userId:D}:{timeStep}:{hash}";
    }
}
