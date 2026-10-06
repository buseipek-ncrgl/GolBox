using System;
using GolBox.Domain.Common;

namespace GolBox.Domain.Entities;

public class BranchSpecialHours : BaseEntity
{
    public Guid CafeId { get; set; }
    public DateTime Date { get; set; }
    public bool IsClosed { get; set; }
    public string? OpenTime { get; set; }
    public string? CloseTime { get; set; }
    public string? Reason { get; set; }

    public virtual Cafe Cafe { get; set; } = null!;
}
