using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using GolBox.Application.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GolBox.Application.Common;
using GolBox.Application.Interfaces;

namespace GolBox.Api.Controllers;

[Authorize(Policy = AuthorizationPolicies.StaffOrAdmin)]
public class DashboardController : BaseApiController
{
    private readonly IAppDbContext _context;

    public DashboardController(IAppDbContext context)
    {
        _context = context;
    }

    [HttpGet("overview")]
    public async Task<IActionResult> GetOverview()
    {
        var now = DateTime.UtcNow;
        var (todayFrom, todayTo) = AdminDateRange.Today();
        var thirtyDaysAgo = now.AddDays(-30);
        var criticalBefore = now.AddMinutes(-AdminSafetyRules.CriticalOrderMinutes);
        var expiringBefore = now.AddHours(AdminSafetyRules.ExpiringFieldDropHours);
        var isAdmin = HttpContext?.User?.IsInRole("Admin") == true;

        var registeredCitizensCount = await _context.Users.CountAsync(u => u.Role == "User" || u.Role == "Citizen");
        var activeCitizensLast30Days = await _context.Orders
            .Where(o => o.CreatedDate >= thirtyDaysAgo)
            .Select(o => o.UserId)
            .Distinct()
            .CountAsync();

        var activeBranchesCount = await _context.Cafes.CountAsync(c => c.IsActive && !c.IsDeleted);
        var todayOrdersCount = await _context.Orders.CountAsync(o => o.CreatedDate >= todayFrom && o.CreatedDate < todayTo);
        var activeOrdersCount = await _context.Orders.CountAsync(o =>
            o.Status == OrderStatuses.Pending ||
            o.Status == OrderStatuses.Preparing ||
            o.Status == OrderStatuses.Ready ||
            o.Status == "Onay bekliyor");

        var todayEarnedPoints = await _context.PointTransactions
            .Where(pt => pt.CreatedDate >= todayFrom && pt.CreatedDate < todayTo && pt.Amount > 0)
            .SumAsync(pt => (int?)pt.Amount) ?? 0;

        var todaySpentPoints = await _context.PointTransactions
            .Where(pt => pt.CreatedDate >= todayFrom && pt.CreatedDate < todayTo && pt.Amount < 0)
            .SumAsync(pt => (int?)Math.Abs(pt.Amount)) ?? 0;

        var pendingApprovalsCount = await _context.ApprovalRequests.CountAsync(ar => ar.Status == "Pending");

        var activeFieldDropsCount = await _context.FieldDrops.CountAsync(d =>
            d.IsActive && d.StartsAt <= now && d.EndsAt >= now);
        var todayActivities = await _context.Activities
            .Where(a => a.Status == "Active" && a.StartDate < todayTo && a.EndDate >= todayFrom)
            .OrderBy(a => a.StartDate)
            .Select(a => new { a.Id, a.Title, a.StartDate, a.EndDate, a.Location, joinedCount = a.UserActivities.Count, a.Capacity })
            .Take(8)
            .ToListAsync();
        var pendingIsmarliyor = await _context.Orders
            .Include(o => o.User)
            .Include(o => o.Cafe)
            .Where(o => o.Status == OrderStatuses.Pending || o.Status == OrderStatuses.Preparing || o.Status == OrderStatuses.Ready || o.Status == "Onay bekliyor")
            .OrderBy(o => o.CreatedDate)
            .Select(o => new
            {
                o.Id,
                o.CollectionCode,
                UserFullName = $"{o.User.FirstName} {o.User.LastName}",
                CafeName = o.Cafe.Name,
                o.CreatedDate,
                o.Status
            })
            .Take(8)
            .ToListAsync();

        var longPendingOrders = await _context.Orders
            .Include(o => o.User)
            .Include(o => o.Cafe)
            .Where(o =>
                (o.Status == OrderStatuses.Pending ||
                 o.Status == OrderStatuses.Preparing ||
                 o.Status == OrderStatuses.Ready ||
                 o.Status == "Onay bekliyor") &&
                o.CreatedDate < criticalBefore)
            .OrderBy(o => o.CreatedDate)
            .Select(o => new
            {
                o.Id,
                o.CollectionCode,
                UserFullName = $"{o.User.FirstName} {o.User.LastName}",
                CafeName = o.Cafe.Name,
                o.CreatedDate,
                o.Status
            })
            .Take(8)
            .ToListAsync();

        var criticalApprovals = isAdmin
            ? await _context.ApprovalRequests
                .Where(ar => ar.Status == "Pending")
                .OrderByDescending(ar => ar.CreatedDate)
                .Select(ar => new
                {
                    ar.Id,
                    ar.RequestType,
                    ar.Reason,
                    ar.RequesterEmail,
                    ar.CreatedDate
                })
                .Take(5)
                .ToListAsync()
            : new List<object>().Select(x => new { Id = Guid.Empty, RequestType = "", Reason = "", RequesterEmail = "", CreatedDate = now }).Take(0).ToList();

        var activeFieldDrops = await _context.FieldDrops
            .Where(d => d.IsActive && d.StartsAt <= now && d.EndsAt >= now)
            .OrderBy(d => d.EndsAt)
            .Select(d => new
            {
                d.Id,
                d.Title,
                remainingStock = d.TotalStock == null ? (int?)null : d.TotalStock.Value - d.CapturedCount,
                d.CapturedCount,
                d.TotalStock,
                d.EndsAt
            })
            .Take(8)
            .ToListAsync();

        var lowStockFieldDrops = activeFieldDrops
            .Where(d => d.remainingStock != null && d.remainingStock <= 5)
            .Take(5)
            .ToList();

        var expiringFieldDrops = activeFieldDrops
            .Where(d => d.EndsAt <= expiringBefore)
            .Take(5)
            .ToList();

        var highValuePointTransactions = isAdmin
            ? await _context.PointTransactions
                .Include(pt => pt.User)
                .Where(pt => Math.Abs(pt.Amount) >= 100)
                .OrderByDescending(pt => pt.CreatedDate)
                .Select(pt => new
                {
                    pt.Id,
                    UserFullName = $"{pt.User.FirstName} {pt.User.LastName}",
                    pt.Amount,
                    pt.Type,
                    pt.Description,
                    pt.CreatedDate
                })
                .Take(5)
                .ToListAsync()
            : new List<object>().Select(x => new { Id = Guid.Empty, UserFullName = "", Amount = 0, Type = "", Description = "", CreatedDate = now }).Take(0).ToList();

        var operationAlerts = new List<object>();
        foreach (var o in longPendingOrders)
            operationAlerts.Add(new { id = o.Id, kind = "order", text = $"Uzun bekleyen Ismarlıyor {o.CollectionCode}", href = "/admin/ismarliyor" });
        foreach (var d in lowStockFieldDrops)
            operationAlerts.Add(new { id = d.Id, kind = "fielddrop-stock", text = $"Düşük stok: {d.Title}", href = "/admin/saha-hediyeleri" });
        foreach (var d in expiringFieldDrops)
            operationAlerts.Add(new { id = d.Id, kind = "fielddrop-expiring", text = $"Bitmek üzere: {d.Title}", href = "/admin/saha-hediyeleri" });
        foreach (var a in todayActivities)
            operationAlerts.Add(new { id = a.Id, kind = "activity", text = $"Bugünkü etkinlik: {a.Title}", href = isAdmin ? "/admin/etkinlikler" : "/admin" });
        if (isAdmin)
        {
            foreach (var ar in criticalApprovals)
                operationAlerts.Add(new { id = ar.Id, kind = "approval", text = $"Onay: {(string.IsNullOrWhiteSpace(ar.RequestType) ? ar.Reason : ar.RequestType)}", href = "/admin" });
            foreach (var t in highValuePointTransactions)
                operationAlerts.Add(new { id = t.Id, kind = "points", text = $"Yüksek GP: {t.UserFullName} {t.Amount} GP", href = "/admin/golpuan" });
        }

        return Ok(Result<object>.Ok(new
        {
            metrics = new
            {
                registeredCitizensCount,
                activeCitizensLast30Days,
                activeBranchesCount,
                todayOrdersCount,
                pendingOrdersCount = activeOrdersCount,
                activeOrdersCount,
                criticalOrdersCount = longPendingOrders.Count,
                todayEarnedPoints,
                todaySpentPoints,
                pendingApprovalsCount,
                operationAlertCount = operationAlerts.Count
            },
            alerts = new
            {
                longPendingOrders,
                criticalOrders = longPendingOrders,
                criticalApprovals,
                highValuePointTransactions,
                pendingIsmarliyor,
                todayActivities,
                activeFieldDrops,
                lowStockFieldDrops,
                expiringFieldDrops,
                operationAlerts
            },
            totalUsers = registeredCitizensCount,
            activeBranches = activeBranchesCount,
            todayOrders = todayOrdersCount,
            pendingOrders = activeOrdersCount,
            activeOrders = activeOrdersCount,
            criticalOrders = longPendingOrders.Count,
            todayEarnedPoints,
            todaySpentPoints,
            activeFieldDropsCount,
            todayActivitiesCount = todayActivities.Count,
            operationAlertCount = operationAlerts.Count,
            timezone = "Europe/Istanbul",
            todayFrom,
            todayTo
        }));
    }
}
