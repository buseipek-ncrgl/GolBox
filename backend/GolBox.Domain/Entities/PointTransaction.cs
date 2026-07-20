using System;
using GolBox.Domain.Common;

namespace GolBox.Domain.Entities;

public class PointTransaction : BaseEntity
{
    public Guid UserId { get; set; }
    public Guid OrganizationId { get; set; }
    public int Amount { get; set; }
    public string Type { get; set; } = string.Empty; // Earn, Spend, Adjustment
    public string Description { get; set; } = string.Empty;
    public string? ReferenceType { get; set; } // Order, Task, RewardClaim, Admin
    public Guid? ReferenceId { get; set; }

    // Navigations
    public virtual User User { get; set; } = null!;
    public virtual Organization Organization { get; set; } = null!;
}
