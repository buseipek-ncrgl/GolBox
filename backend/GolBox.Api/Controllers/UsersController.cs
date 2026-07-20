using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GolBox.Application.Features.Users.Commands;
using GolBox.Application.Features.Users.Queries;
using GolBox.Application.Interfaces;

namespace GolBox.Api.Controllers;

[Authorize]
public class UsersController : BaseApiController
{
    private readonly IMediator _mediator;
    private readonly IAppDbContext _context;

    public UsersController(IMediator mediator, IAppDbContext context)
    {
        _mediator = mediator;
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllUsers()
    {
        var users = await _context.Users
            .Select(u => new { u.Id, u.Email, u.FirstName, u.LastName, u.PointsBalance })
            .ToListAsync();
        return Ok(GolBox.Application.Common.Result<object>.Ok(users));
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetProfile()
    {
        var result = await _mediator.Send(new GetUserProfileQuery());
        return HandleResult(result);
    }

    [HttpPut("me")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateUserProfileCommand command)
    {
        var result = await _mediator.Send(command);
        return HandleResult(result);
    }

    [HttpPut("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordCommand command)
    {
        var result = await _mediator.Send(command);
        return HandleResult(result);
    }
}
