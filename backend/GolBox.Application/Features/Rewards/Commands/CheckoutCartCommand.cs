using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using GolBox.Application.Common;
using GolBox.Application.Features.Rewards;
using GolBox.Application.Interfaces;
using GolBox.Domain.Entities;

namespace GolBox.Application.Features.Rewards.Commands;

public record CheckoutCartItem(Guid RewardId, int Quantity);

public record CheckoutCartCommand(List<CheckoutCartItem> Items) : IRequest<Result<CheckoutCartResultDto>>;

public record CheckoutCartCouponDto(
    Guid ClaimId,
    Guid RewardId,
    string RewardTitle,
    string RedeemCode,
    DateTime ExpiresAt,
    string HolderName,
    string PersonalizedFor
);

public record CheckoutCartResultDto(
    int RemainingPoints,
    List<CheckoutCartCouponDto> Coupons
);

public class CheckoutCartCommandHandler : IRequestHandler<CheckoutCartCommand, Result<CheckoutCartResultDto>>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public CheckoutCartCommandHandler(IAppDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<Result<CheckoutCartResultDto>> Handle(CheckoutCartCommand request, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUserService.UserId;
        if (currentUserId == null || currentUserId == Guid.Empty)
            return Result<CheckoutCartResultDto>.Fail("Kullanıcı kimliği doğrulanamadı.");

        var lines = (request.Items ?? new List<CheckoutCartItem>())
            .Where(i => i.RewardId != Guid.Empty && i.Quantity > 0)
            .GroupBy(i => i.RewardId)
            .Select(g => new { RewardId = g.Key, Quantity = Math.Clamp(g.Sum(x => x.Quantity), 1, 5) })
            .ToList();

        if (lines.Count == 0)
            return Result<CheckoutCartResultDto>.Fail("Sepet boş.");

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == currentUserId.Value, cancellationToken);
        if (user == null)
            return Result<CheckoutCartResultDto>.Fail("Kullanıcı bulunamadı.");

        var rewardIds = lines.Select(l => l.RewardId).ToList();
        var rewards = await _context.Rewards
            .Where(r => rewardIds.Contains(r.Id) && r.OrganizationId == user.OrganizationId)
            .ToListAsync(cancellationToken);

        if (rewards.Count != rewardIds.Count)
            return Result<CheckoutCartResultDto>.Fail("Sepette geçersiz veya pasif bir ikram var.");

        if (rewards.Any(r => r.Status != "Active"))
            return Result<CheckoutCartResultDto>.Fail("Sepette aktif olmayan bir ikram var.");

        var totalPoints = 0;
        foreach (var line in lines)
        {
            var reward = rewards.First(r => r.Id == line.RewardId);
            totalPoints += reward.RequiredPoints * line.Quantity;
        }

        if (user.PointsBalance < totalPoints)
            return Result<CheckoutCartResultDto>.Fail($"Yetersiz bakiye. Sepet {totalPoints} GP, bakiyen {user.PointsBalance} GP.");

        var expireDays = await RewardIssue.ExpireDaysAsync(_context, user.OrganizationId, cancellationToken);
        var now = DateTime.UtcNow;
        var coupons = new List<CheckoutCartCouponDto>();
        var holderName = $"{user.FirstName} {user.LastName}".Trim();
        var personalized = RewardIssue.PersonalizedFor(user.FirstName, user.LastName);
        var usedCodes = (await _context.UserRewards.Select(ur => ur.RedeemCode).ToListAsync(cancellationToken))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        foreach (var line in lines)
        {
            var reward = rewards.First(r => r.Id == line.RewardId);
            for (var i = 0; i < line.Quantity; i++)
            {
                string redeemCode;
                do
                {
                    redeemCode = RewardIssue.NewRedeemCode();
                } while (!usedCodes.Add(redeemCode));

                var userReward = new UserReward
                {
                    Id = Guid.NewGuid(),
                    UserId = user.Id,
                    RewardId = reward.Id,
                    ClaimedAt = now,
                    ExpiresAt = now.AddDays(expireDays),
                    Status = "Claimed",
                    RedeemCode = redeemCode,
                    OrganizationId = user.OrganizationId
                };
                _context.UserRewards.Add(userReward);
                coupons.Add(new CheckoutCartCouponDto(
                    userReward.Id,
                    reward.Id,
                    reward.Title,
                    userReward.RedeemCode,
                    userReward.ExpiresAt,
                    holderName,
                    personalized
                ));
            }

            _context.PointTransactions.Add(new PointTransaction
            {
                UserId = user.Id,
                OrganizationId = user.OrganizationId,
                Amount = -(reward.RequiredPoints * line.Quantity),
                Type = "Spend",
                Description = line.Quantity > 1
                    ? $"{reward.Title} ×{line.Quantity} sepetten alındı"
                    : $"{reward.Title} sepetten alındı",
                ReferenceType = "RewardCheckout"
            });
        }

        user.PointsBalance -= totalPoints;
        await _context.SaveChangesAsync(cancellationToken);

        return Result<CheckoutCartResultDto>.Ok(
            new CheckoutCartResultDto(user.PointsBalance, coupons),
            $"{coupons.Count} kişiye özel kupon 1 yıl geçerli olarak sepetine işlendi."
        );
    }
}
