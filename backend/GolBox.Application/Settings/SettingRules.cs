using System.Globalization;
using GolBox.Application.Common;

namespace GolBox.Application.Settings;

public static class SettingRules
{
    public static readonly string[] ManagedKeys =
    [
        "rewardExpireDays",
        "visitBonusPoints",
        "pointsExchangeRate",
        "spendEarnRatePercent"
    ];

    public static Result Validate(string key, string value)
    {
        var canonical = ManagedKeys.FirstOrDefault(k => k.Equals(key, StringComparison.OrdinalIgnoreCase));
        if (canonical is null)
            return Result.Fail("Bu ayar yönetilemez.");

        if (string.IsNullOrWhiteSpace(value))
            return Result.Fail("Ayar değeri zorunludur.");

        switch (canonical)
        {
            case "rewardExpireDays":
                if (!int.TryParse(value, NumberStyles.Integer, CultureInfo.InvariantCulture, out var days) || days < 1 || days > 3650)
                    return Result.Fail("rewardExpireDays 1–3650 arasında olmalıdır.");
                break;
            case "visitBonusPoints":
                if (!int.TryParse(value, NumberStyles.Integer, CultureInfo.InvariantCulture, out var bonus) || bonus < 0 || bonus > 10000)
                    return Result.Fail("visitBonusPoints 0–10000 arasında olmalıdır.");
                break;
            case "pointsExchangeRate":
                if (!decimal.TryParse(value, NumberStyles.Number, CultureInfo.InvariantCulture, out var rate) || rate <= 0)
                    return Result.Fail("pointsExchangeRate 0’dan büyük olmalıdır.");
                break;
            case "spendEarnRatePercent":
                if (!decimal.TryParse(value, NumberStyles.Number, CultureInfo.InvariantCulture, out var percent) || percent < 0 || percent > 100)
                    return Result.Fail("spendEarnRatePercent 0–100 arasında olmalıdır.");
                break;
        }

        return Result.Ok();
    }

    public static string CanonicalKey(string key) =>
        ManagedKeys.First(k => k.Equals(key, StringComparison.OrdinalIgnoreCase));
}
