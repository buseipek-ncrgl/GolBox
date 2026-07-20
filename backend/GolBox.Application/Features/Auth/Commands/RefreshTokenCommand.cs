using System;
using System.Collections.Generic;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using GolBox.Application.Common;
using GolBox.Application.DTOs;
using GolBox.Application.Interfaces;
using GolBox.Domain.Entities;

namespace GolBox.Application.Features.Auth.Commands;

public record RefreshTokenCommand(
    string RefreshToken,
    string IpAddress = ""
) : IRequest<Result<AuthDto>>;

public class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, Result<AuthDto>>
{
    private readonly IAppDbContext _context;
    private readonly ITokenService _tokenService;

    public RefreshTokenCommandHandler(IAppDbContext context, ITokenService tokenService)
    {
        _context = context;
        _tokenService = tokenService;
    }

    public async Task<Result<AuthDto>> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
    {
        using var sha256 = SHA256.Create();
        var hashedInputToken = Convert.ToBase64String(sha256.ComputeHash(Encoding.UTF8.GetBytes(request.RefreshToken)));

        var existingToken = await _context.RefreshTokens
            .Include(t => t.User)
            .ThenInclude(u => u.Organization)
            .FirstOrDefaultAsync(t => t.TokenHash == hashedInputToken, cancellationToken);

        if (existingToken == null)
        {
            return Result<AuthDto>.Fail("Geçersiz Refresh Token.");
        }

        if (existingToken.ExpiresAt < DateTime.UtcNow)
        {
            return Result<AuthDto>.Fail("Refresh Token süresi dolmuş. Lütfen tekrar giriş yapın.");
        }

        if (existingToken.RevokedAt != null)
        {
            return Result<AuthDto>.Fail("Bu Refresh Token iptal edilmiş. Güvenlik ihlali şüphesi.");
        }

        var user = existingToken.User;
        var newAccessToken = _tokenService.GenerateAccessToken(user);
        var newRawRefreshToken = _tokenService.GenerateRefreshToken();
        var newHashedRefreshToken = Convert.ToBase64String(sha256.ComputeHash(Encoding.UTF8.GetBytes(newRawRefreshToken)));

        // Create new Refresh Token
        var newRefreshTokenEntity = new RefreshToken
        {
            UserId = user.Id,
            TokenHash = newHashedRefreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedByIp = request.IpAddress
        };

        _context.RefreshTokens.Add(newRefreshTokenEntity);

        // Revoke the old token
        existingToken.RevokedAt = DateTime.UtcNow;
        existingToken.RevokedByIp = request.IpAddress;
        existingToken.ReplacedByToken = newRefreshTokenEntity;

        await _context.SaveChangesAsync(cancellationToken);

        var userDto = new UserDto(
            user.Id,
            user.FirstName,
            user.LastName,
            user.Email,
            user.PointsBalance,
            new List<string> { "User" }
        );

        var authDto = new AuthDto(
            newAccessToken,
            900,
            newRawRefreshToken,
            userDto
        );

        return Result<AuthDto>.Ok(authDto, "Token başarıyla yenilendi.");
    }
}
