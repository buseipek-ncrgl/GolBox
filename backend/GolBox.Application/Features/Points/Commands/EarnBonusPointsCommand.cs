using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using GolBox.Application.Common;
using GolBox.Application.Interfaces;
using GolBox.Domain.Entities;

namespace GolBox.Application.Features.Points.Commands;

public record EarnBonusPointsCommand(
    int Amount,
    string Description,
    string? ReferenceType = null
) : IRequest<Result<int>>;

public class EarnBonusPointsCommandHandler : IRequestHandler<EarnBonusPointsCommand, Result<int>>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public EarnBonusPointsCommandHandler(IAppDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<Result<int>> Handle(EarnBonusPointsCommand request, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUserService.UserId;
        if (currentUserId == null || currentUserId == Guid.Empty)
        {
            return Result<int>.Fail("Kullanıcı kimliği doğrulanamadı.");
        }

        if (request.Amount <= 0)
        {
            return Result<int>.Fail("Kazanılacak puan 0'dan büyük olmalıdır.");
        }

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == currentUserId.Value, cancellationToken);

        if (user == null)
        {
            return Result<int>.Fail("Kullanıcı bulunamadı.");
        }

        user.PointsBalance += request.Amount;

        var transaction = new PointTransaction
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            OrganizationId = user.OrganizationId,
            Amount = request.Amount,
            Type = "Earn",
            Description = string.IsNullOrWhiteSpace(request.Description) ? "Bonus Puan" : request.Description,
            ReferenceType = string.IsNullOrWhiteSpace(request.ReferenceType) ? "Bonus" : request.ReferenceType,
            BalanceAfter = user.PointsBalance,
            CreatedBy = user.Id,
            CreatedDate = DateTime.UtcNow
        };

        _context.PointTransactions.Add(transaction);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<int>.Ok(user.PointsBalance, $"{request.Amount} GP başarıyla hesabınıza eklendi.");
    }
}
