using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using GolBox.Domain.Entities;

namespace GolBox.Application.Interfaces;

public interface IAppDbContext
{
    DbSet<Organization> Organizations { get; }
    DbSet<User> Users { get; }
    DbSet<RefreshToken> RefreshTokens { get; }
    DbSet<Setting> Settings { get; }
    DbSet<PointTransaction> PointTransactions { get; }
    DbSet<Reward> Rewards { get; }
    DbSet<UserReward> UserRewards { get; }
    DbSet<QrPayment> QrPayments { get; }
    DbSet<Cafe> Cafes { get; }
    DbSet<CafeCategory> CafeCategories { get; }
    DbSet<GolBox.Domain.Entities.Task> Tasks { get; }
    DbSet<UserTask> UserTasks { get; }
    DbSet<Activity> Activities { get; }
    DbSet<UserActivity> UserActivities { get; }
    DbSet<MenuItem> MenuItems { get; }
    DbSet<Order> Orders { get; }
    DbSet<OrderItem> OrderItems { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
