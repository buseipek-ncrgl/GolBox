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
using GolBox.Application.Features.Tasks;

namespace GolBox.Api.Controllers;

[Authorize]
public class ActivitiesController : BaseApiController
{
    private readonly IMediator _mediator;
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IDynamicQrService? _qrService;

    public ActivitiesController(IMediator mediator, IAppDbContext context, ICurrentUserService currentUser, IDynamicQrService? qrService = null)
    {
        _mediator = mediator;
        _context = context;
        _currentUser = currentUser;
        _qrService = qrService;
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
        var registrations = userId.HasValue
            ? await _context.UserActivities.AsNoTracking()
                .Where(ua => ua.UserId == userId.Value)
                .Select(ua => new { ua.ActivityId, ua.CheckedInAt })
                .ToListAsync(cancellationToken)
            : [];

        var activityRows = await query
            .OrderBy(a => a.StartDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new
            {
                a.Id,
                a.Title,
                a.Description,
                a.Category,
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
            .ToListAsync(cancellationToken);

        var registrationByActivity = registrations.ToDictionary(r => r.ActivityId);
        var items = activityRows.Select(a =>
        {
            registrationByActivity.TryGetValue(a.Id, out var registration);
            return new PublicActivityDto(
                a.Id,
                a.Title,
                a.Description,
                a.ImageUrl,
                a.Location,
                a.StartDate,
                a.EndDate,
                a.Capacity,
                a.JoinedCount,
                a.PointsReward,
                registration != null,
                registration?.CheckedInAt,
                a.PlaceId,
                a.PlaceName,
                a.PlaceAddress,
                a.PlaceLatitude,
                a.PlaceLongitude,
                a.Category ?? "Gençlik");
        }).ToList();

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
        DateTime? checkedInAt = null;
        if (_currentUser.IsAuthenticated && _currentUser.UserId.HasValue)
        {
            var registration = await _context.UserActivities.AsNoTracking()
                .Where(ua => ua.ActivityId == id && ua.UserId == _currentUser.UserId.Value)
                .Select(ua => new { ua.CheckedInAt }).FirstOrDefaultAsync(cancellationToken);
            isJoined = registration != null;
            checkedInAt = registration?.CheckedInAt;
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
            checkedInAt,
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
        [FromQuery] int pageSize = AdminPaging.DefaultPageSize,
        [FromQuery] string? filter = null,
        [FromQuery] string? status = null,
        [FromQuery] string? search = null,
        CancellationToken cancellationToken = default)
    {
        (page, pageSize) = AdminPaging.Normalize(page, pageSize);
        var orgId = await ResolveOrganizationIdAsync(cancellationToken);
        var now = DateTime.UtcNow;
        var query = _context.Activities.AsNoTracking().Where(a => a.OrganizationId == orgId);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(a => a.Title.Contains(term) || a.Location.Contains(term));
        }
        if (!string.IsNullOrWhiteSpace(status) && status != "All")
            query = query.Where(a => a.Status == status);
        switch ((filter ?? "").Trim().ToLowerInvariant())
        {
            case "upcoming":
                query = query.Where(a => a.StartDate > now);
                break;
            case "ongoing":
                query = query.Where(a => a.StartDate <= now && a.EndDate >= now);
                break;
            case "ended":
                query = query.Where(a => a.EndDate < now);
                break;
            case "draft":
                query = query.Where(a => a.Status == "Draft");
                break;
            case "published":
                query = query.Where(a => a.Status == "Active");
                break;
        }

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
                checkedInCount = a.UserActivities.Count(ua => ua.CheckedInAt != null),
                a.PointsReward,
                a.Status,
                a.PlaceId,
                placeName = a.Place != null ? a.Place.Name : null
            })
            .ToListAsync(cancellationToken);

        return Ok(Result<object>.Ok(new { items, page, pageSize, totalCount = total }));
    }

    [HttpGet("{id:guid}/check-ins")]
    [Authorize(Policy = AuthorizationPolicies.StaffOrAdmin)]
    public async Task<IActionResult> GetCheckIns(Guid id, CancellationToken cancellationToken)
    {
        var activity = await _context.Activities.AsNoTracking().FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
        if (activity == null) return NotFound(Result<object>.Fail("Etkinlik bulunamadı."));
        var registrations = await _context.UserActivities.AsNoTracking()
            .Where(ua => ua.ActivityId == id).Include(ua => ua.User)
            .OrderByDescending(ua => ua.CheckedInAt ?? ua.JoinedAt)
            .Select(ua => new { ua.Id, ua.UserId, userFullName = ua.User.FirstName + " " + ua.User.LastName,
                ua.User.Email, ua.JoinedAt, ua.CheckedInAt, ua.PointsEarned, ua.PointsAwardedAt, ua.CheckInNotes })
            .ToListAsync(cancellationToken);
        return Ok(Result<object>.Ok(new { activityId = id, activity.Title, activity.Capacity, activity.PointsReward,
            registeredCount = registrations.Count, checkedInCount = registrations.Count(x => x.CheckedInAt != null), items = registrations }));
    }

    [HttpPost("{id:guid}/check-in")]
    [Authorize(Policy = AuthorizationPolicies.StaffOrAdmin)]
    public async Task<IActionResult> CheckIn(Guid id, [FromBody] EventCheckInRequest request, CancellationToken cancellationToken)
    {
        if (_qrService == null) return StatusCode(503, Result<object>.Fail("QR doğrulama servisi kullanılamıyor."));
        var validation = _qrService.ValidateDynamicQrToken(request.QrToken?.Trim() ?? string.Empty);
        if (!validation.IsValid || validation.UserId == null)
            return BadRequest(Result<object>.Fail(validation.ErrorMessage ?? "Geçersiz veya süresi dolmuş GölBOX QR kodu."));

        var activity = await _context.Activities.FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
        if (activity == null || activity.Status != "Active")
            return NotFound(Result<object>.Fail("Aktif etkinlik bulunamadı."));
        var now = DateTime.UtcNow;
        if (now < activity.StartDate.AddHours(-2))
            return BadRequest(Result<object>.Fail("Check-in etkinlik başlangıcından 2 saat önce açılır."));
        if (now > activity.EndDate.AddHours(4))
            return BadRequest(Result<object>.Fail("Etkinliğin check-in süresi sona ermiş."));

        var registration = await _context.UserActivities.Include(ua => ua.User)
            .FirstOrDefaultAsync(ua => ua.ActivityId == id && ua.UserId == validation.UserId.Value, cancellationToken);
        if (registration == null)
            return BadRequest(Result<object>.Fail("Vatandaş bu etkinliğe kayıtlı değil."));
        if (registration.CheckedInAt.HasValue)
            return Conflict(Result<object>.Fail($"Katılım daha önce {registration.CheckedInAt.Value.ToLocalTime():dd.MM.yyyy HH:mm} tarihinde doğrulanmış."));

        var pointsToAward = registration.PointsEarned > 0 ? 0 : activity.PointsReward;
        registration.CheckedInAt = now;
        registration.CheckedInBy = _currentUser.UserId;
        registration.CheckInNotes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim();
        if (pointsToAward > 0)
        {
            registration.PointsEarned = pointsToAward;
            registration.PointsAwardedAt = now;
            registration.User.PointsBalance += pointsToAward;
            _context.PointTransactions.Add(new PointTransaction { Id = Guid.NewGuid(), UserId = registration.UserId,
                OrganizationId = registration.OrganizationId, Amount = pointsToAward, Type = "Earn",
                Description = $"{activity.Title} doğrulanmış katılım ödülü", ReferenceType = "ActivityCheckIn", ReferenceId = registration.Id,
                BalanceAfter = registration.User.PointsBalance,
                CreatedDate = now });
        }

        try { await _context.SaveChangesAsync(cancellationToken); }
        catch (DbUpdateConcurrencyException) { return Conflict(Result<object>.Fail("Puan bakiyesi başka bir işlemle değişti. Tekrar deneyin.")); }

        var missionPoints = await MissionAwardService.AwardEligibleAsync(_context, registration.UserId, cancellationToken);

        await AuditLogsController.LogAsync(_context, _currentUser.Email ?? "staff", _currentUser.Role ?? "Staff", "Event_CheckIn",
            "Activities", "UserActivity", registration.Id.ToString(), null, "CheckedIn", $"Activity={activity.Title}; Points={pointsToAward}");
        return Ok(Result<object>.Ok(new { registration.Id, registration.UserId,
            userFullName = $"{registration.User.FirstName} {registration.User.LastName}".Trim(), registration.User.Email,
            registration.CheckedInAt, pointsEarned = pointsToAward, missionPointsEarned = missionPoints, newPointsBalance = registration.User.PointsBalance,
            activityId = activity.Id, activityTitle = activity.Title }, "Katılım doğrulandı ve etkinlik puanı hesaba eklendi."));
    }

    [HttpPost("{id}/join")]
    public async Task<IActionResult> JoinActivity(Guid id)
    {
        var result = await _mediator.Send(new JoinActivityCommand(id));
        return HandleResult(result);
    }

    [HttpDelete("{id:guid}/join")]
    public async Task<IActionResult> CancelJoin(Guid id, CancellationToken cancellationToken)
    {
        if (!_currentUser.UserId.HasValue) return Unauthorized(Result<object>.Fail("Oturum doğrulanamadı."));
        var registration = await _context.UserActivities.FirstOrDefaultAsync(
            ua => ua.ActivityId == id && ua.UserId == _currentUser.UserId.Value, cancellationToken);
        if (registration == null) return NotFound(Result<object>.Fail("Etkinlik kaydı bulunamadı."));
        if (registration.CheckedInAt.HasValue)
            return BadRequest(Result<object>.Fail("Doğrulanmış katılım kaydı iptal edilemez."));
        registration.IsDeleted = true;
        registration.DeletedDate = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);
        return Ok(Result<object>.Ok(new { activityId = id }, "Etkinlik kaydınız iptal edildi."));
    }

    [HttpPost]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> CreateActivity([FromBody] CreateActivityRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
            return BadRequest(Result<object>.Fail("Etkinlik başlığı zorunludur."));

        var scheduleCheck = AdminSafetyRules.ValidateActivitySchedule(request.StartDate, request.EndDate);
        if (!scheduleCheck.Success)
            return BadRequest(Result<object>.Fail(scheduleCheck.Message));
        var rewardCheck = AdminSafetyRules.ValidateActivityReward(request.PointsReward);
        if (!rewardCheck.Success)
            return BadRequest(Result<object>.Fail(rewardCheck.Message));
        var capacityCheck = AdminSafetyRules.ValidateActivityCapacity(request.Capacity);
        if (!capacityCheck.Success)
            return BadRequest(Result<object>.Fail(capacityCheck.Message));

        string location = request.Location?.Trim() ?? string.Empty;
        Guid? placeId = request.PlaceId;
        if (placeId is Guid selectedPlaceId)
        {
            var org = request.OrganizationId == Guid.Empty ? KnownOrganizations.Sehitkamil : request.OrganizationId;
            var place = await _context.Places.AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == selectedPlaceId && p.OrganizationId == org);
            if (place == null)
                return BadRequest(Result<object>.Fail("Seçilen tesis bulunamadı."));
            location = string.IsNullOrWhiteSpace(place.Address) ? place.Name : place.Address!;
        }

        var activity = new Activity
        {
            Id = Guid.NewGuid(),
            OrganizationId = request.OrganizationId == Guid.Empty ? KnownOrganizations.Sehitkamil : request.OrganizationId,
            Title = request.Title.Trim(),
            Category = string.IsNullOrWhiteSpace(request.Category) ? "Gençlik" : request.Category.Trim(),
            Description = request.Description?.Trim() ?? string.Empty,
            PointsReward = request.PointsReward,
            Location = location,
            ImageUrl = MediaUrlNormalizer.Normalize(request.ImageUrl),
            Capacity = request.Capacity is > 0 ? request.Capacity : request.Capacity == 0 ? 0 : null,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            Status = "Active",
            PlaceId = placeId
        };

        _context.Activities.Add(activity);
        await _context.SaveChangesAsync();
        await AuditLogsController.LogAsync(_context, "admin", "Admin", "Activity_Create", "Activities", "Activity", activity.Id.ToString(), null, activity.Title, null);

        return Ok(Result<object>.Ok(new { id = activity.Id }, "Etkinlik başarıyla oluşturuldu."));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> UpdateActivity(Guid id, [FromBody] CreateActivityRequest request)
    {
        var activity = await _context.Activities.FindAsync(id);
        if (activity == null)
            return NotFound(Result<object>.Fail("Etkinlik bulunamadı."));
        if (string.IsNullOrWhiteSpace(request.Title))
            return BadRequest(Result<object>.Fail("Etkinlik başlığı zorunludur."));

        var scheduleCheck = AdminSafetyRules.ValidateActivitySchedule(request.StartDate, request.EndDate, allowPastStart: true);
        if (!scheduleCheck.Success)
            return BadRequest(Result<object>.Fail(scheduleCheck.Message));
        var rewardCheck = AdminSafetyRules.ValidateActivityReward(request.PointsReward);
        if (!rewardCheck.Success)
            return BadRequest(Result<object>.Fail(rewardCheck.Message));
        var capacityCheck = AdminSafetyRules.ValidateActivityCapacity(request.Capacity);
        if (!capacityCheck.Success)
            return BadRequest(Result<object>.Fail(capacityCheck.Message));

        string location = request.Location?.Trim() ?? string.Empty;
        Guid? placeId = request.PlaceId;
        if (placeId is Guid selectedPlaceId)
        {
            var org = activity.OrganizationId;
            var place = await _context.Places.AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == selectedPlaceId && p.OrganizationId == org);
            if (place == null)
                return BadRequest(Result<object>.Fail("Seçilen tesis bulunamadı."));
            location = string.IsNullOrWhiteSpace(place.Address) ? place.Name : place.Address!;
        }
        else
        {
            placeId = null;
        }

        var previous = activity.Title;
        activity.Title = request.Title.Trim();
        activity.Category = string.IsNullOrWhiteSpace(request.Category) ? "Gençlik" : request.Category.Trim();
        activity.Description = request.Description?.Trim() ?? string.Empty;
        activity.PointsReward = request.PointsReward;
        activity.Location = location;
        if (request.ImageUrl != null)
            activity.ImageUrl = MediaUrlNormalizer.Normalize(request.ImageUrl);
        activity.Capacity = request.Capacity is > 0 ? request.Capacity : request.Capacity == 0 ? 0 : null;
        activity.StartDate = request.StartDate;
        activity.EndDate = request.EndDate;
        activity.PlaceId = placeId;
        activity.UpdatedDate = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        await AuditLogsController.LogAsync(_context, "admin", "Admin", "Activity_Update", "Activities", "Activity", activity.Id.ToString(), previous, activity.Title, null);
        return Ok(Result<object>.Ok(new { id = activity.Id }, "Etkinlik güncellendi."));
    }

    [HttpPost("{id:guid}/publish")]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> PublishActivity(Guid id)
    {
        var activity = await _context.Activities.FindAsync(id);
        if (activity == null)
            return NotFound(Result<object>.Fail("Etkinlik bulunamadı."));
        activity.Status = "Active";
        activity.UpdatedDate = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        await AuditLogsController.LogAsync(_context, "admin", "Admin", "Activity_Publish", "Activities", "Activity", id.ToString(), null, "Active", null);
        return Ok(Result<object>.Ok(new { id, status = activity.Status }, "Etkinlik yayına alındı."));
    }

    [HttpPost("{id:guid}/unpublish")]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> UnpublishActivity(Guid id)
    {
        var activity = await _context.Activities.FindAsync(id);
        if (activity == null)
            return NotFound(Result<object>.Fail("Etkinlik bulunamadı."));
        activity.Status = "Draft";
        activity.UpdatedDate = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        await AuditLogsController.LogAsync(_context, "admin", "Admin", "Activity_Unpublish", "Activities", "Activity", id.ToString(), "Active", "Draft", null);
        return Ok(Result<object>.Ok(new { id, status = activity.Status }, "Etkinlik taslağa alındı."));
    }

    [HttpPost("{id:guid}/archive")]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> ArchiveActivity(Guid id)
    {
        var activity = await _context.Activities.FindAsync(id);
        if (activity == null)
            return NotFound(Result<object>.Fail("Etkinlik bulunamadı."));
        activity.Status = "Archived";
        activity.UpdatedDate = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        await AuditLogsController.LogAsync(_context, "admin", "Admin", "Activity_Archive", "Activities", "Activity", id.ToString(), null, "Archived", null);
        return Ok(Result<object>.Ok(new { id, status = activity.Status }, "Etkinlik arşivlendi."));
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> DeleteActivity(Guid id)
    {
        var activity = await _context.Activities.FindAsync(id);
        if (activity == null)
            return NotFound(Result<object>.Fail("Etkinlik bulunamadı."));

        var hasRegistrations = await _context.UserActivities.AnyAsync(x => x.ActivityId == id);
        if (hasRegistrations)
            return Conflict(Result<object>.Fail("Katılım kaydı bulunan etkinlik silinemez. Geçmişi korumak için etkinliği arşivleyin."));

        var previous = activity.Title;
        activity.IsDeleted = true;
        activity.Status = "Archived";
        activity.DeletedDate = DateTime.UtcNow;
        activity.UpdatedDate = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        await AuditLogsController.LogAsync(_context, "admin", "Admin", "Activity_Delete", "Activities", "Activity", id.ToString(), previous, null, "Katılım kaydı olmayan etkinlik silindi.");
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
    DateTime? CheckedInAt,
    Guid? PlaceId = null,
    string? PlaceName = null,
    string? PlaceAddress = null,
    decimal? PlaceLatitude = null,
    decimal? PlaceLongitude = null,
    string Category = "Gençlik"
);

public class EventCheckInRequest
{
    public string QrToken { get; set; } = string.Empty;
    public string? Notes { get; set; }
}

public class CreateActivityRequest
{
    public Guid OrganizationId { get; set; } = KnownOrganizations.Sehitkamil;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? Category { get; set; } = "Gençlik";
    public int PointsReward { get; set; }
    public string Location { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public int? Capacity { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public Guid? PlaceId { get; set; }
}
