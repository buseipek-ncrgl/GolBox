using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GolBox.Application.Common;

namespace GolBox.Api.Controllers;

[AllowAnonymous]
[ApiController]
[Route("api/v1/config")]
public class ConfigController : ControllerBase
{
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
}
