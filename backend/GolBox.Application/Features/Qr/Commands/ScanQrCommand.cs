using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using GolBox.Application.Common;
using GolBox.Application.Interfaces;
using GolBox.Application.Security;
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
    string Status,
    Guid UserId,
    string MemberName,
    string Operation,
    string? CouponCode,
    string? CouponTitle
);

public class ScanQrCommandHandler : IRequestHandler<ScanQrCommand, Result<ScanResultDto>>
{
    private readonly IAppDbContext _context;
    private readonly IDynamicQrService _dynamicQrService;
    private readonly ICurrentUserService _currentUser;

    public ScanQrCommandHandler(
        IAppDbContext context,
        IDynamicQrService dynamicQrService,
        ICurrentUserService currentUser)
    {
        _context = context;
        _dynamicQrService = dynamicQrService;
        _currentUser = currentUser;
    }

    public async Task<Result<ScanResultDto>> Handle(ScanQrCommand request, CancellationToken cancellationToken)
    {
        var identity = QrTokenParser.Resolve(request.QrToken, _dynamicQrService);
        if (!identity.IsValid || identity.UserId is null)
            return Result<ScanResultDto>.Fail(identity.ErrorMessage ?? "Geçersiz veya okunamayan QR kod.");

        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == identity.UserId.Value, cancellationToken);

            if (user == null)
                return Result<ScanResultDto>.Fail("QR koda bağlı kullanıcı bulunamadı.");

            var cafe = await _context.Cafes
                .FirstOrDefaultAsync(c => c.Id == request.CafeId && c.OrganizationId == user.OrganizationId, cancellationToken);

            if (cafe == null || !cafe.IsActive)
                return Result<ScanResultDto>.Fail("Geçersiz veya aktif olmayan şube (kafe).");

            int pointsDeducted = 0;
            int pointsEarned = 0;
            const string status = "Completed";
            string operation;
            string? couponCode = null;
            string? couponTitle = null;

            var visitBonusSetting = await _context.Settings
                .FirstOrDefaultAsync(s => s.OrganizationId == user.OrganizationId && s.Key == "visitBonusPoints", cancellationToken);
            var visitBonus = 10;
            if (visitBonusSetting != null && int.TryParse(visitBonusSetting.Value, out var parsedBonus))
                visitBonus = parsedBonus;

            if (!string.IsNullOrWhiteSpace(request.RedeemCode))
            {
                var userReward = await _context.UserRewards
                    .Include(ur => ur.Reward)
                    .FirstOrDefaultAsync(ur => ur.RedeemCode == request.RedeemCode && ur.UserId == user.Id, cancellationToken);

                if (userReward == null)
                    return Result<ScanResultDto>.Fail("Belirtilen ikram kodu bulunamadı veya bu kullanıcıya ait değil.");

                if (userReward.Status == UserRewardStatuses.Expired ||
                    (UserRewardStatuses.IsOpenClaim(userReward.Status) && userReward.ExpiresAt < DateTime.UtcNow))
                {
                    userReward.Status = UserRewardStatuses.Expired;
                    userReward.UpdatedDate = DateTime.UtcNow;
                    await _context.SaveChangesAsync(cancellationToken);
                    await transaction.CommitAsync(cancellationToken);
                    return Result<ScanResultDto>.Fail("Bu ikram kodunun geçerlilik süresi dolmuş.");
                }

                if (!UserRewardStatuses.IsOpenClaim(userReward.Status))
                    return Result<ScanResultDto>.Fail($"Bu ikram kodu zaten kullanılmış veya iptal edilmiş. Durum: {userReward.Status}");

                userReward.Status = UserRewardStatuses.Redeemed;
                userReward.RedeemedAt = DateTime.UtcNow;
                couponCode = userReward.RedeemCode;
                couponTitle = userReward.Reward?.Title;
                operation = "coupon-redeem";

                pointsEarned = visitBonus;
                user.PointsBalance += pointsEarned;

                _context.PointTransactions.Add(new PointTransaction
                {
                    UserId = user.Id,
                    OrganizationId = user.OrganizationId,
                    Amount = pointsEarned,
                    Type = "Earn",
                    Description = $"{cafe.Name} Ziyareti - İkram Kullanım Bonusu",
                    ReferenceType = "QrScan",
                    ReferenceId = userReward.Id
                });
            }
            else if (request.PaidWithPoints)
            {
                var rateSetting = await _context.Settings
                    .FirstOrDefaultAsync(s => s.OrganizationId == user.OrganizationId && s.Key == "pointsExchangeRate", cancellationToken);
                var rate = 1.0m;
                if (rateSetting != null && decimal.TryParse(rateSetting.Value, out var parsedRate))
                    rate = parsedRate;

                var pointsRequired = (int)Math.Ceiling(request.Amount * rate);
                if (user.PointsBalance < pointsRequired)
                    return Result<ScanResultDto>.Fail($"Yetersiz puan bakiyesi. Ödeme için {pointsRequired} puan gerekiyor, mevcut bakiyeniz: {user.PointsBalance}");

                user.PointsBalance -= pointsRequired;
                pointsDeducted = pointsRequired;
                operation = "points-payment";

                _context.PointTransactions.Add(new PointTransaction
                {
                    UserId = user.Id,
                    OrganizationId = user.OrganizationId,
                    Amount = -pointsRequired,
                    Type = "Spend",
                    Description = $"{cafe.Name} QR Puanlı Ödeme",
                    ReferenceType = "QrScan"
                });

                pointsEarned = visitBonus;
                user.PointsBalance += pointsEarned;

                _context.PointTransactions.Add(new PointTransaction
                {
                    UserId = user.Id,
                    OrganizationId = user.OrganizationId,
                    Amount = pointsEarned,
                    Type = "Earn",
                    Description = $"{cafe.Name} Ziyareti Bonusu",
                    ReferenceType = "QrScan"
                });
            }
            else
            {
                var earnRateSetting = await _context.Settings
                    .FirstOrDefaultAsync(s => s.OrganizationId == user.OrganizationId && s.Key == "spendEarnRatePercent", cancellationToken);
                var earnPercent = 10;
                if (earnRateSetting != null && int.TryParse(earnRateSetting.Value, out var parsedPercent))
                    earnPercent = parsedPercent;

                pointsEarned = (int)Math.Floor(request.Amount * (earnPercent / 100.0m));
                pointsEarned += visitBonus;
                user.PointsBalance += pointsEarned;
                operation = "cash-earn";

                _context.PointTransactions.Add(new PointTransaction
                {
                    UserId = user.Id,
                    OrganizationId = user.OrganizationId,
                    Amount = pointsEarned,
                    Type = "Earn",
                    Description = $"{cafe.Name} Alışveriş & Ziyaret Kazancı",
                    ReferenceType = "QrScan"
                });
            }

            var tokenFingerprint = identity.Kind == "hmac"
                ? identity.Fingerprint
                : $"legacy:{identity.UserId:D}:{Guid.NewGuid():N}";

            if (identity.Kind == "hmac")
            {
                var replay = await _context.QrPayments
                    .AnyAsync(p => p.Token == tokenFingerprint && p.Status == "Completed", cancellationToken);
                if (replay)
                    return Result<ScanResultDto>.Fail("Bu kasa kodu az önce kullanıldı. Yeni kod oluşturun.");
            }

            var qrPayment = new QrPayment
            {
                UserId = user.Id,
                CafeId = request.CafeId,
                Amount = request.Amount,
                PaidWithPoints = request.PaidWithPoints,
                PointsDeducted = pointsDeducted,
                Status = status,
                Token = tokenFingerprint.Length > 250
                    ? tokenFingerprint[..250]
                    : tokenFingerprint,
                ExpiresAt = DateTime.UtcNow,
                OrganizationId = user.OrganizationId
            };
            _context.QrPayments.Add(qrPayment);

            await _context.SaveChangesAsync(cancellationToken);

            await AuditLogsControllerSafe.TryLogAsync(
                _context,
                _currentUser.Email ?? "staff",
                _currentUser.Role ?? "Staff",
                operation == "coupon-redeem" ? "Coupon_Redeem" : operation == "points-payment" ? "Qr_PointsPayment" : "Qr_CashEarn",
                "Qr",
                operation == "coupon-redeem" ? "UserReward" : "QrPayment",
                qrPayment.Id.ToString(),
                null,
                $"{user.FirstName} {user.LastName} | {operation} | {pointsEarned} GP",
                $"Cafe={cafe.Name}; deducted={pointsDeducted}; earned={pointsEarned}");

            await transaction.CommitAsync(cancellationToken);

            return Result<ScanResultDto>.Ok(new ScanResultDto(
                qrPayment.Id,
                request.Amount,
                pointsDeducted,
                pointsEarned,
                user.PointsBalance,
                status,
                user.Id,
                $"{user.FirstName} {user.LastName}".Trim(),
                operation,
                couponCode,
                couponTitle
            ), "QR tarama ve işlem tamamlama başarılı.");
        }
        catch (DbUpdateConcurrencyException)
        {
            await transaction.RollbackAsync(cancellationToken);
            return Result<ScanResultDto>.Fail("Bakiye başka bir kasa işlemiyle değişti. Lütfen tekrar deneyin.");
        }
        catch (DbUpdateException)
        {
            await transaction.RollbackAsync(cancellationToken);
            return Result<ScanResultDto>.Fail("Bu kasa kodu az önce kullanıldı veya işlem çakıştı.");
        }
    }
}

/// <summary>
/// Avoids a circular project reference: Application cannot see Api.AuditLogsController.
/// Persistence of audit rows is done inline.
/// </summary>
internal static class AuditLogsControllerSafe
{
    public static async Task TryLogAsync(
        IAppDbContext context,
        string userEmail,
        string userRole,
        string actionType,
        string moduleName,
        string entityName,
        string? entityId,
        string? oldVal,
        string? newVal,
        string? reason)
    {
        context.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            UserEmail = userEmail,
            UserRole = userRole,
            ActionType = actionType,
            ModuleName = moduleName,
            EntityName = entityName,
            EntityId = entityId,
            OldValues = oldVal,
            NewValues = newVal,
            Reason = reason,
            IpAddress = null,
            CreatedDate = DateTime.UtcNow
        });
        await context.SaveChangesAsync();
    }
}
