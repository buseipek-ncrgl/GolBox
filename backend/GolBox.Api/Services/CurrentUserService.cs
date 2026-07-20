using System;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using GolBox.Application.Interfaces;

namespace GolBox.Api.Services;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid? UserId
    {
        get
        {
            var userIdClaim = _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier) 
                              ?? _httpContextAccessor.HttpContext?.User?.FindFirstValue("sub");

            if (Guid.TryParse(userIdClaim, out var parsedGuid))
            {
                return parsedGuid;
            }

            return null;
        }
    }
}
