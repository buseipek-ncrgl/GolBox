using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GolBox.Application.Interfaces;
using GolBox.Domain.Entities;
using GolBox.Application.Common;

namespace GolBox.Api.Controllers;

[Authorize]
[Route("api/v1/cafes/{cafeId}/menu")]
public class MenuItemsController : BaseApiController
{
    private readonly IAppDbContext _context;

    public MenuItemsController(IAppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetMenuItems(Guid cafeId)
    {
        var items = await _context.MenuItems
            .Where(m => m.CafeId == cafeId)
            .OrderBy(m => m.Name)
            .ToListAsync();
        return Ok(Result<object>.Ok(items));
    }

    [HttpPost]
    public async Task<IActionResult> CreateMenuItem(Guid cafeId, [FromBody] CreateMenuItemRequest request)
    {
        var cafeExists = await _context.Cafes.AnyAsync(c => c.Id == cafeId);
        if (!cafeExists)
            return NotFound(Result<object>.Fail("Belirtilen kafe bulunamadı."));

        var menuItem = new MenuItem
        {
            Id = Guid.NewGuid(),
            CafeId = cafeId,
            Name = request.Name,
            Description = request.Description,
            Price = request.Price,
            ImageUrl = request.ImageUrl,
            IsActive = true
        };

        _context.MenuItems.Add(menuItem);
        await _context.SaveChangesAsync();

        return Ok(Result<Guid>.Ok(menuItem.Id));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteMenuItem(Guid cafeId, Guid id)
    {
        var menuItem = await _context.MenuItems
            .FirstOrDefaultAsync(m => m.CafeId == cafeId && m.Id == id);
            
        if (menuItem == null)
            return NotFound(Result<object>.Fail("Ürün bulunamadı."));

        menuItem.IsDeleted = true;
        menuItem.DeletedDate = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(Result<object>.Ok(null, "Ürün başarıyla silindi."));
    }
}

public class CreateMenuItemRequest
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string? ImageUrl { get; set; }
}
