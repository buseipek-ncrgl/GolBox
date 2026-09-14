using System;
using GolBox.Domain.Common;

namespace GolBox.Domain.Entities;

public class PlaceImage : BaseEntity
{
    public Guid PlaceId { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public string? AltText { get; set; }
    public int SortOrder { get; set; }
    public bool IsCover { get; set; }

    public virtual Place Place { get; set; } = null!;
}
