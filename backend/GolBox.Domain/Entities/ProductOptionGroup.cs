using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using GolBox.Domain.Common;

namespace GolBox.Domain.Entities;

public class ProductOptionGroup : BaseEntity
{
    public Guid MenuItemId { get; set; }
    public string Name { get; set; } = string.Empty; // e.g. "Boyut", "Süt Tercihi"
    public string SelectionType { get; set; } = "SINGLE"; // "SINGLE", "MULTI"
    public bool Required { get; set; } = true;
    public int MinSelections { get; set; } = 1;
    public int MaxSelections { get; set; } = 1;
    public int DisplayOrder { get; set; }

    [NotMapped]
    public bool IsRequired { get => Required; set => Required = value; }
    [NotMapped]
    public int MinSelect { get => MinSelections; set => MinSelections = value; }
    [NotMapped]
    public int MaxSelect { get => MaxSelections; set => MaxSelections = value; }

    public virtual MenuItem MenuItem { get; set; } = null!;
    public virtual ICollection<ProductOption> Options { get; set; } = new List<ProductOption>();
}
