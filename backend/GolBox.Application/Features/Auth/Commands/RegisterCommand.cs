using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using GolBox.Application.Common;
using GolBox.Application.Interfaces;
using GolBox.Domain.Entities;

namespace GolBox.Application.Features.Auth.Commands;

public record RegisterCommand(
    Guid OrganizationId,
    string Email,
    string Password,
    string FirstName,
    string LastName,
    string? PhoneNumber,
    int? Age,
    string? EducationLevel
) : IRequest<Result<Guid>>;

public class RegisterCommandHandler : IRequestHandler<RegisterCommand, Result<Guid>>
{
    private readonly IAppDbContext _context;
    private readonly IPasswordHasher _passwordHasher;

    public RegisterCommandHandler(IAppDbContext context, IPasswordHasher passwordHasher)
    {
        _context = context;
        _passwordHasher = passwordHasher;
    }

    public async Task<Result<Guid>> Handle(RegisterCommand request, CancellationToken cancellationToken)
    {
        // Check organization exists
        var orgExists = await _context.Organizations
            .AnyAsync(o => o.Id == request.OrganizationId, cancellationToken);

        if (!orgExists)
        {
            return Result<Guid>.Fail("Belirtilen organizasyon (belediye) sistemde kayıtlı değil.");
        }

        // Email uniqueness check (per Organization)
        var emailExists = await _context.Users
            .AnyAsync(u => u.Email.ToLower() == request.Email.ToLower() && u.OrganizationId == request.OrganizationId, cancellationToken);

        if (emailExists)
        {
            return Result<Guid>.Fail("Bu e-posta adresi bu belediye için zaten kayıtlı.");
        }

        var user = new User
        {
            OrganizationId = request.OrganizationId,
            Email = request.Email,
            NormalizedEmail = request.Email.ToUpper(),
            FirstName = request.FirstName,
            LastName = request.LastName,
            PhoneNumber = request.PhoneNumber,
            PasswordHash = _passwordHasher.Hash(request.Password),
            EmailConfirmed = false,
            PhoneNumberConfirmed = false,
            PointsBalance = 0,
            Role = "User"
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Ok(user.Id, "Kullanıcı başarıyla kaydedildi.");
    }
}
