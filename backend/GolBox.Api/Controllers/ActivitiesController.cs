using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using GolBox.Application.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GolBox.Application.Content;
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
    private readonly ICurrentUserService _currentUser;

    public ActivitiesController(IMediator mediator, IAppDbContext context, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _context = context;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<IActionResult> GetUpcomingActivities()
    {
        var result = await _mediator.Send(new GetUpcomingActivitiesQuery());
        return HandleResult(result);
    }

    [HttpGet("public")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPublicActivities(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, CityContentRules.MaxPageSize);
        var orgId = await ResolveOrganizationIdAsync(cancellationToken);
        var now = DateTime.UtcNow;
        var query = _context.Activities.AsNoTracking()
            .Where(a => a.OrganizationId == orgId && a.Status == "Active" && a.EndDate >= now);

        var total = await query.CountAsync(cancellationToken);
        var userId = _currentUser.IsAuthenticated ? _currentUser.UserId : null;
        var joined = userId.HasValue
            ? await _context.UserActivities.AsNoTracking()
                .Where(ua => ua.UserId == userId.Value)
                .Select(ua => ua.ActivityId)
                .ToListAsync(cancellationToken)
            : [];

        var items = await query
            .OrderBy(a => a.StartDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new PublicActivityDto(
                a.Id,
                a.Title,
                a.Description,
                a.ImageUrl,
                a.Location,
                a.StartDate,
                a.EndDate,
                a.Capacity,
                a.UserActivities.Count,
                a.PointsReward,
                userId.HasValue && joined.Contains(a.Id),
                a.PlaceId,
                a.Place != null ? a.Place.Name : null,
                a.Place != null ? a.Place.Address : null,
                a.Place != null ? a.Place.Latitude : null,
                a.Place != null ? a.Place.Longitude : null
            ))
            .ToListAsync(cancellationToken);

        return Ok(Result<object>.Ok(new PagedResult<PublicActivityDto>(items, page, pageSize, total)));
    }

    [HttpGet("{id:guid}/public")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPublicActivity(Guid id, CancellationToken cancellationToken)
    {
        var orgId = await ResolveOrganizationIdAsync(cancellationToken);
        var activity = await _context.Activities.AsNoTracking()
            .Where(a => a.Id == id && a.OrganizationId == orgId && a.Status == "Active")
            .Select(a => new
            {
                a.Id,
                a.Title,
                a.Description,
                a.ImageUrl,
                a.Location,
                a.StartDate,
                a.EndDate,
                a.Capacity,
                JoinedCount = a.UserActivities.Count,
                a.PointsReward,
                a.PlaceId,
                PlaceName = a.Place != null ? a.Place.Name : null,
                PlaceAddress = a.Place != null ? a.Place.Address : null,
                PlaceLatitude = a.Place != null ? a.Place.Latitude : null,
                PlaceLongitude = a.Place != null ? a.Place.Longitude : null
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (activity == null)
            return NotFound(Result<object>.Fail("Etkinlik bulunamadı."));

        var isJoined = false;
        if (_currentUser.IsAuthenticated && _currentUser.UserId.HasValue)
        {
            isJoined = await _context.UserActivities.AsNoTracking()
                .AnyAsync(ua => ua.ActivityId == id && ua.UserId == _currentUser.UserId.Value, cancellationToken);
        }

        return Ok(Result<object>.Ok(new PublicActivityDto(
            activity.Id,
            activity.Title,
            activity.Description,
            activity.ImageUrl,
            activity.Location,
            activity.StartDate,
            activity.EndDate,
            activity.Capacity,
            activity.JoinedCount,
            activity.PointsReward,
            isJoined,
            activity.PlaceId,
            activity.PlaceName,
            activity.PlaceAddress,
            activity.PlaceLatitude,
            activity.PlaceLongitude
        )));
    }

    [HttpGet("admin")]
    [Authorize(Policy = AuthorizationPolicies.StaffOrAdmin)]
    public async Task<IActionResult> GetAdminActivities(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);
        var orgId = await ResolveOrganizationIdAsync(cancellationToken);
        var query = _context.Activities.AsNoTracking().Where(a => a.OrganizationId == orgId);
        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(a => a.StartDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new
            {
                a.Id,
                a.Title,
                a.Description,
                a.ImageUrl,
                a.Location,
                a.StartDate,
                a.EndDate,
                a.Capacity,
                joinedCount = a.UserActivities.Count,
                a.PointsReward,
                a.Status,
                a.PlaceId,
                placeName = a.Place != null ? a.Place.Name : null
            })
            .ToListAsync(cancellationToken);

        return Ok(Result<object>.Ok(new { items, page, pageSize, totalCount = total }));
    }

    [HttpPost("{id}/join")]
    public async Task<IActionResult> JoinActivity(Guid id)
    {
        var result = await _mediator.Send(new JoinActivityCommand(id));
        return HandleResult(result);
    }

    [HttpPost]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> CreateActivity([FromBody] CreateActivityRequest request)
    {
        if (request.PlaceId is Guid placeId)
        {
            var org = request.OrganizationId == Guid.Empty ? KnownOrganizations.Sehitkamil : request.OrganizationId;
            var placeOk = await _context.Places.AnyAsync(p => p.Id == placeId && p.OrganizationId == org);
            if (!placeOk)
                return BadRequest(Result<object>.Fail("Seçilen tesis bulunamadı."));
        }

        var activity = new Activity
        {
            Id = Guid.NewGuid(),
            OrganizationId = request.OrganizationId == Guid.Empty ? KnownOrganizations.Sehitkamil : request.OrganizationId,
            Title = request.Title,
            Description = request.Description,
            PointsReward = request.PointsReward,
            Location = request.Location,
            ImageUrl = MediaUrlNormalizer.Normalize(request.ImageUrl),
            Capacity = request.Capacity is > 0 ? request.Capacity : null,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            Status = "Active",
            PlaceId = request.PlaceId
        };

        _context.Activities.Add(activity);
        await _context.SaveChangesAsync();
        await AuditLogsController.LogAsync(_context, "admin", "Admin", "Activity_Create", "Activities", "Activity", activity.Id.ToString(), null, activity.Title, null);

        return Ok(Result<object>.Ok(new { id = activity.Id }, "Etkinlik başarıyla oluşturuldu."));
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> DeleteActivity(Guid id)
    {
        var activity = await _context.Activities.FindAsync(id);
        if (activity == null)
            return NotFound(Result<object>.Fail("Etkinlik bulunamadı."));

        activity.IsDeleted = true;
        activity.DeletedDate = DateTime.UtcNow;
        
        await _context.SaveChangesAsync();
        return Ok(Result<object>.Ok(new { id }, "Etkinlik başarıyla silindi."));
    }

    private async Task<Guid> ResolveOrganizationIdAsync(CancellationToken cancellationToken)
    {
        var orgId = await _context.Organizations.AsNoTracking()
            .OrderBy(o => o.CreatedDate)
            .Select(o => o.Id)
            .FirstOrDefaultAsync(cancellationToken);
        return orgId == Guid.Empty ? KnownOrganizations.Sehitkamil : orgId;
    }
}

public record PublicActivityDto(
    Guid Id,
    string Title,
    string Description,
    string? ImageUrl,
    string Location,
    DateTime StartDate,
    DateTime EndDate,
    int? Capacity,
    int JoinedCount,
    int RewardPoints,
    bool IsJoined,
    Guid? PlaceId = null,
    string? PlaceName = null,
    string? PlaceAddress = null,
    decimal? PlaceLatitude = null,
    decimal? PlaceLongitude = null
);

public class CreateActivityRequest
{
    public Guid OrganizationId { get; set; } = KnownOrganizations.Sehitkamil;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int PointsReward { get; set; }
    public string Location { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public int? Capacity { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public Guid? PlaceId { get; set; }
}
