using System;
using System.Linq;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GolBox.Application.Common;
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
    public async Task<IActionResult> GetLedger([FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        var query = _context.PointTransactions
            .Include(pt => pt.User)
            .OrderByDescending(pt => pt.CreatedDate);

        var totalCount = await query.CountAsync();
        var items = await query
            .Skip(Math.Max(page - 1, 0) * pageSize)
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
                pt.CreatedDate
            })
            .ToListAsync();

        return Ok(Result<object>.Ok(new
        {
            items,
            page,
            pageSize,
            totalCount
        }));
    }

    [HttpPost("grant")]
    public async Task<IActionResult> GrantPoints([FromBody] GrantPointsCommand command)
    {
        var result = await _mediator.Send(command);
        return HandleResult(result);
    }
}
