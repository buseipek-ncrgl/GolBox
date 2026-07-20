using System;
using System.Collections.Generic;
using GolBox.Domain.Common;

namespace GolBox.Domain.Entities;

public class CafeCategory : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
    public Guid OrganizationId { get; set; }

    // Navigations
    public virtual Organization Organization { get; set; } = null!;
    public virtual ICollection<Cafe> Cafes { get; set; } = new List<Cafe>();
}
