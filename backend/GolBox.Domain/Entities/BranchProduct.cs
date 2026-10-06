using System;
using GolBox.Domain.Common;

namespace GolBox.Domain.Entities;

public class BranchProduct : BaseEntity
{
    public Guid CafeId { get; set; }
    public Guid MenuItemId { get; set; }
    public bool IsAvailable { get; set; } = true;

    public virtual Cafe Cafe { get; set; } = null!;
    public virtual MenuItem MenuItem { get; set; } = null!;
}
