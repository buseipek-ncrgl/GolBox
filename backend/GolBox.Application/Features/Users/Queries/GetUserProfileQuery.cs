using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using GolBox.Application.Common;
using GolBox.Application.Interfaces;

namespace GolBox.Application.Features.Users.Queries;

public record GetUserProfileQuery : IRequest<Result<UserProfileDto>>;

public record UserProfileDto(
    Guid Id,
    string Email,
    string? PhoneNumber,
    string FirstName,
    string LastName,
    string? ProfileImageUrl,
    int PointsBalance,
    OrganizationDto Organization
);

public record OrganizationDto(
    Guid Id,
    string Name,
    string ThemeColor,
    string? LogoUrl
);

public class GetUserProfileQueryHandler : IRequestHandler<GetUserProfileQuery, Result<UserProfileDto>>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetUserProfileQueryHandler(IAppDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<Result<UserProfileDto>> Handle(GetUserProfileQuery request, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUserService.UserId;
        if (currentUserId == null || currentUserId == Guid.Empty)
        {
            return Result<UserProfileDto>.Fail("Kullanıcı kimliği doğrulanamadı.");
        }

        var user = await _context.Users
            .Include(u => u.Organization)
            .FirstOrDefaultAsync(u => u.Id == currentUserId.Value, cancellationToken);

        if (user == null)
        {
            return Result<UserProfileDto>.Fail("Kullanıcı bulunamadı.");
        }

        var profileDto = new UserProfileDto(
            user.Id,
            user.Email,
            user.PhoneNumber,
            user.FirstName,
            user.LastName,
            user.ProfileImageUrl,
            user.PointsBalance,
            new OrganizationDto(
                user.Organization.Id,
                user.Organization.Name,
                user.Organization.ThemeColor,
                user.Organization.LogoUrl
            )
        );

        return Result<UserProfileDto>.Ok(profileDto, "Kullanıcı profili başarıyla getirildi.");
    }
}
