using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GolBox.Persistence.Context;

namespace GolBox.Api.Controllers;

[ApiController]
[AllowAnonymous]
public sealed class HealthController : ControllerBase
{
    private readonly AppDbContext _db;

    public HealthController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("/health")]
    [HttpGet("/health/ready")]
    public async Task<IActionResult> Ready(CancellationToken cancellationToken)
    {
        var canConnect = await _db.Database.CanConnectAsync(cancellationToken);
        if (!canConnect)
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new { status = "unhealthy" });

        var pending = (await _db.Database.GetPendingMigrationsAsync(cancellationToken)).ToList();
        if (pending.Count > 0)
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new { status = "unhealthy" });

        return Ok(new { status = "ok" });
    }

    [HttpGet("/health/live")]
    public IActionResult Live() => Ok(new { status = "ok" });
}
