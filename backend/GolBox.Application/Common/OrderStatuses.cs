namespace GolBox.Application.Common;

public static class OrderStatuses
{
    public const string Pending = "Pending";
    public const string Preparing = "Preparing";
    public const string Ready = "Ready";
    public const string Completed = "Completed";
    public const string Cancelled = "Cancelled";

    public static string Canonicalize(string? status)
    {
        if (string.IsNullOrWhiteSpace(status))
            return Pending;

        return status.Trim().ToLowerInvariant() switch
        {
            "pending" or "submitted" or "created" or "onay bekliyor" or "inceleme" => Pending,
            "approved" or "preparing" or "hazirlaniyor" or "hazırlanıyor" => Preparing,
            "ready" or "live" or "hazir" or "hazır" => Ready,
            "completed" or "delivered" or "teslim edildi" or "tamamlandi" or "tamamlandı" => Completed,
            "cancelled" or "canceled" or "rejected" or "iptal" => Cancelled,
            _ => status.Trim()
        };
    }

    public static bool IsPending(string? status)
    {
        var value = Canonicalize(status);
        return value == Pending || value == Preparing;
    }
}
