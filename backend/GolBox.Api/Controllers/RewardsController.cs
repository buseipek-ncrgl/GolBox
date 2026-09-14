using System;
using System.Linq;
using System.Threading.Tasks;
using MediatR;
using GolBox.Application.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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

    [HttpGet("admin")]
    [Authorize(Policy = AuthorizationPolicies.StaffOrAdmin)]
    public async Task<IActionResult> GetAdminRewards()
    {
        var rewards = await _context.Rewards
            .OrderBy(r => r.RequiredPoints)
            .Select(r => new
            {
                r.Id,
                r.Title,
                r.Description,
                r.RequiredPoints,
                r.ImageUrl,
                r.Status,
                r.CreatedDate,
                r.UpdatedDate
            })
            .ToListAsync();
        return Ok(Result<object>.Ok(rewards));
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
        var pointsCheck = AdminSafetyRules.ValidateRewardPoints(request.RequiredPoints);
        if (!pointsCheck.Success)
            return BadRequest(Result<object>.Fail(pointsCheck.Message));
        if (string.IsNullOrWhiteSpace(request.Title))
            return BadRequest(Result<object>.Fail("Ödül başlığı zorunludur."));

        var reward = new Reward
        {
            Id = Guid.NewGuid(),
            OrganizationId = request.OrganizationId == Guid.Empty ? KnownOrganizations.Sehitkamil : request.OrganizationId,
            Title = request.Title.Trim(),
            Description = request.Description?.Trim() ?? string.Empty,
            RequiredPoints = request.RequiredPoints,
            ImageUrl = request.ImageUrl,
            Status = "Active"
        };

        _context.Rewards.Add(reward);
        await _context.SaveChangesAsync();
        await AuditLogsController.LogAsync(_context, "admin", "Admin", "Reward_Create", "Rewards", "Reward", reward.Id.ToString(), null, reward.Title, $"{reward.RequiredPoints} GP");

        return Ok(Result<object>.Ok(new { id = reward.Id }, "Ödül başarıyla oluşturuldu."));
    }

    [HttpPut("{id}")]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> UpdateReward(Guid id, [FromBody] UpdateRewardRequest request)
    {
        var reward = await _context.Rewards.FindAsync(id);
        if (reward == null)
            return NotFound(Result<object>.Fail("Ödül bulunamadı."));

        var pointsCheck = AdminSafetyRules.ValidateRewardPoints(request.RequiredPoints);
        if (!pointsCheck.Success)
            return BadRequest(Result<object>.Fail(pointsCheck.Message));
        if (string.IsNullOrWhiteSpace(request.Title))
            return BadRequest(Result<object>.Fail("Ödül başlığı zorunludur."));

        var previous = $"{reward.Title} / {reward.RequiredPoints} GP / {reward.Status}";
        reward.Title = request.Title.Trim();
        reward.Description = request.Description?.Trim() ?? string.Empty;
        reward.RequiredPoints = request.RequiredPoints;
        if (request.ImageUrl != null)
            reward.ImageUrl = request.ImageUrl;
        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            reward.Status = request.Status.Equals("Passive", StringComparison.OrdinalIgnoreCase) ||
                            request.Status.Equals("Inactive", StringComparison.OrdinalIgnoreCase)
                ? "Passive"
                : "Active";
        }
        reward.UpdatedDate = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        await AuditLogsController.LogAsync(_context, "admin", "Admin", "Reward_Update", "Rewards", "Reward", reward.Id.ToString(), previous, $"{reward.Title} / {reward.RequiredPoints} GP / {reward.Status}", null);
        return Ok(Result<object>.Ok(new { id = reward.Id, status = reward.Status }, "Ödül güncellendi."));
    }

    [HttpPost("{id}/deactivate")]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> DeactivateReward(Guid id)
    {
        var reward = await _context.Rewards.FindAsync(id);
        if (reward == null)
            return NotFound(Result<object>.Fail("Ödül bulunamadı."));

        if (reward.Status == "Passive")
            return Ok(Result<object>.Ok(new { id = reward.Id, status = reward.Status }, "Ödül zaten pasif."));

        var previous = reward.Status;
        reward.Status = "Passive";
        reward.UpdatedDate = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        await AuditLogsController.LogAsync(_context, "admin", "Admin", "Reward_Deactivate", "Rewards", "Reward", reward.Id.ToString(), previous, "Passive", null);
        return Ok(Result<object>.Ok(new { id = reward.Id, status = reward.Status }, "Ödül vatandaş kataloğundan kaldırıldı."));
    }

    [HttpPost("{id}/activate")]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> ActivateReward(Guid id)
    {
        var reward = await _context.Rewards.FindAsync(id);
        if (reward == null)
            return NotFound(Result<object>.Fail("Ödül bulunamadı."));

        var pointsCheck = AdminSafetyRules.ValidateRewardPoints(reward.RequiredPoints);
        if (!pointsCheck.Success)
            return BadRequest(Result<object>.Fail(pointsCheck.Message));

        var previous = reward.Status;
        reward.Status = "Active";
        reward.UpdatedDate = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        await AuditLogsController.LogAsync(_context, "admin", "Admin", "Reward_Activate", "Rewards", "Reward", reward.Id.ToString(), previous, "Active", null);
        return Ok(Result<object>.Ok(new { id = reward.Id, status = reward.Status }, "Ödül yayına alındı."));
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

public class UpdateRewardRequest
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int RequiredPoints { get; set; }
    public string? ImageUrl { get; set; }
    public string? Status { get; set; }
}
