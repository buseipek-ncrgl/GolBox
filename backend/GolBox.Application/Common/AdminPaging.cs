namespace GolBox.Application.Common;

public static class AdminPaging
{
    public const int DefaultPageSize = 25;

    public static (int Page, int PageSize) Normalize(int page, int pageSize)
    {
        page = page < 1 ? 1 : page;
        pageSize = pageSize switch
        {
            25 or 50 or 100 => pageSize,
            > 0 and <= 100 => pageSize,
            _ => DefaultPageSize
        };
        return (page, pageSize);
    }
}

public static class AdminDateRange
{
    public static TimeZoneInfo Istanbul { get; } = ResolveIstanbul();

    public static (DateTime FromUtc, DateTime ToUtc) Resolve(string? preset, DateTime? from, DateTime? to)
    {
        var nowLocal = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, Istanbul);
        DateTime startLocal;
        DateTime endLocalExclusive;

        switch ((preset ?? string.Empty).Trim().ToLowerInvariant())
        {
            case "today":
                startLocal = nowLocal.Date;
                endLocalExclusive = startLocal.AddDays(1);
                break;
            case "7d":
            case "last7":
                startLocal = nowLocal.Date.AddDays(-6);
                endLocalExclusive = nowLocal.Date.AddDays(1);
                break;
            case "30d":
            case "last30":
                startLocal = nowLocal.Date.AddDays(-29);
                endLocalExclusive = nowLocal.Date.AddDays(1);
                break;
            default:
                if (from.HasValue || to.HasValue)
                {
                    var fromLocal = ToIstanbulDate(from) ?? nowLocal.Date.AddDays(-29);
                    var toLocal = ToIstanbulDate(to) ?? nowLocal.Date;
                    startLocal = fromLocal;
                    endLocalExclusive = toLocal.AddDays(1);
                    if (endLocalExclusive <= startLocal)
                        endLocalExclusive = startLocal.AddDays(1);
                }
                else
                {
                    startLocal = nowLocal.Date.AddDays(-29);
                    endLocalExclusive = nowLocal.Date.AddDays(1);
                }
                break;
        }

        return (ToUtc(startLocal), ToUtc(endLocalExclusive));
    }

    private static DateTime? ToIstanbulDate(DateTime? value)
    {
        if (!value.HasValue) return null;
        var v = value.Value;
        if (v.Kind == DateTimeKind.Utc)
            return TimeZoneInfo.ConvertTimeFromUtc(v, Istanbul).Date;
        if (v.Kind == DateTimeKind.Local)
            return TimeZoneInfo.ConvertTime(v, Istanbul).Date;
        return v.Date;
    }

    private static DateTime ToUtc(DateTime unspecifiedLocal) =>
        TimeZoneInfo.ConvertTimeToUtc(DateTime.SpecifyKind(unspecifiedLocal, DateTimeKind.Unspecified), Istanbul);

    private static TimeZoneInfo ResolveIstanbul()
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById("Europe/Istanbul");
        }
        catch (TimeZoneNotFoundException)
        {
            return TimeZoneInfo.FindSystemTimeZoneById("Turkey Standard Time");
        }
    }
}
