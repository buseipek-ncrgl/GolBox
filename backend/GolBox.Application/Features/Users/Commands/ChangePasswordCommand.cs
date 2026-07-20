using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using GolBox.Application.Common;
using GolBox.Application.Interfaces;

namespace GolBox.Application.Features.Users.Commands;

public record ChangePasswordCommand(
    string OldPassword,
    string NewPassword
) : IRequest<Result>;

public class ChangePasswordCommandHandler : IRequestHandler<ChangePasswordCommand, Result>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IPasswordHasher _passwordHasher;

    public ChangePasswordCommandHandler(IAppDbContext context, ICurrentUserService currentUserService, IPasswordHasher passwordHasher)
    {
        _context = context;
        _currentUserService = currentUserService;
        _passwordHasher = passwordHasher;
    }

    public async Task<Result> Handle(ChangePasswordCommand request, CancellationToken cancellationToken)
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

        if (!_passwordHasher.Verify(request.OldPassword, user.PasswordHash))
        {
            return Result.Fail("Eski şifre hatalı.");
        }

        user.PasswordHash = _passwordHasher.Hash(request.NewPassword);
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Ok("Şifre başarıyla değiştirildi.");
    }
}
