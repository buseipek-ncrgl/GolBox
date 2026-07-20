using System;
using GolBox.Domain.Common;

namespace GolBox.Domain.Entities;

public class Cafe : BaseEntity
{
    public Guid OrganizationId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public decimal Latitude { get; set; }
    public decimal Longitude { get; set; }
    public Guid CategoryId { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigations
    public virtual Organization Organization { get; set; } = null!;
    public virtual CafeCategory Category { get; set; } = null!;
}
