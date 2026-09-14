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
    public string TargetUserGroup { get; set; } = "All"; // All, AgeRange, EducationLevel, SingleUser, HighSchool, University
    public Guid? TargetUserId { get; set; }
    public int? MinAge { get; set; }
    public int? MaxAge { get; set; }
    public string? EducationLevel { get; set; }
    public string? TargetType { get; set; }
    public string? TargetId { get; set; }
    public DateTime? ScheduledDate { get; set; }
    public DateTime? SentDate { get; set; }
    public string Status { get; set; } = "Draft"; // Draft, Scheduled, Sent
    public int SentCount { get; set; } = 0;
}
