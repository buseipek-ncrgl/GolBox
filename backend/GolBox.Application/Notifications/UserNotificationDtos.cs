namespace GolBox.Application.Notifications;

public record UserNotificationDto(
    Guid Id,
    string Title,
    string Body,
    string Type,
    string? TargetType,
    string? TargetId,
    bool IsRead,
    DateTime CreatedAt,
    DateTime? ReadAt
);

public record UnreadCountDto(int Count);

public class SendCitizenNotificationRequest
{
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public string NotificationType { get; set; } = "General";
    public string TargetUserGroup { get; set; } = string.Empty;
    public Guid? TargetUserId { get; set; }
    public int? MinAge { get; set; }
    public int? MaxAge { get; set; }
    public string? EducationLevel { get; set; }
    public string? TargetType { get; set; }
    public string? TargetId { get; set; }
    public DateTime? ScheduledDate { get; set; }
}
