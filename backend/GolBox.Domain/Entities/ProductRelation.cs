using System;
using System.ComponentModel.DataAnnotations.Schema;
using GolBox.Domain.Common;

namespace GolBox.Domain.Entities;

public class ProductRelation : BaseEntity
{
    public Guid SourceProductId { get; set; }
    public Guid TargetProductId { get; set; }
    public string RelationType { get; set; } = "PAIRING";
    public int DisplayOrder { get; set; }

    [ForeignKey("SourceProductId")]
    [InverseProperty("ProductRelations")]
    public virtual MenuItem SourceProduct { get; set; } = null!;

    [ForeignKey("TargetProductId")]
    public virtual MenuItem TargetProduct { get; set; } = null!;
}
