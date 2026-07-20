using System;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using GolBox.Application.Interfaces;

namespace GolBox.Infrastructure.Services;

public class TokenDecoder : ITokenDecoder
{
    public Guid? GetUserIdFromToken(string token)
    {
        try
        {
            var handler = new JwtSecurityTokenHandler();
            if (!handler.CanReadToken(token)) return null;

            var jsonToken = handler.ReadToken(token) as JwtSecurityToken;
            var subClaim = jsonToken?.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Sub)?.Value;
            
            if (subClaim != null && Guid.TryParse(subClaim, out var userId))
            {
                return userId;
            }
        }
        catch
        {
            // Return null if token cannot be parsed
        }
        return null;
    }
}
