using System;
using GolBox.Domain.Common;

namespace GolBox.Domain.Entities;

public class UserFieldCapture : BaseEntity
{
    public Guid OrganizationId { get; set; }
    public Guid FieldDropId { get; set; }
    public Guid UserId { get; set; }
    public decimal CapturedLatitude { get; set; }
    public decimal CapturedLongitude { get; set; }
    public double? AccuracyMeters { get; set; }
    public int PointsGranted { get; set; }
    public double DistanceMeters { get; set; }

    public virtual FieldDrop FieldDrop { get; set; } = null!;
    public virtual User User { get; set; } = null!;
}
