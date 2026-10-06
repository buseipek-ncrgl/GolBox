using System;
using GolBox.Domain.Common;

namespace GolBox.Domain.Entities;

public class ProductIngredient : BaseEntity
{
    public Guid MenuItemId { get; set; }
    public Guid IngredientId { get; set; }

    public virtual MenuItem MenuItem { get; set; } = null!;
    public virtual Ingredient Ingredient { get; set; } = null!;
}
