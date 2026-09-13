using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using GolBox.Application.Common;
using GolBox.Application.Interfaces;
using GolBox.Domain.Entities;

namespace GolBox.Application.Features.Activities.Commands;

public record JoinActivityCommand(
    Guid ActivityId
) : IRequest<Result>;

public class JoinActivityCommandHandler : IRequestHandler<JoinActivityCommand, Result>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public JoinActivityCommandHandler(IAppDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<Result> Handle(JoinActivityCommand request, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUserService.UserId;
        if (currentUserId == null || currentUserId == Guid.Empty)
        {
            return Result.Fail("Kullanıcı kimliği doğrulanamadı.");
        }

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == currentUserId.Value, cancellationToken);

        if (user == null)
        {
            return Result.Fail("Kullanıcı bulunamadı.");
        }

        var activity = await _context.Activities
            .FirstOrDefaultAsync(a => a.Id == request.ActivityId && a.OrganizationId == user.OrganizationId, cancellationToken);

        if (activity == null || activity.Status != "Active")
        {
            return Result.Fail("Etkinlik bulunamadı veya aktif değil.");
        }

        var now = DateTime.UtcNow;
        if (activity.EndDate < now)
        {
            return Result.Fail("Etkinlik süresi dolduğu için katılım sağlanamaz.");
        }

        var alreadyJoined = await _context.UserActivities
            .AnyAsync(ua => ua.ActivityId == activity.Id && ua.UserId == user.Id, cancellationToken);

        if (alreadyJoined)
        {
            return Result.Fail("Bu etkinliğe zaten katıldınız.");
        }

        if (activity.Capacity.HasValue && activity.Capacity.Value > 0)
        {
            var joinedCount = await _context.UserActivities
                .CountAsync(ua => ua.ActivityId == activity.Id, cancellationToken);
            if (joinedCount >= activity.Capacity.Value)
                return Result.Fail("Etkinlik kontenjanı dolmuştur.");
        }

        // 1. Join Activity
        var userActivity = new UserActivity
        {
            UserId = user.Id,
            ActivityId = activity.Id,
            JoinedAt = now,
            PointsEarned = activity.PointsReward,
            OrganizationId = user.OrganizationId
        };
        _context.UserActivities.Add(userActivity);

        // 2. Award Points
        user.PointsBalance += activity.PointsReward;

        var transaction = new PointTransaction
        {
            UserId = user.Id,
            OrganizationId = user.OrganizationId,
            Amount = activity.PointsReward,
            Type = "Earn",
            Description = $"\"{activity.Title}\" Etkinliğine Katılım",
            ReferenceType = "Activity",
            ReferenceId = activity.Id
        };
        _context.PointTransactions.Add(transaction);

        await _context.SaveChangesAsync(cancellationToken);

        return Result.Ok("Etkinliğe başarıyla katıldınız ve puanınız eklendi.");
    }
}
