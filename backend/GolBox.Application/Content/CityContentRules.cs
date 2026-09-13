using GolBox.Application.Common;
using GolBox.Domain.Entities;

namespace GolBox.Application.Content;

public static class CityContentRules
{
    public const int HeroMaxCount = 8;
    public const int AgendaDefaultPageSize = 12;
    public const int MaxPageSize = 50;

    public static bool IsLive(CityContent content, DateTime utcNow)
    {
        if (content.IsDeleted || !content.IsPublished)
            return false;
        if (content.StartAt > utcNow)
            return false;
        if (content.EndAt.HasValue && content.EndAt.Value < utcNow)
            return false;
        return true;
    }

    public static bool MatchesAudience(CityContent content, AudienceContext? audience)
    {
        var type = AudienceTypes.Canonical(content.AudienceType);
        if (type == AudienceTypes.Everyone)
            return true;

        if (audience is null || !audience.IsAuthenticated)
            return false;

        if (type == AudienceTypes.LoggedIn)
            return true;

        if (type == AudienceTypes.AgeRange)
        {
            if (!audience.Age.HasValue)
                return false;
            if (content.AudienceMinAge.HasValue && audience.Age.Value < content.AudienceMinAge.Value)
                return false;
            if (content.AudienceMaxAge.HasValue && audience.Age.Value > content.AudienceMaxAge.Value)
                return false;
            return true;
        }

        if (type == AudienceTypes.EducationLevel)
            return EducationMatches(content.AudienceEducationLevel, audience.EducationLevel);

        return false;
    }

    public static bool EducationMatches(string? required, string? userLevel)
    {
        if (string.IsNullOrWhiteSpace(required))
            return true;
        if (string.IsNullOrWhiteSpace(userLevel))
            return false;
        return string.Equals(NormalizeEducation(required), NormalizeEducation(userLevel), StringComparison.OrdinalIgnoreCase);
    }

    public static string NormalizeEducation(string value)
    {
        var trimmed = value.Trim();
        if (trimmed.Equals("HighSchool", StringComparison.OrdinalIgnoreCase) ||
            trimmed.Equals("Lise", StringComparison.OrdinalIgnoreCase))
            return "Lise";
        if (trimmed.Equals("University", StringComparison.OrdinalIgnoreCase) ||
            trimmed.Equals("Universite", StringComparison.OrdinalIgnoreCase) ||
            trimmed.Equals("Üniversite", StringComparison.OrdinalIgnoreCase))
            return "Üniversite";
        return trimmed;
    }

    public static string AdminStatus(CityContent content, DateTime utcNow)
    {
        if (!content.IsPublished)
            return AdminContentStatuses.Draft;
        if (content.StartAt > utcNow)
            return AdminContentStatuses.Scheduled;
        if (content.EndAt.HasValue && content.EndAt.Value < utcNow)
            return AdminContentStatuses.Expired;
        return AdminContentStatuses.Published;
    }

    public static IQueryable<CityContent> WhereLive(IQueryable<CityContent> query, Guid organizationId, DateTime utcNow) =>
        query.Where(c =>
            c.OrganizationId == organizationId &&
            c.IsPublished &&
            c.StartAt <= utcNow &&
            (c.EndAt == null || c.EndAt >= utcNow));

    public static IEnumerable<CityContent> FilterAudience(IEnumerable<CityContent> items, AudienceContext? audience) =>
        items.Where(item => MatchesAudience(item, audience));
}
