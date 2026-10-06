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
using GolBox.Application.Features.Tasks;
using GolBox.Application.Features.Qr.Commands;
using GolBox.Application.Interfaces;
using GolBox.Domain.Entities;

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

    [HttpPost("orders/resolve")]
    [Authorize(Policy = AuthorizationPolicies.StaffOrAdmin)]
    [EnableRateLimiting("qr")]
    public async Task<IActionResult> ResolveOrder([FromBody] ResolvePickupOrderRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Code))
            return BadRequest(Result<object>.Fail("Teslim kodu boş bırakılamaz."));

        var code = request.Code.Trim();
        var hasId = Guid.TryParse(code, out var orderId);
        var order = await _context.Orders.AsNoTracking()
            .Include(o => o.User)
            .Include(o => o.Cafe)
            .Include(o => o.OrderItems)
            .FirstOrDefaultAsync(o => o.CollectionCode == code || (hasId && o.Id == orderId));

        if (order == null)
            return NotFound(Result<object>.Fail("Bu teslim koduna ait sipariş bulunamadı."));
        var scopeError = await ValidateBranchScope(order.CafeId, request.CafeId);
        if (scopeError != null) return scopeError;

        var status = OrderStatuses.Canonicalize(order.Status);
        if (status == OrderStatuses.Completed)
            return Conflict(Result<object>.Fail("Bu sipariş daha önce teslim edilmiş."));
        if (status == OrderStatuses.Cancelled)
            return BadRequest(Result<object>.Fail("İptal edilmiş sipariş teslim edilemez."));
        if (status != OrderStatuses.Ready)
            return BadRequest(Result<object>.Fail($"Sipariş henüz teslime hazır değil. Mevcut durum: {status}"));

        return Ok(Result<object>.Ok(MapPickupOrder(order)));
    }

    [HttpPost("orders/{id:guid}/complete")]
    [Authorize(Policy = AuthorizationPolicies.StaffOrAdmin)]
    [EnableRateLimiting("qr")]
    public async Task<IActionResult> CompleteOrder(Guid id, [FromBody] CompletePickupOrderRequest request)
    {
        var order = await _context.Orders
            .Include(o => o.User).Include(o => o.Cafe).Include(o => o.OrderItems)
            .FirstOrDefaultAsync(o => o.Id == id);
        if (order == null) return NotFound(Result<object>.Fail("Sipariş bulunamadı."));

        var scopeError = await ValidateBranchScope(order.CafeId, request.CafeId);
        if (scopeError != null) return scopeError;
        if (OrderStatuses.Canonicalize(order.Status) == OrderStatuses.Completed)
            return Conflict(Result<object>.Fail("Bu sipariş daha önce teslim edilmiş."));
        if (OrderStatuses.Canonicalize(order.Status) != OrderStatuses.Ready)
            return BadRequest(Result<object>.Fail("Yalnızca teslime hazır siparişler teslim edilebilir."));

        var paymentMethod = order.PaidWithPoints ? "POINTS" : request.PaymentMethod?.Trim().ToUpperInvariant();
        if (paymentMethod is not ("POINTS" or "CASH" or "CARD"))
            return BadRequest(Result<object>.Fail("Geçerli bir ödeme yöntemi seçin."));

        var now = DateTime.UtcNow;
        order.Status = OrderStatuses.Completed;
        order.PaymentMethod = paymentMethod;
        order.PaymentStatus = "PAID";
        order.PaidAt ??= now;
        order.CompletedAt ??= now;
        order.UpdatedDate = now;
        await _context.SaveChangesAsync();
        await MissionAwardService.AwardEligibleAsync(_context, order.UserId);

        await AuditLogsController.LogAsync(_context, _currentUser.Email ?? "staff", _currentUser.Role ?? "Staff",
            "Order_Pickup_Complete", "Qr", "Order", order.Id.ToString(), OrderStatuses.Ready,
            OrderStatuses.Completed, $"Cafe={order.Cafe.Name}; payment={paymentMethod}; code={order.CollectionCode}");

        return Ok(Result<object>.Ok(MapPickupOrder(order), "Sipariş ödemesi onaylandı ve teslim edildi."));
    }

    private async Task<IActionResult?> ValidateBranchScope(Guid orderCafeId, Guid requestCafeId)
    {
        if (requestCafeId == Guid.Empty || orderCafeId != requestCafeId)
            return BadRequest(Result<object>.Fail("Sipariş seçili şubeye ait değil."));
        if (_currentUser.IsAdmin) return null;
        var staff = await _context.StaffUsers.AsNoTracking().FirstOrDefaultAsync(s => s.UserId == _currentUser.UserId && s.IsActive);
        if (staff == null) return StatusCode(403, Result<object>.Fail("Aktif personel kaydı bulunamadı."));
        if (staff.Role is not ("BranchManager" or "BranchStaff" or "Cashier"))
            return StatusCode(403, Result<object>.Fail("Göreviniz kasa ve teslim işlemlerine yetkili değil."));
        if (!staff.BranchId.HasValue)
            return StatusCode(403, Result<object>.Fail("Personel hesabınıza bir şube atanmamış."));
        if (staff.BranchId.Value != orderCafeId)
            return StatusCode(403, Result<object>.Fail("Bu şubenin siparişlerini teslim etme yetkiniz yok."));
        return null;
    }

    private static object MapPickupOrder(Order order) => new
    {
        order.Id, order.CollectionCode, order.Status, order.CafeId, cafeName = order.Cafe.Name,
        order.UserId, memberName = $"{order.User.FirstName} {order.User.LastName}".Trim(), order.User.Email,
        order.TotalAmount, order.PaidWithPoints, order.PointsUsed, order.PaymentMethod, order.PaymentStatus,
        order.CreatedDate, order.ReadyAt, order.CompletedAt,
        items = order.OrderItems.Select(item => new
        {
            item.Id, item.Quantity, name = item.ProductName ?? "Ürün", item.UnitPrice,
            item.OptionPricesSum, finalUnitPrice = item.FinalUnitPrice > 0 ? item.FinalUnitPrice : item.UnitPrice,
            item.SelectedOptionsJson
        })
    };
}

public class VerifyDynamicQrRequest
{
    public string QrToken { get; set; } = string.Empty;
}

public class ResolvePickupOrderRequest
{
    public string Code { get; set; } = string.Empty;
    public Guid CafeId { get; set; }
}

public class CompletePickupOrderRequest
{
    public Guid CafeId { get; set; }
    public string? PaymentMethod { get; set; }
}
