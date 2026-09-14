using System;

namespace GolBox.Domain.Entities;

public class PlaceAmenity
{
    public Guid PlaceId { get; set; }
    public string AmenityId { get; set; } = string.Empty;

    public virtual Place Place { get; set; } = null!;
}
