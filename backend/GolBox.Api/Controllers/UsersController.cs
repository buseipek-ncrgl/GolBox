using System;
using System.Linq;
using System.Threading.Tasks;
using MediatR;
using GolBox.Application.Authorization;
using GolBox.Application.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GolBox.Application.Features.Users.Commands;
using GolBox.Application.Features.Users.Queries;
using GolBox.Application.Interfaces;
using GolBox.Domain.Entities;

namespace GolBox.Api.Controllers;

[Authorize]
public class UsersController : BaseApiController
{
    private readonly IMediator _mediator;
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public UsersController(IMediator mediator, IAppDbContext context, ICurrentUserService currentUserService)
    {
        _mediator = mediator;
        _context = context;
        _currentUserService = currentUserService;
    }

    [HttpGet]
    [Authorize(Policy = AuthorizationPolicies.StaffOrAdmin)]
    public async Task<IActionResult> GetAllUsers(
        [FromQuery] string? role = null,
        [FromQuery] string? search = null,
        [FromQuery] int? minAge = null,
        [FromQuery] int? maxAge = null,
        [FromQuery] string? education = null,
        [FromQuery] int? minPoints = null,
        [FromQuery] int? maxPoints = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = AdminPaging.DefaultPageSize)
    {
        (page, pageSize) = AdminPaging.Normalize(page, pageSize);
        var query = _context.Users.AsQueryable();
        if (!string.IsNullOrWhiteSpace(role))
        {
            if (role.Equals("citizen", StringComparison.OrdinalIgnoreCase) ||
                role.Equals("user", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(u => u.Role == "User" || u.Role == "Citizen");
            }
            else if (role.Equals("staff", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(u => u.Role == "Staff");
            }
            else if (role.Equals("admin", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(u => u.Role == "Admin");
            }
            else
            {
                query = query.Where(u => u.Role == role);
            }
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(u =>
                u.FirstName.Contains(term) ||
                u.LastName.Contains(term) ||
                u.Email.Contains(term) ||
                (u.PhoneNumber != null && u.PhoneNumber.Contains(term)));
        }

        if (minAge.HasValue)
            query = query.Where(u => u.Age != null && u.Age >= minAge.Value);
        if (maxAge.HasValue)
            query = query.Where(u => u.Age != null && u.Age <= maxAge.Value);
        if (!string.IsNullOrWhiteSpace(education))
        {
            var edu = education.Trim();
            if (edu is "Lise" or "HighSchool")
                query = query.Where(u => u.EducationLevel == "Lise" || u.EducationLevel == "HighSchool");
            else if (edu is "Üniversite" or "Universite" or "University")
                query = query.Where(u => u.EducationLevel == "Üniversite" || u.EducationLevel == "Universite" || u.EducationLevel == "University");
            else
                query = query.Where(u => u.EducationLevel == edu);
        }
        if (minPoints.HasValue)
            query = query.Where(u => u.PointsBalance >= minPoints.Value);
        if (maxPoints.HasValue)
            query = query.Where(u => u.PointsBalance <= maxPoints.Value);

        var totalCount = await query.CountAsync();
        var users = await query
            .OrderByDescending(u => u.CreatedDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new
            {
                u.Id,
                u.Email,
                u.FirstName,
                u.LastName,
                u.PointsBalance,
                u.Age,
                u.EducationLevel,
                u.PhoneNumber,
                u.CreatedDate,
                u.Role
            })
            .ToListAsync();
        return Ok(Result<object>.Ok(new { items = users, page, pageSize, totalCount }));
    }

    [HttpGet("{id}/detail")]
    public async Task<IActionResult> GetUserDetail(Guid id)
    {
        if (!_currentUserService.CanAccessUser(id))
            return Forbid();
        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound(Result<object>.Fail("Vatandaş bulunamadı."));

        var pointHistory = await _context.PointTransactions
            .Where(pt => pt.UserId == id)
            .OrderByDescending(pt => pt.CreatedDate)
            .Take(25)
            .Select(pt => new { pt.Id, pt.Amount, pt.Type, pt.Description, pt.ReferenceType, pt.CreatedDate })
            .ToListAsync();

        var ordersHistory = await _context.Orders
            .Include(o => o.Cafe)
            .Where(o => o.UserId == id)
            .OrderByDescending(o => o.CreatedDate)
            .Take(25)
            .Select(o => new { o.Id, o.CollectionCode, CafeName = o.Cafe.Name, o.TotalAmount, o.PaidWithPoints, o.Status, o.CreatedDate })
            .ToListAsync();

        var coupons = await _context.UserRewards
            .Include(ur => ur.Reward)
            .Where(ur => ur.UserId == id)
            .OrderByDescending(ur => ur.ClaimedAt)
            .Select(ur => new
            {
                ur.Id,
                ur.RewardId,
                Title = ur.Reward.Title,
                ur.Status,
                ur.RedeemCode,
                ur.ClaimedAt,
                ur.RedeemedAt,
                ur.ExpiresAt
            })
            .ToListAsync();

        var activeCoupons = coupons.Where(c => c.Status == UserRewardStatuses.Claimed).ToList();
        var pastCoupons = coupons.Where(c => c.Status != UserRewardStatuses.Claimed).ToList();

        var fieldCaptures = await _context.UserFieldCaptures
            .Include(c => c.FieldDrop)
            .Where(c => c.UserId == id)
            .OrderByDescending(c => c.CreatedDate)
            .Take(25)
            .Select(c => new
            {
                c.Id,
                c.FieldDropId,
                Title = c.FieldDrop.Title,
                c.PointsGranted,
                c.DistanceMeters,
                c.CreatedDate
            })
            .ToListAsync();

        var userTasks = await _context.UserTasks
            .Include(ut => ut.Task)
            .Where(ut => ut.UserId == id)
            .Select(ut => new { ut.TaskId, Title = ut.Task.Title, Points = ut.Task.PointsReward, ut.CreatedDate })
            .ToListAsync();

        var userActivities = await _context.UserActivities
            .Include(ua => ua.Activity)
            .Where(ua => ua.UserId == id)
            .Select(ua => new { ua.ActivityId, Title = ua.Activity.Title, Points = ua.Activity.PointsReward, ua.CreatedDate })
            .ToListAsync();

        var profile = new
        {
            user.Id,
            user.Email,
            user.FirstName,
            user.LastName,
            user.PhoneNumber,
            user.PointsBalance,
            user.Age,
            user.EducationLevel,
            user.CreatedDate,
            user.Role
        };

        return Ok(Result<object>.Ok(new
        {
            profile.Id,
            profile.Email,
            profile.FirstName,
            profile.LastName,
            profile.PhoneNumber,
            profile.PointsBalance,
            profile.Age,
            profile.EducationLevel,
            profile.CreatedDate,
            profile.Role,
            profile,
            pointHistory,
            ordersHistory,
            activeCoupons,
            pastCoupons,
            coupons,
            fieldCaptures,
            userTasks,
            userActivities
        }));
    }

    [HttpPost("{id}/adjust-points")]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> AdjustPoints(Guid id, [FromBody] AdjustPointsRequest request)
    {
        var applied = await ManualPointAdjustment.ApplyAsync(
            _context,
            id,
            request.Amount,
            request.ActionType,
            request.Reason,
            request.Description,
            _currentUserService.UserId);

        if (!applied.Success)
        {
            if (applied.Message.Contains("bulunamadı", StringComparison.OrdinalIgnoreCase))
                return NotFound(Result<object>.Fail(applied.Message));
            return BadRequest(Result<object>.Fail(applied.Message));
        }

        var adminUser = await _context.Users.FindAsync(_currentUserService.UserId);
        await AuditLogsController.LogAsync(
            _context,
            adminUser?.Email ?? "admin@golbox.gov.tr",
            adminUser?.Role ?? "Admin",
            $"Point_{applied.Data!.Action}",
            "Users",
            "User",
            id.ToString(),
            $"{applied.Data.PreviousBalance} GP",
            $"{applied.Data.NewBalance} GP",
            $"Neden: {applied.Data.Reason} | Açıklama: {applied.Data.Description}"
        );

        return Ok(Result<object>.Ok(new { PointsBalance = applied.Data.NewBalance }, $"Puan işlemi başarıyla uygulandı. Yeni Bakiye: {applied.Data.NewBalance} GP."));
    }

    [HttpGet("me")]
    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var result = await _mediator.Send(new GetUserProfileQuery());
        return HandleResult(result);
    }

    [HttpPut("me")]
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateUserProfileCommand command)
    {
        var result = await _mediator.Send(command);
        return HandleResult(result);
    }

    [HttpPut("change-password")]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordCommand command)
    {
        var result = await _mediator.Send(command);
        return HandleResult(result);
    }

    public class AdjustPointsRequest
    {
        public int Amount { get; set; }
        public string ActionType { get; set; } = "Add"; // Add, Deduct, Reverse
        public string Reason { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }
}
