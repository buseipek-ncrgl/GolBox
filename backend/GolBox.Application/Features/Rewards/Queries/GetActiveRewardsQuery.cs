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
    string? ImageUrl,
    int? RemainingStock,
    int PerUserLimit,
    bool IsEligible,
    string? EligibilityMessage
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
        var organizationId = KnownOrganizations.Sehitkamil;
        var currentUserId = _currentUserService.UserId;
        GolBox.Domain.Entities.User? currentUser = null;
        if (currentUserId != null && currentUserId != Guid.Empty)
        {
            currentUser = await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == currentUserId.Value, cancellationToken);
            if (currentUser != null)
                organizationId = currentUser.OrganizationId;
        }

        var query = _context.Rewards
            .Where(r => r.OrganizationId == organizationId && r.Status == "Active");

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            query = query.Where(r => r.Title.Contains(request.Search) || r.Description.Contains(request.Search));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var rows = await query
            .OrderBy(r => r.RequiredPoints)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(r => new { r.Id, r.Title, r.Description, r.RequiredPoints, r.ImageUrl, r.TotalStock, r.IssuedCount, r.PerUserLimit, r.MinAge, r.RequiredEducation })
            .ToListAsync(cancellationToken);

        var items = rows.Select(r =>
        {
            string? eligibilityMessage = null;
            if (r.TotalStock.HasValue && r.IssuedCount >= r.TotalStock.Value) eligibilityMessage = "Kontenjan tükendi.";
            else if (currentUser != null && r.MinAge.HasValue && (!currentUser.Age.HasValue || currentUser.Age.Value < r.MinAge.Value)) eligibilityMessage = $"En az {r.MinAge} yaş gereklidir.";
            else if (currentUser != null && !string.IsNullOrWhiteSpace(r.RequiredEducation) && !string.Equals(currentUser.EducationLevel, r.RequiredEducation, StringComparison.OrdinalIgnoreCase)) eligibilityMessage = $"{r.RequiredEducation} öğrenim koşulu gereklidir.";
            return new RewardDto(r.Id, r.Title, r.Description, r.RequiredPoints, r.ImageUrl,
                r.TotalStock.HasValue ? Math.Max(0, r.TotalStock.Value - r.IssuedCount) : null,
                r.PerUserLimit, eligibilityMessage == null, eligibilityMessage);
        }).ToList();

        var totalPages = (int)Math.Ceiling((double)totalCount / request.PageSize);

        var result = new PagedRewardsResult(items, request.Page, request.PageSize, totalCount, totalPages);

        return Result<PagedRewardsResult>.Ok(result, "Aktif ödüller başarıyla listelendi.");
    }
}
