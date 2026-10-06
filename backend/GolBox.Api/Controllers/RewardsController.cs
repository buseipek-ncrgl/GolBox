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
    public async Task<IActionResult> GetAdminRewards(
        [FromQuery] string? search = null,
        [FromQuery] string? status = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = AdminPaging.DefaultPageSize)
    {
        (page, pageSize) = AdminPaging.Normalize(page, pageSize);
        var query = _context.Rewards.AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(r => r.Title.Contains(term) || r.Description.Contains(term));
        }
        if (!string.IsNullOrWhiteSpace(status) && status != "All")
            query = query.Where(r => r.Status == status);

        var totalCount = await query.CountAsync();
        var rewards = await query
            .OrderBy(r => r.RequiredPoints)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new
            {
                r.Id,
                r.Title,
                r.Description,
                r.RequiredPoints,
                r.ImageUrl,
                r.Status,
                r.TotalStock,
                r.IssuedCount,
                remainingStock = r.TotalStock == null ? (int?)null : Math.Max(0, r.TotalStock.Value - r.IssuedCount),
                r.PerUserLimit,
                r.MinAge,
                r.RequiredEducation,
                claimedCount = r.UserRewards.Count,
                redeemedCount = r.UserRewards.Count(ur => ur.Status == UserRewardStatuses.Redeemed),
                r.CreatedDate,
                r.UpdatedDate
            })
            .ToListAsync();
        var summaryRows = await _context.Rewards.Select(r => new { r.Status, r.TotalStock, r.IssuedCount }).ToListAsync();
        var totalClaims = await _context.UserRewards.CountAsync();
        var totalRedemptions = await _context.UserRewards.CountAsync(ur => ur.Status == UserRewardStatuses.Redeemed);
        var summary = new
        {
            total = summaryRows.Count,
            active = summaryRows.Count(r => r.Status == "Active"),
            limitedStock = summaryRows.Count(r => r.TotalStock.HasValue),
            totalClaims,
            totalRedemptions
        };
        return Ok(Result<object>.Ok(new { items = rewards, page, pageSize, totalCount, summary }));
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
        var ruleError = ValidateOperationalRules(request.TotalStock, request.PerUserLimit, request.MinAge);
        if (ruleError != null) return BadRequest(Result<object>.Fail(ruleError));

        var reward = new Reward
        {
            Id = Guid.NewGuid(),
            OrganizationId = request.OrganizationId == Guid.Empty ? KnownOrganizations.Sehitkamil : request.OrganizationId,
            Title = request.Title.Trim(),
            Description = request.Description?.Trim() ?? string.Empty,
            RequiredPoints = request.RequiredPoints,
            ImageUrl = request.ImageUrl,
            TotalStock = request.TotalStock,
            PerUserLimit = request.PerUserLimit,
            MinAge = request.MinAge,
            RequiredEducation = string.IsNullOrWhiteSpace(request.RequiredEducation) ? null : request.RequiredEducation.Trim(),
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
        var ruleError = ValidateOperationalRules(request.TotalStock, request.PerUserLimit, request.MinAge);
        if (ruleError != null) return BadRequest(Result<object>.Fail(ruleError));

        var previous = $"{reward.Title} / {reward.RequiredPoints} GP / {reward.Status}";
        reward.Title = request.Title.Trim();
        reward.Description = request.Description?.Trim() ?? string.Empty;
        reward.RequiredPoints = request.RequiredPoints;
        if (request.TotalStock.HasValue && request.TotalStock.Value < reward.IssuedCount)
            return BadRequest(Result<object>.Fail($"Toplam kontenjan dağıtılmış {reward.IssuedCount} adetten düşük olamaz."));
        reward.TotalStock = request.TotalStock;
        reward.PerUserLimit = request.PerUserLimit;
        reward.MinAge = request.MinAge;
        reward.RequiredEducation = string.IsNullOrWhiteSpace(request.RequiredEducation) ? null : request.RequiredEducation.Trim();
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

    private static string? ValidateOperationalRules(int? totalStock, int perUserLimit, int? minAge)
    {
        if (totalStock.HasValue && totalStock.Value < 1) return "Toplam kontenjan en az 1 olmalıdır.";
        if (perUserLimit is < 1 or > 20) return "Kişi başı limit 1 ile 20 arasında olmalıdır.";
        if (totalStock.HasValue && perUserLimit > totalStock.Value) return "Kişi başı limit toplam kontenjandan büyük olamaz.";
        if (minAge.HasValue && minAge.Value is < 6 or > 120) return "Minimum yaş 6 ile 120 arasında olmalıdır.";
        return null;
    }
}

public class CreateRewardRequest
{
    public Guid OrganizationId { get; set; } = KnownOrganizations.Sehitkamil;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int RequiredPoints { get; set; }
    public string? ImageUrl { get; set; }
    public int? TotalStock { get; set; }
    public int PerUserLimit { get; set; } = 1;
    public int? MinAge { get; set; }
    public string? RequiredEducation { get; set; }
}

public class UpdateRewardRequest
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int RequiredPoints { get; set; }
    public string? ImageUrl { get; set; }
    public string? Status { get; set; }
    public int? TotalStock { get; set; }
    public int PerUserLimit { get; set; } = 1;
    public int? MinAge { get; set; }
    public string? RequiredEducation { get; set; }
}
