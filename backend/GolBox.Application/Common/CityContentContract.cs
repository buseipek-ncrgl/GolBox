namespace GolBox.Application.Common;

public static class CityContentTypes
{
    public const string Hero = "Hero";
    public const string Announcement = "Announcement";
    public const string EventPromo = "EventPromo";
    public const string MayorMessage = "MayorMessage";
    public const string Campaign = "Campaign";
    public const string Institutional = "Institutional";

    public static readonly string[] All =
    [
        Hero, Announcement, EventPromo, MayorMessage, Campaign, Institutional
    ];

    public static bool IsKnown(string? value) =>
        All.Any(t => string.Equals(t, value, StringComparison.OrdinalIgnoreCase));

    public static string Canonical(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return Announcement;
        var match = All.FirstOrDefault(t => string.Equals(t, value, StringComparison.OrdinalIgnoreCase));
        return match ?? Announcement;
    }
}

public static class AudienceTypes
{
    public const string Everyone = "Everyone";
    public const string LoggedIn = "LoggedIn";
    public const string AgeRange = "AgeRange";
    public const string EducationLevel = "EducationLevel";

    public static readonly string[] All = [Everyone, LoggedIn, AgeRange, EducationLevel];

    public static bool IsKnown(string? value) =>
        All.Any(t => string.Equals(t, value, StringComparison.OrdinalIgnoreCase));

    public static string Canonical(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return Everyone;
        var match = All.FirstOrDefault(t => string.Equals(t, value, StringComparison.OrdinalIgnoreCase));
        return match ?? Everyone;
    }
}

public static class ContentCtaTypes
{
    public const string None = "None";
    public const string ExternalUrl = "ExternalUrl";
    public const string InternalRoute = "InternalRoute";
    public const string Activity = "Activity";
    public const string Cafe = "Cafe";
    public const string Place = "Place";
    public const string RewardCatalog = "RewardCatalog";
    public const string Map = "Map";
    public const string Profile = "Profile";

    public static readonly string[] All =
    [
        None, ExternalUrl, InternalRoute, Activity, Cafe, Place, RewardCatalog, Map, Profile
    ];

    public static readonly string[] InternalRoutes =
    [
        "home", "map", "qr", "profile", "catalog", "coupons", "cafes", "places", "earn"
    ];

    public static readonly string[] ExternalHosts =
    [
        "sehitkamil.bel.tr",
        "www.sehitkamil.bel.tr",
        "gaziantep.bel.tr",
        "www.gaziantep.bel.tr"
    ];

    public static bool IsKnown(string? value) =>
        All.Any(t => string.Equals(t, value, StringComparison.OrdinalIgnoreCase));

    public static string Canonical(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return None;
        var match = All.FirstOrDefault(t => string.Equals(t, value, StringComparison.OrdinalIgnoreCase));
        return match ?? None;
    }

    public static bool IsAllowedInternalRoute(string? route) =>
        !string.IsNullOrWhiteSpace(route) &&
        InternalRoutes.Any(r => string.Equals(r, route.Trim(), StringComparison.OrdinalIgnoreCase));
}

public static class NotificationTargetGroups
{
    public const string All = "All";
    public const string AgeRange = "AgeRange";
    public const string EducationLevel = "EducationLevel";
    public const string SingleUser = "SingleUser";
    public const string HighSchool = "HighSchool";
    public const string University = "University";
}

public static class NotificationTargetTypes
{
    public const string None = "None";
    public const string Content = "Content";
    public const string Activity = "Activity";
    public const string Cafe = "Cafe";
    public const string Place = "Place";
    public const string Route = "Route";
    public const string ExternalUrl = "ExternalUrl";

    public static readonly string[] All =
    [
        None, Content, Activity, Cafe, Place, Route, ExternalUrl
    ];

    public static bool IsKnown(string? value) =>
        string.IsNullOrWhiteSpace(value) ||
        All.Any(t => string.Equals(t, value, StringComparison.OrdinalIgnoreCase));

    public static string Canonical(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return None;
        var match = All.FirstOrDefault(t => string.Equals(t, value, StringComparison.OrdinalIgnoreCase));
        return match ?? None;
    }
}

public static class AdminContentStatuses
{
    public const string Draft = "Draft";
    public const string Published = "Published";
    public const string Scheduled = "Scheduled";
    public const string Expired = "Expired";
}

public record AudienceContext(bool IsAuthenticated, int? Age, string? EducationLevel);

public record PagedResult<T>(IReadOnlyList<T> Items, int Page, int PageSize, int TotalCount);
