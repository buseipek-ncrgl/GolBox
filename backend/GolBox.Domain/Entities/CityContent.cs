using System;
using GolBox.Domain.Common;

namespace GolBox.Domain.Entities;

public class CityContent : BaseEntity
{
    public Guid OrganizationId { get; set; }
    public string Type { get; set; } = "Announcement";
    public string Title { get; set; } = string.Empty;
    public string? Subtitle { get; set; }
    public string? Body { get; set; }
    public string? ImageUrl { get; set; }
    public string? ImageFocus { get; set; }
    public string? CtaLabel { get; set; }
    public string CtaType { get; set; } = "None";
    public string? CtaTarget { get; set; }
    public int Priority { get; set; }
    public DateTime StartAt { get; set; }
    public DateTime? EndAt { get; set; }
    public bool IsPublished { get; set; }
    public string AudienceType { get; set; } = "Everyone";
    public int? AudienceMinAge { get; set; }
    public int? AudienceMaxAge { get; set; }
    public string? AudienceEducationLevel { get; set; }
    public string? AuthorName { get; set; }
    public string? AuthorTitle { get; set; }
    public string? AuthorImageUrl { get; set; }
    public Guid? ActivityId { get; set; }

    public virtual Organization Organization { get; set; } = null!;
    public virtual Activity? Activity { get; set; }
}
