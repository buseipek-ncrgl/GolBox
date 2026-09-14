using System.Globalization;
using GolBox.Application.Common;
using GolBox.Domain.Entities;

namespace GolBox.Application.Places;

public static class PlaceClock
{
    public static TimeZoneInfo IstanbulTimeZone { get; } = ResolveIstanbul();

    public static DateTime ToIstanbul(DateTime utc)
    {
        var value = utc.Kind == DateTimeKind.Unspecified
            ? DateTime.SpecifyKind(utc, DateTimeKind.Utc)
            : utc.ToUniversalTime();
        return TimeZoneInfo.ConvertTimeFromUtc(value, IstanbulTimeZone);
    }

    public static string ResolveOpenStatus(IEnumerable<PlaceOpeningHour> hours, DateTime? utcNow = null)
    {
        var local = ToIstanbul(utcNow ?? DateTime.UtcNow);
        var today = hours.FirstOrDefault(h => h.DayOfWeek == (int)local.DayOfWeek && !h.IsDeleted);
        if (today == null)
            return PlaceOpenStatuses.Unknown;
        if (today.IsClosed)
            return PlaceOpenStatuses.Closed;
        if (!TryParseHm(today.OpenTime, out var open) || !TryParseHm(today.CloseTime, out var close))
            return PlaceOpenStatuses.Unknown;

        var now = local.TimeOfDay;
        return now >= open && now < close ? PlaceOpenStatuses.Open : PlaceOpenStatuses.Closed;
    }

    public static bool IsOpenNow(IEnumerable<PlaceOpeningHour> hours, DateTime? utcNow = null) =>
        ResolveOpenStatus(hours, utcNow) == PlaceOpenStatuses.Open;

    public static bool TryParseHm(string? value, out TimeSpan time)
    {
        time = default;
        if (string.IsNullOrWhiteSpace(value))
            return false;
        return TimeSpan.TryParseExact(value.Trim(), ["hh\\:mm", "h\\:mm"], CultureInfo.InvariantCulture, out time);
    }

    public static string? NormalizeHm(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;
        return TryParseHm(value, out var time) ? time.ToString(@"hh\:mm") : null;
    }

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
