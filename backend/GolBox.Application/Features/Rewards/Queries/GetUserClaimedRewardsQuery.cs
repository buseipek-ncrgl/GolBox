using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using GolBox.Application.Common;
using GolBox.Application.Interfaces;
using GolBox.Application.Features.Rewards;

namespace GolBox.Application.Features.Rewards.Queries;

public record GetUserClaimedRewardsQuery : IRequest<Result<List<ClaimedRewardDto>>>;

public record ClaimedRewardDto(
    Guid ClaimId,
    Guid RewardId,
    string RewardTitle,
    string RedeemCode,
    string Status,
    DateTime ClaimedAt,
    DateTime? RedeemedAt,
    DateTime ExpiresAt,
    string RewardDescription,
    string? ImageUrl,
    int RequiredPoints,
    string HolderName,
    string PersonalizedFor,
    bool IsExpired,
    int DaysRemaining,
    string SourceType
);

public class GetUserClaimedRewardsQueryHandler : IRequestHandler<GetUserClaimedRewardsQuery, Result<List<ClaimedRewardDto>>>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetUserClaimedRewardsQueryHandler(IAppDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<Result<List<ClaimedRewardDto>>> Handle(GetUserClaimedRewardsQuery request, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUserService.UserId;
        if (currentUserId == null || currentUserId == Guid.Empty)
        {
            return Result<List<ClaimedRewardDto>>.Fail("Kullanıcı kimliği doğrulanamadı.");
        }

        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == currentUserId.Value, cancellationToken);

        if (user == null)
            return Result<List<ClaimedRewardDto>>.Fail("Kullanıcı bulunamadı.");

        var now = DateTime.UtcNow;
        var holderName = $"{user.FirstName} {user.LastName}".Trim();
        var personalized = RewardIssue.PersonalizedFor(user.FirstName, user.LastName);

        var rows = await _context.UserRewards
            .AsNoTracking()
            .Include(ur => ur.Reward)
            .Where(ur => ur.UserId == currentUserId.Value)
            .OrderByDescending(ur => ur.ClaimedAt)
            .ToListAsync(cancellationToken);

        var claimedRewards = rows.Select(ur =>
        {
            var expired = ur.ExpiresAt < now;
            var daysRemaining = expired ? 0 : (int)Math.Ceiling((ur.ExpiresAt - now).TotalDays);
            return new ClaimedRewardDto(
                ur.Id,
                ur.RewardId,
                ur.Reward.Title,
                ur.RedeemCode,
                ur.Status,
                ur.ClaimedAt,
                ur.RedeemedAt,
                ur.ExpiresAt,
                ur.Reward.Description,
                ur.Reward.ImageUrl,
                ur.Reward.RequiredPoints,
                holderName,
                personalized,
                expired,
                daysRemaining,
                ur.RedeemCode.StartsWith("ISM-") ? "Ismarliyor" : "GolPuan"
            );
        }).ToList();

        return Result<List<ClaimedRewardDto>>.Ok(claimedRewards, "Kullanıcı ikram geçmişi başarıyla getirildi.");
    }
}
