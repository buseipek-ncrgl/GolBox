using System;
using GolBox.Domain.Common;

namespace GolBox.Domain.Entities;

public class AuditLog : BaseEntity
{
    public Guid? UserId { get; set; }
    public string UserEmail { get; set; } = string.Empty;
    public string UserRole { get; set; } = string.Empty;
    public string ActionType { get; set; } = string.Empty; // Create, Update, StatusChange, AdjustPoints, Login, etc.
    public string ModuleName { get; set; } = string.Empty; // Users, Cafes, MenuItems, Orders, Points, Staff, Settings
    public string EntityName { get; set; } = string.Empty;
    public string? EntityId { get; set; }
    public string? OldValues { get; set; }
    public string? NewValues { get; set; }
    public string? Reason { get; set; }
    public string? IpAddress { get; set; }
}
