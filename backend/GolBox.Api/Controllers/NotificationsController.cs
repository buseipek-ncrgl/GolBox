using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using GolBox.Application.Authorization;
using GolBox.Application.Common;
using GolBox.Application.Content;
using GolBox.Application.Interfaces;
using GolBox.Application.Notifications;
using GolBox.Domain.Entities;
using GolBox.Api.Hubs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace GolBox.Api.Controllers;

[Authorize]
public class NotificationsController : BaseApiController
{
    private const int FanoutCap = 5000;
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IHubContext<NotificationHub> _hub;

    public NotificationsController(
        IAppDbContext context,
        ICurrentUserService currentUser,
        IHubContext<NotificationHub> hub)
    {
        _context = context;
        _currentUser = currentUser;
        _hub = hub;
    }

    [HttpGet]
    [Authorize(Policy = AuthorizationPolicies.StaffOrAdmin)]
    public async Task<IActionResult> GetNotifications()
    {
        var list = await _context.Notifications
            .OrderByDescending(n => n.CreatedDate)
            .Select(n => new
            {
                n.Id,
                n.Title,
                n.Message,
                n.NotificationType,
                n.TargetUserGroup,
                n.TargetUserId,
                n.Status,
                n.SentCount,
                n.SentDate,
                n.CreatedDate,
                n.TargetType,
                n.TargetId
            })
            .ToListAsync();
        return Ok(Result<object>.Ok(list));
    }

    [HttpGet("my")]
    public async Task<IActionResult> GetMyNotifications(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        if (_currentUser.UserId is null)
            return Unauthorized(Result<object>.Fail("Giriş gerekli."));

        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 50);
        var userId = _currentUser.UserId.Value;
        var query = _context.UserNotifications.AsNoTracking()
            .Where(n => n.UserId == userId);

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(n => n.CreatedDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(n => new UserNotificationDto(
                n.Id,
                n.Title,
                n.Body,
                n.Type,
                n.TargetType,
                n.TargetId,
                n.IsRead,
                n.CreatedDate,
                n.ReadAt
            ))
            .ToListAsync(cancellationToken);

        return Ok(Result<object>.Ok(new PagedResult<UserNotificationDto>(items, page, pageSize, total)));
    }

    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount(CancellationToken cancellationToken)
    {
        if (_currentUser.UserId is null)
            return Unauthorized(Result<object>.Fail("Giriş gerekli."));

        var count = await _context.UserNotifications.AsNoTracking()
            .CountAsync(n => n.UserId == _currentUser.UserId.Value && !n.IsRead, cancellationToken);
        return Ok(Result<object>.Ok(new UnreadCountDto(count)));
    }

    [HttpPost("{id:guid}/read")]
    public async Task<IActionResult> MarkRead(Guid id, CancellationToken cancellationToken)
    {
        if (_currentUser.UserId is null)
            return Unauthorized(Result<object>.Fail("Giriş gerekli."));

        var row = await _context.UserNotifications
            .FirstOrDefaultAsync(n => n.Id == id && n.UserId == _currentUser.UserId.Value, cancellationToken);
        if (row == null)
            return NotFound(Result<object>.Fail("Bildirim bulunamadı."));

        if (!row.IsRead)
        {
            row.IsRead = true;
            row.ReadAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);
        }

        return Ok(Result<object>.Ok(new UserNotificationDto(
            row.Id, row.Title, row.Body, row.Type, row.TargetType, row.TargetId, row.IsRead, row.CreatedDate, row.ReadAt
        )));
    }

    [HttpPost("read-all")]
    public async Task<IActionResult> MarkAllRead(CancellationToken cancellationToken)
    {
        if (_currentUser.UserId is null)
            return Unauthorized(Result<object>.Fail("Giriş gerekli."));

        var now = DateTime.UtcNow;
        await _context.UserNotifications
            .Where(n => n.UserId == _currentUser.UserId.Value && !n.IsRead)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(n => n.IsRead, true)
                .SetProperty(n => n.ReadAt, now)
                .SetProperty(n => n.UpdatedDate, now), cancellationToken);
        return Ok(Result<object>.Ok(new UnreadCountDto(0), "Tüm bildirimler okundu."));
    }

    [HttpPost("preview")]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> PreviewNotification([FromBody] SendCitizenNotificationRequest request, CancellationToken cancellationToken = default)
    {
        var contentCheck = AdminSafetyRules.ValidateNotificationContent(request.Title, request.Message);
        if (!contentCheck.Success)
            return BadRequest(Result<object>.Fail(contentCheck.Message));
        var targetCheck = AdminSafetyRules.ValidateNotificationTargetGroup(request.TargetUserGroup, request.TargetUserId);
        if (!targetCheck.Success)
            return BadRequest(Result<object>.Fail(targetCheck.Message));
        if (!NotificationTargetTypes.IsKnown(request.TargetType))
            return BadRequest(Result<object>.Fail("Geçersiz yönlendirme hedefi."));

        var org = await _context.Organizations.OrderBy(o => o.CreatedDate).FirstOrDefaultAsync(cancellationToken);
        var orgId = org?.Id ?? KnownOrganizations.Sehitkamil;
        var recipients = await ResolveRecipientsAsync(orgId, request, cancellationToken);
        return Ok(Result<object>.Ok(new
        {
            recipientCount = recipients.Count,
            targetUserGroup = request.TargetUserGroup.Trim(),
            everyoneWarning = request.TargetUserGroup.Equals(NotificationTargetGroups.All, StringComparison.OrdinalIgnoreCase)
        }));
    }

    [HttpPost("send")]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> SendNotification([FromBody] SendCitizenNotificationRequest request, CancellationToken cancellationToken = default)
    {
        var contentCheck = AdminSafetyRules.ValidateNotificationContent(request.Title, request.Message);
        if (!contentCheck.Success)
            return BadRequest(Result<object>.Fail(contentCheck.Message));
        var targetCheck = AdminSafetyRules.ValidateNotificationTargetGroup(request.TargetUserGroup, request.TargetUserId);
        if (!targetCheck.Success)
            return BadRequest(Result<object>.Fail(targetCheck.Message));
        if (!NotificationTargetTypes.IsKnown(request.TargetType))
            return BadRequest(Result<object>.Fail("Geçersiz yönlendirme hedefi."));

        var org = await _context.Organizations.OrderBy(o => o.CreatedDate).FirstOrDefaultAsync(cancellationToken);
        var orgId = org?.Id ?? KnownOrganizations.Sehitkamil;

        var recipients = await ResolveRecipientsAsync(orgId, request, cancellationToken);
        var recipientCount = recipients.Count;

        var notification = new NotificationRecord
        {
            Id = Guid.NewGuid(),
            OrganizationId = orgId,
            Title = request.Title.Trim(),
            Message = request.Message.Trim(),
            ImageUrl = MediaUrlNormalizer.Normalize(request.ImageUrl),
            NotificationType = string.IsNullOrWhiteSpace(request.NotificationType) ? "General" : request.NotificationType.Trim(),
            TargetUserGroup = request.TargetUserGroup.Trim(),
            TargetUserId = request.TargetUserId,
            MinAge = request.MinAge,
            MaxAge = request.MaxAge,
            EducationLevel = request.EducationLevel,
            TargetType = string.IsNullOrWhiteSpace(request.TargetType) ? NotificationTargetTypes.None : NotificationTargetTypes.Canonical(request.TargetType),
            TargetId = request.TargetId,
            ScheduledDate = request.ScheduledDate,
            SentDate = request.ScheduledDate == null ? DateTime.UtcNow : null,
            Status = request.ScheduledDate == null ? "Sent" : "Scheduled",
            SentCount = recipientCount,
            CreatedDate = DateTime.UtcNow
        };

        _context.Notifications.Add(notification);

        if (request.ScheduledDate == null)
        {
            foreach (var userId in recipients)
            {
                _context.UserNotifications.Add(new UserNotification
                {
                    Id = Guid.NewGuid(),
                    OrganizationId = orgId,
                    UserId = userId,
                    BroadcastId = notification.Id,
                    Title = notification.Title,
                    Body = notification.Message,
                    Type = notification.NotificationType,
                    TargetType = notification.TargetType,
                    TargetId = notification.TargetId,
                    IsRead = false
                });
            }
        }

        await _context.SaveChangesAsync(cancellationToken);
        await AuditLogsController.LogAsync(_context, _currentUser.Email ?? "admin", "Admin", "Notification_Send", "Notifications", "NotificationRecord", notification.Id.ToString(), null, notification.Title, request.TargetUserGroup);

        if (request.ScheduledDate == null)
        {
            foreach (var userId in recipients.Take(FanoutCap))
            {
                await _hub.Clients.User(userId.ToString()).SendAsync("ReceiveNotification", new
                {
                    id = notification.Id,
                    title = notification.Title,
                    body = notification.Message,
                    targetType = notification.TargetType,
                    targetId = notification.TargetId
                }, cancellationToken);
            }
        }

        return Ok(Result<object>.Ok(new { notificationId = notification.Id, recipientCount }, $"Bildirim {recipientCount} vatandaşa başarıyla gönderildi."));
    }

    private async Task<List<Guid>> ResolveRecipientsAsync(Guid orgId, SendCitizenNotificationRequest request, CancellationToken cancellationToken)
    {
        var group = string.IsNullOrWhiteSpace(request.TargetUserGroup)
            ? string.Empty
            : request.TargetUserGroup.Trim();
        var query = _context.Users.AsNoTracking()
            .Where(u => u.OrganizationId == orgId && (u.Role == "User" || u.Role == "Citizen"));

        if (request.TargetUserId.HasValue || group.Equals(NotificationTargetGroups.SingleUser, StringComparison.OrdinalIgnoreCase))
        {
            if (!request.TargetUserId.HasValue)
                return [];
            return await query.Where(u => u.Id == request.TargetUserId.Value).Select(u => u.Id).Take(1).ToListAsync(cancellationToken);
        }

        if (group.Equals(NotificationTargetGroups.AgeRange, StringComparison.OrdinalIgnoreCase) ||
            group.Equals("AgeGroup", StringComparison.OrdinalIgnoreCase))
        {
            if (request.MinAge.HasValue)
                query = query.Where(u => u.Age != null && u.Age >= request.MinAge.Value);
            if (request.MaxAge.HasValue)
                query = query.Where(u => u.Age != null && u.Age <= request.MaxAge.Value);
        }
        else if (group.Equals(NotificationTargetGroups.EducationLevel, StringComparison.OrdinalIgnoreCase) ||
                 group.Equals(NotificationTargetGroups.HighSchool, StringComparison.OrdinalIgnoreCase) ||
                 group.Equals(NotificationTargetGroups.University, StringComparison.OrdinalIgnoreCase))
        {
            var education = request.EducationLevel;
            if (string.IsNullOrWhiteSpace(education))
            {
                if (group.Equals(NotificationTargetGroups.HighSchool, StringComparison.OrdinalIgnoreCase))
                    education = "Lise";
                else if (group.Equals(NotificationTargetGroups.University, StringComparison.OrdinalIgnoreCase))
                    education = "Üniversite";
            }
            var normalized = CityContentRules.NormalizeEducation(education ?? "");
            query = query.Where(u => u.EducationLevel != null &&
                (u.EducationLevel == normalized || u.EducationLevel == education));
        }

        return await query.Select(u => u.Id).Take(FanoutCap).ToListAsync(cancellationToken);
    }
}
