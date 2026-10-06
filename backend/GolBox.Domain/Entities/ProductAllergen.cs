using System;
using GolBox.Domain.Common;

namespace GolBox.Domain.Entities;

public class ProductAllergen : BaseEntity
{
    public Guid MenuItemId { get; set; }
    public Guid AllergenId { get; set; }

    public virtual MenuItem MenuItem { get; set; } = null!;
    public virtual Allergen Allergen { get; set; } = null!;
}
