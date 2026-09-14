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

public record LoginCommand(
    string Email,
    string Password,
    string IpAddress = ""
) : IRequest<Result<AuthDto>>;

public class LoginCommandHandler : IRequestHandler<LoginCommand, Result<AuthDto>>
{
    private readonly IAppDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ITokenService _tokenService;

    public LoginCommandHandler(IAppDbContext context, IPasswordHasher passwordHasher, ITokenService tokenService)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _tokenService = tokenService;
    }

    public async Task<Result<AuthDto>> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .Include(u => u.Organization)
            .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower(), cancellationToken);

        if (user == null)
        {
            return Result<AuthDto>.Fail("Geçersiz e-posta adresi veya şifre.");
        }

        if (!_passwordHasher.Verify(request.Password, user.PasswordHash))
        {
            return Result<AuthDto>.Fail("Geçersiz e-posta adresi veya şifre.");
        }

        var staffProfile = await _context.StaffUsers.FirstOrDefaultAsync(s => s.UserId == user.Id, cancellationToken);
        if (staffProfile != null && !staffProfile.IsActive)
            return Result<AuthDto>.Fail("Hesabınız pasif. Yönetici ile iletişime geçin.");

        if (user.Role is "Admin" or "Staff")
        {
            if (staffProfile == null)
            {
                staffProfile = new StaffUser
                {
                    Id = Guid.NewGuid(),
                    UserId = user.Id,
                    RegistrationNumber = "",
                    Role = user.Role,
                    IsActive = true,
                    CreatedDate = DateTime.UtcNow
                };
                _context.StaffUsers.Add(staffProfile);
            }
            staffProfile.LastLoginDate = DateTime.UtcNow;
        }

        var accessToken = _tokenService.GenerateAccessToken(user);
        var rawRefreshToken = _tokenService.GenerateRefreshToken();

        // SHA256 Hash for Refresh Token
        using var sha256 = SHA256.Create();
        var hashedRefreshToken = Convert.ToBase64String(sha256.ComputeHash(Encoding.UTF8.GetBytes(rawRefreshToken)));

        var refreshTokenEntity = new RefreshToken
        {
            UserId = user.Id,
            TokenHash = hashedRefreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(7), // Refresh token: 7 days
            CreatedByIp = request.IpAddress
        };

        _context.RefreshTokens.Add(refreshTokenEntity);
        await _context.SaveChangesAsync(cancellationToken);

        var userDto = new UserDto(
            user.Id,
            user.FirstName,
            user.LastName,
            user.Email,
            user.PointsBalance,
            new List<string> { string.IsNullOrWhiteSpace(user.Role) ? "User" : user.Role }
        );

        var authDto = new AuthDto(
            accessToken,
            28800, // 8 hours in seconds, matches Jwt:ExpiresMinutes
            rawRefreshToken,
            userDto
        );

        return Result<AuthDto>.Ok(authDto, "Giriş başarılı.");
    }
}
