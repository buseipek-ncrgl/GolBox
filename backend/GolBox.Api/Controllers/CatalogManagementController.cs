using GolBox.Application.Authorization;
using GolBox.Application.Common;
using GolBox.Application.Interfaces;
using GolBox.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GolBox.Api.Controllers;

[Authorize(Policy = AuthorizationPolicies.AdminOnly)]
[Route("api/v1/catalog")]
public class CatalogManagementController : BaseApiController
{
    private readonly IAppDbContext _context;

    public CatalogManagementController(IAppDbContext context) => _context = context;

    [HttpGet("meta")]
    public async Task<IActionResult> GetMeta()
    {
        var categories = await _context.CafeCategories.OrderBy(x => x.DisplayOrder).ThenBy(x => x.Name)
            .Select(x => new { x.Id, x.Name, x.DisplayOrder }).ToListAsync();
        var ingredients = await _context.Ingredients.OrderBy(x => x.DisplayOrder).ThenBy(x => x.Name)
            .Select(x => new { x.Id, x.Name, x.IsActive, x.DisplayOrder }).ToListAsync();
        var allergens = await _context.Allergens.OrderBy(x => x.DisplayOrder).ThenBy(x => x.Name)
            .Select(x => new { x.Id, x.Name, x.IconKey, x.IsActive, x.DisplayOrder }).ToListAsync();
        return Ok(Result<object>.Ok(new { categories, ingredients, allergens }));
    }

    [HttpPost("categories")]
    public async Task<IActionResult> CreateCategory([FromBody] CatalogMasterRequest request)
    {
        var name = request.Name.Trim();
        if (name.Length < 2) return BadRequest(Result<object>.Fail("Kategori adı en az 2 karakter olmalıdır."));
        if (await _context.CafeCategories.AnyAsync(x => x.Name.ToLower() == name.ToLower()))
            return Conflict(Result<object>.Fail("Bu kategori zaten tanımlı."));
        var item = new CafeCategory { Id = Guid.NewGuid(), Name = name, DisplayOrder = request.DisplayOrder, OrganizationId = KnownOrganizations.Sehitkamil };
        _context.CafeCategories.Add(item);
        await _context.SaveChangesAsync();
        return Ok(Result<object>.Ok(new { item.Id, item.Name, item.DisplayOrder }, "Kategori oluşturuldu."));
    }

    [HttpPatch("categories/{id:guid}")]
    public async Task<IActionResult> UpdateCategory(Guid id, [FromBody] CatalogMasterRequest request)
    {
        var item = await _context.CafeCategories.FirstOrDefaultAsync(x => x.Id == id);
        if (item == null) return NotFound(Result<object>.Fail("Kategori bulunamadı."));
        if (!string.IsNullOrWhiteSpace(request.Name)) item.Name = request.Name.Trim();
        item.DisplayOrder = request.DisplayOrder;
        await _context.SaveChangesAsync();
        return Ok(Result<object>.Ok(new { item.Id }, "Kategori güncellendi."));
    }

    [HttpDelete("categories/{id:guid}")]
    public async Task<IActionResult> DeleteCategory(Guid id)
    {
        var item = await _context.CafeCategories.FirstOrDefaultAsync(x => x.Id == id);
        if (item == null) return NotFound(Result<object>.Fail("Kategori bulunamadı."));
        if (await _context.MenuItems.AnyAsync(x => x.CategoryId == id) || await _context.Cafes.AnyAsync(x => x.CategoryId == id))
            return Conflict(Result<object>.Fail("Bu kategori ürün veya şubelerde kullanılıyor. Önce bağlı kayıtları başka kategoriye taşıyın."));
        item.IsDeleted = true;
        await _context.SaveChangesAsync();
        return Ok(Result<object>.Ok(new { item.Id }, "Kategori silindi."));
    }

    [HttpPost("ingredients")]
    public async Task<IActionResult> CreateIngredient([FromBody] CatalogMasterRequest request)
    {
        var name = request.Name.Trim();
        if (name.Length < 2) return BadRequest(Result<object>.Fail("İçerik adı en az 2 karakter olmalıdır."));
        if (await _context.Ingredients.AnyAsync(x => x.Name.ToLower() == name.ToLower()))
            return Conflict(Result<object>.Fail("Bu içerik zaten tanımlı."));
        var item = new Ingredient { Id = Guid.NewGuid(), Name = name, DisplayOrder = request.DisplayOrder, IsActive = true };
        _context.Ingredients.Add(item);
        await _context.SaveChangesAsync();
        return Ok(Result<object>.Ok(new { item.Id, item.Name, item.IsActive, item.DisplayOrder }, "İçerik oluşturuldu."));
    }

    [HttpPatch("ingredients/{id:guid}")]
    public async Task<IActionResult> UpdateIngredient(Guid id, [FromBody] CatalogMasterRequest request)
    {
        var item = await _context.Ingredients.FirstOrDefaultAsync(x => x.Id == id);
        if (item == null) return NotFound(Result<object>.Fail("İçerik bulunamadı."));
        if (!string.IsNullOrWhiteSpace(request.Name)) item.Name = request.Name.Trim();
        item.DisplayOrder = request.DisplayOrder;
        if (request.IsActive.HasValue) item.IsActive = request.IsActive.Value;
        await _context.SaveChangesAsync();
        return Ok(Result<object>.Ok(new { item.Id }, "İçerik güncellendi."));
    }

    [HttpDelete("ingredients/{id:guid}")]
    public async Task<IActionResult> DeleteIngredient(Guid id)
    {
        var item = await _context.Ingredients.FirstOrDefaultAsync(x => x.Id == id);
        if (item == null) return NotFound(Result<object>.Fail("İçerik bulunamadı."));
        item.IsActive = false;
        await _context.SaveChangesAsync();
        return Ok(Result<object>.Ok(new { item.Id }, "İçerik arşivlendi."));
    }

    [HttpPost("allergens")]
    public async Task<IActionResult> CreateAllergen([FromBody] CatalogMasterRequest request)
    {
        var name = request.Name.Trim();
        if (name.Length < 2) return BadRequest(Result<object>.Fail("Alerjen adı en az 2 karakter olmalıdır."));
        if (await _context.Allergens.AnyAsync(x => x.Name.ToLower() == name.ToLower()))
            return Conflict(Result<object>.Fail("Bu alerjen zaten tanımlı."));
        var item = new Allergen { Id = Guid.NewGuid(), Name = name, IconKey = request.IconKey?.Trim() ?? "alert", DisplayOrder = request.DisplayOrder, IsActive = true };
        _context.Allergens.Add(item);
        await _context.SaveChangesAsync();
        return Ok(Result<object>.Ok(new { item.Id, item.Name, item.IconKey, item.IsActive, item.DisplayOrder }, "Alerjen oluşturuldu."));
    }

    [HttpPatch("allergens/{id:guid}")]
    public async Task<IActionResult> UpdateAllergen(Guid id, [FromBody] CatalogMasterRequest request)
    {
        var item = await _context.Allergens.FirstOrDefaultAsync(x => x.Id == id);
        if (item == null) return NotFound(Result<object>.Fail("Alerjen bulunamadı."));
        if (!string.IsNullOrWhiteSpace(request.Name)) item.Name = request.Name.Trim();
        if (request.IconKey != null) item.IconKey = request.IconKey.Trim();
        item.DisplayOrder = request.DisplayOrder;
        if (request.IsActive.HasValue) item.IsActive = request.IsActive.Value;
        await _context.SaveChangesAsync();
        return Ok(Result<object>.Ok(new { item.Id }, "Alerjen güncellendi."));
    }

    [HttpDelete("allergens/{id:guid}")]
    public async Task<IActionResult> DeleteAllergen(Guid id)
    {
        var item = await _context.Allergens.FirstOrDefaultAsync(x => x.Id == id);
        if (item == null) return NotFound(Result<object>.Fail("Alerjen bulunamadı."));
        item.IsActive = false;
        await _context.SaveChangesAsync();
        return Ok(Result<object>.Ok(new { item.Id }, "Alerjen arşivlendi."));
    }
}

public class CatalogMasterRequest
{
    public string Name { get; set; } = string.Empty;
    public string? IconKey { get; set; }
    public int DisplayOrder { get; set; }
    public bool? IsActive { get; set; }
}
