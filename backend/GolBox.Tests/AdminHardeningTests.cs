using System.Collections;
using GolBox.Api.Controllers;
using GolBox.Api.Hubs;
using GolBox.Application.Authorization;
using GolBox.Application.Common;
using GolBox.Application.Features.Points.Commands;
using GolBox.Domain.Entities;
using GolBox.Persistence.Context;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace GolBox.Tests;

public class AdminHardeningTests
{
    [Fact]
    public void Istanbul_Today_Range_Is_Full_Local_Day_Stored_As_Utc()
    {
        var (fromUtc, toUtc) = AdminDateRange.Today();
        var fromLocal = TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(fromUtc, DateTimeKind.Utc), AdminDateRange.Istanbul);
        var toLocal = TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(toUtc, DateTimeKind.Utc), AdminDateRange.Istanbul);
        Assert.Equal(TimeSpan.FromDays(1), toUtc - fromUtc);
        Assert.Equal(TimeSpan.Zero, fromLocal.TimeOfDay);
        Assert.Equal(fromLocal.Date.AddDays(1), toLocal.Date);
        Assert.Equal(TimeSpan.FromHours(3), AdminDateRange.Istanbul.GetUtcOffset(DateTime.UtcNow));
    }

    [Fact]
    public void Istanbul_2330_Utc_Is_Next_Calendar_Day()
    {
        var utc = DateTime.SpecifyKind(new DateTime(2026, 9, 16, 23, 30, 0), DateTimeKind.Utc);
        var istanbul = TimeZoneInfo.ConvertTimeFromUtc(utc, AdminDateRange.Istanbul);
        Assert.Equal(new DateTime(2026, 9, 17, 2, 30, 0), istanbul);
    }

    [Fact]
    public void Istanbul_0230_Is_Previous_Utc_Evening()
    {
        var local = DateTime.SpecifyKind(new DateTime(2026, 9, 17, 2, 30, 0), DateTimeKind.Unspecified);
        var utc = TimeZoneInfo.ConvertTimeToUtc(local, AdminDateRange.Istanbul);
        Assert.Equal(new DateTime(2026, 9, 16, 23, 30, 0), utc);
    }

    [Fact]
    public async Task Dashboard_Active_Count_Includes_Ready_And_Critical_Uses_Sla()
    {
        var (conn, db) = TestDb.OpenMigrated();
        await using var _ = conn;
        await using var __ = db;
        var category = TestData.Category();
        var cafe = TestData.Cafe();
        cafe.CategoryId = category.Id;
        var user = TestData.Citizen();
        db.Organizations.Add(TestData.Org());
        db.CafeCategories.Add(category);
        db.Cafes.Add(cafe);
        db.Users.Add(user);
        var pending = NewOrder(user.Id, cafe.Id, OrderStatuses.Pending, DateTime.UtcNow);
        var preparing = NewOrder(user.Id, cafe.Id, OrderStatuses.Preparing, DateTime.UtcNow);
        var readyFresh = NewOrder(user.Id, cafe.Id, OrderStatuses.Ready, DateTime.UtcNow);
        var readyCritical = NewOrder(user.Id, cafe.Id, OrderStatuses.Ready, DateTime.UtcNow);
        var completed = NewOrder(user.Id, cafe.Id, OrderStatuses.Completed, DateTime.UtcNow);
        db.Orders.AddRange(pending, preparing, readyFresh, readyCritical, completed);
        await db.SaveChangesAsync();
        pending.CreatedDate = DateTime.UtcNow.AddMinutes(-5);
        preparing.CreatedDate = DateTime.UtcNow.AddMinutes(-8);
        readyFresh.CreatedDate = DateTime.UtcNow.AddMinutes(-3);
        readyCritical.CreatedDate = DateTime.UtcNow.AddMinutes(-(AdminSafetyRules.CriticalOrderMinutes + 5));
        completed.CreatedDate = DateTime.UtcNow.AddMinutes(-2);
        foreach (var order in new[] { pending, preparing, readyFresh, readyCritical, completed })
            db.Entry(order).Property(o => o.CreatedDate).IsModified = true;
        await db.SaveChangesAsync();

        var body = ActionResultAssert.Body(await new DashboardController(db).GetOverview());
        Assert.Equal(4, Convert.ToInt32(PagedData.Prop(body.Data!, "pendingOrders")));
        Assert.Equal(4, Convert.ToInt32(PagedData.Prop(body.Data!, "activeOrders")));
        Assert.Equal(1, Convert.ToInt32(PagedData.Prop(body.Data!, "criticalOrders")));
        var alerts = PagedData.Prop(body.Data!, "alerts")!;
        var critical = AsList(PagedData.Prop(alerts, "longPendingOrders"));
        Assert.Single(critical);
    }

    [Fact]
    public async Task Dashboard_Today_Uses_Istanbul_Range_Not_Utc_Midnight()
    {
        var (conn, db) = TestDb.OpenMigrated();
        await using var _ = conn;
        await using var __ = db;
        var category = TestData.Category();
        var cafe = TestData.Cafe();
        cafe.CategoryId = category.Id;
        var user = TestData.Citizen();
        db.Organizations.Add(TestData.Org());
        db.CafeCategories.Add(category);
        db.Cafes.Add(cafe);
        db.Users.Add(user);

        var (todayFrom, todayTo) = AdminDateRange.Today();
        var inside = NewOrder(user.Id, cafe.Id, OrderStatuses.Completed, todayFrom.AddMinutes(1));
        var outside = NewOrder(user.Id, cafe.Id, OrderStatuses.Completed, todayFrom.AddMinutes(-1));
        db.Orders.Add(inside);
        db.Orders.Add(outside);
        await db.SaveChangesAsync();
        inside.CreatedDate = todayFrom.AddMinutes(1);
        outside.CreatedDate = todayFrom.AddMinutes(-1);
        db.Entry(inside).Property(o => o.CreatedDate).IsModified = true;
        db.Entry(outside).Property(o => o.CreatedDate).IsModified = true;
        await db.SaveChangesAsync();

        var body = ActionResultAssert.Body(await new DashboardController(db).GetOverview());
        Assert.Equal(1, Convert.ToInt32(PagedData.Prop(body.Data!, "todayOrders")));
        Assert.True(todayFrom < todayTo);
        Assert.Equal("Europe/Istanbul", PagedData.Prop(body.Data!, "timezone")?.ToString());
        Assert.Equal(todayFrom, PagedData.Prop(body.Data!, "todayFrom"));
        Assert.Equal(todayTo, PagedData.Prop(body.Data!, "todayTo"));
    }

    [Fact]
    public void GrantPoints_Endpoint_Is_AdminOnly()
    {
        var method = typeof(PointsController).GetMethod(nameof(PointsController.GrantPoints));
        var attr = method!.GetCustomAttributes(typeof(AuthorizeAttribute), true)
            .Cast<AuthorizeAttribute>()
            .First();
        Assert.Equal(AuthorizationPolicies.AdminOnly, attr.Policy);
        Assert.Contains(typeof(PointsController).GetCustomAttributes(typeof(AuthorizeAttribute), true), _ => true);
    }

    [Theory]
    [InlineData(0, "Düzeltme işlemi", "Add")]
    [InlineData(-5, "Düzeltme işlemi", "Add")]
    [InlineData(10001, "Düzeltme işlemi", "Add")]
    [InlineData(10, "ab", "Add")]
    public async Task GrantPoints_Rejects_Invalid_Amount_Or_Short_Reason(int amount, string reason, string action)
    {
        var (conn, db) = TestDb.OpenMigrated();
        await using var _ = conn;
        await using var __ = db;
        var user = await SeedCitizenAsync(db);
        var handler = new GrantPointsCommandHandler(db, new FakeCurrentUser { UserId = Guid.NewGuid(), Role = "Admin" });
        var result = await handler.Handle(new GrantPointsCommand(user.Id, amount, reason, reason, action), default);
        Assert.False(result.Success);
        Assert.Equal(100, (await db.Users.FindAsync(user.Id))!.PointsBalance);
    }

    [Fact]
    public async Task GrantPoints_Rejects_Overdraft_And_Writes_Ledger_On_Success()
    {
        var (conn, db) = TestDb.OpenMigrated();
        await using var _ = conn;
        await using var __ = db;
        var user = await SeedCitizenAsync(db, 20);
        var actor = Guid.NewGuid();
        var handler = new GrantPointsCommandHandler(db, new FakeCurrentUser { UserId = actor, Role = "Admin" });

        var overdraft = await handler.Handle(new GrantPointsCommand(user.Id, 50, "Hatalı yükleme düzeltmesi", null, "Deduct"), default);
        Assert.False(overdraft.Success);
        Assert.Equal(20, (await db.Users.FindAsync(user.Id))!.PointsBalance);

        var ok = await handler.Handle(new GrantPointsCommand(user.Id, 15, "Etkinlik ikramı"), default);
        Assert.True(ok.Success);
        Assert.Equal(35, (await db.Users.FindAsync(user.Id))!.PointsBalance);
        Assert.Equal(1, await db.PointTransactions.CountAsync(t => t.UserId == user.Id && t.Type == "ManualAddition"));
        Assert.Equal(actor, (await db.PointTransactions.FirstAsync(t => t.UserId == user.Id)).CreatedBy);
    }

    [Fact]
    public async Task Ready_To_Cancelled_Remains_Allowed()
    {
        var (conn, db) = TestDb.OpenMigrated();
        await using var _ = conn;
        await using var __ = db;
        var category = TestData.Category();
        var cafe = TestData.Cafe();
        cafe.CategoryId = category.Id;
        var user = TestData.Citizen(points: 10);
        db.Organizations.Add(TestData.Org());
        db.CafeCategories.Add(category);
        db.Cafes.Add(cafe);
        db.Users.Add(user);
        var order = NewOrder(user.Id, cafe.Id, OrderStatuses.Ready, DateTime.UtcNow, paidWithPoints: true, pointsUsed: 40);
        db.Orders.Add(order);
        await db.SaveChangesAsync();

        Assert.True(OrderStatuses.CanTransition(OrderStatuses.Ready, OrderStatuses.Cancelled));
        var controller = new OrdersController(db, new FakeCurrentUser { UserId = Guid.NewGuid(), Role = "Staff" }, new FakeHubContext<OrderHub>());
        Assert.Equal(200, ActionResultAssert.Status(await controller.UpdateOrderStatus(order.Id, new UpdateOrderStatusRequest { Status = "Cancelled" })));
        Assert.Equal(OrderStatuses.Cancelled, (await db.Orders.FindAsync(order.Id))!.Status);
        Assert.Equal(50, (await db.Users.FindAsync(user.Id))!.PointsBalance);
    }

    [Fact]
    public async Task FieldDrop_Create_Requires_Dates_And_Rejects_Past_Or_Inverted()
    {
        var (conn, db) = TestDb.OpenMigrated();
        await using var _ = conn;
        await using var __ = db;
        db.Organizations.Add(TestData.Org());
        await db.SaveChangesAsync();
        var controller = new FieldDropsController(db, new FakeCurrentUser { UserId = Guid.NewGuid(), Role = "Admin" });

        var missing = ValidDrop();
        missing.StartsAt = null;
        missing.EndsAt = null;
        Assert.Equal(400, ActionResultAssert.Status(await controller.Create(missing)));

        var inverted = ValidDrop();
        inverted.StartsAt = DateTime.UtcNow.AddHours(2);
        inverted.EndsAt = DateTime.UtcNow.AddHours(1);
        Assert.Equal(400, ActionResultAssert.Status(await controller.Create(inverted)));

        var past = ValidDrop();
        past.StartsAt = DateTime.UtcNow.AddDays(-1);
        past.EndsAt = DateTime.UtcNow.AddDays(1);
        Assert.Equal(400, ActionResultAssert.Status(await controller.Create(past)));
    }

    [Fact]
    public async Task FieldDrop_Create_Persists_Limit_And_Captures_Are_Paged()
    {
        var (conn, db) = TestDb.OpenMigrated();
        await using var _ = conn;
        await using var __ = db;
        db.Organizations.Add(TestData.Org());
        var users = new[] { TestData.Citizen(), TestData.Citizen(), TestData.Citizen() };
        db.Users.AddRange(users);
        await db.SaveChangesAsync();
        var controller = new FieldDropsController(db, new FakeCurrentUser { UserId = Guid.NewGuid(), Role = "Admin" });
        var request = ValidDrop();
        request.PerUserLimit = 2;
        Assert.Equal(200, ActionResultAssert.Status(await controller.Create(request)));
        var drop = await db.FieldDrops.SingleAsync();
        Assert.Equal(2, drop.PerUserLimit);
        Assert.True(drop.EndsAt > drop.StartsAt);

        for (var i = 0; i < users.Length; i++)
        {
            db.UserFieldCaptures.Add(new UserFieldCapture
            {
                OrganizationId = TestData.OrgId,
                FieldDropId = drop.Id,
                UserId = users[i].Id,
                PointsGranted = 10,
                DistanceMeters = 5,
                CapturedLatitude = 37.06m,
                CapturedLongitude = 37.37m,
                CreatedDate = DateTime.UtcNow.AddMinutes(-i)
            });
        }
        await db.SaveChangesAsync();

        var page = ActionResultAssert.Body(await controller.GetCaptures(drop.Id, 1, 25));
        Assert.Equal(3, PagedData.TotalCount(page.Data));
        Assert.Equal(3, PagedData.Items(page.Data).Count);
        Assert.Null(PagedData.Prop(PagedData.Items(page.Data)[0], "userId"));
    }

    [Fact]
    public async Task Reports_Today_Matches_Dashboard_Istanbul_Range()
    {
        var (conn, db) = TestDb.OpenMigrated();
        await using var _ = conn;
        await using var __ = db;
        db.Organizations.Add(TestData.Org());
        await db.SaveChangesAsync();
        var dash = ActionResultAssert.Body(await new DashboardController(db).GetOverview());
        var reports = ActionResultAssert.Body(await new ReportsController(db).GetReportsSummary("today", null, null));
        Assert.Equal(PagedData.Prop(dash.Data!, "todayFrom"), PagedData.Prop(reports.Data!, "from"));
        Assert.Equal(PagedData.Prop(dash.Data!, "todayTo"), PagedData.Prop(reports.Data!, "to"));
        var range = AdminDateRange.Resolve("today", null, null);
        Assert.Equal(range.FromUtc, PagedData.Prop(dash.Data!, "todayFrom"));
        Assert.Equal(range.ToUtc, PagedData.Prop(dash.Data!, "todayTo"));
    }

    private static List<object> AsList(object? value)
    {
        var enumerable = Assert.IsAssignableFrom<IEnumerable>(value);
        return enumerable.Cast<object>().ToList();
    }

    private static Order NewOrder(Guid userId, Guid cafeId, string status, DateTime created, bool paidWithPoints = false, int pointsUsed = 0) =>
        new()
        {
            OrganizationId = TestData.OrgId,
            UserId = userId,
            CafeId = cafeId,
            TotalAmount = pointsUsed,
            PaidWithPoints = paidWithPoints,
            PointsUsed = pointsUsed,
            Status = status,
            CollectionCode = $"IS-{Guid.NewGuid():N}"[..10],
            CreatedDate = created
        };

    private static UpsertFieldDropRequest ValidDrop() => new()
    {
        Title = "Park hediyesi",
        Description = "Test",
        Latitude = 37.0662m,
        Longitude = 37.3781m,
        RadiusMeters = 40,
        PointsGranted = 25,
        TotalStock = 20,
        PerUserLimit = 1,
        StartsAt = DateTime.UtcNow.AddMinutes(10),
        EndsAt = DateTime.UtcNow.AddDays(2),
        IsActive = true
    };

    private static async Task<User> SeedCitizenAsync(AppDbContext db, int points = 100)
    {
        db.Organizations.Add(TestData.Org());
        var user = TestData.Citizen(points: points);
        db.Users.Add(user);
        await db.SaveChangesAsync();
        return user;
    }
}
