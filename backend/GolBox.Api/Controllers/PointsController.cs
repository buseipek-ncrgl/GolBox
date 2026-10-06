using System;
using System.Linq;
using System.Threading.Tasks;
using System.Threading;
using MediatR;
using GolBox.Application.Authorization;
using GolBox.Application.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GolBox.Application.Features.Points.Commands;
using GolBox.Application.Features.Points.Queries;
using GolBox.Application.Interfaces;

namespace GolBox.Api.Controllers;

[Authorize]
public class PointsController : BaseApiController
{
    private readonly IMediator _mediator;
    private readonly IAppDbContext _context;

    public PointsController(IMediator mediator, IAppDbContext context)
    {
        _mediator = mediator;
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetPointsHistory([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _mediator.Send(new GetUserPointsHistoryQuery(page, pageSize));
        return HandleResult(result);
    }

    [HttpGet("ledger")]
    [Authorize(Policy = AuthorizationPolicies.StaffOrAdmin)]
    public async Task<IActionResult> GetLedger(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = AdminPaging.DefaultPageSize,
        [FromQuery] string? type = null,
        [FromQuery] Guid? userId = null,
        [FromQuery] string? search = null,
        [FromQuery] string? preset = null,
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null,
        CancellationToken cancellationToken = default)
    {
        (page, pageSize) = AdminPaging.Normalize(page, pageSize);
        var query = _context.PointTransactions.Include(pt => pt.User).AsQueryable();

        if (!string.IsNullOrWhiteSpace(preset) || from.HasValue || to.HasValue)
        {
            var range = AdminDateRange.Resolve(preset, from, to);
            query = query.Where(pt => pt.CreatedDate >= range.FromUtc && pt.CreatedDate < range.ToUtc);
        }

        if (userId.HasValue)
            query = query.Where(pt => pt.UserId == userId.Value);
        if (!string.IsNullOrWhiteSpace(type) && type != "All")
            query = query.Where(pt => pt.Type == type);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(pt =>
                (pt.User != null && (pt.User.FirstName.Contains(term) || pt.User.LastName.Contains(term) || pt.User.Email.Contains(term))) ||
                pt.Description.Contains(term));
        }

        query = query.OrderByDescending(pt => pt.CreatedDate);
        var totalCount = await query.CountAsync(cancellationToken);
        var pageRows = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(pt => new
            {
                pt.Id,
                pt.UserId,
                UserFullName = pt.User != null ? pt.User.FirstName + " " + pt.User.LastName : "Vatandaş",
                UserEmail = pt.User != null ? pt.User.Email : "",
                pt.Amount,
                pt.Type,
                pt.Description,
                pt.ReferenceType,
                pt.BalanceAfter,
                pt.CreatedBy,
                pt.CreatedDate
            })
            .ToListAsync(cancellationToken);

        var actorIds = pageRows.Where(r => r.CreatedBy.HasValue).Select(r => r.CreatedBy!.Value).Distinct().ToList();
        var actors = actorIds.Count == 0
            ? new Dictionary<Guid, string>()
            : await _context.Users.Where(u => actorIds.Contains(u.Id))
                .ToDictionaryAsync(u => u.Id, u => (u.FirstName + " " + u.LastName).Trim(), cancellationToken);

        var items = pageRows.Select(pt => new
        {
            pt.Id,
            pt.UserId,
            pt.UserFullName,
            pt.UserEmail,
            pt.Amount,
            pt.Type,
            pt.Description,
            source = pt.ReferenceType,
            pt.BalanceAfter,
            pt.CreatedBy,
            actorName = pt.CreatedBy.HasValue && actors.TryGetValue(pt.CreatedBy.Value, out var name) ? name : null,
            pt.CreatedDate
        }).ToList();

        var (todayFrom, todayTo) = AdminDateRange.Today();
        var inCirculation = await _context.Users
            .Where(u => u.Role == "User" || u.Role == "Citizen")
            .SumAsync(u => (int?)u.PointsBalance, cancellationToken) ?? 0;
        var earnedToday = await _context.PointTransactions
            .Where(pt => pt.CreatedDate >= todayFrom && pt.CreatedDate < todayTo && pt.Amount > 0)
            .SumAsync(pt => (int?)pt.Amount, cancellationToken) ?? 0;
        var spentTodayRaw = await _context.PointTransactions
            .Where(pt => pt.CreatedDate >= todayFrom && pt.CreatedDate < todayTo && pt.Amount < 0)
            .SumAsync(pt => (int?)pt.Amount, cancellationToken) ?? 0;
        var activeRewards = await _context.Rewards.CountAsync(r => r.Status == "Active", cancellationToken);

        return Ok(Result<object>.Ok(new
        {
            items,
            page,
            pageSize,
            totalCount,
            summary = new { inCirculation, earnedToday, spentToday = Math.Abs(spentTodayRaw), activeRewards }
        }));
    }

    [HttpPost("grant")]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> GrantPoints([FromBody] GrantPointsCommand command)
    {
        var result = await _mediator.Send(command);
        if (result.Success)
        {
            var actor = HttpContext.User?.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value
                        ?? HttpContext.User?.Identity?.Name
                        ?? "admin";
            var role = HttpContext.User?.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? "Admin";
            await AuditLogsController.LogAsync(
                _context,
                actor,
                role,
                "Points_Grant",
                "Points",
                "User",
                command.UserId.ToString(),
                null,
                command.Amount.ToString(),
                command.Description);
        }
        return HandleResult(result);
    }

    [HttpPost("earn")]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> EarnBonusPoints([FromBody] EarnBonusPointsCommand command)
    {
        var result = await _mediator.Send(command);
        return HandleResult(result);
    }
}
