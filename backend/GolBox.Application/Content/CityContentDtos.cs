using GolBox.Application.Common;
using GolBox.Domain.Entities;

namespace GolBox.Application.Content;

public record CityContentPublicDto(
    Guid Id,
    string Type,
    string Title,
    string? Subtitle,
    string? Body,
    string? ImageUrl,
    string? ImageFocus,
    string? CtaLabel,
    string CtaType,
    string? CtaTarget,
    int Priority,
    DateTime StartAt,
    DateTime? EndAt,
    string? AuthorName,
    string? AuthorTitle,
    string? AuthorImageUrl,
    Guid? ActivityId,
    string CategoryLabel,
    string? Meta
);

public record CityContentAdminDto(
    Guid Id,
    string Type,
    string Title,
    string? Subtitle,
    string? Body,
    string? ImageUrl,
    string? ImageFocus,
    string? CtaLabel,
    string CtaType,
    string? CtaTarget,
    int Priority,
    DateTime StartAt,
    DateTime? EndAt,
    bool IsPublished,
    string Status,
    string AudienceType,
    int? AudienceMinAge,
    int? AudienceMaxAge,
    string? AudienceEducationLevel,
    string? AuthorName,
    string? AuthorTitle,
    string? AuthorImageUrl,
    Guid? ActivityId,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);

public class UpsertCityContentRequest
{
    public string Type { get; set; } = CityContentTypes.Announcement;
    public string Title { get; set; } = string.Empty;
    public string? Subtitle { get; set; }
    public string? Body { get; set; }
    public string? ImageUrl { get; set; }
    public string? ImageFocus { get; set; }
    public string? CtaLabel { get; set; }
    public string CtaType { get; set; } = ContentCtaTypes.None;
    public string? CtaTarget { get; set; }
    public int Priority { get; set; }
    public DateTime StartAt { get; set; } = DateTime.UtcNow;
    public DateTime? EndAt { get; set; }
    public bool IsPublished { get; set; }
    public string AudienceType { get; set; } = AudienceTypes.Everyone;
    public int? AudienceMinAge { get; set; }
    public int? AudienceMaxAge { get; set; }
    public string? AudienceEducationLevel { get; set; }
    public string? AuthorName { get; set; }
    public string? AuthorTitle { get; set; }
    public string? AuthorImageUrl { get; set; }
    public Guid? ActivityId { get; set; }
}

public static class CityContentMapper
{
    public static string CategoryLabel(string type) => CityContentTypes.Canonical(type) switch
    {
        CityContentTypes.Hero => "Duyuru",
        CityContentTypes.Announcement => "Duyuru",
        CityContentTypes.EventPromo => "Etkinlik",
        CityContentTypes.MayorMessage => "Başkan’dan",
        CityContentTypes.Campaign => "Kampanya",
        CityContentTypes.Institutional => "Kurumsal",
        _ => "Duyuru"
    };

    public static string? FormatMeta(CityContent content)
    {
        if (content.StartAt == default)
            return null;
        var start = content.StartAt.ToLocalTime();
        if (content.EndAt.HasValue)
        {
            var end = content.EndAt.Value.ToLocalTime();
            if (start.Date == end.Date)
                return start.ToString("d MMMM", new System.Globalization.CultureInfo("tr-TR"));
            return $"{start:d MMM} – {end:d MMM}";
        }
        return start.ToString("d MMMM", new System.Globalization.CultureInfo("tr-TR"));
    }

    public static CityContentPublicDto ToPublic(CityContent content) => new(
        content.Id,
        CityContentTypes.Canonical(content.Type),
        content.Title,
        content.Subtitle,
        content.Body,
        content.ImageUrl,
        content.ImageFocus,
        content.CtaLabel,
        ContentCtaTypes.Canonical(content.CtaType),
        content.CtaTarget,
        content.Priority,
        content.StartAt,
        content.EndAt,
        CityContentTypes.Canonical(content.Type) == CityContentTypes.MayorMessage ? content.AuthorName : null,
        CityContentTypes.Canonical(content.Type) == CityContentTypes.MayorMessage ? content.AuthorTitle : null,
        CityContentTypes.Canonical(content.Type) == CityContentTypes.MayorMessage ? content.AuthorImageUrl : null,
        content.ActivityId,
        CategoryLabel(content.Type),
        FormatMeta(content)
    );

    public static CityContentAdminDto ToAdmin(CityContent content, DateTime utcNow) => new(
        content.Id,
        CityContentTypes.Canonical(content.Type),
        content.Title,
        content.Subtitle,
        content.Body,
        content.ImageUrl,
        content.ImageFocus,
        content.CtaLabel,
        ContentCtaTypes.Canonical(content.CtaType),
        content.CtaTarget,
        content.Priority,
        content.StartAt,
        content.EndAt,
        content.IsPublished,
        CityContentRules.AdminStatus(content, utcNow),
        AudienceTypes.Canonical(content.AudienceType),
        content.AudienceMinAge,
        content.AudienceMaxAge,
        content.AudienceEducationLevel,
        content.AuthorName,
        content.AuthorTitle,
        content.AuthorImageUrl,
        content.ActivityId,
        content.CreatedDate,
        content.UpdatedDate
    );
}
