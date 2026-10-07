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
using GolBox.Api.Services;

namespace GolBox.Api.Controllers;

[Route("api/v1/qr")]
public class QrController : BaseApiController
{
    private readonly IMediator _mediator;
    private readonly IDynamicQrService _qrService;
    private readonly ICurrentUserService _currentUser;
    private readonly IAppDbContext _context;
    private readonly CitizenNotificationService _notifications;

    public QrController(IMediator mediator, IDynamicQrService qrService, ICurrentUserService currentUser, IAppDbContext context, CitizenNotificationService notifications)
    {
        _mediator = mediator;
        _qrService = qrService;
        _currentUser = currentUser;
        _context = context;
        _notifications = notifications;
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
                p.Status,
                p.Token
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
                operation = p.Token.StartsWith("coupon:") ? "coupon-redeem" : p.PaidWithPoints ? "points-payment" : p.Amount > 0 ? "cash-earn" : "visit",
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
        if (string.Equals(order.PaymentMethod, "ISMARLIYOR", StringComparison.OrdinalIgnoreCase))
            return BadRequest(Result<object>.Fail("Ismarlıyor siparişlerinde ikinci QR okutulmaz. Teslim işlemini Sipariş Operasyonu ekranından tamamlayın."));

        var status = OrderStatuses.Canonicalize(order.Status);
        if (status == OrderStatuses.Completed)
            return Conflict(Result<object>.Fail("Bu sipariş daha önce teslim edilmiş."));
        if (status == OrderStatuses.Cancelled)
            return BadRequest(Result<object>.Fail("İptal edilmiş sipariş teslim edilemez."));
        if (status != OrderStatuses.Ready)
            return BadRequest(Result<object>.Fail($"Sipariş henüz teslime hazır değil. Mevcut durum: {status}"));

        return Ok(Result<object>.Ok(MapPickupOrder(order)));
    }

    [HttpPost("coupons/resolve")]
    [Authorize(Policy = AuthorizationPolicies.StaffOrAdmin)]
    [EnableRateLimiting("qr")]
    public async Task<IActionResult> ResolveCoupon([FromBody] ResolveCouponRequest request)
    {
        var code = request.Code?.Trim().ToUpperInvariant();
        if (string.IsNullOrWhiteSpace(code)) return BadRequest(Result<object>.Fail("Kupon kodu boş bırakılamaz."));
        var claim = await _context.UserRewards.AsNoTracking().Include(x => x.User).Include(x => x.Reward)
            .FirstOrDefaultAsync(x => x.RedeemCode == code);
        if (claim == null) return NotFound(Result<object>.Fail("Bu koda ait ikram kuponu bulunamadı."));
        var orderMarker = $"ismarliyor-claim:{claim.Id}";
        if (claim.Status == UserRewardStatuses.Redeemed && await _context.Orders.AnyAsync(x => x.ImageUrl == orderMarker))
            return Conflict(Result<object>.Fail("Bu ikram kuponu daha önce siparişe dönüştürülmüş."));
        if (claim.Status != UserRewardStatuses.Claimed || claim.ExpiresAt < DateTime.UtcNow)
        {
            if (claim.Status != UserRewardStatuses.Redeemed)
                return BadRequest(Result<object>.Fail("Bu ikram kuponu geçerli değil veya süresi dolmuş."));
        }
        return Ok(Result<object>.Ok(new { id = claim.Id, code = claim.RedeemCode, title = claim.Reward.Title,
            description = claim.Reward.Description, memberName = $"{claim.User.FirstName} {claim.User.LastName}".Trim(),
            email = claim.User.Email, expiresAt = claim.ExpiresAt, sourceType = "Ismarliyor" }));
    }

    [HttpPost("coupons/{id:guid}/redeem")]
    [Authorize(Policy = AuthorizationPolicies.StaffOrAdmin)]
    [EnableRateLimiting("qr")]
    public async Task<IActionResult> RedeemCoupon(Guid id, [FromBody] RedeemCouponRequest request)
    {
        if (request.CafeId == Guid.Empty || !await _context.Cafes.AnyAsync(x => x.Id == request.CafeId && x.IsActive))
            return BadRequest(Result<object>.Fail("Geçerli bir şube seçin."));
        var claim = await _context.UserRewards.Include(x => x.Reward).FirstOrDefaultAsync(x => x.Id == id);
        if (claim == null) return NotFound(Result<object>.Fail("İkram kuponu bulunamadı."));
        var orderMarker = $"ismarliyor-claim:{claim.Id}";
        if (await _context.Orders.AnyAsync(x => x.ImageUrl == orderMarker))
            return Conflict(Result<object>.Fail("Bu ikram kuponu daha önce siparişe dönüştürülmüş."));
        if (claim.Status != UserRewardStatuses.Claimed && claim.Status != UserRewardStatuses.Redeemed)
            return BadRequest(Result<object>.Fail("Bu ikram kuponu geçerli değil veya süresi dolmuş."));
        if (claim.Status == UserRewardStatuses.Claimed && claim.ExpiresAt < DateTime.UtcNow)
            return BadRequest(Result<object>.Fail("Bu ikram kuponunun süresi dolmuş."));

        var menuItem = await _context.MenuItems.FirstOrDefaultAsync(x =>
            x.CafeId == request.CafeId && x.IsActive && x.Name == claim.Reward.Title);
        if (menuItem == null)
            return BadRequest(Result<object>.Fail($"'{claim.Reward.Title}' ürünü seçilen şubenin aktif menüsünde bulunamadı."));

        string collectionCode;
        do { collectionCode = $"IS-MR-{Random.Shared.Next(1000, 10000)}"; }
        while (await _context.Orders.AnyAsync(x => x.CollectionCode == collectionCode));

        var now = DateTime.UtcNow;
        var orderId = Guid.NewGuid();
        var order = new Order
        {
            Id = orderId, UserId = claim.UserId, CafeId = request.CafeId,
            TotalAmount = 0, PaidWithPoints = false, PointsUsed = 0,
            Status = OrderStatuses.Preparing, PaymentStatus = "PAID", PaymentMethod = "ISMARLIYOR",
            CollectionCode = collectionCode, OrganizationId = claim.OrganizationId,
            ImageUrl = orderMarker, ConfirmedAt = now, PreparingAt = now, CreatedDate = now,
            OrderItems = new System.Collections.Generic.List<OrderItem>
            {
                new()
                {
                    Id = Guid.NewGuid(), OrderId = orderId, MenuItemId = menuItem.Id, Quantity = 1,
                    UnitPrice = 0, FinalUnitPrice = 0, OptionPricesSum = 0,
                    ProductName = menuItem.Name, SelectedOptionsJson = "[]"
                }
            }
        };
        _context.Orders.Add(order);
        claim.Status = UserRewardStatuses.Redeemed; claim.RedeemedAt ??= now; claim.UpdatedDate = now;
        if (!await _context.QrPayments.AnyAsync(x => x.Token == $"coupon:{claim.RedeemCode}"))
            _context.QrPayments.Add(new QrPayment
        {
            Id = Guid.NewGuid(), UserId = claim.UserId, CafeId = request.CafeId,
            Amount = 0, PaidWithPoints = false, PointsDeducted = 0, Status = "Completed",
            Token = $"coupon:{claim.RedeemCode}", ExpiresAt = now,
            OrganizationId = claim.OrganizationId
        });
        await _context.SaveChangesAsync();
        await AuditLogsController.LogAsync(_context, _currentUser.Email ?? "staff", _currentUser.Role ?? "Staff",
            "Coupon_Redeem", "Qr", "UserReward", claim.Id.ToString(), UserRewardStatuses.Claimed,
            UserRewardStatuses.Redeemed, $"Cafe={request.CafeId}; code={claim.RedeemCode}");
        await _notifications.SendToUserAsync(claim.UserId, claim.OrganizationId,
            "İkram siparişiniz hazırlanıyor", $"{order.CollectionCode} kodlu {menuItem.Name} ikramınız şubede hazırlanmaya başladı.",
            "ORDER_PREPARING", "ORDER", order.Id.ToString());
        return Ok(Result<object>.Ok(new { id = claim.Id, status = claim.Status, claim.RedeemedAt,
            orderId = order.Id, order.CollectionCode, orderStatus = order.Status }, "İkram siparişi hazırlanmak üzere oluşturuldu."));
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
        if (string.Equals(order.PaymentMethod, "ISMARLIYOR", StringComparison.OrdinalIgnoreCase))
            return BadRequest(Result<object>.Fail("Ismarlıyor siparişlerinde teslim QR ile yapılmaz. Sipariş Operasyonu ekranındaki 'Teslim Edildi' işlemini kullanın."));
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

public class ResolveCouponRequest { public string Code { get; set; } = string.Empty; }
public class RedeemCouponRequest { public Guid CafeId { get; set; } }
