using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using GolBox.Application.Common;
using GolBox.Application.Interfaces;

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
    DateTime ExpiresAt
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

        var claimedRewards = await _context.UserRewards
            .Include(ur => ur.Reward)
            .Where(ur => ur.UserId == currentUserId.Value)
            .OrderByDescending(ur => ur.ClaimedAt)
            .Select(ur => new ClaimedRewardDto(
                ur.Id,
                ur.RewardId,
                ur.Reward.Title,
                ur.RedeemCode,
                ur.Status,
                ur.ClaimedAt,
                ur.RedeemedAt,
                ur.ExpiresAt
            ))
            .ToListAsync(cancellationToken);

        return Result<List<ClaimedRewardDto>>.Ok(claimedRewards, "Kullanıcı ikram geçmişi başarıyla getirildi.");
    }
}
