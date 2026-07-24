using System;
using GolBox.Domain.Common;

namespace GolBox.Domain.Entities;

public class NotificationRecord : BaseEntity
{
    public Guid OrganizationId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public string NotificationType { get; set; } = "General"; // General, Campaign, Task, Activity, Branch, Point, Coupon
    public string TargetUserGroup { get; set; } = "All"; // All, AgeGroup, EducationGroup, BranchUsers, EventAttendees, SingleUser
    public Guid? TargetUserId { get; set; }
    public DateTime? ScheduledDate { get; set; }
    public DateTime? SentDate { get; set; }
    public string Status { get; set; } = "Draft"; // Draft, Scheduled, Sent
    public int SentCount { get; set; } = 0;
}
