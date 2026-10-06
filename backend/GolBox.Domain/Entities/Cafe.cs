using System;
using GolBox.Domain.Common;

namespace GolBox.Domain.Entities;

public class Cafe : BaseEntity
{
    public Guid OrganizationId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = "Gaziantep";
    public string District { get; set; } = "Şehitkamil";
    public string? PhoneNumber { get; set; }
    public string PickupStatus { get; set; } = "AVAILABLE"; // AVAILABLE, PAUSED, DISABLED
    public DateTime? PickupPausedAt { get; set; }
    public string? PickupPausedBy { get; set; }
    public string? PickupPauseReason { get; set; }
    public decimal Latitude { get; set; }
    public decimal Longitude { get; set; }
    public Guid CategoryId { get; set; }
    public bool IsActive { get; set; } = true;
    public string? ImageUrl { get; set; }

    public Guid? PlaceId { get; set; }

    // Navigations
    public virtual Organization Organization { get; set; } = null!;
    public virtual CafeCategory Category { get; set; } = null!;
    public virtual Place? Place { get; set; }
}
