using System;
using GolBox.Domain.Common;

namespace GolBox.Domain.Entities;

public class RefreshToken : BaseEntity
{
    public Guid UserId { get; set; }
    public string TokenHash { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public string CreatedByIp { get; set; } = string.Empty;
    public DateTime? RevokedAt { get; set; }
    public string? RevokedByIp { get; set; }
    public Guid? ReplacedByTokenId { get; set; }

    // Navigations
    public virtual User User { get; set; } = null!;
    public virtual RefreshToken? ReplacedByToken { get; set; }
}
