namespace GolBox.Application.Common;

public static class PlaceCategories
{
    public const string Cafe = "Cafe";
    public const string ScienceCenter = "ScienceCenter";
    public const string Library = "Library";
    public const string YouthCenter = "YouthCenter";
    public const string SportsFacility = "SportsFacility";
    public const string CultureCenter = "CultureCenter";
    public const string Theatre = "Theatre";
    public const string Park = "Park";
    public const string Other = "Other";

    public static readonly string[] All =
    [
        Cafe, ScienceCenter, Library, YouthCenter, SportsFacility, CultureCenter, Theatre, Park, Other
    ];

    public static bool IsKnown(string? value) =>
        All.Any(c => string.Equals(c, value, StringComparison.OrdinalIgnoreCase));

    public static string Canonical(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return Other;
        return All.FirstOrDefault(c => string.Equals(c, value, StringComparison.OrdinalIgnoreCase)) ?? Other;
    }

    public static string SearchKeywords(string category) => Canonical(category) switch
    {
        Cafe => "gol kafe golkafe cafe kafeterya",
        ScienceCenter => "bilim sehitkamil bilim merkezi",
        Library => "kutuphane kitap",
        YouthCenter => "genclik merkezi",
        SportsFacility => "spor tesis salon saha",
        CultureCenter => "kultur sanat merkezi",
        Theatre => "sahne tiyatro",
        Park => "park rekreasyon",
        _ => "tesis yer"
    };
}

public static class PlaceAmenities
{
    public const string Wifi = "Wifi";
    public const string Parking = "Parking";
    public const string WheelchairAccess = "WheelchairAccess";
    public const string AccessibleToilet = "AccessibleToilet";
    public const string KidsArea = "KidsArea";
    public const string Library = "Library";
    public const string Cafe = "Cafe";
    public const string Wc = "Wc";
    public const string PrayerRoom = "PrayerRoom";

    public static readonly string[] All =
    [
        Wifi, Parking, WheelchairAccess, AccessibleToilet, KidsArea, Library, Cafe, Wc, PrayerRoom
    ];

    public static bool IsKnown(string? value) =>
        All.Any(a => string.Equals(a, value, StringComparison.OrdinalIgnoreCase));

    public static string Canonical(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return string.Empty;
        return All.FirstOrDefault(a => string.Equals(a, value, StringComparison.OrdinalIgnoreCase)) ?? string.Empty;
    }

    public static IReadOnlyList<string> CanonicalList(IEnumerable<string>? values)
    {
        if (values == null)
            return [];
        return values
            .Select(Canonical)
            .Where(v => v.Length > 0)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }
}

public static class PlaceOpenStatuses
{
    public const string Open = "Open";
    public const string Closed = "Closed";
    public const string Unknown = "Unknown";
}
