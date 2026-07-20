using System;
using GolBox.Domain.Common;

namespace GolBox.Domain.Entities;

public class QrPayment : BaseEntity
{
    public Guid UserId { get; set; }
    public Guid CafeId { get; set; }
    public decimal Amount { get; set; }
    public bool PaidWithPoints { get; set; }
    public int PointsDeducted { get; set; }
    public string Status { get; set; } = "Pending"; // Pending, Completed, Failed
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public Guid OrganizationId { get; set; }

    // Navigations
    public virtual User User { get; set; } = null!;
    public virtual Cafe Cafe { get; set; } = null!;
    public virtual Organization Organization { get; set; } = null!;
}
