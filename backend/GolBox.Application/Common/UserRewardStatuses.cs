namespace GolBox.Application.Common;

/// <summary>
/// Live coupon lifecycle is UserReward, not the deprecated Coupon entity.
/// Canonical statuses: Claimed → Redeemed | Expired | Cancelled.
/// </summary>
public static class UserRewardStatuses
{
    public const string Claimed = "Claimed";
    public const string Redeemed = "Redeemed";
    public const string Expired = "Expired";
    public const string Cancelled = "Cancelled";

    public static bool IsOpenClaim(string? status) =>
        string.Equals(status, Claimed, StringComparison.OrdinalIgnoreCase);
}
