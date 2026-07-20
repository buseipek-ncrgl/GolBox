using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using GolBox.Application.Common;
using GolBox.Application.Interfaces;
using GolBox.Domain.Entities;

namespace GolBox.Application.Features.Points.Commands;

public record GrantPointsCommand(
    Guid UserId,
    int Amount,
    string Description
) : IRequest<Result>;

public class GrantPointsCommandHandler : IRequestHandler<GrantPointsCommand, Result>
{
    private readonly IAppDbContext _context;

    public GrantPointsCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<Result> Handle(GrantPointsCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);

        if (user == null)
        {
            return Result.Fail("Kullanıcı bulunamadı.");
        }

        // Apply Points
        user.PointsBalance += request.Amount;
        if (user.PointsBalance < 0)
        {
            return Result.Fail("İşlem sonucunda bakiye negatif olamaz.");
        }

        var transaction = new PointTransaction
        {
            UserId = user.Id,
            OrganizationId = user.OrganizationId,
            Amount = request.Amount,
            Type = request.Amount >= 0 ? "Earn" : "Spend",
            Description = request.Description,
            ReferenceType = "Admin",
            ReferenceId = Guid.Empty
        };

        _context.PointTransactions.Add(transaction);
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Ok("Puan başarıyla güncellendi.");
    }
}
