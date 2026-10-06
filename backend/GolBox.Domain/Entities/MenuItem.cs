using System;
using System.Collections.Generic;
using GolBox.Domain.Common;

namespace GolBox.Domain.Entities;

public class MenuItem : BaseEntity
{
    public Guid CafeId { get; set; }
    public Guid? CategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string? ImageUrl { get; set; }
    public bool IsActive { get; set; } = true;
    public int DisplayOrder { get; set; }
    public DateTime? PublishedAt { get; set; }

    public int? MinAge { get; set; }
    public int? MaxAge { get; set; }
    public string? RequiredEducation { get; set; }

    // JSON / Text fallback for fast queries
    public string? IngredientsJson { get; set; }
    public string? AllergensJson { get; set; }
    public string? OptionsJson { get; set; }

    // Navigations
    public virtual Cafe Cafe { get; set; } = null!;
    public virtual CafeCategory? Category { get; set; }
    public virtual ICollection<ProductIngredient> ProductIngredients { get; set; } = new List<ProductIngredient>();
    public virtual ICollection<ProductAllergen> ProductAllergens { get; set; } = new List<ProductAllergen>();
    public virtual ICollection<ProductOptionGroup> OptionGroups { get; set; } = new List<ProductOptionGroup>();
    public virtual ICollection<ProductRelation> ProductRelations { get; set; } = new List<ProductRelation>();
    public virtual ICollection<BranchProduct> BranchAvailabilities { get; set; } = new List<BranchProduct>();
}
