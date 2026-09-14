using GolBox.Api.Controllers;
using GolBox.Api.Hubs;
using GolBox.Application.Authorization;
using GolBox.Application.Common;
using GolBox.Application.Notifications;
using GolBox.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace GolBox.Tests;

public class AdminSafetyPhase1Tests
{
    [Theory]
    [InlineData(OrderStatuses.Pending, OrderStatuses.Preparing, true)]
    [InlineData(OrderStatuses.Preparing, OrderStatuses.Ready, true)]
    [InlineData(OrderStatuses.Ready, OrderStatuses.Completed, true)]
    [InlineData(OrderStatuses.Pending, OrderStatuses.Cancelled, true)]
    [InlineData(OrderStatuses.Preparing, OrderStatuses.Cancelled, true)]
    [InlineData(OrderStatuses.Ready, OrderStatuses.Cancelled, true)]
    [InlineData(OrderStatuses.Pending, OrderStatuses.Completed, false)]
    [InlineData(OrderStatuses.Completed, OrderStatuses.Ready, false)]
    [InlineData(OrderStatuses.Cancelled, OrderStatuses.Preparing, false)]
    [InlineData(OrderStatuses.Completed, OrderStatuses.Cancelled, false)]
    public void Order_Transitions_Match_Canonical_Flow(string from, string to, bool allowed)
    {
        Assert.Equal(allowed, OrderStatuses.CanTransition(from, to));
    }

    [Fact]
    public void Delivered_Canonicalizes_To_Completed()
    {
        Assert.Equal(OrderStatuses.Completed, OrderStatuses.Canonicalize("Delivered"));
        Assert.False(OrderStatuses.CanTransition("Delivered", OrderStatuses.Pending));
    }

    [Fact]
    public async Task Order_Controller_Allows_Canonical_Path_And_Rejects_Skip()
    {
        var (conn, db) = TestDb.OpenMigrated();
        await using var _ = conn;
        await using var __ = db;
        var (order, _) = await SeedOrderAsync(db, OrderStatuses.Pending);

        var controller = OrderController(db);
        Assert.Equal(200, ActionResultAssert.Status(await controller.UpdateOrderStatus(order.Id, new UpdateOrderStatusRequest { Status = "Preparing" })));
        Assert.Equal(OrderStatuses.Preparing, (await db.Orders.FindAsync(order.Id))!.Status);

        Assert.Equal(200, ActionResultAssert.Status(await controller.UpdateOrderStatus(order.Id, new UpdateOrderStatusRequest { Status = "Ready" })));
        Assert.Equal(OrderStatuses.Ready, (await db.Orders.FindAsync(order.Id))!.Status);

        Assert.Equal(200, ActionResultAssert.Status(await controller.UpdateOrderStatus(order.Id, new UpdateOrderStatusRequest { Status = "Completed" })));
        Assert.Equal(OrderStatuses.Completed, (await db.Orders.FindAsync(order.Id))!.Status);

        var skip = await controller.UpdateOrderStatus(order.Id, new UpdateOrderStatusRequest { Status = "Ready" });
        Assert.Equal(400, ActionResultAssert.Status(skip));
    }

    [Fact]
    public async Task Order_Controller_Rejects_Pending_To_Completed()
    {
        var (conn, db) = TestDb.OpenMigrated();
        await using var _ = conn;
        await using var __ = db;
        var (order, _) = await SeedOrderAsync(db, OrderStatuses.Pending);
        var result = await OrderController(db).UpdateOrderStatus(order.Id, new UpdateOrderStatusRequest { Status = "Completed" });
        Assert.Equal(400, ActionResultAssert.Status(result));
        Assert.Equal(OrderStatuses.Pending, (await db.Orders.FindAsync(order.Id))!.Status);
    }

    [Fact]
    public async Task Order_Cancel_Refunds_Once_Through_Controller()
    {
        var (conn, db) = TestDb.OpenMigrated();
        await using var _ = conn;
        await using var __ = db;
        var (order, user) = await SeedOrderAsync(db, OrderStatuses.Pending, paidWithPoints: true, pointsUsed: 40, startingPoints: 10);
        var controller = OrderController(db);

        Assert.Equal(200, ActionResultAssert.Status(await controller.UpdateOrderStatus(order.Id, new UpdateOrderStatusRequest { Status = "Cancelled" })));
        Assert.Equal(50, (await db.Users.FindAsync(user.Id))!.PointsBalance);
        Assert.Equal(1, await db.PointTransactions.CountAsync(t => t.Type == "Refund"));

        Assert.Equal(200, ActionResultAssert.Status(await controller.UpdateOrderStatus(order.Id, new UpdateOrderStatusRequest { Status = "Cancelled" })));
        Assert.Equal(50, (await db.Users.FindAsync(user.Id))!.PointsBalance);
        Assert.Equal(1, await db.PointTransactions.CountAsync(t => t.Type == "Refund"));
        Assert.Equal(1, await db.AuditLogs.CountAsync(l => l.ActionType == "Order_Status"));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-5)]
    [InlineData(100001)]
    public async Task Reward_Create_Rejects_Invalid_Gp(int points)
    {
        var (conn, db) = TestDb.OpenMigrated();
        await using var _ = conn;
        await using var __ = db;
        db.Organizations.Add(TestData.Org());
        await db.SaveChangesAsync();
        var result = await new RewardsController(null!, db).CreateReward(new CreateRewardRequest
        {
            Title = "Kahve",
            Description = "Filtre",
            RequiredPoints = points
        });
        Assert.Equal(400, ActionResultAssert.Status(result));
    }

    [Fact]
    public async Task Reward_Create_Accepts_Valid_Gp_And_Audits()
    {
        var (conn, db) = TestDb.OpenMigrated();
        await using var _ = conn;
        await using var __ = db;
        db.Organizations.Add(TestData.Org());
        await db.SaveChangesAsync();
        var controller = new RewardsController(null!, db);
        var created = await controller.CreateReward(new CreateRewardRequest
        {
            Title = "Çay",
            Description = "Bardak çay",
            RequiredPoints = 25
        });
        Assert.Equal(200, ActionResultAssert.Status(created));
        Assert.Equal(1, await db.Rewards.CountAsync(r => r.RequiredPoints == 25 && r.Status == "Active"));
        Assert.True(await db.AuditLogs.AnyAsync(l => l.ActionType == "Reward_Create"));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-10)]
    [InlineData(10001)]
    public async Task Manual_Gp_Rejects_Invalid_Amount(int amount)
    {
        var (conn, db) = TestDb.OpenMigrated();
        await using var _ = conn;
        await using var __ = db;
        var user = await SeedCitizenAsync(db);
        var result = await UsersController(db).AdjustPoints(user.Id, new UsersController.AdjustPointsRequest
        {
            Amount = amount,
            ActionType = "Add",
            Reason = "Düzeltme işlemi"
        });
        Assert.Equal(400, ActionResultAssert.Status(result));
        Assert.Equal(100, (await db.Users.FindAsync(user.Id))!.PointsBalance);
    }

    [Fact]
    public async Task Manual_Gp_Rejects_Short_Reason_And_Overdraft()
    {
        var (conn, db) = TestDb.OpenMigrated();
        await using var _ = conn;
        await using var __ = db;
        var user = await SeedCitizenAsync(db, points: 20);
        var controller = UsersController(db);

        var shortReason = await controller.AdjustPoints(user.Id, new UsersController.AdjustPointsRequest
        {
            Amount = 5,
            ActionType = "Add",
            Reason = "ab"
        });
        Assert.Equal(400, ActionResultAssert.Status(shortReason));

        var overdraft = await controller.AdjustPoints(user.Id, new UsersController.AdjustPointsRequest
        {
            Amount = 50,
            ActionType = "Deduct",
            Reason = "Hatalı yükleme düzeltmesi"
        });
        Assert.Equal(400, ActionResultAssert.Status(overdraft));
        Assert.Equal(20, (await db.Users.FindAsync(user.Id))!.PointsBalance);
    }

    [Fact]
    public async Task Manual_Gp_Grant_And_Deduct_Write_Ledger_And_Audit()
    {
        var (conn, db) = TestDb.OpenMigrated();
        await using var _ = conn;
        await using var __ = db;
        var user = await SeedCitizenAsync(db, points: 40);
        var controller = UsersController(db);

        Assert.Equal(200, ActionResultAssert.Status(await controller.AdjustPoints(user.Id, new UsersController.AdjustPointsRequest
        {
            Amount = 15,
            ActionType = "Add",
            Reason = "Etkinlik ikramı",
            Description = "Pilot"
        })));
        Assert.Equal(55, (await db.Users.FindAsync(user.Id))!.PointsBalance);

        Assert.Equal(200, ActionResultAssert.Status(await controller.AdjustPoints(user.Id, new UsersController.AdjustPointsRequest
        {
            Amount = 10,
            ActionType = "Deduct",
            Reason = "Mükerrer yükleme"
        })));
        Assert.Equal(45, (await db.Users.FindAsync(user.Id))!.PointsBalance);
        Assert.Equal(2, await db.PointTransactions.CountAsync(t => t.UserId == user.Id));
        Assert.Equal(2, await db.AuditLogs.CountAsync(l => l.ActionType.StartsWith("Point_")));
    }

    [Fact]
    public async Task Notification_Rejects_Empty_Fields_And_Invalid_Target()
    {
        var (conn, db) = TestDb.OpenMigrated();
        await using var _ = conn;
        await using var __ = db;
        db.Organizations.Add(TestData.Org());
        await db.SaveChangesAsync();
        var controller = NotificationController(db);

        Assert.Equal(400, ActionResultAssert.Status(await controller.SendNotification(new SendCitizenNotificationRequest
        {
            Title = "",
            Message = "x",
            TargetUserGroup = "All"
        })));
        Assert.Equal(400, ActionResultAssert.Status(await controller.SendNotification(new SendCitizenNotificationRequest
        {
            Title = "Başlık",
            Message = "",
            TargetUserGroup = "All"
        })));
        Assert.Equal(400, ActionResultAssert.Status(await controller.SendNotification(new SendCitizenNotificationRequest
        {
            Title = "Başlık",
            Message = "Mesaj",
            TargetUserGroup = ""
        })));
        Assert.Equal(400, ActionResultAssert.Status(await controller.SendNotification(new SendCitizenNotificationRequest
        {
            Title = "Başlık",
            Message = "Mesaj",
            TargetUserGroup = "EveryoneEverywhere"
        })));
        Assert.Equal(400, ActionResultAssert.Status(await controller.SendNotification(new SendCitizenNotificationRequest
        {
            Title = "Başlık",
            Message = "Mesaj",
            TargetUserGroup = "SingleUser"
        })));
    }

    [Fact]
    public async Task Notification_Admin_Send_Succeeds_And_Audits()
    {
        var (conn, db) = TestDb.OpenMigrated();
        await using var _ = conn;
        await using var __ = db;
        db.Organizations.Add(TestData.Org());
        var citizen = TestData.Citizen();
        db.Users.Add(citizen);
        await db.SaveChangesAsync();

        var result = await NotificationController(db).SendNotification(new SendCitizenNotificationRequest
        {
            Title = "Duyuru",
            Message = "Kitap kafe açık",
            TargetUserGroup = "All"
        });
        Assert.Equal(200, ActionResultAssert.Status(result));
        Assert.Equal(1, await db.Notifications.CountAsync());
        Assert.Equal(1, await db.UserNotifications.CountAsync(n => n.UserId == citizen.Id));
        Assert.True(await db.AuditLogs.AnyAsync(l => l.ActionType == "Notification_Send"));
    }

    [Fact]
    public void Notification_Send_Is_AdminOnly_Staff_Rejected_By_Policy()
    {
        var method = typeof(NotificationsController).GetMethod(nameof(NotificationsController.SendNotification));
        var policy = method?.GetCustomAttributes(typeof(AuthorizeAttribute), true)
            .Cast<AuthorizeAttribute>()
            .FirstOrDefault();
        Assert.Equal(AuthorizationPolicies.AdminOnly, policy?.Policy);
    }

    [Fact]
    public async Task Activity_Rejects_End_Before_Start_And_Accepts_Place()
    {
        var (conn, db) = TestDb.OpenMigrated();
        await using var _ = conn;
        await using var __ = db;
        db.Organizations.Add(TestData.Org());
        var place = TestData.Place();
        db.Places.Add(place);
        await db.SaveChangesAsync();
        var controller = new ActivitiesController(null!, db, new FakeCurrentUser { Role = "Admin" });

        var invalid = await controller.CreateActivity(new CreateActivityRequest
        {
            Title = "Konser",
            Description = "Açık hava",
            PointsReward = 10,
            StartDate = DateTime.UtcNow.AddDays(3),
            EndDate = DateTime.UtcNow.AddDays(1)
        });
        Assert.Equal(400, ActionResultAssert.Status(invalid));

        var past = await controller.CreateActivity(new CreateActivityRequest
        {
            Title = "Geçmiş",
            Description = "x",
            PointsReward = 10,
            StartDate = DateTime.UtcNow.AddDays(-2),
            EndDate = DateTime.UtcNow.AddDays(1)
        });
        Assert.Equal(400, ActionResultAssert.Status(past));

        var start = DateTime.UtcNow.AddDays(2);
        var ok = await controller.CreateActivity(new CreateActivityRequest
        {
            Title = "Saha günü",
            Description = "Spor",
            PointsReward = 20,
            Location = "Bu metin tesis seçilince kullanılmamalı",
            PlaceId = place.Id,
            Capacity = 40,
            StartDate = start,
            EndDate = start.AddHours(3)
        });
        Assert.Equal(200, ActionResultAssert.Status(ok));
        var saved = await db.Activities.SingleAsync();
        Assert.Equal(place.Id, saved.PlaceId);
        Assert.Equal(place.Address, saved.Location);
        Assert.True(await db.AuditLogs.AnyAsync(l => l.ActionType == "Activity_Create"));
    }

    [Fact]
    public async Task Campaign_Create_Stores_Announcement_Not_Discount_Engine()
    {
        var (conn, db) = TestDb.OpenMigrated();
        await using var _ = conn;
        await using var __ = db;
        db.Organizations.Add(TestData.Org());
        await db.SaveChangesAsync();
        var result = await new CampaignsController(db).CreateCampaign(new CampaignsController.CreateCampaignRequest
        {
            Title = "Bahar duyurusu",
            Description = "İçerik",
            CampaignType = "Percentage",
            StartDate = DateTime.UtcNow.AddDays(1),
            EndDate = DateTime.UtcNow.AddDays(10),
            TargetUserGroup = "All"
        });
        Assert.Equal(200, ActionResultAssert.Status(result));
        var campaign = await db.Campaigns.SingleAsync();
        Assert.Equal("Announcement", campaign.CampaignType);
        Assert.True(await db.AuditLogs.AnyAsync(l => l.ActionType == "Campaign_Create"));
    }

    [Fact]
    public async Task Menu_Rejects_Zero_Price()
    {
        var (conn, db) = TestDb.OpenMigrated();
        await using var _ = conn;
        await using var __ = db;
        var category = TestData.Category();
        var cafe = TestData.Cafe();
        cafe.CategoryId = category.Id;
        db.Organizations.Add(TestData.Org());
        db.CafeCategories.Add(category);
        db.Cafes.Add(cafe);
        await db.SaveChangesAsync();
        var result = await new MenuItemsController(db).CreateMenuItem(cafe.Id, new CreateMenuItemRequest
        {
            Name = "Çay",
            Description = "Bardak",
            Price = 0
        });
        Assert.Equal(400, ActionResultAssert.Status(result));
    }

    [Fact]
    public async Task Citizens_Query_Excludes_Staff_And_Admin()
    {
        var (conn, db) = TestDb.OpenMigrated();
        await using var _ = conn;
        await using var __ = db;
        db.Organizations.Add(TestData.Org());
        db.Users.AddRange(
            TestData.Citizen(role: "User"),
            TestData.Citizen(role: "Admin"),
            TestData.Citizen(role: "Staff"));
        await db.SaveChangesAsync();
        var result = await UsersController(db).GetAllUsers("citizen");
        var body = ActionResultAssert.Body(result);
        var data = body.Data!;
        var itemsProp = data.GetType().GetProperty("items") ?? data.GetType().GetProperty("Items");
        var list = Assert.IsAssignableFrom<System.Collections.IEnumerable>(itemsProp!.GetValue(data));
        var count = list.Cast<object>().Count();
        Assert.Equal(1, count);
    }

    private static OrdersController OrderController(GolBox.Persistence.Context.AppDbContext db) =>
        new(db, new FakeCurrentUser { UserId = Guid.NewGuid(), Role = "Staff", Email = "staff@test.local" }, new FakeHubContext<OrderHub>());

    private static UsersController UsersController(GolBox.Persistence.Context.AppDbContext db) =>
        new(null!, db, new FakeCurrentUser { UserId = Guid.NewGuid(), Role = "Admin", Email = "admin@test.local" });

    private static NotificationsController NotificationController(GolBox.Persistence.Context.AppDbContext db) =>
        new(db, new FakeCurrentUser { UserId = Guid.NewGuid(), Role = "Admin", Email = "admin@test.local" }, new FakeHubContext<NotificationHub>());

    private static async Task<User> SeedCitizenAsync(GolBox.Persistence.Context.AppDbContext db, int points = 100)
    {
        db.Organizations.Add(TestData.Org());
        var user = TestData.Citizen(points: points);
        db.Users.Add(user);
        await db.SaveChangesAsync();
        return user;
    }

    private static async Task<(Order Order, User User)> SeedOrderAsync(
        GolBox.Persistence.Context.AppDbContext db,
        string status,
        bool paidWithPoints = false,
        int pointsUsed = 0,
        int startingPoints = 100)
    {
        var category = TestData.Category();
        var cafe = TestData.Cafe();
        cafe.CategoryId = category.Id;
        var user = TestData.Citizen(points: startingPoints);
        db.Organizations.Add(TestData.Org());
        db.CafeCategories.Add(category);
        db.Cafes.Add(cafe);
        db.Users.Add(user);
        var order = new Order
        {
            OrganizationId = TestData.OrgId,
            UserId = user.Id,
            CafeId = cafe.Id,
            TotalAmount = pointsUsed,
            PaidWithPoints = paidWithPoints,
            PointsUsed = pointsUsed,
            Status = status,
            CollectionCode = "IS-MR-9"
        };
        db.Orders.Add(order);
        await db.SaveChangesAsync();
        return (order, user);
    }
}
