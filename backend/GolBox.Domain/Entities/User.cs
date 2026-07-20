using System;
using System.Collections.Generic;
using GolBox.Domain.Common;

namespace GolBox.Domain.Entities;

public class User : BaseEntity
{
    public Guid OrganizationId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string NormalizedEmail { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string PasswordHash { get; set; } = string.Empty;
    public bool EmailConfirmed { get; set; }
    public bool PhoneNumberConfirmed { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? ProfileImageUrl { get; set; }
    public int PointsBalance { get; set; } = 0;
    public int? Age { get; set; }
    public string? EducationLevel { get; set; }

    // Navigations
    public virtual Organization Organization { get; set; } = null!;
    public virtual ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
}
