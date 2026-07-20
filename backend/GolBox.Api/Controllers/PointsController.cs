using System;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GolBox.Application.Features.Points.Commands;
using GolBox.Application.Features.Points.Queries;

namespace GolBox.Api.Controllers;

[Authorize]
public class PointsController : BaseApiController
{
    private readonly IMediator _mediator;

    public PointsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<IActionResult> GetPointsHistory([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _mediator.Send(new GetUserPointsHistoryQuery(page, pageSize));
        return HandleResult(result);
    }

    [HttpPost("grant")]
    public async Task<IActionResult> GrantPoints([FromBody] GrantPointsCommand command)
    {
        var result = await _mediator.Send(command);
        return HandleResult(result);
    }
}
