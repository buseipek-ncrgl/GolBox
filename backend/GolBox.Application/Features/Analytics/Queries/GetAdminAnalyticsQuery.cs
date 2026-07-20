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

public record GetAdminAnalyticsQuery : IRequest<Result<AdminAnalyticsDto>>;

public record AdminAnalyticsDto(
    int TotalUsersCount,
    int TotalPointsDistributed,
    int TotalPointsRedeemed,
    List<TopCafeDto> TopCafes,
    List<TopRewardDto> TopRewards
);

public record TopCafeDto(
    string CafeName,
    int VisitCount,
    decimal TotalSalesAmount
);

public record TopRewardDto(
    string RewardTitle,
    int ClaimCount
);

public class GetAdminAnalyticsQueryHandler : IRequestHandler<GetAdminAnalyticsQuery, Result<AdminAnalyticsDto>>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetAdminAnalyticsQueryHandler(IAppDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<Result<AdminAnalyticsDto>> Handle(GetAdminAnalyticsQuery request, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUserService.UserId;
        if (currentUserId == null || currentUserId == Guid.Empty)
        {
            return Result<AdminAnalyticsDto>.Fail("Yönetici kimliği doğrulanamadı.");
        }

        var adminUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == currentUserId.Value, cancellationToken);

        if (adminUser == null)
        {
            return Result<AdminAnalyticsDto>.Fail("Yönetici bulunamadı.");
        }

        var orgId = adminUser.OrganizationId;

        // Total users count
        var totalUsers = await _context.Users
            .CountAsync(u => u.OrganizationId == orgId, cancellationToken);

        // Total points distributed & redeemed
        var pointsInfo = await _context.PointTransactions
            .Where(pt => pt.OrganizationId == orgId)
            .Select(pt => pt.Amount)
            .ToListAsync(cancellationToken);

        var pointsDistributed = pointsInfo.Where(a => a > 0).Sum();
        var pointsRedeemed = Math.Abs(pointsInfo.Where(a => a < 0).Sum());

        // Top cafes based on visits (QrPayments)
        var topCafes = await _context.QrPayments
            .Include(qp => qp.Cafe)
            .Where(qp => qp.OrganizationId == orgId && qp.Status == "Completed")
            .GroupBy(qp => qp.Cafe.Name)
            .Select(g => new TopCafeDto(
                g.Key,
                g.Count(),
                g.Sum(qp => qp.Amount)
            ))
            .OrderByDescending(dto => dto.VisitCount)
            .Take(5)
            .ToListAsync(cancellationToken);

        // Top rewards claimed
        var topRewards = await _context.UserRewards
            .Include(ur => ur.Reward)
            .Where(ur => ur.OrganizationId == orgId)
            .GroupBy(ur => ur.Reward.Title)
            .Select(g => new TopRewardDto(
                g.Key,
                g.Count()
            ))
            .OrderByDescending(dto => dto.ClaimCount)
            .Take(5)
            .ToListAsync(cancellationToken);

        var analytics = new AdminAnalyticsDto(
            totalUsers,
            pointsDistributed,
            pointsRedeemed,
            topCafes,
            topRewards
        );

        return Result<AdminAnalyticsDto>.Ok(analytics, "Yönetici analitik raporu başarıyla hazırlandı.");
    }
}
