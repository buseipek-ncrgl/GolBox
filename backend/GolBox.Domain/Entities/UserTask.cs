using System;
using GolBox.Domain.Common;

namespace GolBox.Domain.Entities;

public class UserTask : BaseEntity
{
    public Guid UserId { get; set; }
    public Guid TaskId { get; set; }
    public DateTime CompletedAt { get; set; } = DateTime.UtcNow;
    public int PointsEarned { get; set; }
    public Guid OrganizationId { get; set; }

    // Navigations
    public virtual User User { get; set; } = null!;
    public virtual Task Task { get; set; } = null!;
    public virtual Organization Organization { get; set; } = null!;
}
