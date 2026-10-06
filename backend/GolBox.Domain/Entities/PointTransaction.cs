using System;
using GolBox.Domain.Common;

namespace GolBox.Domain.Entities;

public class PointTransaction : BaseEntity
{
    public Guid UserId { get; set; }
    public Guid OrganizationId { get; set; }
    public int Amount { get; set; }
    public string Type { get; set; } = string.Empty; // Earn, Spend, Bonus, Refund, Reversal, Adjustment, EventReward, MissionReward
    public string Description { get; set; } = string.Empty;
    public string? ReferenceType { get; set; } // ORDER, TASK, REWARD_CLAIM, EVENT, MISSION, ADMIN_ADJUSTMENT
    public Guid? ReferenceId { get; set; }
    public string? AdminReason { get; set; }
    public int BalanceAfter { get; set; }

    // Navigations
    public virtual User User { get; set; } = null!;
    public virtual Organization Organization { get; set; } = null!;
}
