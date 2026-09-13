using System;
using GolBox.Domain.Common;

namespace GolBox.Domain.Entities;

public class UserNotification : BaseEntity
{
    public Guid OrganizationId { get; set; }
    public Guid UserId { get; set; }
    public Guid? BroadcastId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string Type { get; set; } = "General";
    public string? TargetType { get; set; }
    public string? TargetId { get; set; }
    public bool IsRead { get; set; }
    public DateTime? ReadAt { get; set; }

    public virtual Organization Organization { get; set; } = null!;
    public virtual User User { get; set; } = null!;
}
