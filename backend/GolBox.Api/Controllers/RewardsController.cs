using System;
using System.Threading.Tasks;
using MediatR;
using GolBox.Application.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GolBox.Application.Features.Rewards.Commands;
using GolBox.Application.Features.Rewards.Queries;
using GolBox.Application.Interfaces;
using GolBox.Domain.Entities;
using GolBox.Application.Common;

namespace GolBox.Api.Controllers;

[Authorize]
public class RewardsController : BaseApiController
{
    private readonly IMediator _mediator;
    private readonly IAppDbContext _context;

    public RewardsController(IMediator mediator, IAppDbContext context)
    {
        _mediator = mediator;
        _context = context;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetActiveRewards([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? search = null)
    {
        var result = await _mediator.Send(new GetActiveRewardsQuery(page, pageSize, search));
        return HandleResult(result);
    }

    [HttpGet("my-claimed")]
    public async Task<IActionResult> GetMyClaimedRewards()
    {
        var result = await _mediator.Send(new GetUserClaimedRewardsQuery());
        return HandleResult(result);
    }

    [HttpPost("checkout")]
    public async Task<IActionResult> Checkout([FromBody] CheckoutCartCommand command)
    {
        var items = command?.Items ?? new System.Collections.Generic.List<CheckoutCartItem>();
        var result = await _mediator.Send(new CheckoutCartCommand(items));
        return HandleResult(result);
    }

    [HttpPost("{id}/claim")]
    public async Task<IActionResult> ClaimReward(Guid id)
    {
        var result = await _mediator.Send(new ClaimRewardCommand(id));
        return HandleResult(result);
    }

    [HttpPost]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> CreateReward([FromBody] CreateRewardRequest request)
    {
        var reward = new Reward
        {
            Id = Guid.NewGuid(),
            OrganizationId = request.OrganizationId,
            Title = request.Title,
            Description = request.Description,
            RequiredPoints = request.RequiredPoints,
            ImageUrl = request.ImageUrl,
            Status = "Active"
        };

        _context.Rewards.Add(reward);
        await _context.SaveChangesAsync();
        await AuditLogsController.LogAsync(_context, "admin", "Admin", "Reward_Create", "Rewards", "Reward", reward.Id.ToString(), null, reward.Title, null);

        return Ok(Result<object>.Ok(new { id = reward.Id }, "Ödül başarıyla oluşturuldu."));
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> DeleteReward(Guid id)
    {
        var reward = await _context.Rewards.FindAsync(id);
        if (reward == null)
            return NotFound(Result<object>.Fail("Ödül bulunamadı."));

        reward.IsDeleted = true;
        reward.DeletedDate = DateTime.UtcNow;
        
        await _context.SaveChangesAsync();
        await AuditLogsController.LogAsync(_context, "admin", "Admin", "Reward_Delete", "Rewards", "Reward", id.ToString(), reward.Title, null, null);
        return Ok(Result<object>.Ok(new { id }, "Ödül başarıyla silindi."));
    }
}

public class CreateRewardRequest
{
    public Guid OrganizationId { get; set; } = KnownOrganizations.Sehitkamil;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int RequiredPoints { get; set; }
    public string? ImageUrl { get; set; }
}
