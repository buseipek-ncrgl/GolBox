using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using GolBox.Application.Common;
using GolBox.Application.Interfaces;

namespace GolBox.Application.Features.Rewards.Queries;

public record GetActiveRewardsQuery(
    int Page = 1,
    int PageSize = 20,
    string? Search = null
) : IRequest<Result<PagedRewardsResult>>;

public record PagedRewardsResult(
    List<RewardDto> Items,
    int Page,
    int PageSize,
    int TotalCount,
    int TotalPages
);

public record RewardDto(
    Guid Id,
    string Title,
    string Description,
    int RequiredPoints,
    string? ImageUrl
);

public class GetActiveRewardsQueryHandler : IRequestHandler<GetActiveRewardsQuery, Result<PagedRewardsResult>>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetActiveRewardsQueryHandler(IAppDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<Result<PagedRewardsResult>> Handle(GetActiveRewardsQuery request, CancellationToken cancellationToken)
    {
        var organizationId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var currentUserId = _currentUserService.UserId;
        if (currentUserId != null && currentUserId != Guid.Empty)
        {
            var user = await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == currentUserId.Value, cancellationToken);
            if (user != null)
                organizationId = user.OrganizationId;
        }

        var query = _context.Rewards
            .Where(r => r.OrganizationId == organizationId && r.Status == "Active");

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            query = query.Where(r => r.Title.Contains(request.Search) || r.Description.Contains(request.Search));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderBy(r => r.RequiredPoints)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(r => new RewardDto(
                r.Id,
                r.Title,
                r.Description,
                r.RequiredPoints,
                r.ImageUrl
            ))
            .ToListAsync(cancellationToken);

        var totalPages = (int)Math.Ceiling((double)totalCount / request.PageSize);

        var result = new PagedRewardsResult(items, request.Page, request.PageSize, totalCount, totalPages);

        return Result<PagedRewardsResult>.Ok(result, "Aktif ödüller başarıyla listelendi.");
    }
}
