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
    public async Task<IActionResult> GetReportsSummary()
    {
        var totalUsers = await _context.Users.CountAsync(u => u.Email != "admin@golbox.gov.tr");
        var liseUsers = await _context.Users.CountAsync(u => u.EducationLevel == "Lise");
        var uniUsers = await _context.Users.CountAsync(u => u.EducationLevel == "Üniversite");

        var totalOrders = await _context.Orders.CountAsync();
        var deliveredOrders = await _context.Orders.CountAsync(o => o.Status == "Delivered" || o.Status == "Teslim edildi");
        var cancelledOrders = await _context.Orders.CountAsync(o => o.Status == "Cancelled" || o.Status == "İptal edildi");

        var totalEarnedPoints = await _context.PointTransactions.Where(pt => pt.Amount > 0).SumAsync(pt => (int?)pt.Amount) ?? 0;
        var totalSpentPoints = await _context.PointTransactions.Where(pt => pt.Amount < 0).SumAsync(pt => (int?)Math.Abs(pt.Amount)) ?? 0;

        return Ok(Result<object>.Ok(new
        {
            citizens = new { totalUsers, liseUsers, uniUsers },
            orders = new { totalOrders, deliveredOrders, cancelledOrders },
            points = new { totalEarnedPoints, totalSpentPoints }
        }));
    }

    [HttpGet("export/{type}")]
    public async Task<IActionResult> ExportReport(string type)
    {
        var sb = new StringBuilder();

        if (type.Equals("citizens", StringComparison.OrdinalIgnoreCase))
        {
            sb.AppendLine("Id;Ad;Soyad;Eposta;Telefon;Yas;Egitim;GolPuan");
            var users = await _context.Users.Where(u => u.Email != "admin@golbox.gov.tr").ToListAsync();
            foreach (var u in users)
            {
                sb.AppendLine($"{u.Id};{u.FirstName};{u.LastName};{u.Email};{u.PhoneNumber};{u.Age ?? 0};{u.EducationLevel};{u.PointsBalance}");
            }
        }
        else if (type.Equals("orders", StringComparison.OrdinalIgnoreCase))
        {
            sb.AppendLine("Id;KoleksiyonKodu;Vatandas;Kafe;Tutar;PuanKullanildi;Durum;Tarih");
            var orders = await _context.Orders.Include(o => o.User).Include(o => o.Cafe).ToListAsync();
            foreach (var o in orders)
            {
                sb.AppendLine($"{o.Id};{o.CollectionCode};{o.User?.FirstName} {o.User?.LastName};{o.Cafe?.Name};{o.TotalAmount};{o.PointsUsed};{o.Status};{o.CreatedDate:yyyy-MM-dd HH:mm}");
            }
        }
        else
        {
            sb.AppendLine("Id;Vatandas;Turu;Miktar;Aciklama;Tarih");
            var pts = await _context.PointTransactions.Include(pt => pt.User).ToListAsync();
            foreach (var pt in pts)
            {
                sb.AppendLine($"{pt.Id};{pt.User?.FirstName} {pt.User?.LastName};{pt.Type};{pt.Amount};{pt.Description};{pt.CreatedDate:yyyy-MM-dd HH:mm}");
            }
        }

        var csvBytes = Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(sb.ToString())).ToArray();
        return File(csvBytes, "text/csv", $"golbox-rapor-{type}-{DateTime.UtcNow:yyyyMMdd}.csv");
    }
}
