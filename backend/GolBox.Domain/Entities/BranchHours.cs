using System;
using GolBox.Domain.Common;

namespace GolBox.Domain.Entities;

public class BranchHours : BaseEntity
{
    public Guid CafeId { get; set; }
    public int DayOfWeek { get; set; } // 0 = Sunday, 1 = Monday ... 6 = Saturday
    public bool IsClosed { get; set; }
    public string OpenTime { get; set; } = "08:00";
    public string CloseTime { get; set; } = "22:00";

    public virtual Cafe Cafe { get; set; } = null!;
}
