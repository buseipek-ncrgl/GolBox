using System;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GolBox.Application.Features.Activities.Commands;
using GolBox.Application.Features.Activities.Queries;
using GolBox.Application.Interfaces;
using GolBox.Domain.Entities;
using GolBox.Application.Common;

namespace GolBox.Api.Controllers;

[Authorize]
public class ActivitiesController : BaseApiController
{
    private readonly IMediator _mediator;
    private readonly IAppDbContext _context;

    public ActivitiesController(IMediator mediator, IAppDbContext context)
    {
        _mediator = mediator;
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetUpcomingActivities()
    {
        var result = await _mediator.Send(new GetUpcomingActivitiesQuery());
        return HandleResult(result);
    }

    [HttpPost("{id}/join")]
    public async Task<IActionResult> JoinActivity(Guid id)
    {
        var result = await _mediator.Send(new JoinActivityCommand(id));
        return HandleResult(result);
    }

    [HttpPost]
    public async Task<IActionResult> CreateActivity([FromBody] CreateActivityRequest request)
    {
        var activity = new Activity
        {
            Id = Guid.NewGuid(),
            OrganizationId = request.OrganizationId,
            Title = request.Title,
            Description = request.Description,
            PointsReward = request.PointsReward,
            Location = request.Location,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            Status = "Active"
        };

        _context.Activities.Add(activity);
        await _context.SaveChangesAsync();

        return Ok(Result<Guid>.Ok(activity.Id));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteActivity(Guid id)
    {
        var activity = await _context.Activities.FindAsync(id);
        if (activity == null)
            return NotFound(Result<object>.Fail("Etkinlik bulunamadı."));

        activity.IsDeleted = true;
        activity.DeletedDate = DateTime.UtcNow;
        
        await _context.SaveChangesAsync();
        return Ok(Result<object>.Ok(null, "Etkinlik başarıyla silindi."));
    }
}

public class CreateActivityRequest
{
    public Guid OrganizationId { get; set; } = Guid.Parse("11111111-1111-1111-1111-111111111111");
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int PointsReward { get; set; }
    public string Location { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
}
