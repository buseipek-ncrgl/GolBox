using System;
using System.Security.Cryptography;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using GolBox.Application.Interfaces;

namespace GolBox.Application.Features.Rewards;

internal static class RewardIssue
{
    public const int DefaultExpireDays = 365;

    public static string NewRedeemCode()
    {
        var randomBytes = new byte[4];
        RandomNumberGenerator.Fill(randomBytes);
        var codeSuffix = Convert.ToHexString(randomBytes)[..6];
        return $"GB-CLAIM-{codeSuffix}";
    }

    public static async Task<int> ExpireDaysAsync(IAppDbContext context, Guid organizationId, CancellationToken cancellationToken)
    {
        var expireDaysSetting = await context.Settings
            .FirstOrDefaultAsync(s => s.OrganizationId == organizationId && s.Key == "rewardExpireDays", cancellationToken);

        if (expireDaysSetting != null && int.TryParse(expireDaysSetting.Value, out var parsedDays) && parsedDays >= DefaultExpireDays)
            return parsedDays;

        return DefaultExpireDays;
    }

    public static string PersonalizedFor(string? firstName, string? lastName)
    {
        var full = $"{firstName} {lastName}".Trim();
        if (string.IsNullOrWhiteSpace(full))
            full = "Üye";

        var lastVowel = 'a';
        foreach (var ch in full.ToLowerInvariant())
        {
            if ("aeıioöuü".Contains(ch))
                lastVowel = ch;
        }

        var isFront = lastVowel is 'e' or 'i' or 'ö' or 'ü';
        var endsVowel = "aeıioöuü".Contains(char.ToLowerInvariant(full[^1]));
        var suffix = endsVowel ? (isFront ? "ye" : "ya") : (isFront ? "e" : "a");
        return $"{full}'{suffix} özel";
    }
}
