using System;
using System.Collections.Generic;
using GolBox.Domain.Common;

namespace GolBox.Domain.Entities;

public class Activity : BaseEntity
{
    public Guid OrganizationId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int PointsReward { get; set; }
    public string Location { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string Status { get; set; } = "Active"; // Active, Cancelled, Completed

    // Navigations
    public virtual Organization Organization { get; set; } = null!;
    public virtual ICollection<UserActivity> UserActivities { get; set; } = new List<UserActivity>();
}
