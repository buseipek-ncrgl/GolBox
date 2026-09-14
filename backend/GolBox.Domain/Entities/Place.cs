using System;
using System.Collections.Generic;
using GolBox.Domain.Common;

namespace GolBox.Domain.Entities;

public class Place : BaseEntity
{
    public Guid OrganizationId { get; set; }

    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Category { get; set; } = "Other";

    public string? ShortDescription { get; set; }
    public string? Description { get; set; }

    public string? Address { get; set; }
    public string? District { get; set; }
    public string? Neighborhood { get; set; }

    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }

    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? WebsiteUrl { get; set; }

    public string? CoverImageUrl { get; set; }

    public bool IsActive { get; set; } = true;
    public bool IsPublished { get; set; }
    public int SortOrder { get; set; }

    public bool? WheelchairAccessible { get; set; }
    public bool? AccessibleToilet { get; set; }

    public string SearchNormalized { get; set; } = string.Empty;

    public virtual Organization Organization { get; set; } = null!;
    public virtual ICollection<PlaceImage> Images { get; set; } = new List<PlaceImage>();
    public virtual ICollection<PlaceOpeningHour> OpeningHours { get; set; } = new List<PlaceOpeningHour>();
    public virtual ICollection<PlaceAmenity> Amenities { get; set; } = new List<PlaceAmenity>();
    public virtual ICollection<Cafe> Cafes { get; set; } = new List<Cafe>();
    public virtual ICollection<Activity> Activities { get; set; } = new List<Activity>();
}
