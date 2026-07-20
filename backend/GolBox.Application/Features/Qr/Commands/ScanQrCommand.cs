using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using GolBox.Application.Common;
using GolBox.Application.Interfaces;
using GolBox.Domain.Entities;

namespace GolBox.Application.Features.Qr.Commands;

public record ScanQrCommand(
    string QrToken,
    Guid CafeId,
    decimal Amount,
    bool PaidWithPoints,
    string? RedeemCode
) : IRequest<Result<ScanResultDto>>;

public record ScanResultDto(
    Guid PaymentId,
    decimal Amount,
    int PointsDeducted,
    int PointsEarned,
    int NewPointsBalance,
    string Status
);

public class ScanQrCommandHandler : IRequestHandler<ScanQrCommand, Result<ScanResultDto>>
{
    private readonly IAppDbContext _context;
    private readonly ITokenDecoder _tokenDecoder;

    public ScanQrCommandHandler(IAppDbContext context, ITokenDecoder tokenDecoder)
    {
        _context = context;
        _tokenDecoder = tokenDecoder;
    }

    public async Task<Result<ScanResultDto>> Handle(ScanQrCommand request, CancellationToken cancellationToken)
    {
        // 1. Identify User from QrToken
        Guid userId;
        if (Guid.TryParse(request.QrToken, out var parsedGuid))
        {
            userId = parsedGuid;
        }
        else
        {
            var decodedUserId = _tokenDecoder.GetUserIdFromToken(request.QrToken);
            if (decodedUserId != null && decodedUserId != Guid.Empty)
            {
                userId = decodedUserId.Value;
            }
            else
            {
                return Result<ScanResultDto>.Fail("Geçersiz veya okunamayan QR Kod Token'ı.");
            }
        }

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (user == null)
        {
            return Result<ScanResultDto>.Fail("QR koda bağlı kullanıcı bulunamadı.");
        }

        // 2. Validate Cafe
        var cafe = await _context.Cafes
            .FirstOrDefaultAsync(c => c.Id == request.CafeId && c.OrganizationId == user.OrganizationId, cancellationToken);

        if (cafe == null || !cafe.IsActive)
        {
            return Result<ScanResultDto>.Fail("Geçersiz veya aktif olmayan şube (kafe).");
        }

        int pointsDeducted = 0;
        int pointsEarned = 0;
        string status = "Completed";

        // Read settings from database
        var visitBonusSetting = await _context.Settings
            .FirstOrDefaultAsync(s => s.OrganizationId == user.OrganizationId && s.Key == "visitBonusPoints", cancellationToken);
        var visitBonus = 10;
        if (visitBonusSetting != null && int.TryParse(visitBonusSetting.Value, out var parsedBonus))
        {
            visitBonus = parsedBonus;
        }

        // 3. Process according to context
        if (!string.IsNullOrWhiteSpace(request.RedeemCode))
        {
            // CASE A: Redeeming a Claimed Ikram (Reward)
            var userReward = await _context.UserRewards
                .Include(ur => ur.Reward)
                .FirstOrDefaultAsync(ur => ur.RedeemCode == request.RedeemCode && ur.UserId == user.Id, cancellationToken);

            if (userReward == null)
            {
                return Result<ScanResultDto>.Fail("Belirtilen ikram kodu bulunamadı veya bu kullanıcıya ait değil.");
            }

            if (userReward.Status != "Claimed")
            {
                return Result<ScanResultDto>.Fail($"Bu ikram kodu zaten kullanılmış veya iptal edilmiş. Durum: {userReward.Status}");
            }

            if (userReward.ExpiresAt < DateTime.UtcNow)
            {
                userReward.Status = "Cancelled";
                await _context.SaveChangesAsync(cancellationToken);
                return Result<ScanResultDto>.Fail("Bu ikram kodunun geçerlilik süresi dolmuş.");
            }

            // Apply redemption
            userReward.Status = "Redeemed";
            userReward.RedeemedAt = DateTime.UtcNow;

            // Automatically award visit bonus points
            pointsEarned = visitBonus;
            user.PointsBalance += pointsEarned;

            var bonusTransaction = new PointTransaction
            {
                UserId = user.Id,
                OrganizationId = user.OrganizationId,
                Amount = pointsEarned,
                Type = "Earn",
                Description = $"{cafe.Name} Ziyareti - İkram Kullanım Bonusu",
                ReferenceType = "QrScan",
                ReferenceId = userReward.Id
            };
            _context.PointTransactions.Add(bonusTransaction);
        }
        else if (request.PaidWithPoints)
        {
            // CASE B: Paying with Points (1 TL = 1 Puan standard rate, customizable)
            var rateSetting = await _context.Settings
                .FirstOrDefaultAsync(s => s.OrganizationId == user.OrganizationId && s.Key == "pointsExchangeRate", cancellationToken);
            var rate = 1.0m;
            if (rateSetting != null && decimal.TryParse(rateSetting.Value, out var parsedRate))
            {
                rate = parsedRate;
            }

            var pointsRequired = (int)Math.Ceiling(request.Amount * rate);
            if (user.PointsBalance < pointsRequired)
            {
                return Result<ScanResultDto>.Fail($"Yetersiz puan bakiyesi. Ödeme için {pointsRequired} puan gerekiyor, mevcut bakiyeniz: {user.PointsBalance}");
            }

            // Deduct points
            user.PointsBalance -= pointsRequired;
            pointsDeducted = pointsRequired;

            var spendTransaction = new PointTransaction
            {
                UserId = user.Id,
                OrganizationId = user.OrganizationId,
                Amount = -pointsRequired,
                Type = "Spend",
                Description = $"{cafe.Name} QR Puanlı Ödeme",
                ReferenceType = "QrScan"
            };
            _context.PointTransactions.Add(spendTransaction);

            // Also earn visit bonus points for using the app
            pointsEarned = visitBonus;
            user.PointsBalance += pointsEarned;

            var earnTransaction = new PointTransaction
            {
                UserId = user.Id,
                OrganizationId = user.OrganizationId,
                Amount = pointsEarned,
                Type = "Earn",
                Description = $"{cafe.Name} Ziyareti Bonusu",
                ReferenceType = "QrScan"
            };
            _context.PointTransactions.Add(earnTransaction);
        }
        else
        {
            // CASE C: Regular cash/card payment, user earns points (10% of cash spent)
            var earnRateSetting = await _context.Settings
                .FirstOrDefaultAsync(s => s.OrganizationId == user.OrganizationId && s.Key == "spendEarnRatePercent", cancellationToken);
            var earnPercent = 10; // 10%
            if (earnRateSetting != null && int.TryParse(earnRateSetting.Value, out var parsedPercent))
            {
                earnPercent = parsedPercent;
            }

            pointsEarned = (int)Math.Floor(request.Amount * (earnPercent / 100.0m));
            
            // Add visit bonus too
            pointsEarned += visitBonus;
            user.PointsBalance += pointsEarned;

            var earnTransaction = new PointTransaction
            {
                UserId = user.Id,
                OrganizationId = user.OrganizationId,
                Amount = pointsEarned,
                Type = "Earn",
                Description = $"{cafe.Name} Alışveriş & Ziyaret Kazancı",
                ReferenceType = "QrScan"
            };
            _context.PointTransactions.Add(earnTransaction);
        }

        // 4. Create QrPayment Log
        var qrPayment = new QrPayment
        {
            UserId = user.Id,
            CafeId = request.CafeId,
            Amount = request.Amount,
            PaidWithPoints = request.PaidWithPoints,
            PointsDeducted = pointsDeducted,
            Status = status,
            Token = request.QrToken.Length > 250 ? request.QrToken.Substring(0, 250) : request.QrToken,
            ExpiresAt = DateTime.UtcNow,
            OrganizationId = user.OrganizationId
        };
        _context.QrPayments.Add(qrPayment);

        await _context.SaveChangesAsync(cancellationToken);

        var result = new ScanResultDto(
            qrPayment.Id,
            request.Amount,
            pointsDeducted,
            pointsEarned,
            user.PointsBalance,
            status
        );

        return Result<ScanResultDto>.Ok(result, "QR tarama ve işlem tamamlama başarılı.");
    }
}
