using System;
using System.Linq;
using System.Reflection;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using GolBox.Application.Interfaces;
using GolBox.Domain.Common;
using GolBox.Domain.Entities;

namespace GolBox.Persistence.Context;

public class AppDbContext : DbContext, IAppDbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Organization> Organizations => Set<Organization>();
    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Setting> Settings => Set<Setting>();
    public DbSet<PointTransaction> PointTransactions => Set<PointTransaction>();
    public DbSet<Reward> Rewards => Set<Reward>();
    public DbSet<UserReward> UserRewards => Set<UserReward>();
    public DbSet<QrPayment> QrPayments => Set<QrPayment>();
    public DbSet<Cafe> Cafes => Set<Cafe>();
    public DbSet<CafeCategory> CafeCategories => Set<CafeCategory>();
    public DbSet<GolBox.Domain.Entities.Task> Tasks => Set<GolBox.Domain.Entities.Task>();
    public DbSet<UserTask> UserTasks => Set<UserTask>();
    public DbSet<Activity> Activities => Set<Activity>();
    public DbSet<UserActivity> UserActivities => Set<UserActivity>();
    public DbSet<MenuItem> MenuItems => Set<MenuItem>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<ApprovalRequest> ApprovalRequests => Set<ApprovalRequest>();
    public DbSet<Campaign> Campaigns => Set<Campaign>();
    public DbSet<NotificationRecord> Notifications => Set<NotificationRecord>();
    public DbSet<CityContent> CityContents => Set<CityContent>();
    public DbSet<UserNotification> UserNotifications => Set<UserNotification>();
    public DbSet<Place> Places => Set<Place>();
    public DbSet<PlaceImage> PlaceImages => Set<PlaceImage>();
    public DbSet<PlaceOpeningHour> PlaceOpeningHours => Set<PlaceOpeningHour>();
    public DbSet<PlaceAmenity> PlaceAmenities => Set<PlaceAmenity>();
#pragma warning disable CS0618
    public DbSet<Coupon> Coupons => Set<Coupon>();
#pragma warning restore CS0618
    public DbSet<StaffUser> StaffUsers => Set<StaffUser>();
    public DbSet<FieldDrop> FieldDrops => Set<FieldDrop>();
    public DbSet<UserFieldCapture> UserFieldCaptures => Set<UserFieldCapture>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply all configurations from assembly
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());

        // Apply Soft Delete query filter dynamically to all entities inheriting from BaseEntity
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (typeof(BaseEntity).IsAssignableFrom(entityType.ClrType))
            {
                var method = typeof(AppDbContext)
                    .GetMethod(nameof(SetSoftDeleteFilter), BindingFlags.NonPublic | BindingFlags.Static)?
                    .MakeGenericMethod(entityType.ClrType);

                method?.Invoke(null, new object[] { modelBuilder });
            }
        }
    }

    private static void SetSoftDeleteFilter<TEntity>(ModelBuilder modelBuilder) where TEntity : BaseEntity
    {
        modelBuilder.Entity<TEntity>().HasQueryFilter(x => !x.IsDeleted);
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var entries = ChangeTracker.Entries<BaseEntity>();

        foreach (var entry in entries)
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedDate = DateTime.UtcNow;
                entry.Entity.IsDeleted = false;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedDate = DateTime.UtcNow;
            }
            else if (entry.State == EntityState.Deleted)
            {
                // Intercept hard delete and turn it into soft delete
                entry.State = EntityState.Modified;
                entry.Entity.IsDeleted = true;
                entry.Entity.DeletedDate = DateTime.UtcNow;
            }
        }

        return await base.SaveChangesAsync(cancellationToken);
    }
}
