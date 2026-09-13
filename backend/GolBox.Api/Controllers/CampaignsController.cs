using System;
using System.Linq;
using System.Threading.Tasks;
using GolBox.Application.Authorization;
using GolBox.Application.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GolBox.Application.Common;
using GolBox.Application.Interfaces;
using GolBox.Domain.Entities;

namespace GolBox.Api.Controllers;

[Authorize]
public class CampaignsController : BaseApiController
{
    private readonly IAppDbContext _context;

    public CampaignsController(IAppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [Authorize(Policy = AuthorizationPolicies.StaffOrAdmin)]
    public async Task<IActionResult> GetCampaigns()
    {
        var list = await _context.Campaigns
            .OrderByDescending(c => c.CreatedDate)
            .ToListAsync();
        return Ok(Result<object>.Ok(list));
    }

    [HttpPost]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> CreateCampaign([FromBody] CreateCampaignRequest request)
    {
        var org = await _context.Organizations.FirstOrDefaultAsync();
        var campaign = new Campaign
        {
            Id = Guid.NewGuid(),
            OrganizationId = org?.Id ?? KnownOrganizations.Sehitkamil,
            Title = request.Title,
            Description = request.Description,
            ImageUrl = request.ImageUrl,
            CampaignType = request.CampaignType,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            TargetUserGroup = request.TargetUserGroup,
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
