using System;
using System.Linq;
using System.Threading.Tasks;
using GolBox.Application.Authorization;
using GolBox.Application.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GolBox.Application.Interfaces;
using GolBox.Domain.Entities;
using System.Text.Json;

namespace GolBox.Api.Controllers;

[Authorize]
public class CampaignsController : BaseApiController
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public CampaignsController(IAppDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    [HttpGet("public")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPublicCampaigns(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        (page, pageSize) = AdminPaging.Normalize(page, pageSize);
        var now = DateTime.UtcNow;
        var query = _context.Campaigns.AsNoTracking()
            .Where(c => c.CampaignType != "Ismarliyor" && c.IsActive && c.StartDate <= now && c.EndDate >= now);
        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query.OrderBy(c => c.EndDate)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(c => new
            {
                c.Id, c.Title, c.Description, c.ImageUrl, c.CampaignType,
                c.StartDate, c.EndDate, c.TargetUserGroup, c.CafeId, c.MenuItemId,
                c.TotalUsageLimit, c.PerUserLimit, c.CurrentUsageCount,
                cafeName = c.CafeId.HasValue ? _context.Cafes.Where(x => x.Id == c.CafeId.Value).Select(x => x.Name).FirstOrDefault() : null,
                menuItemName = c.MenuItemId.HasValue ? _context.MenuItems.Where(x => x.Id == c.MenuItemId.Value).Select(x => x.Name).FirstOrDefault() : null
            }).ToListAsync(cancellationToken);
        return Ok(Result<object>.Ok(new { items, page, pageSize, totalCount }));
    }

    [HttpGet]
    [Authorize(Policy = AuthorizationPolicies.StaffOrAdmin)]
    public async Task<IActionResult> GetCampaigns(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = AdminPaging.DefaultPageSize,
        [FromQuery] string? search = null,
        [FromQuery] bool? active = null,
        [FromQuery] string? state = null)
    {
        (page, pageSize) = AdminPaging.Normalize(page, pageSize);
        var query = _context.Campaigns.Where(c => c.CampaignType != "Ismarliyor");
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(c => c.Title.Contains(term) || c.Description.Contains(term));
        }
        if (active.HasValue)
            query = query.Where(c => c.IsActive == active.Value);
        var now = DateTime.UtcNow;
        if (state == "upcoming") query = query.Where(c => c.StartDate > now);
        if (state == "ongoing") query = query.Where(c => c.StartDate <= now && c.EndDate >= now);
        if (state == "ended") query = query.Where(c => c.EndDate < now);
        var totalCount = await query.CountAsync();
        var list = await query
            .OrderByDescending(c => c.CreatedDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
        return Ok(Result<object>.Ok(new { items = list, page, pageSize, totalCount }));
    }

    [HttpPost]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> CreateCampaign([FromBody] CreateCampaignRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
            return BadRequest(Result<object>.Fail("Kampanya başlığı zorunludur."));
        if (request.EndDate <= request.StartDate)
            return BadRequest(Result<object>.Fail("Bitiş tarihi başlangıç tarihinden sonra olmalıdır."));

        var org = await _context.Organizations.FirstOrDefaultAsync();
        var campaign = new Campaign
        {
            Id = Guid.NewGuid(),
            OrganizationId = org?.Id ?? KnownOrganizations.Sehitkamil,
            Title = request.Title.Trim(),
            Description = request.Description?.Trim() ?? string.Empty,
            ImageUrl = request.ImageUrl,
            CampaignType = "Announcement",
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            TargetUserGroup = string.IsNullOrWhiteSpace(request.TargetUserGroup) ? "All" : request.TargetUserGroup,
            CafeId = request.CafeId,
            MenuItemId = request.MenuItemId,
            TotalUsageLimit = request.TotalUsageLimit,
            PerUserLimit = request.PerUserLimit,
            IsActive = true,
            CreatedDate = DateTime.UtcNow
        };

        _context.Campaigns.Add(campaign);
        await _context.SaveChangesAsync();
        await AuditLogsController.LogAsync(_context, "admin", "Admin", "Campaign_Create", "Campaigns", "Campaign", campaign.Id.ToString(), null, campaign.Title, null);

        return Ok(Result<object>.Ok(new { id = campaign.Id }, "Kampanya başarıyla oluşturuldu."));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> UpdateCampaign(Guid id, [FromBody] CreateCampaignRequest request)
    {
        var campaign = await _context.Campaigns.FindAsync(id);
        if (campaign == null)
            return NotFound(Result<object>.Fail("Kampanya bulunamadı."));
        if (string.IsNullOrWhiteSpace(request.Title))
            return BadRequest(Result<object>.Fail("Kampanya başlığı zorunludur."));
        if (request.EndDate <= request.StartDate)
            return BadRequest(Result<object>.Fail("Bitiş tarihi başlangıç tarihinden sonra olmalıdır."));

        var previous = campaign.Title;
        campaign.Title = request.Title.Trim();
        campaign.Description = request.Description?.Trim() ?? string.Empty;
        campaign.ImageUrl = request.ImageUrl;
        campaign.CampaignType = "Announcement";
        campaign.StartDate = request.StartDate;
        campaign.EndDate = request.EndDate;
        campaign.TargetUserGroup = string.IsNullOrWhiteSpace(request.TargetUserGroup) ? "All" : request.TargetUserGroup;
        campaign.CafeId = request.CafeId;
        campaign.MenuItemId = request.MenuItemId;
        campaign.TotalUsageLimit = request.TotalUsageLimit;
        campaign.PerUserLimit = request.PerUserLimit;
        campaign.UpdatedDate = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        await AuditLogsController.LogAsync(_context, "admin", "Admin", "Campaign_Update", "Campaigns", "Campaign", campaign.Id.ToString(), previous, campaign.Title, null);
        return Ok(Result<object>.Ok(new { id = campaign.Id }, "Kampanya içeriği güncellendi."));
    }

    [HttpPost("{id:guid}/publish")]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> PublishCampaign(Guid id)
    {
        var campaign = await _context.Campaigns.FindAsync(id);
        if (campaign == null)
            return NotFound(Result<object>.Fail("Kampanya bulunamadı."));
        campaign.IsActive = true;
        campaign.UpdatedDate = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        await AuditLogsController.LogAsync(_context, "admin", "Admin", "Campaign_Publish", "Campaigns", "Campaign", id.ToString(), null, "Active", null);
        return Ok(Result<object>.Ok(new { id, isActive = true }, "Kampanya yayına alındı."));
    }

    [HttpPost("{id:guid}/unpublish")]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> UnpublishCampaign(Guid id)
    {
        var campaign = await _context.Campaigns.FindAsync(id);
        if (campaign == null)
            return NotFound(Result<object>.Fail("Kampanya bulunamadı."));
        campaign.IsActive = false;
        campaign.UpdatedDate = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        await AuditLogsController.LogAsync(_context, "admin", "Admin", "Campaign_Unpublish", "Campaigns", "Campaign", id.ToString(), "Active", "Inactive", null);
        return Ok(Result<object>.Ok(new { id, isActive = false }, "Kampanya yayından kaldırıldı."));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> DeleteCampaign(Guid id)
    {
        var campaign = await _context.Campaigns.FindAsync(id);
        if (campaign == null)
            return NotFound(Result<object>.Fail("Kampanya bulunamadı."));
        var previous = campaign.Title;
        campaign.IsActive = false;
        campaign.IsDeleted = true;
        campaign.DeletedDate = DateTime.UtcNow;
        campaign.UpdatedDate = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        await AuditLogsController.LogAsync(_context, "admin", "Admin", "Campaign_Delete", "Campaigns", "Campaign", id.ToString(), previous, null, null);
        return Ok(Result<object>.Ok(new { id }, "Kampanya silindi."));
    }

    [HttpGet("ismarliyor")]
    [AllowAnonymous]
    public async Task<IActionResult> GetIsmarliyorCampaigns()
    {
        var query = _context.Campaigns.AsNoTracking()
            .Where(x => x.CampaignType == "Ismarliyor");
        if (!_currentUser.IsStaffOrAdmin)
            query = query.Where(x => x.IsActive && x.StartDate <= DateTime.UtcNow && x.EndDate >= DateTime.UtcNow);
        var rows = await query
            .OrderByDescending(x => x.CreatedDate)
            .ToListAsync();
        return Ok(Result<object>.Ok(rows.Select(ToIsmarliyorDto).ToList()));
    }

    [HttpPost("ismarliyor/sync")]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> SyncIsmarliyorCampaigns([FromBody] List<IsmarliyorCampaignDto>? items)
    {
        items ??= new List<IsmarliyorCampaignDto>();
        var rows = await _context.Campaigns
            .Where(x => x.CampaignType == "Ismarliyor")
            .ToListAsync();
        var incomingIds = items
            .Select(x => Guid.TryParse(x.Id, out var id) ? id : Guid.Empty)
            .Where(x => x != Guid.Empty)
            .ToHashSet();

        foreach (var row in rows.Where(x => !incomingIds.Contains(x.Id)))
        {
            row.IsDeleted = true;
            row.DeletedDate = DateTime.UtcNow;
            row.IsActive = false;
            row.UpdatedDate = DateTime.UtcNow;
        }

        foreach (var item in items)
        {
            var parsed = Guid.TryParse(item.Id, out var id) ? id : Guid.Empty;
            var row = rows.FirstOrDefault(x => x.Id == parsed);
            if (row == null)
            {
                row = new Campaign
                {
                    Id = Guid.NewGuid(),
                    OrganizationId = KnownOrganizations.Sehitkamil,
                    CampaignType = "Ismarliyor",
                    StartDate = DateTime.UtcNow,
                    CreatedDate = DateTime.UtcNow
                };
                _context.Campaigns.Add(row);
            }

            row.Title = item.ItemName.Trim();
            row.Description = JsonSerializer.Serialize(new IsmarliyorMetadata(item.SponsorName.Trim(), item.SponsorTitle.Trim()));
            row.TargetUserGroup = string.IsNullOrWhiteSpace(item.TargetAudience) ? "Tüm Vatandaşlar" : item.TargetAudience.Trim();
            row.TotalUsageLimit = Math.Max(1, item.Quota);
            row.CurrentUsageCount = Math.Clamp(item.Claimed, 0, Math.Max(1, item.Quota));
            row.EndDate = ParseIsmarliyorEndDate(item.EndDate);
            row.IsActive = item.IsActive;
            row.IsDeleted = false;
            row.DeletedDate = null;
            row.UpdatedDate = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        var saved = await _context.Campaigns.AsNoTracking()
            .Where(x => x.CampaignType == "Ismarliyor")
            .OrderByDescending(x => x.CreatedDate)
            .ToListAsync();
        return Ok(Result<object>.Ok(saved.Select(ToIsmarliyorDto).ToList()));
    }

    [HttpPost("ismarliyor/{id}/claim")]
    [Authorize]
    public async Task<IActionResult> ClaimIsmarliyor(string id, [FromQuery] string? legacyCode = null)
    {
        if (!Guid.TryParse(id, out var campaignId))
            return NotFound(Result<object>.Fail("Aktif Ismarlıyor kampanyası bulunamadı."));
        var campaignRow = await _context.Campaigns.FirstOrDefaultAsync(x =>
            x.Id == campaignId && x.CampaignType == "Ismarliyor" && x.IsActive && x.EndDate >= DateTime.UtcNow);
        if (campaignRow == null)
            return NotFound(Result<object>.Fail("Aktif Ismarlıyor kampanyası bulunamadı."));
        var campaign = ToIsmarliyorDto(campaignRow);
        if (campaign.Claimed >= campaign.Quota)
            return Conflict(Result<object>.Fail("İkram kontenjanı tükenmiştir."));

        var userId = _currentUser.UserId;
        if (!userId.HasValue || userId == Guid.Empty)
            return Unauthorized(Result<object>.Fail("Oturum doğrulanamadı."));
        var user = await _context.Users.FindAsync(userId.Value);
        if (user == null) return NotFound(Result<object>.Fail("Kullanıcı bulunamadı."));

        var marker = $"ismarliyor://{campaign.Id}";
        var reward = await _context.Rewards.FirstOrDefaultAsync(r => r.OrganizationId == user.OrganizationId && r.ImageUrl == marker);
        if (reward == null)
        {
            reward = new Reward
            {
                Id = Guid.NewGuid(), OrganizationId = user.OrganizationId, Title = campaign.ItemName,
                Description = $"{campaign.SponsorName} tarafından ikram edildi ({campaign.SponsorTitle})",
                RequiredPoints = 0, Status = "Passive", ImageUrl = marker, TotalStock = campaign.Quota,
                PerUserLimit = 1
            };
            _context.Rewards.Add(reward);
        }

        var existing = await _context.UserRewards.FirstOrDefaultAsync(x => x.UserId == userId.Value && x.RewardId == reward.Id);
        if (existing != null)
            return Conflict(Result<object>.Fail("Bu ikramı daha önce kazandınız."));

        string redeemCode;
        var normalizedLegacyCode = legacyCode?.Trim().ToUpperInvariant();
        if (!string.IsNullOrWhiteSpace(normalizedLegacyCode) &&
            System.Text.RegularExpressions.Regex.IsMatch(normalizedLegacyCode, "^ISM-[0-9]{6}$") &&
            !await _context.UserRewards.AnyAsync(x => x.RedeemCode == normalizedLegacyCode))
        {
            redeemCode = normalizedLegacyCode;
        }
        else
        {
            do { redeemCode = $"ISM-{Random.Shared.Next(100000, 1000000)}"; }
            while (await _context.UserRewards.AnyAsync(x => x.RedeemCode == redeemCode));
        }

        var now = DateTime.UtcNow;
        var claim = new UserReward
        {
            Id = Guid.NewGuid(), UserId = userId.Value, RewardId = reward.Id,
            OrganizationId = user.OrganizationId, ClaimedAt = now, ExpiresAt = now.AddDays(7),
            Status = UserRewardStatuses.Claimed, RedeemCode = redeemCode
        };
        _context.UserRewards.Add(claim);
        reward.IssuedCount++;
        campaignRow.CurrentUsageCount++;
        await _context.SaveChangesAsync();

        return Ok(Result<object>.Ok(new
        {
            claimId = claim.Id, rewardId = reward.Id, rewardTitle = reward.Title,
            rewardDescription = reward.Description, claim.RedeemCode, claim.Status,
            claimedAt = claim.ClaimedAt, expiresAt = claim.ExpiresAt, redeemedAt = (DateTime?)null,
            isExpired = false, daysRemaining = 7, sourceType = "Ismarliyor"
        }, "İkram kuponunuza eklendi."));
    }

    public class IsmarliyorCampaignDto
    {
        public string Id { get; set; } = string.Empty;
        public string SponsorName { get; set; } = string.Empty;
        public string SponsorTitle { get; set; } = string.Empty;
        public string ItemName { get; set; } = string.Empty;
        public int Quota { get; set; }
        public int Claimed { get; set; }
        public string TargetAudience { get; set; } = "Tüm Vatandaşlar";
        public string EndDate { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
    }

    private sealed record IsmarliyorMetadata(string SponsorName, string SponsorTitle);

    private static IsmarliyorCampaignDto ToIsmarliyorDto(Campaign row)
    {
        IsmarliyorMetadata? metadata = null;
        try { metadata = JsonSerializer.Deserialize<IsmarliyorMetadata>(row.Description); } catch (JsonException) { }
        return new IsmarliyorCampaignDto
        {
            Id = row.Id.ToString(), SponsorName = metadata?.SponsorName ?? "Şehitkamil Belediyesi",
            SponsorTitle = metadata?.SponsorTitle ?? "Kurumsal İkram", ItemName = row.Title,
            Quota = row.TotalUsageLimit ?? 0, Claimed = row.CurrentUsageCount,
            TargetAudience = row.TargetUserGroup,
            EndDate = row.EndDate.ToLocalTime().ToString("yyyy-MM-dd"), IsActive = row.IsActive
        };
    }

    private static DateTime ParseIsmarliyorEndDate(string? value)
    {
        if (DateTime.TryParse(value, out var parsed))
            return DateTime.SpecifyKind(parsed.Date.AddDays(1).AddTicks(-1), DateTimeKind.Local).ToUniversalTime();
        return DateTime.UtcNow.AddDays(7);
    }

    public class CreateCampaignRequest
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public string CampaignType { get; set; } = "FixedBonus";
        public DateTime StartDate { get; set; } = DateTime.UtcNow;
        public DateTime EndDate { get; set; } = DateTime.UtcNow.AddDays(30);
        public string TargetUserGroup { get; set; } = "All";
        public Guid? CafeId { get; set; }
        public Guid? MenuItemId { get; set; }
        public int? TotalUsageLimit { get; set; }
        public int? PerUserLimit { get; set; }
    }
}
