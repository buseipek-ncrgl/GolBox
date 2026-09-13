using System;
using System.Threading.Tasks;
using MediatR;
using GolBox.Application.Authorization;
using GolBox.Application.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GolBox.Application.Features.Tasks.Commands;
using GolBox.Application.Features.Tasks.Queries;
using GolBox.Application.Interfaces;

namespace GolBox.Api.Controllers;

[Authorize]
[Route("api/v1/tasks")]
public class TasksController : BaseApiController
{
    private readonly IMediator _mediator;
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public TasksController(IMediator mediator, IAppDbContext context, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _context = context;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<IActionResult> GetActiveTasks()
    {
        var result = await _mediator.Send(new GetActiveTasksQuery());
        return HandleResult(result);
    }

    [HttpPost("{id}/complete")]
    public async Task<IActionResult> CompleteTask(Guid id)
    {
        var result = await _mediator.Send(new CompleteTaskCommand(id));
        return HandleResult(result);
    }

    [HttpPost("{id}/claim-auto")]
    public async Task<IActionResult> ClaimAutoTask(Guid id)
    {
        var userId = _currentUser.UserId;
        if (userId == null || userId == Guid.Empty)
            return Unauthorized(Result<object>.Fail("Oturum doğrulanamadı."));

        var user = await _context.Users.FindAsync(userId.Value);
        if (user == null)
            return NotFound(Result<object>.Fail("Kullanıcı bulunamadı."));

        var task = await _context.Tasks.FindAsync(id);
        if (task == null)
            return NotFound(Result<object>.Fail("Başvuru/Görev bulunamadı."));

        var eval = AutoRewardEngine.EvaluateUserEligibility(user, task.Title ?? "All");
        if (!eval.IsEligible)
            return BadRequest(Result<object>.Fail(eval.Reason));

        var result = await _mediator.Send(new CompleteTaskCommand(id));
        return HandleResult(result);
    }

    [HttpPost]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> CreateTask([FromBody] CreateTaskCommand command)
    {
        var result = await _mediator.Send(command);
        return HandleResult(result);
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> DeleteTask(Guid id)
    {
        var task = await _context.Tasks.FindAsync(id);
        if (task == null)
            return NotFound(Result<object>.Fail("Görev bulunamadı."));

        task.IsDeleted = true;
        task.DeletedDate = DateTime.UtcNow;
        
        await _context.SaveChangesAsync();
        return Ok(Result<object>.Ok(new { id }, "Görev başarıyla silindi."));
    }
}
