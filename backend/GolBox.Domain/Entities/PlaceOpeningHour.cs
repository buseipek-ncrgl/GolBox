using System;
using GolBox.Domain.Common;

namespace GolBox.Domain.Entities;

public class PlaceOpeningHour : BaseEntity
{
    public Guid PlaceId { get; set; }

    /// <summary>0 = Sunday … 6 = Saturday, matching <see cref="DayOfWeek"/>.</summary>
    public int DayOfWeek { get; set; }

    /// <summary>Local Europe/Istanbul clock as HH:mm.</summary>
    public string? OpenTime { get; set; }

    /// <summary>Local Europe/Istanbul clock as HH:mm.</summary>
    public string? CloseTime { get; set; }

    public bool IsClosed { get; set; }

    public virtual Place Place { get; set; } = null!;
}
