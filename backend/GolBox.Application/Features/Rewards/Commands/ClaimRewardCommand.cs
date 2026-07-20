using System;
using System.Security.Cryptography;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using GolBox.Application.Common;
using GolBox.Application.Interfaces;
using GolBox.Domain.Entities;

namespace GolBox.Application.Features.Rewards.Commands;

public record ClaimRewardCommand(
    Guid RewardId
) : IRequest<Result<ClaimResultDto>>;

public record ClaimResultDto(
    Guid ClaimId,
    string RedeemCode,
    DateTime ClaimedAt,
    int RemainingPoints
);

public class ClaimRewardCommandHandler : IRequestHandler<ClaimRewardCommand, Result<ClaimResultDto>>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public ClaimRewardCommandHandler(IAppDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<Result<ClaimResultDto>> Handle(ClaimRewardCommand request, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUserService.UserId;
        if (currentUserId == null || currentUserId == Guid.Empty)
        {
            return Result<ClaimResultDto>.Fail("Kullanıcı kimliği doğrulanamadı.");
        }

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == currentUserId.Value, cancellationToken);

        if (user == null)
        {
            return Result<ClaimResultDto>.Fail("Kullanıcı bulunamadı.");
        }

        var reward = await _context.Rewards
            .FirstOrDefaultAsync(r => r.Id == request.RewardId && r.OrganizationId == user.OrganizationId, cancellationToken);

        if (reward == null || reward.Status != "Active")
        {
            return Result<ClaimResultDto>.Fail("İkram aktif değil veya bulunamadı.");
        }

        if (user.PointsBalance < reward.RequiredPoints)
        {
            return Result<ClaimResultDto>.Fail("Yetersiz bakiye. Bu ikramı almak için yeterli puanınız bulunmuyor.");
        }

        // Read expiration setting from database (rewardExpireDays, default: 30)
        var expireDaysSetting = await _context.Settings
            .FirstOrDefaultAsync(s => s.OrganizationId == user.OrganizationId && s.Key == "rewardExpireDays", cancellationToken);

        var expireDays = 30;
        if (expireDaysSetting != null && int.TryParse(expireDaysSetting.Value, out var parsedDays))
        {
            expireDays = parsedDays;
        }

        // Generate unique RedeemCode
        var randomBytes = new byte[4];
        RandomNumberGenerator.Fill(randomBytes);
        var codeSuffix = Convert.ToHexString(randomBytes).Substring(0, 6);
        var redeemCode = $"GB-CLAIM-{codeSuffix}";

        // Save User Reward
        var userReward = new UserReward
        {
            UserId = user.Id,
            RewardId = reward.Id,
            ClaimedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(expireDays),
            Status = "Claimed",
            RedeemCode = redeemCode,
            OrganizationId = user.OrganizationId
        };

        _context.UserRewards.Add(userReward);

        // Deduct points
        user.PointsBalance -= reward.RequiredPoints;

        var transaction = new PointTransaction
        {
            UserId = user.Id,
            OrganizationId = user.OrganizationId,
            Amount = -reward.RequiredPoints,
            Type = "Spend",
            Description = $"{reward.Title} İkramı Alındı",
            ReferenceType = "RewardClaim",
            ReferenceId = userReward.Id
        };

        _context.PointTransactions.Add(transaction);

        await _context.SaveChangesAsync(cancellationToken);

        var result = new ClaimResultDto(
            userReward.Id,
            redeemCode,
            userReward.ClaimedAt,
            user.PointsBalance
        );

        return Result<ClaimResultDto>.Ok(result, "İkram başarıyla alındı.");
    }
}
