using GolBox.Application.Authorization;
using GolBox.Application.Common;
using GolBox.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DomainTask = GolBox.Domain.Entities.Task;
using GolBox.Api.Services;

namespace GolBox.Api.Controllers;

[Authorize(Policy = AuthorizationPolicies.StaffOrAdmin)]
public class MissionsController : BaseApiController
{
    private static readonly string[] MissionTypes = ["ORDER_COMPLETED", "EVENT_ATTENDED", "DISTINCT_BRANCH", "DISTINCT_CATEGORY", "FIRST_ORDER"];
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly CitizenNotificationService _notifications;

    public MissionsController(IAppDbContext context, ICurrentUserService currentUser, CitizenNotificationService notifications)
    {
        _context = context;
        _currentUser = currentUser;
        _notifications = notifications;
    }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] int page = 1, [FromQuery] int pageSize = 25,
        [FromQuery] string? search = null, [FromQuery] string? status = null, CancellationToken cancellationToken = default)
    {
        (page, pageSize) = AdminPaging.Normalize(page, pageSize);
        var query = _context.Tasks.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(search)) { var term = search.Trim(); query = query.Where(t => t.Title.Contains(term) || t.Description.Contains(term)); }
        if (!string.IsNullOrWhiteSpace(status) && status != "All") query = query.Where(t => t.Status == status);
        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query.OrderByDescending(t => t.CreatedDate).Skip((page - 1) * pageSize).Take(pageSize)
            .Select(t => new
            {
                t.Id, t.Title, t.ShortDescription, fullDescription = t.Description, t.Category, t.MissionType,
                t.TargetProgress, pointsGranted = t.PointsReward, t.StartDate, t.EndDate, t.Status, t.TargetAudience,
                t.HowToCompleteJson, joinedCount = t.UserTasks.Count, completedCount = t.UserTasks.Count
            }).ToListAsync(cancellationToken);
        var all = await _context.Tasks.AsNoTracking().Select(t => new { t.Status, completed = t.UserTasks.Count }).ToListAsync(cancellationToken);
        return Ok(Result<object>.Ok(new { items, page, pageSize, totalCount, summary = new { total = all.Count, active = all.Count(x => x.Status == "Active"), draft = all.Count(x => x.Status == "Draft"), completed = all.Sum(x => x.completed) } }));
    }

    [HttpPost]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> Create([FromBody] MissionRequest request, CancellationToken cancellationToken)
    {
        var validation = Validate(request); if (validation != null) return BadRequest(Result<object>.Fail(validation));
        var mission = new DomainTask { Id = Guid.NewGuid(), OrganizationId = KnownOrganizations.Sehitkamil, Status = "Draft" };
        Apply(mission, request);
        _context.Tasks.Add(mission); await _context.SaveChangesAsync(cancellationToken);
        await AuditLogsController.LogAsync(_context, _currentUser.Email ?? "admin", _currentUser.Role ?? "Admin", "Mission_Create", "Missions", "Task", mission.Id.ToString(), null, mission.Title, mission.MissionType);
        return Ok(Result<object>.Ok(new { mission.Id }, "Görev taslak olarak oluşturuldu."));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> Update(Guid id, [FromBody] MissionRequest request, CancellationToken cancellationToken)
    {
        var validation = Validate(request); if (validation != null) return BadRequest(Result<object>.Fail(validation));
        var mission = await _context.Tasks.FindAsync(new object[] { id }, cancellationToken);
        if (mission == null) return NotFound(Result<object>.Fail("Görev bulunamadı."));
        var previous = $"{mission.Title};{mission.MissionType};{mission.TargetProgress};{mission.PointsReward}";
        Apply(mission, request); mission.UpdatedDate = DateTime.UtcNow; await _context.SaveChangesAsync(cancellationToken);
        await AuditLogsController.LogAsync(_context, _currentUser.Email ?? "admin", _currentUser.Role ?? "Admin", "Mission_Update", "Missions", "Task", id.ToString(), previous, $"{mission.Title};{mission.MissionType};{mission.TargetProgress};{mission.PointsReward}", null);
        return Ok(Result<object>.Ok(new { mission.Id }, "Görev güncellendi."));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var mission = await _context.Tasks.AsNoTracking()
            .Include(t => t.UserTasks)
                .ThenInclude(ut => ut.User)
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken);
        if (mission == null) return NotFound(Result<object>.Fail("Görev bulunamadı."));

        var recentUsers = mission.UserTasks
            .OrderByDescending(ut => ut.CompletedAt)
            .Take(10)
            .Select(ut => new { ut.UserId, userFullName = $"{ut.User?.FirstName} {ut.User?.LastName}".Trim(), ut.CompletedAt, ut.PointsEarned })
            .ToList();

        return Ok(Result<object>.Ok(new
        {
            mission.Id,
            mission.Title,
            mission.ShortDescription,
            fullDescription = mission.Description,
            mission.Category,
            mission.MissionType,
            mission.TargetProgress,
            pointsGranted = mission.PointsReward,
            mission.StartDate,
            mission.EndDate,
            mission.Status,
            mission.TargetAudience,
            mission.HowToCompleteJson,
            joinedCount = mission.UserTasks.Count,
            completedCount = mission.UserTasks.Count,
            recentCompletions = recentUsers
        }));
    }

    [HttpPost("{id:guid}/publish")]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> Publish(Guid id, CancellationToken cancellationToken) => await SetStatus(id, "Active", "Görev yayınlandı ve aktif edildi.", cancellationToken);

    [HttpPost("{id:guid}/end")]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> End(Guid id, CancellationToken cancellationToken) => await SetStatus(id, "Ended", "Görev sona erdirildi.", cancellationToken);

    [HttpPost("{id:guid}/duplicate")]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> Duplicate(Guid id, CancellationToken cancellationToken)
    {
        var source = await _context.Tasks.AsNoTracking().FirstOrDefaultAsync(t => t.Id == id, cancellationToken);
        if (source == null) return NotFound(Result<object>.Fail("Kopyalanacak görev bulunamadı."));

        var copy = new DomainTask
        {
            Id = Guid.NewGuid(),
            OrganizationId = source.OrganizationId,
            Title = $"{source.Title} (Kopya)",
            ShortDescription = source.ShortDescription,
            Description = source.Description,
            Category = source.Category,
            MissionType = source.MissionType,
            TargetProgress = source.TargetProgress,
            PointsReward = source.PointsReward,
            StartDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddDays(30),
            Status = "Draft",
            TargetAudience = source.TargetAudience,
            HowToCompleteJson = source.HowToCompleteJson,
            MaxCompletions = source.MaxCompletions
        };

        _context.Tasks.Add(copy);
        await _context.SaveChangesAsync(cancellationToken);
        await AuditLogsController.LogAsync(_context, _currentUser.Email ?? "admin", _currentUser.Role ?? "Admin", "Mission_Duplicate", "Missions", "Task", copy.Id.ToString(), source.Id.ToString(), copy.Title, null);

        return Ok(Result<object>.Ok(new { id = copy.Id, title = copy.Title }, "Görev başarıyla kopyalandı (Taslak olarak kaydedildi)."));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var mission = await _context.Tasks.FirstOrDefaultAsync(t => t.Id == id, cancellationToken);
        if (mission == null) return NotFound(Result<object>.Fail("Silinecek görev bulunamadı."));

        mission.Status = "Cancelled";
        mission.IsDeleted = true;
        mission.DeletedDate = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        await AuditLogsController.LogAsync(_context, _currentUser.Email ?? "admin", _currentUser.Role ?? "Admin", "Mission_Delete", "Missions", "Task", id.ToString(), mission.Title, "Cancelled", null);
        return Ok(Result<object>.Ok(new { id }, "Görev silindi (iptal edildi)."));
    }

    private async Task<IActionResult> SetStatus(Guid id, string status, string message, CancellationToken cancellationToken)
    {
        var mission = await _context.Tasks.FindAsync(new object[] { id }, cancellationToken);
        if (mission == null) return NotFound(Result<object>.Fail("Görev bulunamadı."));
        var previous = mission.Status; mission.Status = status; mission.UpdatedDate = DateTime.UtcNow; await _context.SaveChangesAsync(cancellationToken);
        if (status == "Active" && previous != "Active")
            await _notifications.SendToOrganizationAsync(mission.OrganizationId, "Yeni görev yayınlandı",
                $"{mission.Title}: {mission.ShortDescription}", "MISSION_NEW", "MISSION", mission.Id.ToString(), cancellationToken);
        await AuditLogsController.LogAsync(_context, _currentUser.Email ?? "admin", _currentUser.Role ?? "Admin", status == "Active" ? "Mission_Publish" : "Mission_End", "Missions", "Task", id.ToString(), previous, status, null);
        return Ok(Result<object>.Ok(new { mission.Id, mission.Status }, message));
    }

    private static void Apply(DomainTask mission, MissionRequest request)
    {
        mission.Title = request.Title.Trim(); mission.ShortDescription = request.ShortDescription.Trim(); mission.Description = request.FullDescription?.Trim() ?? string.Empty;
        mission.Category = request.Category; mission.MissionType = request.MissionType; mission.TargetProgress = request.TargetProgress;
        mission.PointsReward = request.PointsGranted; mission.StartDate = request.StartDate; mission.EndDate = request.EndDate;
        mission.TargetAudience = request.TargetAudience; mission.HowToCompleteJson = request.HowToCompleteJson; mission.MaxCompletions = 1;
    }

    private static string? Validate(MissionRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title) || string.IsNullOrWhiteSpace(request.ShortDescription)) return "Görev başlığı ve kısa açıklama zorunludur.";
        if (!MissionTypes.Contains(request.MissionType)) return "Desteklenmeyen görev tetikleyicisi.";
        if (request.TargetProgress is < 1 or > 100) return "Hedef 1 ile 100 arasında olmalıdır.";
        if (request.PointsGranted is < 1 or > AdminSafetyRules.MaxActivityRewardGp) return $"Ödül 1 ile {AdminSafetyRules.MaxActivityRewardGp} GP arasında olmalıdır.";
        if (request.EndDate <= request.StartDate) return "Bitiş tarihi başlangıç tarihinden sonra olmalıdır.";
        return null;
    }
}

public class MissionRequest
{
    public string Title { get; set; } = string.Empty;
    public string ShortDescription { get; set; } = string.Empty;
    public string? FullDescription { get; set; }
    public string Category { get; set; } = "GölBOX";
    public string MissionType { get; set; } = "ORDER_COMPLETED";
    public int TargetProgress { get; set; } = 1;
    public int PointsGranted { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string TargetAudience { get; set; } = "All";
    public string? HowToCompleteJson { get; set; }
}
