using System;
using System.Linq;
using System.Threading.Tasks;
using MediatR;
using GolBox.Application.Authorization;
using GolBox.Application.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GolBox.Application.Common;
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
    public async Task<IActionResult> GetAllUsers()
    {
        var users = await _context.Users
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
                u.Role,
                VerificationStatus = "Doğrulanmış",
                AccountStatus = "Aktif"
            })
            .ToListAsync();
        return Ok(Result<object>.Ok(users));
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
            .Select(pt => new { pt.Id, pt.Amount, pt.Type, pt.Description, pt.CreatedDate })
            .ToListAsync();

        var ordersHistory = await _context.Orders
            .Include(o => o.Cafe)
            .Where(o => o.UserId == id)
            .OrderByDescending(o => o.CreatedDate)
            .Select(o => new { o.Id, o.CollectionCode, CafeName = o.Cafe.Name, o.TotalAmount, o.PaidWithPoints, o.Status, o.CreatedDate })
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
            user.Role,
            VerificationStatus = "Doğrulanmış",
            AccountStatus = "Aktif"
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
            profile.VerificationStatus,
            profile.AccountStatus,
            profile,
            pointHistory,
            ordersHistory,
            userTasks,
            userActivities
        }));
    }

    [HttpPost("{id}/adjust-points")]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> AdjustPoints(Guid id, [FromBody] AdjustPointsRequest request)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound(Result<object>.Fail("Vatandaş bulunamadı."));

        if (string.IsNullOrWhiteSpace(request.Reason) || request.Reason.Length < 3)
        {
            return BadRequest(Result<object>.Fail("İşlem nedeni ve açıklama girilmesi zorunludur."));
        }

        var actionType = string.IsNullOrWhiteSpace(request.ActionType) ? "Add" : request.ActionType;
        if (actionType is "Reward" or "Coupon" or "Reverse")
            actionType = "Add";

        int previousBalance = user.PointsBalance;
        int deltaAmount = actionType == "Deduct" ? -Math.Abs(request.Amount) : Math.Abs(request.Amount);

        if (actionType == "Deduct" && user.PointsBalance + deltaAmount < 0)
        {
            return BadRequest(Result<object>.Fail($"Yetersiz bakiye. Kullanıcının mevcut bakiyesi: {user.PointsBalance} GP."));
        }

        user.PointsBalance += deltaAmount;

        var transaction = new PointTransaction
        {
            Id = Guid.NewGuid(),
            OrganizationId = user.OrganizationId,
            UserId = user.Id,
            Amount = deltaAmount,
            Type = actionType == "Add" ? "ManualAddition" : actionType == "Deduct" ? "ManualDeduction" : "Reversal",
            Description = $"[Manuel İşlem: {actionType}] Nedeni: {request.Reason}. Açıklama: {request.Description}",
            CreatedDate = DateTime.UtcNow
        };

        _context.PointTransactions.Add(transaction);
        await _context.SaveChangesAsync();

        var adminUser = await _context.Users.FindAsync(_currentUserService.UserId);

        await AuditLogsController.LogAsync(
            _context,
            adminUser?.Email ?? "admin@golbox.gov.tr",
            adminUser?.Role ?? "Admin",
            $"Point_{actionType}",
            "Users",
            "User",
            user.Id.ToString(),
            $"{previousBalance} GP",
            $"{user.PointsBalance} GP",
            $"Neden: {request.Reason} | Açıklama: {request.Description}"
        );

        return Ok(Result<object>.Ok(new { user.PointsBalance }, $"Puan işlemi başarıyla uygulandı. Yeni Bakiye: {user.PointsBalance} GP."));
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
