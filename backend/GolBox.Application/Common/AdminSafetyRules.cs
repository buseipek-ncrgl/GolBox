namespace GolBox.Application.Common;

/// <summary>
/// Shared admin safety limits. UI mirrors these values; backend remains the source of truth.
/// </summary>
public static class AdminSafetyRules
{
    public const int MaxManualGp = 10000;
    public const int MinManualGp = 1;
    public const int MinManualReasonLength = 3;
    public const int MaxRewardGp = 100000;
    public const int MinRewardGp = 1;
    public const int MaxActivityRewardGp = 10000;
    public const int MaxCampaignTitleLength = 200;

    public static readonly string[] CitizenRoles = ["User", "Citizen"];
    public static readonly string[] StaffRoles = ["Staff", "Admin"];

    public static readonly string[] ManualGpActionTypes = ["Add", "Deduct"];

    public static readonly string[] KnownNotificationGroups =
    [
        NotificationTargetGroups.All,
        NotificationTargetGroups.AgeRange,
        NotificationTargetGroups.EducationLevel,
        NotificationTargetGroups.SingleUser,
        NotificationTargetGroups.HighSchool,
        NotificationTargetGroups.University
    ];

    public static Result ValidateManualGpAmount(int amount)
    {
        if (amount < MinManualGp)
            return Result.Fail("Miktar 0'dan büyük olmalıdır.");
        if (amount > MaxManualGp)
            return Result.Fail($"Tek seferde en fazla {MaxManualGp} GP işlem yapılabilir.");
        return Result.Ok();
    }

    public static Result ValidateManualGpReason(string? reason)
    {
        if (string.IsNullOrWhiteSpace(reason) || reason.Trim().Length < MinManualReasonLength)
            return Result.Fail("İşlem nedeni en az 3 karakter olmalıdır.");
        return Result.Ok();
    }

    public static Result ValidateManualGpAction(string? actionType)
    {
        var value = string.IsNullOrWhiteSpace(actionType) ? "Add" : actionType.Trim();
        if (value is "Reward" or "Coupon" or "Reverse")
            value = "Add";
        if (!ManualGpActionTypes.Contains(value, StringComparer.OrdinalIgnoreCase))
            return Result.Fail("İşlem türü Puan ekle veya Puan düş olmalıdır.");
        return Result.Ok();
    }

    public static string CanonicalManualGpAction(string? actionType)
    {
        var value = string.IsNullOrWhiteSpace(actionType) ? "Add" : actionType.Trim();
        if (value is "Reward" or "Coupon" or "Reverse")
            return "Add";
        if (value.Equals("Deduct", StringComparison.OrdinalIgnoreCase))
            return "Deduct";
        return "Add";
    }

    public static Result ValidateRewardPoints(int requiredPoints)
    {
        if (requiredPoints < MinRewardGp)
            return Result.Fail("Ödül fiyatı en az 1 GP olmalıdır.");
        if (requiredPoints > MaxRewardGp)
            return Result.Fail($"Ödül fiyatı en fazla {MaxRewardGp} GP olabilir.");
        return Result.Ok();
    }

    public static Result ValidateActivitySchedule(DateTime startDate, DateTime endDate, bool allowPastStart = false)
    {
        if (endDate <= startDate)
            return Result.Fail("Bitiş tarihi başlangıç tarihinden sonra olmalıdır.");
        if (!allowPastStart && startDate < DateTime.UtcNow.AddMinutes(-5))
            return Result.Fail("Etkinlik başlangıcı geçmiş bir tarih olamaz.");
        return Result.Ok();
    }

    public static Result ValidateActivityReward(int pointsReward)
    {
        if (pointsReward < 0)
            return Result.Fail("Etkinlik GölPuan ödülü negatif olamaz.");
        if (pointsReward > MaxActivityRewardGp)
            return Result.Fail($"Etkinlik GölPuan ödülü en fazla {MaxActivityRewardGp} olabilir.");
        return Result.Ok();
    }

    public static Result ValidateActivityCapacity(int? capacity)
    {
        if (capacity is < 0)
            return Result.Fail("Kontenjan 0 veya daha büyük olmalıdır.");
        return Result.Ok();
    }

    public static Result ValidateMenuPrice(decimal price)
    {
        if (price <= 0)
            return Result.Fail("Ürün fiyatı 0'dan büyük olmalıdır.");
        return Result.Ok();
    }

    public static Result ValidateNotificationTargetGroup(string? group, Guid? targetUserId)
    {
        if (string.IsNullOrWhiteSpace(group))
            return Result.Fail("Hedef kitle seçilmelidir.");

        var match = KnownNotificationGroups.FirstOrDefault(g =>
            g.Equals(group.Trim(), StringComparison.OrdinalIgnoreCase));
        if (match is null)
            return Result.Fail("Geçersiz hedef kitle.");

        if (match.Equals(NotificationTargetGroups.SingleUser, StringComparison.OrdinalIgnoreCase) &&
            targetUserId is null)
            return Result.Fail("Belirli vatandaş hedefi için kullanıcı seçilmelidir.");

        return Result.Ok();
    }

    public static Result ValidateNotificationContent(string? title, string? message)
    {
        if (string.IsNullOrWhiteSpace(title))
            return Result.Fail("Bildirim başlığı zorunludur.");
        if (string.IsNullOrWhiteSpace(message))
            return Result.Fail("Bildirim mesajı zorunludur.");
        return Result.Ok();
    }

    public static bool IsCitizenRole(string? role) =>
        !string.IsNullOrWhiteSpace(role) &&
        CitizenRoles.Any(r => r.Equals(role, StringComparison.OrdinalIgnoreCase));
}
