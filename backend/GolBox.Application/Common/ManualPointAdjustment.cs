using GolBox.Application.Interfaces;
using GolBox.Domain.Entities;

namespace GolBox.Application.Common;

public static class ManualPointAdjustment
{
    public static async Task<Result<ManualPointAdjustmentResult>> ApplyAsync(
        IAppDbContext context,
        Guid userId,
        int amount,
        string? actionType,
        string? reason,
        string? description,
        Guid? actorId,
        CancellationToken cancellationToken = default)
    {
        var reasonCheck = AdminSafetyRules.ValidateManualGpReason(reason);
        if (!reasonCheck.Success)
            return Result<ManualPointAdjustmentResult>.Fail(reasonCheck.Message);

        var amountCheck = AdminSafetyRules.ValidateManualGpAmount(amount);
        if (!amountCheck.Success)
            return Result<ManualPointAdjustmentResult>.Fail(amountCheck.Message);

        var actionCheck = AdminSafetyRules.ValidateManualGpAction(actionType);
        if (!actionCheck.Success)
            return Result<ManualPointAdjustmentResult>.Fail(actionCheck.Message);

        var action = AdminSafetyRules.CanonicalManualGpAction(actionType);
        var user = await context.Users.FindAsync(new object[] { userId }, cancellationToken);
        if (user == null)
            return Result<ManualPointAdjustmentResult>.Fail("Vatandaş bulunamadı.");

        var previous = user.PointsBalance;
        var delta = action == "Deduct" ? -amount : amount;
        if (action == "Deduct" && previous + delta < 0)
            return Result<ManualPointAdjustmentResult>.Fail($"Yetersiz bakiye. Kullanıcının mevcut bakiyesi: {previous} GP.");

        user.PointsBalance += delta;
        context.PointTransactions.Add(new PointTransaction
        {
            Id = Guid.NewGuid(),
            OrganizationId = user.OrganizationId,
            UserId = user.Id,
            Amount = delta,
            Type = action == "Deduct" ? "ManualDeduction" : "ManualAddition",
            Description = $"[Manuel İşlem: {action}] Nedeni: {reason}. Açıklama: {description}",
            ReferenceType = "Admin",
            CreatedBy = actorId,
            CreatedDate = DateTime.UtcNow
        });
        await context.SaveChangesAsync(cancellationToken);
        return Result<ManualPointAdjustmentResult>.Ok(new ManualPointAdjustmentResult(previous, user.PointsBalance, action, reason ?? "", description ?? ""));
    }
}

public record ManualPointAdjustmentResult(int PreviousBalance, int NewBalance, string Action, string Reason, string Description);
