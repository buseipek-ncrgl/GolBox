using GolBox.Api.Controllers;
using GolBox.Application.Common;
using GolBox.Application.Features.Auth.Commands;
using GolBox.Domain.Entities;
using GolBox.Persistence.Context;
using Microsoft.AspNetCore.Mvc;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace GolBox.Tests;

public class AdminWorkflowPhase2Tests
{
    [Fact]
    public async Task Citizens_Pagination_And_Search_Filter()
    {
        var (conn, db) = TestDb.OpenMigrated();
        await using var _ = conn;
        await using var __ = db;
        db.Organizations.Add(TestData.Org());
        db.Users.Add(new User
        {
            OrganizationId = TestData.OrgId,
            Email = "ahmet@test.local",
            NormalizedEmail = "AHMET@TEST.LOCAL",
            PasswordHash = "x",
            FirstName = "Ahmet",
            LastName = "Kaya",
            Role = "User",
            Age = 22,
            EducationLevel = "Üniversite",
            PointsBalance = 80,
            CreatedDate = DateTime.UtcNow
        });
        db.Users.Add(TestData.Citizen());
        db.Users.Add(TestData.Citizen(role: "Admin"));
        await db.SaveChangesAsync();

        var page = await Users(db).GetAllUsers("citizen", "Ahmet", null, null, null, null, null, 1, 25);
        var body = ActionResultAssert.Body(page);
        Assert.Equal(1, PagedData.TotalCount(body.Data));
        Assert.Single(PagedData.Items(body.Data));

        var filtered = await Users(db).GetAllUsers("citizen", null, 20, 25, "Üniversite", 50, 100, 1, 25);
        Assert.Equal(1, PagedData.TotalCount(ActionResultAssert.Body(filtered).Data));
    }

    [Fact]
    public async Task Citizens_Large_List_Paginates()
    {
        var (conn, db) = TestDb.OpenMigrated();
        await using var _ = conn;
        await using var __ = db;
        db.Organizations.Add(TestData.Org());
        for (var i = 0; i < 80; i++)
            db.Users.Add(TestData.Citizen());
        await db.SaveChangesAsync();

        var result = await Users(db).GetAllUsers("citizen", null, null, null, null, null, null, 2, 25);
        var body = ActionResultAssert.Body(result);
        Assert.Equal(80, PagedData.TotalCount(body.Data));
        Assert.Equal(25, PagedData.Items(body.Data).Count);
    }

    [Fact]
    public async Task Citizen_Detail_Includes_Coupons_And_Captures()
    {
        var (conn, db) = TestDb.OpenMigrated();
        await using var _ = conn;
        await using var __ = db;
        var user = TestData.Citizen();
        var reward = new Reward
        {
            OrganizationId = TestData.OrgId,
            Title = "Çay",
            Description = "x",
            RequiredPoints = 10,
            Status = "Active"
        };
        db.Organizations.Add(TestData.Org());
        db.Users.Add(user);
        db.Rewards.Add(reward);
        db.UserRewards.Add(new UserReward
        {
            OrganizationId = TestData.OrgId,
            UserId = user.Id,
            RewardId = reward.Id,
            Status = UserRewardStatuses.Claimed,
            RedeemCode = "ABC123",
            ClaimedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        });
        await db.SaveChangesAsync();

        var result = await Users(db).GetUserDetail(user.Id);
        var data = ActionResultAssert.Body(result).Data!;
        Assert.NotNull(PagedData.Prop(data, "activeCoupons"));
    }

    [Fact]
    public async Task Role_Change_And_Last_Admin_Guards()
    {
        var (conn, db) = TestDb.OpenMigrated();
        await using var _ = conn;
        await using var __ = db;
        var admin = TestData.Citizen(role: "Admin");
        admin.Email = "admin1@test.local";
        var staff = TestData.Citizen(role: "Staff");
        db.Organizations.Add(TestData.Org());
        db.Users.AddRange(admin, staff);
        await db.SaveChangesAsync();

        var controller = new StaffController(db, new FakeCurrentUser { UserId = admin.Id, Role = "Admin", Email = admin.Email });
        var selfDemote = await controller.ChangeRole(admin.Id, new StaffController.ChangeStaffRoleRequest { Role = "Staff" });
        Assert.Equal(400, ActionResultAssert.Status(selfDemote));

        var lastAdmin = await controller.SetActive(admin.Id, new StaffController.SetStaffActiveRequest { IsActive = false });
        Assert.Equal(400, ActionResultAssert.Status(lastAdmin));

        var promote = await controller.ChangeRole(staff.Id, new StaffController.ChangeStaffRoleRequest { Role = "Admin" });
        Assert.Equal(200, ActionResultAssert.Status(promote));
        Assert.True(ActionResultAssert.Body(promote).Success);

        var demote = await controller.ChangeRole(staff.Id, new StaffController.ChangeStaffRoleRequest { Role = "Staff" });
        Assert.Equal(200, ActionResultAssert.Status(demote));
        Assert.Equal(2, db.AuditLogs.Count(l => l.ActionType == "Staff_RoleChange"));
    }

    [Fact]
    public async Task Reports_Count_Completed_Not_Delivered_Label()
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
        db.Orders.Add(new Order
        {
            OrganizationId = TestData.OrgId,
            UserId = user.Id,
            CafeId = cafe.Id,
            Status = OrderStatuses.Completed,
            CollectionCode = "IS-1",
            CreatedDate = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        var result = await new ReportsController(db).GetReportsSummary("today", null, null);
        var data = ActionResultAssert.Body(result).Data!;
        Assert.Equal(1, Convert.ToInt32(PagedData.Prop(data, "completedOrders")));
        var orders = PagedData.Prop(data, "orders")!;
        Assert.Equal(1, Convert.ToInt32(PagedData.Prop(orders, "deliveredOrders")));
    }

    [Fact]
    public async Task Ledger_And_Audit_Filter_Paginate()
    {
        var (conn, db) = TestDb.OpenMigrated();
        await using var _ = conn;
        await using var __ = db;
        var user = TestData.Citizen();
        db.Organizations.Add(TestData.Org());
        db.Users.Add(user);
        for (var i = 0; i < 40; i++)
        {
            db.PointTransactions.Add(new PointTransaction
            {
                OrganizationId = TestData.OrgId,
                UserId = user.Id,
                Amount = i % 2 == 0 ? 10 : -5,
                Type = i % 2 == 0 ? "Earn" : "Spend",
                Description = "row " + i,
                CreatedDate = DateTime.UtcNow.AddMinutes(-i)
            });
            db.AuditLogs.Add(new AuditLog
            {
                UserEmail = "admin@test.local",
                UserRole = "Admin",
                ActionType = i % 2 == 0 ? "Point_Add" : "Reward_Create",
                ModuleName = i % 2 == 0 ? "Users" : "Rewards",
                EntityName = "X",
                CreatedDate = DateTime.UtcNow.AddMinutes(-i)
            });
        }
        await db.SaveChangesAsync();

        var ledger = await new PointsController(null!, db).GetLedger(1, 25, "Earn", user.Id, null, null, null, null);
        var ledgerBody = ActionResultAssert.Body(ledger);
        Assert.Equal(20, PagedData.TotalCount(ledgerBody.Data));
        Assert.Equal(20, PagedData.Items(ledgerBody.Data).Count);

        var audit = await new AuditLogsController(db).GetLogs("Rewards", null, "Reward_Create", "admin", null, null, null, 1, 10);
        var auditBody = ActionResultAssert.Body(audit);
        Assert.Equal(20, PagedData.TotalCount(auditBody.Data));
        Assert.Equal(10, PagedData.Items(auditBody.Data).Count);
    }

    [Fact]
    public async Task Menu_Update_And_Admin_Filter()
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
        var item = new MenuItem
        {
            CafeId = cafe.Id,
            Name = "Çay",
            Description = "Sıcak",
            Price = 15,
            IsActive = true
        };
        db.MenuItems.Add(item);
        await db.SaveChangesAsync();

        var updated = await new MenuItemsController(db).UpdateMenuItem(cafe.Id, item.Id, new CreateMenuItemRequest
        {
            Name = "Filtre kahve",
            Description = "Güncellendi",
            Price = 45,
            IsActive = false,
            MinAge = 12,
            RequiredEducation = "Lise"
        });
        Assert.Equal(200, ActionResultAssert.Status(updated));
        Assert.False((await db.MenuItems.FindAsync(item.Id))!.IsActive);

        var list = await new MenuCatalogController(db).GetAdminMenuItems(cafeId: cafe.Id, active: false, search: "kahve", page: 1, pageSize: 25);
        Assert.Equal(1, PagedData.TotalCount(ActionResultAssert.Body(list).Data));
    }

    [Fact]
    public async Task Activity_Edit_And_Publish()
    {
        var (conn, db) = TestDb.OpenMigrated();
        await using var _ = conn;
        await using var __ = db;
        var place = TestData.Place();
        db.Organizations.Add(TestData.Org());
        db.Places.Add(place);
        var start = DateTime.UtcNow.AddDays(1);
        var create = await new ActivitiesController(null!, db, new FakeCurrentUser { Role = "Admin" }).CreateActivity(new CreateActivityRequest
        {
            Title = "Piknik",
            Description = "Göl",
            PointsReward = 20,
            Capacity = 10,
            StartDate = start,
            EndDate = start.AddHours(2)
        });
        var id = Guid.Parse(PagedData.Prop(ActionResultAssert.Body(create).Data!, "id")!.ToString()!);

        var update = await new ActivitiesController(null!, db, new FakeCurrentUser { Role = "Admin" }).UpdateActivity(id, new CreateActivityRequest
        {
            Title = "Göl pikniği",
            Description = "Güncel",
            PointsReward = 25,
            Capacity = 12,
            StartDate = start,
            EndDate = start.AddHours(3),
            PlaceId = place.Id
        });
        Assert.Equal(200, ActionResultAssert.Status(update));
        var activity = await db.Activities.FindAsync(id);
        Assert.Equal(place.Id, activity!.PlaceId);
        Assert.Equal(place.Address, activity.Location);

        await new ActivitiesController(null!, db, new FakeCurrentUser { Role = "Admin" }).UnpublishActivity(id);
        Assert.Equal("Draft", (await db.Activities.FindAsync(id))!.Status);
        await new ActivitiesController(null!, db, new FakeCurrentUser { Role = "Admin" }).PublishActivity(id);
        Assert.Equal("Active", (await db.Activities.FindAsync(id))!.Status);
    }

    [Fact]
    public async Task Inactive_Staff_Cannot_Login()
    {
        var (conn, db) = TestDb.OpenMigrated();
        await using var _ = conn;
        await using var __ = db;
        var user = TestData.Citizen(role: "Staff");
        user.Email = "staff.login@test.local";
        user.PasswordHash = "hash:Staff123!";
        db.Organizations.Add(TestData.Org());
        db.Users.Add(user);
        db.StaffUsers.Add(new StaffUser
        {
            UserId = user.Id,
            Role = "Staff",
            IsActive = false,
            RegistrationNumber = "1"
        });
        await db.SaveChangesAsync();

        var handler = new LoginCommandHandler(db, new StubPasswordHasher(), new FakeTokenService());
        var result = await handler.Handle(new LoginCommand(user.Email, "Staff123!"), CancellationToken.None);
        Assert.False(result.Success);
    }

    private static UsersController Users(AppDbContext db) =>
        new(null!, db, new FakeCurrentUser { UserId = Guid.NewGuid(), Role = "Admin", Email = "admin@test.local" });
}

internal sealed class FakeTokenService : GolBox.Application.Interfaces.ITokenService
{
    public string GenerateAccessToken(User user) => "token";
    public string GenerateRefreshToken() => "refresh";
}
