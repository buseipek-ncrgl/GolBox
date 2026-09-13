using System;
using System.Linq;
using System.Threading.Tasks;
using GolBox.Application.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GolBox.Application.Common;
using GolBox.Application.Interfaces;
using GolBox.Domain.Entities;

namespace GolBox.Api.Controllers;

[Authorize(Policy = AuthorizationPolicies.AdminOnly)]
[Route("api/v1/approvals")]
[Route("api/v1/[controller]")]
public class ApprovalRequestsController : BaseApiController
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public ApprovalRequestsController(IAppDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    [HttpGet]
    public async Task<IActionResult> GetApprovals([FromQuery] string status = "Pending")
    {
        var query = _context.ApprovalRequests.AsQueryable();

        if (status != "All")
        {
            query = query.Where(a => a.Status == status);
        }

        var list = await query.OrderByDescending(a => a.CreatedDate).ToListAsync();
        return Ok(Result<object>.Ok(list));
    }

    [HttpPost("{id}/action")]
    public async Task<IActionResult> ActionApproval(Guid id, [FromBody] ApprovalActionRequest request)
    {
        var approval = await _context.ApprovalRequests.FindAsync(id);
        if (approval == null) return NotFound(Result<object>.Fail("Onay talebi bulunamadı."));

        var currentUser = await _context.Users.FindAsync(_currentUserService.UserId);

        approval.Status = request.Approved ? "Approved" : "Rejected";
        approval.ApproverUserId = _currentUserService.UserId;
        approval.ApproverEmail = currentUser?.Email ?? "admin@golbox.gov.tr";
        approval.ApprovalNote = request.Note;
        approval.UpdatedDate = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await AuditLogsController.LogAsync(
            _context,
            approval.ApproverEmail,
            "SuperAdmin",
            request.Approved ? "Approval_Granted" : "Approval_Rejected",
            "ApprovalCenter",
            "ApprovalRequest",
            id.ToString(),
            "Pending",
            approval.Status,
            request.Note ?? "Onay merkezi işlemi gerçekleştirildi"
        );

        return Ok(Result<object>.Ok(new { id, status = approval.Status }, $"Onay talebi '{approval.Status}' olarak güncellendi."));
    }

    public class ApprovalActionRequest
    {
        public bool Approved { get; set; }
        public string? Note { get; set; }
    }
}
