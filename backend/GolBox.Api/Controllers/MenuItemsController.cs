using System;
using System.Linq;
using System.Collections.Generic;
using System.Threading.Tasks;
using GolBox.Application.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GolBox.Application.Interfaces;
using GolBox.Domain.Entities;
using GolBox.Application.Common;
using GolBox.Persistence.Context;

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
    [AllowAnonymous]
    public async Task<IActionResult> GetMenuItems(Guid cafeId)
    {
        var items = await _context.MenuItems
            .Where(m => m.IsActive)
            .Include(m => m.Category)
            .Include(m => m.ProductIngredients).ThenInclude(x => x.Ingredient)
            .Include(m => m.ProductAllergens).ThenInclude(x => x.Allergen)
            .Include(m => m.OptionGroups).ThenInclude(x => x.Options)
            .OrderBy(m => m.DisplayOrder).ThenBy(m => m.Name)
            .ToListAsync();

        var itemIds = items.Select(m => m.Id).ToList();
        var availability = await _context.BranchProducts
            .Where(x => x.CafeId == cafeId && itemIds.Contains(x.MenuItemId))
            .ToDictionaryAsync(x => x.MenuItemId, x => x.IsAvailable);

        items = items.Where(m => availability.TryGetValue(m.Id, out var available) ? available : m.CafeId == cafeId).ToList();

        var dtoList = items.Select(m => new
        {
            m.Id,
            m.CafeId,
            m.Name,
            m.Description,
            m.Price,
            m.ImageUrl,
            m.MinAge,
            m.MaxAge,
            m.RequiredEducation,
            m.IsActive,
            m.CategoryId,
            CategoryName = m.Category != null ? m.Category.Name : "Kategorisiz",
            Ingredients = m.ProductIngredients.OrderBy(x => x.Ingredient.DisplayOrder).Select(x => new { x.IngredientId, x.Ingredient.Name }),
            Allergens = m.ProductAllergens.OrderBy(x => x.Allergen.DisplayOrder).Select(x => new { x.AllergenId, x.Allergen.Name, x.Allergen.IconKey }),
            OptionGroups = m.OptionGroups.OrderBy(x => x.DisplayOrder).Select(g => new
            {
                g.Id,
                g.Name,
                g.SelectionType,
                g.Required,
                g.MinSelections,
                g.MaxSelections,
                Options = g.Options.Where(o => o.IsActive).OrderBy(o => o.DisplayOrder).Select(o => new { o.Id, o.Name, o.PriceModifier })
            })
        }).ToList();

        return Ok(Result<object>.Ok(dtoList));
    }

    [HttpPost]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> CreateMenuItem(Guid cafeId, [FromBody] CreateMenuItemRequest request)
    {
        if (cafeId == Guid.Empty)
            cafeId = await _context.Cafes.Where(c => c.IsActive).Select(c => c.Id).FirstOrDefaultAsync();
        if (cafeId == Guid.Empty)
            return BadRequest(Result<object>.Fail("Katalog ürünü oluşturmadan önce en az bir şube tanımlanmalıdır."));
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(Result<object>.Fail("Ürün adı zorunludur."));
        if (!request.CategoryId.HasValue || request.CategoryId == Guid.Empty)
            return BadRequest(Result<object>.Fail("Ürün kategorisi zorunludur. Kahveler, tatlılar veya içecekler gibi bir kategori seçin."));
        if (!await _context.CafeCategories.AnyAsync(c => c.Id == request.CategoryId.Value))
            return BadRequest(Result<object>.Fail("Seçilen ürün kategorisi bulunamadı."));
        var priceCheck = AdminSafetyRules.ValidateMenuPrice(request.Price);
        if (!priceCheck.Success)
            return BadRequest(Result<object>.Fail(priceCheck.Message));

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
            MinAge = request.MinAge,
            MaxAge = request.MaxAge,
            RequiredEducation = request.RequiredEducation,
            CategoryId = request.CategoryId,
            DisplayOrder = request.DisplayOrder,
            PublishedAt = request.IsActive == false ? null : DateTime.UtcNow,
            IsActive = request.IsActive != false
        };

        _context.MenuItems.Add(menuItem);
        ApplyCatalogRelations(menuItem, request);
        await _context.SaveChangesAsync();
        await AuditLogsController.LogAsync(_context, "staff", "Staff", "Menu_Create", "MenuItems", "MenuItem", menuItem.Id.ToString(), null, menuItem.Name, cafeId.ToString());

        return Ok(Result<object>.Ok(new { id = menuItem.Id }, "Ürün başarıyla eklendi."));
    }

    [HttpPut("{id}")]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> UpdateMenuItem(Guid cafeId, Guid id, [FromBody] CreateMenuItemRequest request)
    {
        var menuItem = await _context.MenuItems.FirstOrDefaultAsync(m => m.Id == id);
        if (menuItem == null)
            return NotFound(Result<object>.Fail("Ürün bulunamadı."));
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(Result<object>.Fail("Ürün adı zorunludur."));
        if (request.CategoryId.HasValue && request.CategoryId.Value != Guid.Empty)
        {
            if (!await _context.CafeCategories.AnyAsync(c => c.Id == request.CategoryId.Value))
                return BadRequest(Result<object>.Fail("Seçilen ürün kategorisi bulunamadı."));
            menuItem.CategoryId = request.CategoryId.Value;
        }
        var priceCheck = AdminSafetyRules.ValidateMenuPrice(request.Price);
        if (!priceCheck.Success)
            return BadRequest(Result<object>.Fail(priceCheck.Message));

        var previous = $"{menuItem.Name}/{menuItem.Price}/{menuItem.IsActive}";
        menuItem.Name = request.Name.Trim();
        menuItem.Description = request.Description;
        menuItem.Price = request.Price;
        if (request.ImageUrl != null)
            menuItem.ImageUrl = request.ImageUrl;
        menuItem.MinAge = request.MinAge;
        menuItem.MaxAge = request.MaxAge;
        menuItem.RequiredEducation = request.RequiredEducation;
        menuItem.DisplayOrder = request.DisplayOrder;
        if (request.IsActive.HasValue)
        {
            menuItem.IsActive = request.IsActive.Value;
            menuItem.PublishedAt = request.IsActive.Value ? menuItem.PublishedAt ?? DateTime.UtcNow : null;
        }
        await ReplaceCatalogRelationsAsync(menuItem, request);
        menuItem.UpdatedDate = DateTime.UtcNow;
        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (_context is AppDbContext appDb)
            {
                foreach (var entry in appDb.ChangeTracker.Entries().ToList())
                {
                    if (entry.Entity is ProductOptionGroup || entry.Entity is ProductOption)
                    {
                        if (entry.State == EntityState.Modified || entry.State == EntityState.Deleted)
                            entry.State = EntityState.Detached;
                    }
                }
            }
            await _context.SaveChangesAsync();
        }
        await AuditLogsController.LogAsync(_context, "staff", "Staff", "Menu_Update", "MenuItems", "MenuItem", menuItem.Id.ToString(), previous, menuItem.Name, cafeId.ToString());
        return Ok(Result<object>.Ok(new { id = menuItem.Id }, "Ürün güncellendi."));
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> DeleteMenuItem(Guid cafeId, Guid id)
    {
        var menuItem = await _context.MenuItems
            .FirstOrDefaultAsync(m => m.CafeId == cafeId && m.Id == id);
            
        if (menuItem == null)
            return NotFound(Result<object>.Fail("Ürün bulunamadı."));

        menuItem.IsDeleted = true;
        menuItem.DeletedDate = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(Result<object>.Ok(new { id }, "Ürün başarıyla silindi."));
    }

    private void ApplyCatalogRelations(MenuItem item, CreateMenuItemRequest request, bool includeBranches = true)
    {
        foreach (var ingredientId in request.IngredientIds.Distinct())
            _context.ProductIngredients.Add(new ProductIngredient { Id = Guid.NewGuid(), MenuItemId = item.Id, IngredientId = ingredientId });
        foreach (var allergenId in request.AllergenIds.Distinct())
            _context.ProductAllergens.Add(new ProductAllergen { Id = Guid.NewGuid(), MenuItemId = item.Id, AllergenId = allergenId });
        foreach (var groupRequest in request.OptionGroups)
        {
            var group = new ProductOptionGroup
            {
                Id = Guid.NewGuid(), MenuItemId = item.Id, Name = groupRequest.Name.Trim(),
                SelectionType = groupRequest.SelectionType == "MULTI" ? "MULTI" : "SINGLE",
                Required = groupRequest.Required, MinSelections = groupRequest.Required ? Math.Max(1, groupRequest.MinSelections) : Math.Max(0, groupRequest.MinSelections),
                MaxSelections = Math.Max(1, groupRequest.MaxSelections), DisplayOrder = groupRequest.DisplayOrder
            };
            _context.ProductOptionGroups.Add(group);
            foreach (var optionRequest in groupRequest.Options.Where(o => !string.IsNullOrWhiteSpace(o.Name)))
                _context.ProductOptions.Add(new ProductOption { Id = Guid.NewGuid(), OptionGroupId = group.Id, Name = optionRequest.Name.Trim(), PriceModifier = optionRequest.PriceModifier, DisplayOrder = optionRequest.DisplayOrder, IsActive = true });
        }
        if (includeBranches)
            foreach (var branch in request.BranchAvailabilities.GroupBy(x => x.CafeId).Select(x => x.Last()))
                _context.BranchProducts.Add(new BranchProduct { Id = Guid.NewGuid(), CafeId = branch.CafeId, MenuItemId = item.Id, IsAvailable = branch.IsAvailable });
    }

    private async System.Threading.Tasks.Task ReplaceCatalogRelationsAsync(MenuItem item, CreateMenuItemRequest request)
    {
        var ingredients = await _context.ProductIngredients.Where(x => x.MenuItemId == item.Id).ToListAsync();
        var allergens = await _context.ProductAllergens.Where(x => x.MenuItemId == item.Id).ToListAsync();
        var groups = await _context.ProductOptionGroups.Where(x => x.MenuItemId == item.Id).Include(x => x.Options).ToListAsync();
        var branches = await _context.BranchProducts.Where(x => x.MenuItemId == item.Id).ToListAsync();

        _context.ProductIngredients.RemoveRange(ingredients);
        _context.ProductAllergens.RemoveRange(allergens);

        foreach (var group in groups)
        {
            _context.ProductOptions.RemoveRange(group.Options);
        }
        _context.ProductOptionGroups.RemoveRange(groups);

        var requestedBranches = request.BranchAvailabilities.GroupBy(x => x.CafeId).ToDictionary(x => x.Key, x => x.Last().IsAvailable);
        foreach (var branch in branches)
        {
            if (requestedBranches.Remove(branch.CafeId, out var isAvailable)) branch.IsAvailable = isAvailable;
            else branch.IsAvailable = false;
        }
        foreach (var branch in requestedBranches)
            _context.BranchProducts.Add(new BranchProduct { Id = Guid.NewGuid(), CafeId = branch.Key, MenuItemId = item.Id, IsAvailable = branch.Value });

        ApplyCatalogRelations(item, request, includeBranches: false);
    }
}

public class CreateMenuItemRequest
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string? ImageUrl { get; set; }
    public int? MinAge { get; set; }
    public int? MaxAge { get; set; }
    public string? RequiredEducation { get; set; }
    public bool? IsActive { get; set; }
    public Guid? CategoryId { get; set; }
    public int DisplayOrder { get; set; }
    public List<Guid> IngredientIds { get; set; } = new();
    public List<Guid> AllergenIds { get; set; } = new();
    public List<OptionGroupRequest> OptionGroups { get; set; } = new();
    public List<BranchAvailabilityRequest> BranchAvailabilities { get; set; } = new();
}

public class OptionGroupRequest
{
    public string Name { get; set; } = string.Empty;
    public string SelectionType { get; set; } = "SINGLE";
    public bool Required { get; set; }
    public int MinSelections { get; set; }
    public int MaxSelections { get; set; } = 1;
    public int DisplayOrder { get; set; }
    public List<OptionRequest> Options { get; set; } = new();
}

public class OptionRequest
{
    public string Name { get; set; } = string.Empty;
    public decimal PriceModifier { get; set; }
    public int DisplayOrder { get; set; }
}

public class BranchAvailabilityRequest
{
    public Guid CafeId { get; set; }
    public bool IsAvailable { get; set; }
}
