using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using GolBox.Application.Common;
using GolBox.Application.Interfaces;

namespace GolBox.Application.Features.Users.Commands;

public record UpdateUserProfileCommand(
    string FirstName,
    string LastName,
    string? ProfileImageUrl
) : IRequest<Result>;

public class UpdateUserProfileCommandHandler : IRequestHandler<UpdateUserProfileCommand, Result>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public UpdateUserProfileCommandHandler(IAppDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<Result> Handle(UpdateUserProfileCommand request, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUserService.UserId;
        if (currentUserId == null || currentUserId == Guid.Empty)
        {
            return Result.Fail("Kullanıcı kimliği doğrulanamadı.");
        }

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == currentUserId.Value, cancellationToken);

        if (user == null)
        {
            return Result.Fail("Kullanıcı bulunamadı.");
        }

        user.FirstName = request.FirstName;
        user.LastName = request.LastName;
        if (request.ProfileImageUrl != null)
        {
            user.ProfileImageUrl = request.ProfileImageUrl;
        }

        await _context.SaveChangesAsync(cancellationToken);

        return Result.Ok("Profil başarıyla güncellendi.");
    }
}
