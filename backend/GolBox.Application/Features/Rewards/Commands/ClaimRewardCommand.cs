using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using GolBox.Application.Common;

namespace GolBox.Application.Features.Rewards.Commands;

public record ClaimRewardCommand(
    Guid RewardId
) : IRequest<Result<ClaimResultDto>>;

public record ClaimResultDto(
    Guid ClaimId,
    string RedeemCode,
    DateTime ClaimedAt,
    DateTime ExpiresAt,
    int RemainingPoints
);

public class ClaimRewardCommandHandler : IRequestHandler<ClaimRewardCommand, Result<ClaimResultDto>>
{
    private readonly IMediator _mediator;

    public ClaimRewardCommandHandler(IMediator mediator)
    {
        _mediator = mediator;
    }

    public async Task<Result<ClaimResultDto>> Handle(ClaimRewardCommand request, CancellationToken cancellationToken)
    {
        var checkout = await _mediator.Send(
            new CheckoutCartCommand(new List<CheckoutCartItem> { new(request.RewardId, 1) }),
            cancellationToken
        );

        if (!checkout.Success || checkout.Data == null || checkout.Data.Coupons.Count == 0)
            return Result<ClaimResultDto>.Fail(checkout.Message ?? "İkram alınamadı.");

        var coupon = checkout.Data.Coupons[0];
        return Result<ClaimResultDto>.Ok(
            new ClaimResultDto(
                coupon.ClaimId,
                coupon.RedeemCode,
                DateTime.UtcNow,
                coupon.ExpiresAt,
                checkout.Data.RemainingPoints
            ),
            "İkram kişiye özel kupon olarak cüzdana işlendi."
        );
    }
}
