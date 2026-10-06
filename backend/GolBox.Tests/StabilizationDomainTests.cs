using GolBox.Api.Controllers;
using GolBox.Application.Common;
using GolBox.Application.Places;
using GolBox.Application.Settings;
using GolBox.Domain.Entities;
using GolBox.Persistence.Context;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace GolBox.Tests;

public class StabilizationDomainTests
{
    [Fact]
    public void Setting_Validation_Rejects_Out_Of_Range()
    {
        Assert.False(SettingRules.Validate("rewardExpireDays", "0").Success);
        Assert.False(SettingRules.Validate("visitBonusPoints", "10001").Success);
        Assert.False(SettingRules.Validate("pointsExchangeRate", "0").Success);
        Assert.False(SettingRules.Validate("spendEarnRatePercent", "101").Success);
        Assert.False(SettingRules.Validate("unknownKey", "1").Success);
        Assert.True(SettingRules.Validate("rewardExpireDays", "365").Success);
        Assert.True(SettingRules.Validate("spendEarnRatePercent", "10").Success);
    }

    [Fact]
    public async Task Order_Cancel_Refunds_Once()
    {
        var (conn, db) = TestDb.OpenMigrated();
        await using var _ = conn;
        await using var __ = db;
        var user = TestData.Citizen(points: 10);
        var category = new CafeCategory { Id = Guid.NewGuid(), OrganizationId = TestData.OrgId, Name = "Kafe" };
        var cafe = TestData.Cafe();
        cafe.CategoryId = category.Id;
        db.Organizations.Add(TestData.Org());
        db.CafeCategories.Add(category);
        db.Cafes.Add(cafe);
        db.Users.Add(user);
        var order = new Order
        {
            OrganizationId = TestData.OrgId,
            UserId = user.Id,
            CafeId = cafe.Id,
            TotalAmount = 40,
            PaidWithPoints = true,
            PointsUsed = 40,
            Status = OrderStatuses.Pending,
            CollectionCode = "IS-MR-1"
        };
        db.Orders.Add(order);
        await db.SaveChangesAsync();

        Assert.True(OrderPointRefund.TryRefundOnCancel(order, user, db));
        await db.SaveChangesAsync();
        Assert.Equal(50, user.PointsBalance);
        Assert.Equal(0, order.PointsUsed);
        Assert.False(OrderPointRefund.TryRefundOnCancel(order, user, db));
        await db.SaveChangesAsync();
        Assert.Equal(50, user.PointsBalance);
        Assert.Equal(1, await db.PointTransactions.CountAsync(t => t.Type == "Refund"));
    }

    [Fact]
    public async Task Cafe_Create_Update_Delete_Keeps_Single_Place()
    {
        var (conn, db) = TestDb.OpenMigrated();
        await using var _ = conn;
        await using var __ = db;
        db.Organizations.Add(TestData.Org());
        var category = new CafeCategory { Id = Guid.NewGuid(), OrganizationId = TestData.OrgId, Name = "Kafe" };
        db.CafeCategories.Add(category);
        await db.SaveChangesAsync();

        var cafe = new Cafe
        {
            OrganizationId = TestData.OrgId,
            CategoryId = category.Id,
            Name = "Merkez",
            Address = "Adres 1",
            Latitude = 37.07m,
            Longitude = 37.38m,
            IsActive = true
        };
        db.Cafes.Add(cafe);
        await PlaceCafeSync.EnsureLinkedPlaceAsync(db, cafe);
        await db.SaveChangesAsync();
        Assert.Equal(1, await db.Places.CountAsync());

        cafe.Name = "Merkez Yeni";
        cafe.Address = "Adres 2";
        await PlaceCafeSync.EnsureLinkedPlaceAsync(db, cafe);
        await db.SaveChangesAsync();
        Assert.Equal(1, await db.Places.CountAsync());
        var place = await db.Places.SingleAsync();
        Assert.Equal("Merkez Yeni", place.Name);
        Assert.Equal("Adres 2", place.Address);

        PlaceCafeSync.ApplyPlaceToCafe(place, cafe);
        Assert.Equal("Merkez Yeni", cafe.Name);

        cafe.IsDeleted = true;
        cafe.IsActive = false;
        await PlaceCafeSync.UnpublishLinkedCafePlaceAsync(db, cafe);
        await db.SaveChangesAsync();
        place = await db.Places.IgnoreQueryFilters().SingleAsync();
        Assert.False(place.IsPublished);
        Assert.False(place.IsDeleted);
        Assert.Equal(1, await db.Places.IgnoreQueryFilters().CountAsync());
    }

    [Fact]
    public async Task Production_Seed_Does_Not_Create_Demo_Accounts()
    {
        var (conn, db) = TestDb.OpenMigrated();
        await using var _ = conn;
        await using var __ = db;
        await DbInitializer.SeedAsync(db, new StubPasswordHasher(), isDevelopment: false);
        Assert.False(await db.Users.AnyAsync());
        Assert.False(await db.Cafes.AnyAsync());
        Assert.False(await db.Rewards.AnyAsync());
        Assert.False(await db.Activities.AnyAsync());
        Assert.True(await db.Organizations.AnyAsync());
        Assert.True(await db.Settings.AnyAsync());

        await DbInitializer.SeedAsync(db, new StubPasswordHasher(), isDevelopment: false, forceRefresh: false, bootstrapAdminEmail: "pilot@sehitkamil.bel.tr", bootstrapAdminPassword: "SuperSecretAdminPass1");
        var admin = Assert.Single(await db.Users.ToListAsync());
        Assert.Equal("pilot@sehitkamil.bel.tr", admin.Email);
        Assert.Equal("Admin", admin.Role);
        Assert.DoesNotContain(await db.Users.ToListAsync(), u => u.Email == "admin@golbox.gov.tr");
    }

    [Fact]
    public async Task Fresh_Sqlite_Migrate_Creates_Required_Tables()
    {
        var (conn, db) = TestDb.OpenMigrated();
        await using var _ = conn;
        await using var __ = db;
        Assert.True(await db.Database.CanConnectAsync());
        await db.Organizations.AddAsync(TestData.Org());
        await db.SaveChangesAsync();
        db.Places.Add(new Place
        {
            OrganizationId = TestData.OrgId,
            Name = "Park",
            Slug = "park",
            Category = PlaceCategories.Park,
            SearchNormalized = "park",
            IsActive = true,
            IsPublished = true
        });
        await db.SaveChangesAsync();
        Assert.Equal(1, await db.Places.CountAsync());
    }

    [Fact]
    public async Task Upgrade_From_Baseline_Then_Migrate()
    {
        var path = Path.Combine(Path.GetTempPath(), $"gb-up-{Guid.NewGuid():N}.db");
        try
        {
            await using var conn = new SqliteConnection($"Data Source={path}");
            await conn.OpenAsync();
            await using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(conn).Options);
            await db.Database.MigrateAsync("20260720134257_AddAgeEducationAndOrderImage");
            await db.Database.MigrateAsync();
            Assert.True(await db.Database.CanConnectAsync());
        }
        finally
        {
            SqliteConnection.ClearAllPools();
            if (File.Exists(path))
            {
                try { File.Delete(path); } catch { }
            }
        }
    }

    [Fact]
    public void SqlServer_Provider_Can_Build_Model()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlServer("Server=127.0.0.1;Database=GolBoxModelCheck;User Id=sa;Password=unused;TrustServerCertificate=True")
            .Options;
        using var db = new AppDbContext(options);
        Assert.NotNull(db.Model.FindEntityType(typeof(Place)));
        Assert.NotNull(db.Model.FindEntityType(typeof(CityContent)));
        Assert.NotNull(db.Model.FindEntityType(typeof(UserFieldCapture)));
    }

    [Fact]
    public async Task Field_Last_Stock_One_Winner()
    {
        var path = Path.Combine(Path.GetTempPath(), $"gb-field-{Guid.NewGuid():N}.db");
        var cs = TestDb.FileConnection(path);
        try
        {
            Guid dropId;
            Guid userA;
            Guid userB;
            await using (var setupConn = new SqliteConnection(cs))
            {
                await setupConn.OpenAsync();
                await using var setup = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(setupConn).Options);
                await setup.Database.MigrateAsync();
                await TestDb.EnableWalAsync(setupConn);
                var category = new CafeCategory { Id = Guid.NewGuid(), OrganizationId = TestData.OrgId, Name = "Kafe" };
                var cafe = TestData.Cafe();
                cafe.CategoryId = category.Id;
                var a = TestData.Citizen();
                var b = TestData.Citizen();
                userA = a.Id;
                userB = b.Id;
                var drop = new FieldDrop
                {
                    OrganizationId = TestData.OrgId,
                    CafeId = cafe.Id,
                    Title = "Kutu",
                    Description = "x",
                    Latitude = 37.0750m,
                    Longitude = 37.3825m,
                    RadiusMeters = 500,
                    PointsGranted = 10,
                    TotalStock = 1,
                    CapturedCount = 0,
                    PerUserLimit = 1,
                    StartsAt = DateTime.UtcNow.AddHours(-1),
                    EndsAt = DateTime.UtcNow.AddDays(1),
                    IsActive = true
                };
                setup.Organizations.Add(TestData.Org());
                setup.CafeCategories.Add(category);
                setup.Cafes.Add(cafe);
                setup.Users.AddRange(a, b);
                setup.FieldDrops.Add(drop);
                await setup.SaveChangesAsync();
                dropId = drop.Id;
            }

            async Task<int> Capture(Guid userId)
            {
                await using var conn = new SqliteConnection(cs);
                await conn.OpenAsync();
                await using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(conn).Options);
                var controller = new FieldDropsController(db, new FakeCurrentUser { UserId = userId, Role = "User" });
                var result = await controller.Capture(dropId, new CaptureFieldDropRequest
                {
                    Latitude = 37.0750m,
                    Longitude = 37.3825m,
                    AccuracyMeters = 5
                });
                return result is Microsoft.AspNetCore.Mvc.ObjectResult obj ? obj.StatusCode ?? 200 : 500;
            }

            var codes = await Task.WhenAll(Capture(userA), Capture(userB));
            Assert.Contains(200, codes);
            Assert.Contains(codes, c => c is 409 or 400);

            await using var checkConn = new SqliteConnection(cs);
            await checkConn.OpenAsync();
            await using var check = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(checkConn).Options);
            Assert.Equal(1, await check.UserFieldCaptures.CountAsync());
            Assert.Equal(1, await check.FieldDrops.Select(d => d.CapturedCount).SingleAsync());
            var winners = await check.Users.CountAsync(u => u.PointsBalance == 110);
            Assert.Equal(1, winners);
        }
        finally
        {
            if (File.Exists(path)) File.Delete(path);
        }
    }
}
