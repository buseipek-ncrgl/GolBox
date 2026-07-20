using System;
using System.Collections.Generic;
using GolBox.Domain.Common;

namespace GolBox.Domain.Entities;

public class Order : BaseEntity
{
    public Guid UserId { get; set; }
    public Guid CafeId { get; set; }
    public decimal TotalAmount { get; set; }
    public bool PaidWithPoints { get; set; }
    public int PointsUsed { get; set; }
    public string Status { get; set; } = "Pending"; // Pending, Preparing, Ready, Completed, Cancelled
    public string CollectionCode { get; set; } = string.Empty;
    public Guid OrganizationId { get; set; }
    public string? ImageUrl { get; set; }

    // Navigations
    public virtual User User { get; set; } = null!;
    public virtual Cafe Cafe { get; set; } = null!;
    public virtual Organization Organization { get; set; } = null!;
    public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
}
