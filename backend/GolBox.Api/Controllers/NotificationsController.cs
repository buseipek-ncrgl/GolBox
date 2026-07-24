using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GolBox.Application.Common;
using GolBox.Application.Interfaces;
using GolBox.Domain.Entities;

namespace GolBox.Api.Controllers;

[Authorize]
public class NotificationsController : BaseApiController
{
    private readonly IAppDbContext _context;

    public NotificationsController(IAppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetNotifications()
    {
        var list = await _context.Notifications
            .OrderByDescending(n => n.CreatedDate)
            .ToListAsync();
        return Ok(Result<object>.Ok(list));
    }

    [HttpPost("send")]
    public async Task<IActionResult> SendNotification([FromBody] SendNotificationRequest request)
    {
        var org = await _context.Organizations.FirstOrDefaultAsync();

        // Calculate targeted recipient count
        var query = _context.Users.Where(u => u.Email != "admin@golbox.gov.tr");
        if (request.TargetUserGroup == "HighSchool") query = query.Where(u => u.EducationLevel == "Lise");
        else if (request.TargetUserGroup == "University") query = query.Where(u => u.EducationLevel == "Üniversite");

        var recipientCount = await query.CountAsync();

        var notification = new NotificationRecord
        {
            Id = Guid.NewGuid(),
            OrganizationId = org?.Id ?? Guid.Parse("11111111-1111-1111-1111-111111111111"),
            Title = request.Title,
            Message = request.Message,
            ImageUrl = request.ImageUrl,
            NotificationType = request.NotificationType,
            TargetUserGroup = request.TargetUserGroup,
            TargetUserId = request.TargetUserId,
            ScheduledDate = request.ScheduledDate,
            SentDate = request.ScheduledDate == null ? DateTime.UtcNow : null,
            Status = request.ScheduledDate == null ? "Sent" : "Scheduled",
            SentCount = recipientCount,
            CreatedDate = DateTime.UtcNow
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();

        return Ok(Result<object>.Ok(new { notificationId = notification.Id, recipientCount }, $"Bildirim {recipientCount} vatandaşa başarıyla gönderildi."));
    }

    public class SendNotificationRequest
    {
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public string NotificationType { get; set; } = "General";
        public string TargetUserGroup { get; set; } = "All";
        public Guid? TargetUserId { get; set; }
        public DateTime? ScheduledDate { get; set; }
    }
}
