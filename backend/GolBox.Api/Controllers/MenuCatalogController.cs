using GolBox.Application.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GolBox.Application.Common;
using GolBox.Application.Interfaces;

namespace GolBox.Api.Controllers;

[Authorize]
[Route("api/v1/menu-items")]
public class MenuCatalogController : BaseApiController
{
    private readonly IAppDbContext _context;

    public MenuCatalogController(IAppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAllMenuItems()
    {
        var items = await _context.MenuItems
            .Include(m => m.Cafe)
            .OrderBy(m => m.Name)
            .Select(m => new
            {
                m.Id,
                m.CafeId,
                CafeName = m.Cafe != null ? m.Cafe.Name : "Tesis",
                m.Name,
                m.Description,
                m.Price,
                m.ImageUrl,
                m.MinAge,
                m.MaxAge,
                m.RequiredEducation,
                m.IsActive
            })
            .ToListAsync();

        return Ok(Result<object>.Ok(items));
    }

    [HttpGet("admin")]
    [Authorize(Policy = AuthorizationPolicies.StaffOrAdmin)]
    public async Task<IActionResult> GetAdminMenuItems(
        [FromQuery] Guid? cafeId = null,
        [FromQuery] bool? active = null,
        [FromQuery] string? search = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = AdminPaging.DefaultPageSize)
    {
        (page, pageSize) = AdminPaging.Normalize(page, pageSize);
        var query = _context.MenuItems.Include(m => m.Cafe).AsQueryable();
        if (cafeId.HasValue)
            query = query.Where(m => m.CafeId == cafeId.Value);
        if (active.HasValue)
            query = query.Where(m => m.IsActive == active.Value);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(m => m.Name.Contains(term) || m.Description.Contains(term));
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderBy(m => m.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(m => new
            {
                m.Id,
                m.CafeId,
                CafeName = m.Cafe != null ? m.Cafe.Name : "Tesis",
                m.Name,
                m.Description,
                m.Price,
                m.ImageUrl,
                m.MinAge,
                m.MaxAge,
                m.RequiredEducation,
                m.IsActive
            })
            .ToListAsync();
        return Ok(Result<object>.Ok(new { items, page, pageSize, totalCount }));
    }
}
