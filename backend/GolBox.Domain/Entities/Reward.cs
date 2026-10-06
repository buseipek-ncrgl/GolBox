using System;
using System.Collections.Generic;
using GolBox.Domain.Common;

namespace GolBox.Domain.Entities;

public class Reward : BaseEntity
{
    public Guid OrganizationId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int RequiredPoints { get; set; }
    public string Status { get; set; } = "Active"; // Active, Passive, Deleted
    public string? ImageUrl { get; set; }
    public int? TotalStock { get; set; }
    public int IssuedCount { get; set; }
    public int PerUserLimit { get; set; } = 1;
    public int? MinAge { get; set; }
    public string? RequiredEducation { get; set; }

    // Navigations
    public virtual Organization Organization { get; set; } = null!;
    public virtual ICollection<UserReward> UserRewards { get; set; } = new List<UserReward>();
}
