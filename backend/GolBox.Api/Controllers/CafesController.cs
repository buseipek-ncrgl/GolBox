using System;
using System.Linq;
using System.Threading.Tasks;
using GolBox.Application.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GolBox.Application.Interfaces;
using GolBox.Application.Places;
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
    [AllowAnonymous]
    public async Task<IActionResult> GetCafes()
    {
        var cafes = await _context.Cafes
            .Include(c => c.Category)
            .OrderBy(c => c.Name)
            .ToListAsync();

        var dtoList = cafes.Select(c => new
        {
            c.Id,
            c.Name,
            c.Address,
            c.Latitude,
            c.Longitude,
            c.IsActive,
            c.ImageUrl,
            CategoryId = c.CategoryId,
            CategoryName = c.Category?.Name ?? "Genel",
            c.OrganizationId,
            c.PlaceId
        }).ToList();

        return Ok(Result<object>.Ok(dtoList));
    }

    [HttpPost]
    [Authorize(Policy = AuthorizationPolicies.StaffOrAdmin)]
    public async Task<IActionResult> CreateCafe([FromBody] CreateCafeRequest request)
    {
        var categoryId = request.CategoryId;
        if (categoryId == Guid.Empty)
        {
            var defaultCategory = await _context.CafeCategories.FirstOrDefaultAsync();
            if (defaultCategory == null)
            {
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
            ImageUrl = request.ImageUrl,
            IsActive = true
        };

        _context.Cafes.Add(cafe);
        await PlaceCafeSync.EnsureLinkedPlaceAsync(_context, cafe);
        await _context.SaveChangesAsync();
        await AuditLogsController.LogAsync(_context, "staff", "Staff", "Cafe_Create", "Cafes", "Cafe", cafe.Id.ToString(), null, cafe.Name, null);

        return Ok(Result<object>.Ok(new { id = cafe.Id, placeId = cafe.PlaceId }, "Tesis başarıyla oluşturuldu."));
    }

    [HttpPut("{id}")]
    [Authorize(Policy = AuthorizationPolicies.StaffOrAdmin)]
    public async Task<IActionResult> UpdateCafe(Guid id, [FromBody] UpdateCafeRequest request)
    {
        var cafe = await _context.Cafes.FindAsync(id);
        if (cafe == null)
            return NotFound(Result<object>.Fail("Kafe bulunamadı."));

        if (!string.IsNullOrWhiteSpace(request.Name))
            cafe.Name = request.Name;
        if (!string.IsNullOrWhiteSpace(request.Address))
            cafe.Address = request.Address;
        if (request.ImageUrl != null)
            cafe.ImageUrl = request.ImageUrl;
        if (request.Latitude.HasValue)
            cafe.Latitude = request.Latitude.Value;
        if (request.Longitude.HasValue)
            cafe.Longitude = request.Longitude.Value;
        if (request.CategoryId.HasValue && request.CategoryId.Value != Guid.Empty)
            cafe.CategoryId = request.CategoryId.Value;
        if (request.IsActive.HasValue)
            cafe.IsActive = request.IsActive.Value;

        cafe.UpdatedDate = DateTime.UtcNow;
        await PlaceCafeSync.EnsureLinkedPlaceAsync(_context, cafe);
        await _context.SaveChangesAsync();
        await AuditLogsController.LogAsync(_context, "staff", "Staff", "Cafe_Update", "Cafes", "Cafe", cafe.Id.ToString(), null, cafe.Name, null);

        return Ok(Result<object>.Ok(new { id = cafe.Id, placeId = cafe.PlaceId }, "Tesis başarıyla güncellendi."));
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = AuthorizationPolicies.StaffOrAdmin)]
    public async Task<IActionResult> DeleteCafe(Guid id)
    {
        var cafe = await _context.Cafes.FindAsync(id);
        if (cafe == null)
            return NotFound(Result<object>.Fail("Kafe bulunamadı."));

        cafe.IsDeleted = true;
        cafe.DeletedDate = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        await AuditLogsController.LogAsync(_context, "staff", "Staff", "Cafe_Delete", "Cafes", "Cafe", id.ToString(), cafe.Name, null, null);
        return Ok(Result<object>.Ok(new { id }, "Kafe başarıyla silindi."));
    }
}

public class CreateCafeRequest
{
    public Guid OrganizationId { get; set; } = KnownOrganizations.Sehitkamil;
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public decimal Latitude { get; set; } = 37.0750m;
    public decimal Longitude { get; set; } = 37.3825m;
    public Guid CategoryId { get; set; }
    public string? ImageUrl { get; set; }
}

public class UpdateCafeRequest
{
    public string? Name { get; set; }
    public string? Address { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public Guid? CategoryId { get; set; }
    public string? ImageUrl { get; set; }
    public bool? IsActive { get; set; }
}
