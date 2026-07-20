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
public class CafesController : BaseApiController
{
    private readonly IAppDbContext _context;

    public CafesController(IAppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetCafes()
    {
        var cafes = await _context.Cafes
            .Include(c => c.Category)
            .OrderBy(c => c.Name)
            .ToListAsync();
        return Ok(Result<object>.Ok(cafes));
    }

    [HttpPost]
    public async Task<IActionResult> CreateCafe([FromBody] CreateCafeRequest request)
    {
        // Get default CategoryId if not provided
        var categoryId = request.CategoryId;
        if (categoryId == Guid.Empty)
        {
            var defaultCategory = await _context.CafeCategories.FirstOrDefaultAsync();
            if (defaultCategory == null)
            {
                // Create a default category
                defaultCategory = new CafeCategory
                {
                    Id = Guid.NewGuid(),
                    Name = "Kafe",
                    OrganizationId = request.OrganizationId
                };
                _context.CafeCategories.Add(defaultCategory);
                await _context.SaveChangesAsync();
            }
            categoryId = defaultCategory.Id;
        }

        var cafe = new Cafe
        {
            Id = Guid.NewGuid(),
            OrganizationId = request.OrganizationId,
            Name = request.Name,
            Address = request.Address,
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            CategoryId = categoryId,
            IsActive = true
        };

        _context.Cafes.Add(cafe);
        await _context.SaveChangesAsync();

        return Ok(Result<Guid>.Ok(cafe.Id));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteCafe(Guid id)
    {
        var cafe = await _context.Cafes.FindAsync(id);
        if (cafe == null)
            return NotFound(Result<object>.Fail("Kafe bulunamadı."));

        cafe.IsDeleted = true;
        cafe.DeletedDate = DateTime.UtcNow;
        
        await _context.SaveChangesAsync();
        return Ok(Result<object>.Ok(null, "Kafe başarıyla silindi."));
    }
}

public class CreateCafeRequest
{
    public Guid OrganizationId { get; set; } = Guid.Parse("11111111-1111-1111-1111-111111111111");
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public decimal Latitude { get; set; } = 40.0m;
    public decimal Longitude { get; set; } = 32.0m;
    public Guid CategoryId { get; set; }
}
