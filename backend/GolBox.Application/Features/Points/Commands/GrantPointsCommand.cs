using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using GolBox.Application.Common;
using GolBox.Application.Interfaces;

namespace GolBox.Application.Features.Points.Commands;

public record GrantPointsCommand(
    Guid UserId,
    int Amount,
    string Description,
    string? Reason = null,
    string? ActionType = null
) : IRequest<Result>;

public class GrantPointsCommandHandler : IRequestHandler<GrantPointsCommand, Result>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public GrantPointsCommandHandler(IAppDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<Result> Handle(GrantPointsCommand request, CancellationToken cancellationToken)
    {
        var reason = string.IsNullOrWhiteSpace(request.Reason) ? request.Description : request.Reason;
        var applied = await ManualPointAdjustment.ApplyAsync(
            _context,
            request.UserId,
            request.Amount,
            string.IsNullOrWhiteSpace(request.ActionType) ? "Add" : request.ActionType,
            reason,
            request.Description,
            _currentUser.UserId,
            cancellationToken);

        return applied.Success
            ? Result.Ok("Puan başarıyla güncellendi.")
            : Result.Fail(applied.Message);
    }
}
