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
    public DateTime? CheckedInAt { get; set; }
    public Guid? CheckedInBy { get; set; }
    public DateTime? PointsAwardedAt { get; set; }
    public string? CheckInNotes { get; set; }

    // Navigations
    public virtual User User { get; set; } = null!;
    public virtual Activity Activity { get; set; } = null!;
    public virtual Organization Organization { get; set; } = null!;
}
