using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GolBox.Application.Common;
using GolBox.Application.Interfaces;

namespace GolBox.Api.Controllers;

[Authorize]
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
        var today = now.Date;
        var thirtyDaysAgo = now.AddDays(-30);

        // Top Metrics
        var registeredCitizensCount = await _context.Users.CountAsync(u => u.Email != "admin@golbox.gov.tr");
        var activeCitizensLast30Days = await _context.Orders
            .Where(o => o.CreatedDate >= thirtyDaysAgo)
            .Select(o => o.UserId)
            .Distinct()
            .CountAsync();

        var activeBranchesCount = await _context.Cafes.CountAsync(c => c.IsActive && !c.IsDeleted);
        var todayOrdersCount = await _context.Orders.CountAsync(o => o.CreatedDate >= today);
        var pendingOrdersCount = await _context.Orders.CountAsync(o => o.Status == "Pending" || o.Status == "Onay bekliyor");

        var todayEarnedPoints = await _context.PointTransactions
            .Where(pt => pt.CreatedDate >= today && pt.Amount > 0)
            .SumAsync(pt => (int?)pt.Amount) ?? 0;

        var todaySpentPoints = await _context.PointTransactions
            .Where(pt => pt.CreatedDate >= today && pt.Amount < 0)
            .SumAsync(pt => (int?)Math.Abs(pt.Amount)) ?? 0;

        var pendingApprovalsCount = await _context.ApprovalRequests.CountAsync(ar => ar.Status == "Pending");

        // Critical Alert Items
        var longPendingOrders = await _context.Orders
            .Include(o => o.User)
            .Include(o => o.Cafe)
            .Where(o => (o.Status == "Pending" || o.Status == "Preparing") && o.CreatedDate < now.AddMinutes(-20))
            .Select(o => new
            {
                o.Id,
                o.CollectionCode,
                UserFullName = $"{o.User.FirstName} {o.User.LastName}",
                CafeName = o.Cafe.Name,
                o.CreatedDate,
                o.Status
            })
            .Take(5)
            .ToListAsync();

        var criticalApprovals = await _context.ApprovalRequests
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
            .ToListAsync();

        var highValuePointTransactions = await _context.PointTransactions
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
            .ToListAsync();

        return Ok(Result<object>.Ok(new
        {
            metrics = new
            {
                registeredCitizensCount,
                activeCitizensLast30Days,
                activeBranchesCount,
                todayOrdersCount,
                pendingOrdersCount,
                todayEarnedPoints,
                todaySpentPoints,
                pendingApprovalsCount
            },
            alerts = new
            {
                longPendingOrders,
                criticalApprovals,
                highValuePointTransactions
            }
        }));
    }
}
