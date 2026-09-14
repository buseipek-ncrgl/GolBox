using System;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GolBox.Application.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GolBox.Application.Common;
using GolBox.Application.Interfaces;

namespace GolBox.Api.Controllers;

[Authorize(Policy = AuthorizationPolicies.AdminOnly)]
public class ReportsController : BaseApiController
{
    private readonly IAppDbContext _context;

    public ReportsController(IAppDbContext context)
    {
        _context = context;
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetReportsSummary(
        [FromQuery] string? preset = "30d",
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null)
    {
        var (fromUtc, toUtc) = AdminDateRange.Resolve(preset, from, to);
        var data = await BuildSummaryAsync(fromUtc, toUtc);
        return Ok(Result<object>.Ok(data));
    }

    [HttpGet("export/{type}")]
    public async Task<IActionResult> ExportReport(
        string type,
        [FromQuery] string? preset = "30d",
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null)
    {
        var (fromUtc, toUtc) = AdminDateRange.Resolve(preset, from, to);
        var sb = new StringBuilder();

        if (type.Equals("citizens", StringComparison.OrdinalIgnoreCase))
        {
            sb.AppendLine("Id;Ad;Soyad;Eposta;Telefon;Yas;Egitim;GolPuan;KayitTarihi");
            var users = await _context.Users
                .Where(u => (u.Role == "User" || u.Role == "Citizen") && u.CreatedDate >= fromUtc && u.CreatedDate < toUtc)
                .ToListAsync();
            foreach (var u in users)
            {
                sb.AppendLine($"{u.Id};{u.FirstName};{u.LastName};{u.Email};{u.PhoneNumber};{u.Age ?? 0};{u.EducationLevel};{u.PointsBalance};{u.CreatedDate:yyyy-MM-dd HH:mm}");
            }
        }
        else if (type.Equals("orders", StringComparison.OrdinalIgnoreCase))
        {
            sb.AppendLine("Id;KoleksiyonKodu;Vatandas;Kafe;Tutar;PuanKullanildi;Durum;Tarih");
            var orders = await _context.Orders.Include(o => o.User).Include(o => o.Cafe)
                .Where(o => o.CreatedDate >= fromUtc && o.CreatedDate < toUtc)
                .ToListAsync();
            foreach (var o in orders)
            {
                sb.AppendLine($"{o.Id};{o.CollectionCode};{o.User?.FirstName} {o.User?.LastName};{o.Cafe?.Name};{o.TotalAmount};{o.PointsUsed};{OrderStatuses.Canonicalize(o.Status)};{o.CreatedDate:yyyy-MM-dd HH:mm}");
            }
        }
        else
        {
            sb.AppendLine("Id;Vatandas;Turu;Miktar;Aciklama;Tarih");
            var pts = await _context.PointTransactions.Include(pt => pt.User)
                .Where(pt => pt.CreatedDate >= fromUtc && pt.CreatedDate < toUtc)
                .ToListAsync();
            foreach (var pt in pts)
            {
                sb.AppendLine($"{pt.Id};{pt.User?.FirstName} {pt.User?.LastName};{pt.Type};{pt.Amount};{pt.Description};{pt.CreatedDate:yyyy-MM-dd HH:mm}");
            }
        }

        var csvBytes = Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(sb.ToString())).ToArray();
        return File(csvBytes, "text/csv", $"golbox-rapor-{type}-{fromUtc:yyyyMMdd}-{toUtc:yyyyMMdd}.csv");
    }

    private async Task<object> BuildSummaryAsync(DateTime fromUtc, DateTime toUtc)
    {
        var newCitizens = await _context.Users.CountAsync(u =>
            (u.Role == "User" || u.Role == "Citizen") && u.CreatedDate >= fromUtc && u.CreatedDate < toUtc);
        var liseUsers = await _context.Users.CountAsync(u => u.EducationLevel == "Lise" || u.EducationLevel == "HighSchool");
        var uniUsers = await _context.Users.CountAsync(u => u.EducationLevel == "Üniversite" || u.EducationLevel == "University");

        var ordersInRange = _context.Orders.Where(o => o.CreatedDate >= fromUtc && o.CreatedDate < toUtc);
        var totalOrders = await ordersInRange.CountAsync();
        var completedOrders = await ordersInRange.CountAsync(o =>
            o.Status == OrderStatuses.Completed || o.Status == "Delivered" || o.Status == "Teslim edildi");
        var cancelledOrders = await ordersInRange.CountAsync(o =>
            o.Status == OrderStatuses.Cancelled || o.Status == "İptal edildi");

        var pointsInRange = _context.PointTransactions.Where(pt => pt.CreatedDate >= fromUtc && pt.CreatedDate < toUtc);
        var totalEarnedPoints = await pointsInRange.Where(pt => pt.Amount > 0).SumAsync(pt => (int?)pt.Amount) ?? 0;
        var totalSpentPoints = await pointsInRange.Where(pt => pt.Amount < 0).SumAsync(pt => (int?)Math.Abs(pt.Amount)) ?? 0;

        var usedCoupons = await _context.UserRewards.CountAsync(ur =>
            ur.Status == UserRewardStatuses.Redeemed &&
            ur.RedeemedAt != null &&
            ur.RedeemedAt >= fromUtc &&
            ur.RedeemedAt < toUtc);

        var fieldCaptures = await _context.UserFieldCaptures.CountAsync(c =>
            c.CreatedDate >= fromUtc && c.CreatedDate < toUtc);

        var activityJoins = await _context.UserActivities.CountAsync(ua =>
            ua.CreatedDate >= fromUtc && ua.CreatedDate < toUtc);

        var activeRewards = await _context.Rewards.CountAsync(r => r.Status == "Active");

        return new
        {
            from = fromUtc,
            to = toUtc,
            newCitizens,
            earnedPoints = totalEarnedPoints,
            spentPoints = totalSpentPoints,
            orderCount = totalOrders,
            completedOrders,
            cancelledOrders,
            usedCoupons,
            fieldCaptures,
            activityJoins,
            activeRewards,
            citizens = new { totalUsers = newCitizens, liseUsers, uniUsers },
            orders = new { totalOrders, deliveredOrders = completedOrders, completedOrders, cancelledOrders },
            points = new { totalEarnedPoints, totalSpentPoints }
        };
    }
}
