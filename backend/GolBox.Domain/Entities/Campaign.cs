using System;
using GolBox.Domain.Common;

namespace GolBox.Domain.Entities;

public class Campaign : BaseEntity
{
    public Guid OrganizationId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public string CampaignType { get; set; } = "FixedBonus"; // FixedBonus, DoublePoints, ProductDiscount, FirstOrderBonus, BranchSpecial, TargetGroupSpecial
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string TargetUserGroup { get; set; } = "All"; // All, HighSchool, University, AgeGroup
    public Guid? CafeId { get; set; }
    public Guid? MenuItemId { get; set; }
    public int? TotalUsageLimit { get; set; }
    public int? PerUserLimit { get; set; }
    public int CurrentUsageCount { get; set; } = 0;
    public bool IsActive { get; set; } = true;
}
