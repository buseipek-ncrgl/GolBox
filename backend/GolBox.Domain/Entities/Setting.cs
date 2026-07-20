using System;
using GolBox.Domain.Common;

namespace GolBox.Domain.Entities;

public class Setting : BaseEntity
{
    public Guid OrganizationId { get; set; }
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string? Description { get; set; }

    // Navigations
    public virtual Organization Organization { get; set; } = null!;
}
