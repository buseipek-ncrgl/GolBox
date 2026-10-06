using System;
using GolBox.Domain.Common;

namespace GolBox.Domain.Entities;

public class OrderItem : BaseEntity
{
    public Guid OrderId { get; set; }
    public Guid MenuItemId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }

    // Historical Immutable Snapshot Fields
    public string? ProductName { get; set; }
    public string? SelectedOptionsJson { get; set; }
    public decimal OptionPricesSum { get; set; }
    public decimal FinalUnitPrice { get; set; }

    // Navigations
    public virtual Order Order { get; set; } = null!;
    public virtual MenuItem MenuItem { get; set; } = null!;
}
