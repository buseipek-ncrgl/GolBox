using System;
using GolBox.Domain.Common;

namespace GolBox.Domain.Entities;

public class MenuItem : BaseEntity
{
  public Guid CafeId { get; set; }
  public string Name { get; set; } = string.Empty;
  public string Description { get; set; } = string.Empty;
  public decimal Price { get; set; }
  public string? ImageUrl { get; set; }
  public bool IsActive { get; set; } = true;
  public int? MinAge { get; set; }
  public int? MaxAge { get; set; }
  public string? RequiredEducation { get; set; }

  // Navigations
  public virtual Cafe Cafe { get; set; } = null!;
}
