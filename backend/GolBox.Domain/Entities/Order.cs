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
    public string Status { get; set; } = "Pending"; // Pending, Confirmed, Preparing, Ready, Completed, Cancelled
    public string? PaymentStatus { get; set; } = "UNPAID"; // UNPAID, PAID
    public string? PaymentMethod { get; set; } = "PAY_AT_BRANCH";
    public string CollectionCode { get; set; } = string.Empty;
    public Guid OrganizationId { get; set; }
    public string? ImageUrl { get; set; }

    public DateTime? ConfirmedAt { get; set; }
    public DateTime? PreparingAt { get; set; }
    public DateTime? ReadyAt { get; set; }
    public DateTime? PaidAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? CancelledAt { get; set; }
    public string? CancellationReason { get; set; }

    // Navigations
    public virtual User User { get; set; } = null!;
    public virtual Cafe Cafe { get; set; } = null!;
    public virtual Organization Organization { get; set; } = null!;
    public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
}
