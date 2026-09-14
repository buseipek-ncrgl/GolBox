using System;
using System.Linq;
using System.Threading.Tasks;
using GolBox.Application.Authorization;
using GolBox.Application.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using GolBox.Application.Interfaces;
using GolBox.Domain.Entities;
using GolBox.Api.Hubs;

namespace GolBox.Api.Controllers;

[Authorize]
public class OrdersController : BaseApiController
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IHubContext<OrderHub> _hubContext;

    public OrdersController(IAppDbContext context, ICurrentUserService currentUserService, IHubContext<OrderHub> hubContext)
    {
        _context = context;
        _currentUserService = currentUserService;
        _hubContext = hubContext;
    }

    [HttpGet]
    public async Task<IActionResult> GetOrders()
    {
        var currentUserId = _currentUserService.UserId;
        if (currentUserId == null || currentUserId == Guid.Empty)
            return Unauthorized(Result<object>.Fail("Oturum doğrulanamadı."));

        var query = _context.Orders.AsQueryable();
        if (!_currentUserService.IsStaffOrAdmin)
            query = query.Where(o => o.UserId == currentUserId.Value);

        var orders = await query
            .Include(o => o.User)
            .Include(o => o.Cafe)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.MenuItem)
            .OrderByDescending(o => o.CreatedDate)
            .ToListAsync();

        var dtoList = orders.Select(o => new
        {
            o.Id,
            o.UserId,
            UserFullName = $"{o.User.FirstName} {o.User.LastName}",
            UserEmail = o.User.Email,
            o.CafeId,
            CafeName = o.Cafe.Name,
            o.TotalAmount,
            o.PaidWithPoints,
            o.PointsUsed,
            o.Status,
            o.CollectionCode,
            o.CreatedDate,
            o.ImageUrl,
            Items = o.OrderItems.Select(oi => new
            {
                oi.Id,
                oi.MenuItemId,
                MenuItemName = oi.MenuItem?.Name ?? "Silinmiş Ürün",
                MenuItemImageUrl = oi.MenuItem?.ImageUrl,
                oi.Quantity,
                oi.UnitPrice
            }).ToList()
        }).ToList();

        return Ok(Result<object>.Ok(dtoList));
    }

    [HttpPut("{id}/status")]
    [Authorize(Policy = AuthorizationPolicies.StaffOrAdmin)]
    public async Task<IActionResult> UpdateOrderStatus(Guid id, [FromBody] UpdateOrderStatusRequest request)
    {
        var order = await _context.Orders.FindAsync(id);
        if (order == null)
            return NotFound(Result<object>.Fail("Sipariş bulunamadı."));

        var newStatus = OrderStatuses.Canonicalize(request.Status);
        if (newStatus == OrderStatuses.Cancelled)
        {
            if (order.Status == OrderStatuses.Completed)
                return BadRequest(Result<object>.Fail("Tamamlanmış sipariş iptal edilemez."));

            if (order.Status == OrderStatuses.Cancelled)
                return Ok(Result<object>.Ok(new { id = order.Id, status = order.Status }, "Sipariş zaten iptal."));

            if (order.PaidWithPoints && order.PointsUsed > 0)
            {
                var payer = await _context.Users.FirstOrDefaultAsync(u => u.Id == order.UserId);
                if (payer == null)
                    return NotFound(Result<object>.Fail("Sipariş sahibi bulunamadı."));

                OrderPointRefund.TryRefundOnCancel(order, payer, _context);
            }
        }

        order.Status = newStatus;
        order.UpdatedDate = DateTime.UtcNow;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            return Conflict(Result<object>.Fail("Bakiye başka bir işlemle değişti. Lütfen tekrar deneyin."));
        }

        var payload = new
        {
            orderId = order.Id,
            userId = order.UserId,
            status = order.Status,
            collectionCode = order.CollectionCode
        };
        await _hubContext.Clients.User(order.UserId.ToString()).SendAsync("OrderStatusUpdated", payload);
        await _hubContext.Clients.Group(OrderHub.StaffGroup).SendAsync("OrderStatusUpdated", payload);

        return Ok(Result<object>.Ok(new { id = order.Id, status = order.Status }, $"Sipariş durumu '{order.Status}' olarak güncellendi."));
    }

    [HttpPost]
    public async Task<IActionResult> CreateOrder([FromBody] CreateOrderRequest request)
    {
        var callerId = _currentUserService.UserId ?? Guid.Empty;
        var targetUserId = request.UserId != Guid.Empty ? request.UserId : callerId;
        if (!_currentUserService.IsStaffOrAdmin && targetUserId != callerId)
            return Forbid();

        var user = await _context.Users.FindAsync(targetUserId);
        if (user == null)
            return NotFound(Result<object>.Fail("Kullanıcı bulunamadı."));

        var cafe = await _context.Cafes.FindAsync(request.CafeId);
        if (cafe == null)
            return NotFound(Result<object>.Fail("Kafe bulunamadı."));

        var orderId = Guid.NewGuid();
        var collectionCode = $"IS-MR-{new Random().Next(1000, 9999)}";

        decimal totalAmount = 0;
        var orderItems = new System.Collections.Generic.List<OrderItem>();

        foreach (var itemRequest in request.Items)
        {
            var menuItem = await _context.MenuItems.FindAsync(itemRequest.MenuItemId);
            if (menuItem == null)
                return NotFound(Result<object>.Fail("Menü ürünü bulunamadı."));

            // Check eligibility conditions (MinAge, MaxAge, RequiredEducation)
            if (menuItem.MinAge.HasValue && (!user.Age.HasValue || user.Age.Value < menuItem.MinAge.Value))
            {
                return BadRequest(Result<object>.Fail($"Bu ürün ('{menuItem.Name}') için yaşınız uygun değildir. Minimum yaş sınırı: {menuItem.MinAge.Value} (Sizin yaşınız: {user.Age ?? 0})."));
            }
            if (menuItem.MaxAge.HasValue && (!user.Age.HasValue || user.Age.Value > menuItem.MaxAge.Value))
            {
                return BadRequest(Result<object>.Fail($"Bu ürün ('{menuItem.Name}') için yaşınız uygun değildir. Maksimum yaş sınırı: {menuItem.MaxAge.Value} (Sizin yaşınız: {user.Age ?? 0})."));
            }
            if (!string.IsNullOrEmpty(menuItem.RequiredEducation) && 
                (string.IsNullOrEmpty(user.EducationLevel) || !user.EducationLevel.Equals(menuItem.RequiredEducation, StringComparison.OrdinalIgnoreCase)))
            {
                return BadRequest(Result<object>.Fail($"Bu ürün ('{menuItem.Name}') yalnızca {menuItem.RequiredEducation} öğrencilerine sunulmaktadır (Sizin durumunuz: {user.EducationLevel ?? "Belirtilmemiş"})."));
            }

            totalAmount += menuItem.Price * itemRequest.Quantity;

            orderItems.Add(new OrderItem
            {
                Id = Guid.NewGuid(),
                OrderId = orderId,
                MenuItemId = itemRequest.MenuItemId,
                Quantity = itemRequest.Quantity,
                UnitPrice = menuItem.Price
            });
        }

        int pointsUsed = 0;
        if (request.PaidWithPoints)
        {
            pointsUsed = (int)totalAmount; // 1 TL = 1 Puan
            if (user.PointsBalance < pointsUsed)
            {
                return BadRequest(Result<object>.Fail("Yetersiz sadakat puanı bakiyesi."));
            }

            user.PointsBalance -= pointsUsed;

            _context.PointTransactions.Add(new PointTransaction
            {
                Id = Guid.NewGuid(),
                OrganizationId = user.OrganizationId,
                UserId = user.Id,
                Amount = -pointsUsed,
                Type = "Redemption",
                Description = $"Ismarlıyor ön siparişi ödemesi ({collectionCode})",
                CreatedDate = DateTime.UtcNow
            });
        }

        var order = new Order
        {
            Id = orderId,
            UserId = targetUserId,
            CafeId = request.CafeId,
            TotalAmount = totalAmount,
            PaidWithPoints = request.PaidWithPoints,
            PointsUsed = pointsUsed,
            Status = "Pending",
            CollectionCode = collectionCode,
            OrganizationId = user.OrganizationId,
            OrderItems = orderItems,
            ImageUrl = request.ImageUrl,
            CreatedDate = DateTime.UtcNow
        };

        _context.Orders.Add(order);
        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            return Conflict(Result<object>.Fail("Bakiye başka bir işlemle değişti. Lütfen tekrar deneyin."));
        }

        return Ok(Result<object>.Ok(new
        {
            id = order.Id,
            orderId = order.Id,
            collectionCode = order.CollectionCode,
            status = order.Status,
            totalAmount = order.TotalAmount
        }, "Ön siparişiniz başarıyla alındı."));
    }
}

public class UpdateOrderStatusRequest
{
    public string Status { get; set; } = string.Empty;
}

public class CreateOrderRequest
{
    public Guid UserId { get; set; }
    public Guid CafeId { get; set; }
    public bool PaidWithPoints { get; set; }
    public string? ImageUrl { get; set; }
    public System.Collections.Generic.List<CreateOrderItemRequest> Items { get; set; } = new();
}

public class CreateOrderItemRequest
{
    public Guid MenuItemId { get; set; }
    public int Quantity { get; set; }
}
