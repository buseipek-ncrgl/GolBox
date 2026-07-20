using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using GolBox.Application.Features.Auth.Commands;

namespace GolBox.Api.Controllers;

public class AuthController : BaseApiController
{
    private readonly IMediator _mediator;

    public AuthController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterCommand command)
    {
        var result = await _mediator.Send(command);
        return HandleResult(result);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginCommand command)
    {
        // Add remote IP address to login command context
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var enrichedCommand = command with { IpAddress = ipAddress };
        
        var result = await _mediator.Send(enrichedCommand);
        return HandleResult(result);
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenCommand command)
    {
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var enrichedCommand = command with { IpAddress = ipAddress };

        var result = await _mediator.Send(enrichedCommand);
        return HandleResult(result);
    }
}
