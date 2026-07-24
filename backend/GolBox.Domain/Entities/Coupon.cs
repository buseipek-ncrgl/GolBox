using System;
using GolBox.Domain.Common;

namespace GolBox.Domain.Entities;

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
