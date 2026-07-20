using System;
using System.Collections.Generic;
using GolBox.Domain.Common;

namespace GolBox.Domain.Entities;

public class Task : BaseEntity
{
    public Guid OrganizationId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int PointsReward { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int MaxCompletions { get; set; } = 1; // Default 1 completion per user
    public string Status { get; set; } = "Active"; // Active, Passive, Draft

    // Navigations
    public virtual Organization Organization { get; set; } = null!;
    public virtual ICollection<UserTask> UserTasks { get; set; } = new List<UserTask>();
}
