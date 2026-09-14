using System.Linq;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GolBox.Application.Authorization;
using GolBox.Application.Common;
using GolBox.Application.Features.Settings.Commands;
using GolBox.Application.Features.Settings.Queries;
using GolBox.Application.Interfaces;

namespace GolBox.Api.Controllers;

[Authorize]
public class SettingsController : BaseApiController
{
    private static readonly string[] PublicKeys =
    [
        "visitBonusPoints",
        "rewardExpireDays",
        "pointsExchangeRate"
    ];

    private readonly IMediator _mediator;
    private readonly IAppDbContext _context;

    public SettingsController(IMediator mediator, IAppDbContext context)
    {
        _mediator = mediator;
        _context = context;
    }

    [HttpGet("public")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPublicSettings()
    {
        var orgId = KnownOrganizations.Sehitkamil;
        var org = await _context.Organizations.OrderBy(o => o.CreatedDate).FirstOrDefaultAsync();
        if (org != null)
            orgId = org.Id;

        var settings = await _context.Settings
            .Where(s => s.OrganizationId == orgId && PublicKeys.Contains(s.Key))
            .Select(s => new { s.Key, s.Value })
            .ToListAsync();

        var map = settings.ToDictionary(s => s.Key, s => s.Value);
        int.TryParse(map.GetValueOrDefault("visitBonusPoints"), out var visitBonus);
        int.TryParse(map.GetValueOrDefault("rewardExpireDays"), out var expireDays);
        decimal.TryParse(map.GetValueOrDefault("pointsExchangeRate"), out var exchange);

        return Ok(Result<object>.Ok(new
        {
            visitBonusPoints = visitBonus > 0 ? visitBonus : 15,
            rewardExpireDays = expireDays > 0 ? expireDays : 365,
            pointsExchangeRate = exchange > 0 ? exchange : 1m
        }));
    }

    [HttpGet]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> GetSettings()
    {
        var result = await _mediator.Send(new GetSettingsQuery());
        return HandleResult(result);
    }

    [HttpPut("{key}")]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> UpdateSetting(string key, [FromBody] UpdateSettingRequest request)
    {
        var result = await _mediator.Send(new UpdateSettingCommand(key, request.Value));
        return HandleResult(result);
    }
}

public record UpdateSettingRequest(string Value);
