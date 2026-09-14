using System;
using System.Linq;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using GolBox.Application.Authorization;
using GolBox.Application.Common;
using GolBox.Application.Features.Qr.Commands;
using GolBox.Application.Interfaces;

namespace GolBox.Api.Controllers;

[Route("api/v1/qr")]
public class QrController : BaseApiController
{
    private readonly IMediator _mediator;
    private readonly IDynamicQrService _qrService;
    private readonly ICurrentUserService _currentUser;
    private readonly IAppDbContext _context;

    public QrController(IMediator mediator, IDynamicQrService qrService, ICurrentUserService currentUser, IAppDbContext context)
    {
        _mediator = mediator;
        _qrService = qrService;
        _currentUser = currentUser;
        _context = context;
    }

    [HttpPost("scan")]
    [Authorize(Policy = AuthorizationPolicies.StaffOrAdmin)]
    [EnableRateLimiting("qr")]
    public async Task<IActionResult> ScanQr([FromBody] ScanQrCommand command)
    {
        var result = await _mediator.Send(command);
        return HandleResult(result);
    }

    [Authorize]
    [HttpGet("generate-dynamic")]
    public IActionResult GenerateDynamicQr()
    {
        var userId = _currentUser.UserId;
        if (userId == null || userId == Guid.Empty)
            return Unauthorized(Result<object>.Fail("Oturum doğrulanamadı."));

        var token = _qrService.GenerateDynamicQrToken(userId.Value);
        return Ok(Result<object>.Ok(new { qrToken = token, expiresInSeconds = 30 }));
    }

    [Authorize(Policy = AuthorizationPolicies.StaffOrAdmin)]
    [HttpPost("verify-dynamic")]
    [EnableRateLimiting("qr")]
    public IActionResult VerifyDynamicQr([FromBody] VerifyDynamicQrRequest request)
    {
        var validation = _qrService.ValidateDynamicQrToken(request.QrToken);
        if (!validation.IsValid)
            return BadRequest(Result<object>.Fail(validation.ErrorMessage ?? "Geçersiz QR kod."));

        return Ok(Result<object>.Ok(new { userId = validation.UserId, valid = true, timeStep = validation.TimeStep }));
    }

    [HttpGet("recent")]
    [Authorize(Policy = AuthorizationPolicies.StaffOrAdmin)]
    public async Task<IActionResult> GetRecent(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = AdminPaging.DefaultPageSize)
    {
        (page, pageSize) = AdminPaging.Normalize(page, pageSize);
        var query = _context.QrPayments.AsNoTracking()
            .Include(p => p.User)
            .Include(p => p.Cafe)
            .OrderByDescending(p => p.CreatedDate);
        var totalCount = await query.CountAsync();
        var rows = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new
            {
                p.Id,
                p.CreatedDate,
                p.UserId,
                citizenName = p.User.FirstName + " " + p.User.LastName,
                cafeId = p.CafeId,
                cafeName = p.Cafe.Name,
                p.Amount,
                p.PaidWithPoints,
                p.PointsDeducted,
                p.Status
            })
            .ToListAsync();

        var userIds = rows.Select(r => r.UserId).Distinct().ToList();
        var from = rows.Count == 0 ? DateTime.UtcNow : rows.Min(r => r.CreatedDate).AddMinutes(-1);
        var to = rows.Count == 0 ? DateTime.UtcNow : rows.Max(r => r.CreatedDate).AddMinutes(1);
        var related = await _context.PointTransactions.AsNoTracking()
            .Where(t => userIds.Contains(t.UserId) && t.ReferenceType == "QrScan" && t.CreatedDate >= from && t.CreatedDate <= to)
            .Select(t => new { t.UserId, t.Amount, t.CreatedDate })
            .ToListAsync();

        var items = rows.Select(p =>
        {
            var gp = p.PaidWithPoints
                ? -p.PointsDeducted
                : related.Where(t => t.UserId == p.UserId && Math.Abs((t.CreatedDate - p.CreatedDate).TotalSeconds) <= 12)
                    .Sum(t => t.Amount);
            return new
            {
                p.Id,
                p.CreatedDate,
                p.UserId,
                p.citizenName,
                p.cafeId,
                p.cafeName,
                p.Amount,
                p.PaidWithPoints,
                p.PointsDeducted,
                p.Status,
                operation = p.PaidWithPoints ? "points-payment" : p.Amount > 0 ? "cash-earn" : "visit",
                gp
            };
        }).ToList();
        return Ok(Result<object>.Ok(new { items, page, pageSize, totalCount }));
    }
}

public class VerifyDynamicQrRequest
{
    public string QrToken { get; set; } = string.Empty;
}
