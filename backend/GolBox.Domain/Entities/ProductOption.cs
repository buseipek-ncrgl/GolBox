using System;
using GolBox.Domain.Common;

namespace GolBox.Domain.Entities;

public class ProductOption : BaseEntity
{
    public Guid OptionGroupId { get; set; }
    public string Name { get; set; } = string.Empty; // e.g. "250 ml", "Laktozsuz Süt"
    public decimal PriceModifier { get; set; } // e.g. 0.00, 10.00
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;

    public virtual ProductOptionGroup OptionGroup { get; set; } = null!;
}
