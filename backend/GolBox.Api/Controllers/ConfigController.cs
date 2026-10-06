using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;
using GolBox.Application.Common;
using GolBox.Application.Interfaces;
using GolBox.Persistence.Context;

namespace GolBox.Api.Controllers;

[AllowAnonymous]
[ApiController]
[Route("api/v1/config")]
public class ConfigController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IWebHostEnvironment _env;
    private readonly IPasswordHasher _passwordHasher;

    public ConfigController(AppDbContext context, IWebHostEnvironment env, IPasswordHasher passwordHasher)
    {
        _context = context;
        _env = env;
        _passwordHasher = passwordHasher;
    }

    [HttpGet("app-status")]
    public IActionResult GetAppStatus()
    {
        var appStatus = new
        {
            minSupportedVersion = "1.0.0",
            latestVersion = "1.2.0",
            isMaintenanceMode = false,
            maintenanceMessage = "GölBOX kısa bir kahve molasında ☕\nSize daha iyi hizmet verebilmek için sistemlerimiz üzerinde çalışıyoruz. Kısa süre sonra tekrar deneyebilirsiniz.",
            isForceUpdateRequired = false,
            updateTitle = "GölBOX'ın yeni sürümü hazır.",
            updateMessage = "Yeni lezzetler, hızlandırılmış sipariş takibi ve daha fazla GölPuan kazanma fırsatı sunan yeni versiyonu hemen yükleyin.",
            activeFeatures = new[]
            {
                "GelAl",
                "GolPuan",
                "Campaigns",
                "GolBoxGenc",
                "Gamification",
                "Favorites",
                "Reorder"
            }
        };

        return Ok(Result<object>.Ok(appStatus));
    }

    [HttpPost("reset-test-data")]
    public async Task<IActionResult> ResetTestData()
    {
        if (!_env.IsDevelopment())
        {
            return BadRequest(Result<string>.Fail("Test data reset is strictly prohibited in Non-Development environments."));
        }

        await DbInitializer.SeedAsync(_context, _passwordHasher, isDevelopment: true, forceRefresh: true);

        var accounts = new object[]
        {
            new { name = "TEST Customer Clean", email = "customer.clean@golbox.com", pass = "Clean123!", points = 0, role = "User" },
            new { name = "TEST Customer Loyalty", email = "customer.loyalty@golbox.com", pass = "Loyal123!", points = 340, role = "User" },
            new { name = "TEST Customer LowPoints (39 GP)", email = "customer.low@golbox.com", pass = "Low123!", points = 39, role = "User" },
            new { name = "TEST Customer ExactPoints (40 GP)", email = "customer.exact@golbox.com", pass = "Exact123!", points = 40, role = "User" },
            new { name = "TEST Customer Active Order", email = "customer.active@golbox.com", pass = "Active123!", points = 100, role = "User" },
            new { name = "TEST Branch Staff (Branch 1)", email = "staff.branch1@golbox.gov.tr", pass = "Staff123!", points = 0, role = "Staff" },
            new { name = "TEST Admin", email = "admin@golbox.gov.tr", pass = "Admin123!", points = 0, role = "Admin" }
        };

        return Ok(Result<object>.Ok(new
        {
            message = "GölBOX Test verileri başarıyla sıfırlandı ve yenilendi.",
            timestamp = System.DateTime.UtcNow,
            testUsers = accounts
        }));
    }
}
