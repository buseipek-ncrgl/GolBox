using System;
using GolBox.Domain.Common;

namespace GolBox.Domain.Entities;

public class UserActivity : BaseEntity
{
    public Guid UserId { get; set; }
    public Guid ActivityId { get; set; }
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    public int PointsEarned { get; set; }
    public Guid OrganizationId { get; set; }

    // Navigations
    public virtual User User { get; set; } = null!;
    public virtual Activity Activity { get; set; } = null!;
    public virtual Organization Organization { get; set; } = null!;
}
