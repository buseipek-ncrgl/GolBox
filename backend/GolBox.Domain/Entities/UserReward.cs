using System;
using GolBox.Domain.Common;

namespace GolBox.Domain.Entities;

public class UserReward : BaseEntity
{
    public Guid UserId { get; set; }
    public Guid RewardId { get; set; }
    public DateTime ClaimedAt { get; set; } = DateTime.UtcNow;
    public DateTime? RedeemedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public string Status { get; set; } = "Claimed"; // Claimed, Redeemed, Expired, Cancelled
    public string RedeemCode { get; set; } = string.Empty;
    public Guid OrganizationId { get; set; }

    // Navigations
    public virtual User User { get; set; } = null!;
    public virtual Reward Reward { get; set; } = null!;
    public virtual Organization Organization { get; set; } = null!;
}
