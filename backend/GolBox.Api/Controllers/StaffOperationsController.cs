using GolBox.Application.Authorization;
using GolBox.Application.Common;
using GolBox.Application.Interfaces;
using GolBox.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GolBox.Api.Controllers;

[Authorize(Policy = AuthorizationPolicies.StaffOrAdmin)]
[Route("api/v1/staff")]
public class StaffOperationsController : ControllerBase
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public StaffOperationsController(IAppDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    [HttpGet("products")]
    public async Task<IActionResult> GetBranchProducts()
    {
        var branchId = await ResolveBranchId();
        if (!branchId.HasValue) return Forbidden("Personel hesabınıza aktif bir şube atanmamış.");
        var items = await _context.MenuItems.AsNoTracking()
            .Where(x => x.IsActive)
            .OrderBy(x => x.DisplayOrder).ThenBy(x => x.Name)
            .Select(x => new
            {
                x.Id, x.Name, x.Description, x.Price, x.ImageUrl, x.CategoryId,
                categoryName = x.Category != null ? x.Category.Name : "Kategorisiz",
                cafeId = branchId.Value,
                isAvailable = x.BranchAvailabilities.Where(a => a.CafeId == branchId.Value)
                    .Select(a => (bool?)a.IsAvailable).FirstOrDefault() ?? x.CafeId == branchId.Value
            }).ToListAsync();
        return Ok(Result<object>.Ok(items));
    }

    [HttpPatch("products/{productId:guid}/availability")]
    public async Task<IActionResult> UpdateProductAvailability(Guid productId, [FromBody] AvailabilityRequest request)
    {
        var branchId = await ResolveBranchId();
        if (!branchId.HasValue) return Forbidden("Personel hesabınıza aktif bir şube atanmamış.");
        if (!await HasDuty("BranchManager", "BranchStaff", "OrderPreparer")) return Forbidden("Göreviniz ürün durumunu değiştirmeye yetkili değil.");
        if (!await _context.MenuItems.AnyAsync(x => x.Id == productId && x.IsActive))
            return NotFound(Result<object>.Fail("Ürün bulunamadı."));

        var row = await _context.BranchProducts.FirstOrDefaultAsync(x => x.CafeId == branchId.Value && x.MenuItemId == productId);
        if (row == null)
        {
            row = new BranchProduct { Id = Guid.NewGuid(), CafeId = branchId.Value, MenuItemId = productId };
            _context.BranchProducts.Add(row);
        }
        row.IsAvailable = request.IsAvailable;
        row.UpdatedDate = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        await AuditLogsController.LogAsync(_context, _currentUser.Email ?? "staff", _currentUser.Role ?? "Staff", "Product_Availability", "MenuItems", "MenuItem", productId.ToString(), null, request.IsAvailable.ToString(), branchId.ToString());
        return Ok(Result<object>.Ok(new { productId, branchId, request.IsAvailable }, "Şube ürün durumu güncellendi."));
    }

    [HttpPatch("branches/{branchId:guid}/pickup-status")]
    public async Task<IActionResult> UpdatePickupStatus(Guid branchId, [FromBody] PickupStatusRequest request)
    {
        var allowedBranchId = await ResolveBranchId();
        if (!allowedBranchId.HasValue) return Forbidden("Personel hesabınıza aktif bir şube atanmamış.");
        if (!_currentUser.IsAdmin && allowedBranchId.Value != branchId) return Forbidden("Başka bir şubenin Gel-Al durumunu değiştiremezsiniz.");
        if (!_currentUser.IsAdmin && !await HasDuty("BranchManager")) return Forbidden("Gel-Al durumunu yalnızca şube yöneticisi değiştirebilir.");
        var status = request.Status?.Trim().ToUpperInvariant();
        if (status is not ("OPEN" or "AVAILABLE" or "PAUSED" or "CLOSED" or "DISABLED"))
            return BadRequest(Result<object>.Fail("Geçersiz Gel-Al durumu."));
        var cafe = await _context.Cafes.FirstOrDefaultAsync(x => x.Id == branchId);
        if (cafe == null) return NotFound(Result<object>.Fail("Şube bulunamadı."));
        cafe.PickupStatus = status is "OPEN" ? "AVAILABLE" : status is "CLOSED" ? "DISABLED" : status;
        cafe.PickupPausedAt = cafe.PickupStatus == "PAUSED" ? DateTime.UtcNow : null;
        cafe.PickupPausedBy = _currentUser.Email;
        cafe.PickupPauseReason = cafe.PickupStatus == "PAUSED" ? request.Reason?.Trim() : null;
        cafe.UpdatedDate = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return Ok(Result<object>.Ok(new { branchId, pickupStatus = cafe.PickupStatus }, "Gel-Al durumu güncellendi."));
    }

    private async Task<Guid?> ResolveBranchId()
    {
        if (_currentUser.IsAdmin) return await _context.Cafes.Where(x => x.IsActive).Select(x => (Guid?)x.Id).FirstOrDefaultAsync();
        return await _context.StaffUsers.AsNoTracking().Where(x => x.UserId == _currentUser.UserId && x.IsActive).Select(x => x.BranchId).FirstOrDefaultAsync();
    }

    private async Task<bool> HasDuty(params string[] allowed)
    {
        if (_currentUser.IsAdmin) return true;
        var duty = await _context.StaffUsers.AsNoTracking().Where(x => x.UserId == _currentUser.UserId && x.IsActive).Select(x => x.Role).FirstOrDefaultAsync();
        return duty != null && allowed.Contains(duty, StringComparer.OrdinalIgnoreCase);
    }

    private ObjectResult Forbidden(string message) => StatusCode(403, Result<object>.Fail(message));
    public sealed class AvailabilityRequest { public bool IsAvailable { get; set; } }
    public sealed class PickupStatusRequest { public string Status { get; set; } = "AVAILABLE"; public string? Reason { get; set; } public int? DurationMinutes { get; set; } }
}
