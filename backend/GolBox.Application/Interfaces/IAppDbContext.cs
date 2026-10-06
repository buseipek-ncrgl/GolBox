using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using GolBox.Domain.Entities;

namespace GolBox.Application.Interfaces;

public interface IAppDbContext
{
    DatabaseFacade Database { get; }
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
    DbSet<Ingredient> Ingredients { get; }
    DbSet<Allergen> Allergens { get; }
    DbSet<ProductIngredient> ProductIngredients { get; }
    DbSet<ProductAllergen> ProductAllergens { get; }
    DbSet<ProductOptionGroup> ProductOptionGroups { get; }
    DbSet<ProductOption> ProductOptions { get; }
    DbSet<ProductRelation> ProductRelations { get; }
    DbSet<BranchProduct> BranchProducts { get; }
    DbSet<BranchHours> BranchHours { get; }
    DbSet<BranchSpecialHours> BranchSpecialHours { get; }
    DbSet<Order> Orders { get; }
    DbSet<OrderItem> OrderItems { get; }
    DbSet<AuditLog> AuditLogs { get; }
    DbSet<ApprovalRequest> ApprovalRequests { get; }
    DbSet<Campaign> Campaigns { get; }
    DbSet<NotificationRecord> Notifications { get; }
    DbSet<CityContent> CityContents { get; }
    DbSet<UserNotification> UserNotifications { get; }
    DbSet<Place> Places { get; }
    DbSet<PlaceImage> PlaceImages { get; }
    DbSet<PlaceOpeningHour> PlaceOpeningHours { get; }
    DbSet<PlaceAmenity> PlaceAmenities { get; }
#pragma warning disable CS0618
    DbSet<Coupon> Coupons { get; }
#pragma warning restore CS0618
    DbSet<StaffUser> StaffUsers { get; }
    DbSet<FieldDrop> FieldDrops { get; }
    DbSet<UserFieldCapture> UserFieldCaptures { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
