using System;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using GolBox.Application.Common;
using GolBox.Application.Interfaces;

namespace GolBox.Api.Services;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    private ClaimsPrincipal? Principal => _httpContextAccessor.HttpContext?.User;

    public Guid? UserId
    {
        get
        {
            var userIdClaim = Principal?.FindFirstValue(ClaimTypes.NameIdentifier)
                              ?? Principal?.FindFirstValue("sub");

            if (Guid.TryParse(userIdClaim, out var parsedGuid))
                return parsedGuid;

            return null;
        }
    }

    public string? Email =>
        Principal?.FindFirstValue(ClaimTypes.Email)
        ?? Principal?.FindFirstValue("email");

    public string? Role => Principal?.FindFirstValue(ClaimTypes.Role);

    public bool IsAuthenticated => Principal?.Identity?.IsAuthenticated == true;

    public bool IsAdmin => RoleMatrix.IsAdmin(Role);

    public bool IsStaff => RoleMatrix.IsStaff(Role);

    public bool IsStaffOrAdmin => RoleMatrix.IsStaffOrAdmin(Role);

    public bool IsCitizen => RoleMatrix.IsCitizen(Role);

    public bool CanAccessUser(Guid resourceUserId) =>
        IsStaffOrAdmin || (UserId.HasValue && UserId.Value == resourceUserId);
}
