using System;

namespace GolBox.Application.Interfaces;

public interface ICurrentUserService
{
    Guid? UserId { get; }
    string? Email { get; }
    string? Role { get; }
    bool IsAuthenticated { get; }
    bool IsAdmin { get; }
    bool IsStaff { get; }
    bool IsStaffOrAdmin { get; }
    bool IsCitizen { get; }
    bool CanAccessUser(Guid resourceUserId);
}
