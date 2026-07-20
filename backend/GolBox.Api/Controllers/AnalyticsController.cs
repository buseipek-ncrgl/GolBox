using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GolBox.Application.Features.Analytics.Queries;

namespace GolBox.Api.Controllers;

[Authorize]
public class AnalyticsController : BaseApiController
{
    private readonly IMediator _mediator;

    public AnalyticsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("user")]
    public async Task<IActionResult> GetUserAnalytics()
    {
        var result = await _mediator.Send(new GetUserAnalyticsQuery());
        return HandleResult(result);
    }

    [HttpGet("admin")]
    public async Task<IActionResult> GetAdminAnalytics()
    {
        var result = await _mediator.Send(new GetAdminAnalyticsQuery());
        return HandleResult(result);
    }
}
