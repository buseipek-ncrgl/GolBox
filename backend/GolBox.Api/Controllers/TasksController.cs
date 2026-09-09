using System;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GolBox.Application.Features.Tasks.Commands;
using GolBox.Application.Features.Tasks.Queries;
using GolBox.Application.Interfaces;

namespace GolBox.Api.Controllers;

[Authorize]
public class TasksController : BaseApiController
{
    private readonly IMediator _mediator;
    private readonly IAppDbContext _context;

    public TasksController(IMediator mediator, IAppDbContext context)
    {
        _mediator = mediator;
        _context = context;
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

    [HttpPost]
    public async Task<IActionResult> CreateTask([FromBody] CreateTaskCommand command)
    {
        var result = await _mediator.Send(command);
        return HandleResult(result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTask(Guid id)
    {
        var task = await _context.Tasks.FindAsync(id);
        if (task == null)
            return NotFound(GolBox.Application.Common.Result<object>.Fail("Görev bulunamadı."));

        task.IsDeleted = true;
        task.DeletedDate = DateTime.UtcNow;
        
        await _context.SaveChangesAsync();
        return Ok(GolBox.Application.Common.Result<object>.Ok(new { id }, "Görev başarıyla silindi."));
    }
}
