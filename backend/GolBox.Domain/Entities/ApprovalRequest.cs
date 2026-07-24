using System;
using GolBox.Domain.Common;

namespace GolBox.Domain.Entities;

public class ApprovalRequest : BaseEntity
{
    public string RequestType { get; set; } = string.Empty; // HighPointAdjustment, OrderRefund, CouponReactivation, MajorPriceEdit, MassNotification, RoleElevation, SettingChange
    public Guid RequesterUserId { get; set; }
    public string RequesterEmail { get; set; } = string.Empty;
    public Guid? BranchId { get; set; }
    public string? TargetEntityId { get; set; }
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending"; // Pending, Approved, Rejected, RevisionRequested
    public Guid? ApproverUserId { get; set; }
    public string? ApproverEmail { get; set; }
    public string? ApprovalNote { get; set; }
}
