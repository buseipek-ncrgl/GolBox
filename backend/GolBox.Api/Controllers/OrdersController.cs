using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GolBox.Application.Interfaces;
using GolBox.Domain.Entities;
using GolBox.Application.Common;

using Microsoft.AspNetCore.SignalR;
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
        var currentUser = await _context.Users.FindAsync(currentUserId);

        var query = _context.Orders.AsQueryable();

        if (currentUser != null && currentUser.Email != "admin@golbox.gov.tr")
        {
            query = query.Where(o => o.UserId == currentUserId);
        }

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
    public async Task<IActionResult> UpdateOrderStatus(Guid id, [FromBody] UpdateOrderStatusRequest request)
    {
        var order = await _context.Orders.FindAsync(id);
        if (order == null)
            return NotFound(Result<object>.Fail("Sipariş bulunamadı."));

        order.Status = request.Status;
        order.UpdatedDate = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // Broadcast real-time SignalR notification to user and admins
        await _hubContext.Clients.All.SendAsync("OrderStatusUpdated", new
        {
            orderId = order.Id,
            userId = order.UserId,
            status = order.Status,
            collectionCode = order.CollectionCode
        });

        return Ok(Result<object>.Ok(null, $"Sipariş durumu '{request.Status}' olarak güncellendi."));
    }

    [HttpPost]
    public async Task<IActionResult> CreateOrder([FromBody] CreateOrderRequest request)
    {
        var targetUserId = request.UserId != Guid.Empty ? request.UserId : (_currentUserService.UserId ?? Guid.Empty);
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
        await _context.SaveChangesAsync();

        return Ok(Result<object>.Ok(new
        {
            OrderId = order.Id,
            order.CollectionCode,
            order.Status,
            order.TotalAmount
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
