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
}
