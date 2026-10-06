using GolBox.Application.Features.Activities.Commands;
using GolBox.Application.Features.Rewards.Commands;
using GolBox.Domain.Entities;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Xunit;
using GolBox.Persistence.Context;
using Task = System.Threading.Tasks.Task;

namespace GolBox.Tests;

public class ConcurrencyAndFinanceTests
{
    [Fact]
    public async Task Checkout_Parallel_Spend_Does_Not_Go_Negative()
    {
        var path = Path.Combine(Path.GetTempPath(), $"gb-checkout-{Guid.NewGuid():N}.db");
        var cs = TestDb.FileConnection(path);
        try
        {
            await using (var setupConn = new SqliteConnection(cs))
            {
                await setupConn.OpenAsync();
                await using var setup = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(setupConn).Options);
                await setup.Database.MigrateAsync();
                await TestDb.EnableWalAsync(setupConn);
                var user = TestData.Citizen(points: 50);
                var reward = new Reward
                {
                    Id = Guid.NewGuid(),
                    OrganizationId = TestData.OrgId,
                    Title = "Kahve",
                    Description = "x",
                    RequiredPoints = 40,
                    Status = "Active"
                };
                setup.Organizations.Add(TestData.Org());
                setup.Users.Add(user);
                setup.Rewards.Add(reward);
                setup.Settings.Add(new Setting { OrganizationId = TestData.OrgId, Key = "rewardExpireDays", Value = "30" });
                await setup.SaveChangesAsync();

                async Task<bool> CheckoutOnce()
                {
                    await using var conn = new SqliteConnection(cs);
                    await conn.OpenAsync();
                    await using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(conn).Options);
                    var handler = new CheckoutCartCommandHandler(db, new FakeCurrentUser { UserId = user.Id, Role = "User" });
                    var result = await handler.Handle(
                        new CheckoutCartCommand([new CheckoutCartItem(reward.Id, 1)]),
                        CancellationToken.None);
                    return result.Success;
                }

                var results = await Task.WhenAll(CheckoutOnce(), CheckoutOnce());
                Assert.Equal(1, results.Count(ok => ok));

                await using var checkConn = new SqliteConnection(cs);
                await checkConn.OpenAsync();
                await using var check = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(checkConn).Options);
                var balance = await check.Users.AsNoTracking().Select(u => u.PointsBalance).SingleAsync();
                Assert.True(balance >= 0);
                Assert.Equal(10, balance);
                Assert.Equal(1, await check.UserRewards.CountAsync());
            }
        }
        finally
        {
            if (File.Exists(path)) File.Delete(path);
        }
    }

    [Fact]
    public async Task Activity_Parallel_Join_Awards_Once()
    {
        var path = Path.Combine(Path.GetTempPath(), $"gb-act-{Guid.NewGuid():N}.db");
        var cs = TestDb.FileConnection(path);
        try
        {
            await using var setupConn = new SqliteConnection(cs);
            await setupConn.OpenAsync();
            await using var setup = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(setupConn).Options);
            await setup.Database.MigrateAsync();
            await TestDb.EnableWalAsync(setupConn);
            var user = TestData.Citizen(points: 0);
            var activity = new Activity
            {
                Id = Guid.NewGuid(),
                OrganizationId = TestData.OrgId,
                Title = "Konser",
                Description = "x",
                Location = "Merkez",
                PointsReward = 20,
                StartDate = DateTime.UtcNow.AddHours(-1),
                EndDate = DateTime.UtcNow.AddDays(1),
                Status = "Active"
            };
            setup.Organizations.Add(TestData.Org());
            setup.Users.Add(user);
            setup.Activities.Add(activity);
            await setup.SaveChangesAsync();

            async Task<bool> JoinOnce()
            {
                await using var conn = new SqliteConnection(cs);
                await conn.OpenAsync();
                await using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(conn).Options);
                var handler = new JoinActivityCommandHandler(db, new FakeCurrentUser { UserId = user.Id, Role = "User" });
                var result = await handler.Handle(new JoinActivityCommand(activity.Id), CancellationToken.None);
                return result.Success;
            }

            var results = await Task.WhenAll(JoinOnce(), JoinOnce());
            Assert.Equal(1, results.Count(ok => ok));

            await using var checkConn = new SqliteConnection(cs);
            await checkConn.OpenAsync();
            await using var check = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(checkConn).Options);
            Assert.Equal(1, await check.UserActivities.CountAsync());
            Assert.Equal(0, await check.Users.Select(u => u.PointsBalance).SingleAsync());
            Assert.Equal(0, await check.PointTransactions.CountAsync());
        }
        finally
        {
            if (File.Exists(path)) File.Delete(path);
        }
    }
}
