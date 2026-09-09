using System;
using GolBox.Domain.Common;

namespace GolBox.Domain.Entities;

public class FieldDrop : BaseEntity
{
    public Guid OrganizationId { get; set; }
    public Guid? CafeId { get; set; }
    public Guid? CatalogRewardId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Latitude { get; set; }
    public decimal Longitude { get; set; }
    public int RadiusMeters { get; set; } = 40;
    public int PointsGranted { get; set; }
    public int? TotalStock { get; set; }
    public int CapturedCount { get; set; }
    public int PerUserLimit { get; set; } = 1;
    public DateTime StartsAt { get; set; } = DateTime.UtcNow;
    public DateTime EndsAt { get; set; } = DateTime.UtcNow.AddDays(30);
    public string? ImageUrl { get; set; }
    public string? ModelGlbUrl { get; set; }
    public bool IsActive { get; set; } = true;

    public virtual Organization Organization { get; set; } = null!;
    public virtual Cafe? Cafe { get; set; }
    public virtual Reward? CatalogReward { get; set; }
}
