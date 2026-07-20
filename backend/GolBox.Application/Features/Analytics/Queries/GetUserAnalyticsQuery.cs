using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using GolBox.Application.Common;
using GolBox.Application.Interfaces;

namespace GolBox.Application.Features.Analytics.Queries;

public record GetUserAnalyticsQuery : IRequest<Result<UserAnalyticsDto>>;

public record UserAnalyticsDto(
    int CurrentPointsBalance,
    int TotalPointsEarned,
    int TotalPointsSpent,
    int CompletedTasksCount,
    int AttendedActivitiesCount,
    int RedeemedRewardsCount,
    PointsSourceDistribution PointsDistribution
);

public record PointsSourceDistribution(
    int PointsFromTasks,
    int PointsFromActivities,
    int PointsFromShopping,
    int PointsFromAdmin
);

public class GetUserAnalyticsQueryHandler : IRequestHandler<GetUserAnalyticsQuery, Result<UserAnalyticsDto>>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetUserAnalyticsQueryHandler(IAppDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<Result<UserAnalyticsDto>> Handle(GetUserAnalyticsQuery request, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUserService.UserId;
        if (currentUserId == null || currentUserId == Guid.Empty)
        {
            return Result<UserAnalyticsDto>.Fail("Kullanıcı kimliği doğrulanamadı.");
        }

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == currentUserId.Value, cancellationToken);

        if (user == null)
        {
            return Result<UserAnalyticsDto>.Fail("Kullanıcı bulunamadı.");
        }

        // Calculate counts
        var completedTasks = await _context.UserTasks.CountAsync(ut => ut.UserId == user.Id, cancellationToken);
        var attendedActivities = await _context.UserActivities.CountAsync(ua => ua.UserId == user.Id, cancellationToken);
        var redeemedRewards = await _context.UserRewards.CountAsync(ur => ur.UserId == user.Id && ur.Status == "Redeemed", cancellationToken);

        // Calculate point sums
        var pointTransactions = await _context.PointTransactions
            .Where(pt => pt.UserId == user.Id)
            .ToListAsync(cancellationToken);

        var totalEarned = pointTransactions.Where(pt => pt.Amount > 0).Sum(pt => pt.Amount);
        var totalSpent = Math.Abs(pointTransactions.Where(pt => pt.Amount < 0).Sum(pt => pt.Amount));

        // Group points by source
        var pointsFromTasks = pointTransactions
            .Where(pt => pt.ReferenceType == "Task")
            .Sum(pt => pt.Amount);

        var pointsFromActivities = pointTransactions
            .Where(pt => pt.ReferenceType == "Activity")
            .Sum(pt => pt.Amount);

        var pointsFromShopping = pointTransactions
            .Where(pt => pt.ReferenceType == "QrScan" && pt.Amount > 0)
            .Sum(pt => pt.Amount);

        var pointsFromAdmin = pointTransactions
            .Where(pt => pt.ReferenceType == "Admin" && pt.Amount > 0)
            .Sum(pt => pt.Amount);

        var distribution = new PointsSourceDistribution(
            pointsFromTasks,
            pointsFromActivities,
            pointsFromShopping,
            pointsFromAdmin
        );

        var analytics = new UserAnalyticsDto(
            user.PointsBalance,
            totalEarned,
            totalSpent,
            completedTasks,
            attendedActivities,
            redeemedRewards,
            distribution
        );

        return Result<UserAnalyticsDto>.Ok(analytics, "Kullanıcı analitik verileri başarıyla hesaplandı.");
    }
}
