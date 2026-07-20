using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using GolBox.Application.Common;
using GolBox.Application.Interfaces;

namespace GolBox.Application.Features.Points.Queries;

public record GetUserPointsHistoryQuery(
    int Page = 1,
    int PageSize = 20
) : IRequest<Result<PagedPointsResult>>;

public record PagedPointsResult(
    List<PointTransactionDto> Items,
    int Page,
    int PageSize,
    int TotalCount,
    int TotalPages
);

public record PointTransactionDto(
    Guid Id,
    int Amount,
    string Type,
    string Description,
    DateTime CreatedDate
);

public class GetUserPointsHistoryQueryHandler : IRequestHandler<GetUserPointsHistoryQuery, Result<PagedPointsResult>>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetUserPointsHistoryQueryHandler(IAppDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<Result<PagedPointsResult>> Handle(GetUserPointsHistoryQuery request, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUserService.UserId;
        if (currentUserId == null || currentUserId == Guid.Empty)
        {
            return Result<PagedPointsResult>.Fail("Kullanıcı kimliği doğrulanamadı.");
        }

        var query = _context.PointTransactions
            .Where(pt => pt.UserId == currentUserId.Value)
            .OrderByDescending(pt => pt.CreatedDate);

        var totalCount = await query.CountAsync(cancellationToken);
        
        var items = await query
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(pt => new PointTransactionDto(
                pt.Id,
                pt.Amount,
                pt.Type,
                pt.Description,
                pt.CreatedDate
            ))
            .ToListAsync(cancellationToken);

        var ceilingPages = (int)Math.Ceiling((double)totalCount / request.PageSize);

        var result = new PagedPointsResult(items, request.Page, request.PageSize, totalCount, ceilingPages);

        return Result<PagedPointsResult>.Ok(result, "Puan geçmişi başarıyla getirildi.");
    }
}
