using GolBox.Api.Hubs;
using GolBox.Application.Interfaces;
using GolBox.Domain.Entities;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace GolBox.Api.Services;

public sealed class CitizenNotificationService
{
    private readonly IAppDbContext _context;
    private readonly IHubContext<NotificationHub> _hub;

    public CitizenNotificationService(IAppDbContext context, IHubContext<NotificationHub> hub)
    {
        _context = context;
        _hub = hub;
    }

    public async System.Threading.Tasks.Task SendToUserAsync(Guid userId, Guid organizationId, string title, string body,
        string type, string? targetType = null, string? targetId = null, CancellationToken cancellationToken = default)
    {
        var row = new UserNotification
        {
            Id = Guid.NewGuid(), OrganizationId = organizationId, UserId = userId,
            Title = title, Body = body, Type = type, TargetType = targetType,
            TargetId = targetId, IsRead = false, CreatedDate = DateTime.UtcNow
        };
        _context.UserNotifications.Add(row);
        await _context.SaveChangesAsync(cancellationToken);
        await _hub.Clients.User(userId.ToString()).SendAsync("ReceiveNotification", Payload(row), cancellationToken);
    }

    public async System.Threading.Tasks.Task SendToOrganizationAsync(Guid organizationId, string title, string body,
        string type, string? targetType = null, string? targetId = null, CancellationToken cancellationToken = default)
    {
        var userIds = await _context.Users.AsNoTracking()
            .Where(x => x.OrganizationId == organizationId && (x.Role == "User" || x.Role == "Citizen"))
            .Select(x => x.Id).ToListAsync(cancellationToken);
        var now = DateTime.UtcNow;
        var rows = userIds.Select(userId => new UserNotification
        {
            Id = Guid.NewGuid(), OrganizationId = organizationId, UserId = userId,
            Title = title, Body = body, Type = type, TargetType = targetType,
            TargetId = targetId, IsRead = false, CreatedDate = now
        }).ToList();
        _context.UserNotifications.AddRange(rows);
        await _context.SaveChangesAsync(cancellationToken);
        foreach (var row in rows)
            await _hub.Clients.User(row.UserId.ToString()).SendAsync("ReceiveNotification", Payload(row), cancellationToken);
    }

    private static object Payload(UserNotification row) => new
    {
        id = row.Id, row.Title, row.Body, type = row.Type, entityType = row.TargetType,
        entityId = row.TargetId, targetType = row.TargetType, targetId = row.TargetId,
        isRead = row.IsRead, createdAt = row.CreatedDate
    };
}
