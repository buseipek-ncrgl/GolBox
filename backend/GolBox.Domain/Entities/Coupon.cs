using System;
using GolBox.Domain.Common;

namespace GolBox.Domain.Entities;

/// <summary>
/// Deprecated. Live personal coupons are <see cref="UserReward"/> (Claimed / Redeemed / Expired / Cancelled).
/// Do not write new application code against this entity. Table drop is a separate migration task.
/// </summary>
[Obsolete("Live coupons are UserReward. Coupon table is retained only for compatibility.")]
public class Coupon : BaseEntity
{
    public string CouponCode { get; set; } = string.Empty; // E.g. GB-CPN-94821
    public Guid UserId { get; set; }
    public Guid RewardId { get; set; }
    public string Status { get; set; } = "Active"; // Active, Used, Expired, Cancelled
    public DateTime ExpiryDate { get; set; }
    public Guid? UsedCafeId { get; set; }
    public DateTime? UsedDate { get; set; }

    // Navigations
    public virtual User User { get; set; } = null!;
    public virtual Reward Reward { get; set; } = null!;
}
