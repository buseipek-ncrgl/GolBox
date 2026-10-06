using GolBox.Api.Hubs;
using GolBox.Application.Common;
using GolBox.Application.Content;
using GolBox.Application.Interfaces;
using GolBox.Domain.Entities;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Task = System.Threading.Tasks.Task;

namespace GolBox.Api.Services;

public sealed class ScheduledNotificationDispatcher : BackgroundService
{
    private const int FanoutCap = 5000;
    private static readonly TimeSpan Interval = TimeSpan.FromMinutes(1);
    private readonly IServiceProvider _services;
    private readonly IHubContext<NotificationHub> _hub;
    private readonly ILogger<ScheduledNotificationDispatcher> _logger;

    public ScheduledNotificationDispatcher(IServiceProvider services, IHubContext<NotificationHub> hub, ILogger<ScheduledNotificationDispatcher> logger)
    {
        _services = services;
        _hub = hub;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try { await DispatchDueAsync(stoppingToken); }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { }
            catch (Exception ex) { _logger.LogError(ex, "Planlı bildirimler dağıtılırken hata oluştu."); }
            await Task.Delay(Interval, stoppingToken);
        }
    }

    private async Task DispatchDueAsync(CancellationToken cancellationToken)
    {
        using var scope = _services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<IAppDbContext>();
        var now = DateTime.UtcNow;
        var due = await context.Notifications
            .Where(n => n.Status == "Scheduled" && n.ScheduledDate != null && n.ScheduledDate <= now)
            .OrderBy(n => n.ScheduledDate).Take(20).ToListAsync(cancellationToken);

        foreach (var notification in due)
        {
            var users = context.Users.AsNoTracking().Where(u => u.OrganizationId == notification.OrganizationId && (u.Role == "User" || u.Role == "Citizen"));
            if (notification.TargetUserId.HasValue)
                users = users.Where(u => u.Id == notification.TargetUserId.Value);
            else if (notification.TargetUserGroup == NotificationTargetGroups.AgeRange)
            {
                if (notification.MinAge.HasValue) users = users.Where(u => u.Age != null && u.Age >= notification.MinAge.Value);
                if (notification.MaxAge.HasValue) users = users.Where(u => u.Age != null && u.Age <= notification.MaxAge.Value);
            }
            else if (notification.TargetUserGroup is NotificationTargetGroups.EducationLevel or NotificationTargetGroups.HighSchool or NotificationTargetGroups.University)
            {
                var education = notification.EducationLevel;
                if (string.IsNullOrWhiteSpace(education)) education = notification.TargetUserGroup == NotificationTargetGroups.HighSchool ? "Lise" : "Üniversite";
                var normalized = CityContentRules.NormalizeEducation(education);
                users = users.Where(u => u.EducationLevel != null && (u.EducationLevel == normalized || u.EducationLevel == education));
            }

            var userIds = await users.Select(u => u.Id).Take(FanoutCap).ToListAsync(cancellationToken);
            foreach (var userId in userIds)
                context.UserNotifications.Add(new UserNotification { Id = Guid.NewGuid(), OrganizationId = notification.OrganizationId, UserId = userId,
                    BroadcastId = notification.Id, Title = notification.Title, Body = notification.Message, Type = notification.NotificationType,
                    TargetType = notification.TargetType, TargetId = notification.TargetId, IsRead = false, CreatedDate = now });

            notification.Status = "Sent";
            notification.SentDate = now;
            notification.SentCount = userIds.Count;
            notification.UpdatedDate = now;
            await context.SaveChangesAsync(cancellationToken);

            foreach (var userId in userIds)
                await _hub.Clients.User(userId.ToString()).SendAsync("ReceiveNotification", new { id = notification.Id, title = notification.Title,
                    body = notification.Message, targetType = notification.TargetType, targetId = notification.TargetId }, cancellationToken);
        }
    }
}
