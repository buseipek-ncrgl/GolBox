using GolBox.Application.Authorization;
using GolBox.Application.Common;
using GolBox.Application.Content;
using GolBox.Application.Interfaces;
using GolBox.Application.Places;
using GolBox.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GolBox.Api.Controllers;

[ApiController]
[Authorize(Policy = AuthorizationPolicies.AdminOnly)]
[Route("api/v1/admin/places")]
public class AdminPlacesController : ControllerBase
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IPlaceCache _cache;

    public AdminPlacesController(IAppDbContext context, ICurrentUserService currentUser, IPlaceCache cache)
    {
        _context = context;
        _currentUser = currentUser;
        _cache = cache;
    }

    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] string? category,
        [FromQuery] string? search,
        [FromQuery] bool? published,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);
        var orgId = await ResolveOrganizationIdAsync(cancellationToken);
        var query = _context.Places.AsNoTracking()
            .Include(p => p.Cafes)
            .WhereOrg(orgId)
            .WhereCategory(category)
            .WhereSearch(search);
        if (published.HasValue)
            query = query.Where(p => p.IsPublished == published.Value);

        var total = await query.CountAsync(cancellationToken);
        var rows = await query
            .OrderBy(p => p.SortOrder)
            .ThenBy(p => p.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var items = rows.Select(p => new
        {
            p.Id,
            p.Name,
            p.Slug,
            category = PlaceCategories.Canonical(p.Category),
            p.District,
            p.Neighborhood,
            p.Address,
            p.Latitude,
            p.Longitude,
            p.CoverImageUrl,
            p.IsActive,
            p.IsPublished,
            p.SortOrder,
            cafeId = p.Cafes.Where(c => !c.IsDeleted).Select(c => (Guid?)c.Id).FirstOrDefault()
        }).ToList();

        return Ok(Result<object>.Ok(new { items, page, pageSize, totalCount = total }));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken cancellationToken)
    {
        var orgId = await ResolveOrganizationIdAsync(cancellationToken);
        var place = await _context.Places.AsNoTracking().IncludeDetails()
            .FirstOrDefaultAsync(p => p.Id == id && p.OrganizationId == orgId, cancellationToken);
        if (place == null)
            return NotFound(Result<object>.Fail("Tesis bulunamadı."));
        return Ok(Result<object>.Ok(PlaceMapper.ToAdmin(place)));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] UpsertPlaceRequest request, CancellationToken cancellationToken)
    {
        var validation = PlaceRules.ValidateWrite(
            request.Name, request.Category, request.Latitude, request.Longitude,
            request.Phone, request.Email, request.WebsiteUrl, request.CoverImageUrl, request.Amenities);
        if (!validation.Success)
            return BadRequest(validation);

        var orgId = await ResolveOrganizationIdAsync(cancellationToken);
        var place = new Place
        {
            Id = Guid.NewGuid(),
            OrganizationId = orgId
        };
        PlaceMutations.ApplyCore(place, request);
        place.Slug = await UniqueSlugAsync(orgId, request.Slug, place.Name, place.Id, null, cancellationToken);
        PlaceMutations.ReplaceHours(place, request.OpeningHours);
        PlaceMutations.ReplaceAmenities(place, request.Amenities);

        _context.Places.Add(place);
        await _context.SaveChangesAsync(cancellationToken);
        _cache.Invalidate();
        await AuditLogsController.LogAsync(_context, _currentUser.Email ?? "admin", "Admin", "Place_Create", "Places", "Place", place.Id.ToString(), null, place.Name, null);
        return Ok(Result<object>.Ok(PlaceMapper.ToAdmin(place), "Tesis oluşturuldu."));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpsertPlaceRequest request, CancellationToken cancellationToken)
    {
        var validation = PlaceRules.ValidateWrite(
            request.Name, request.Category, request.Latitude, request.Longitude,
            request.Phone, request.Email, request.WebsiteUrl, request.CoverImageUrl, request.Amenities);
        if (!validation.Success)
            return BadRequest(validation);

        var orgId = await ResolveOrganizationIdAsync(cancellationToken);
        var place = await _context.Places.IncludeDetails()
            .FirstOrDefaultAsync(p => p.Id == id && p.OrganizationId == orgId, cancellationToken);
        if (place == null)
            return NotFound(Result<object>.Fail("Tesis bulunamadı."));

        PlaceMutations.ApplyCore(place, request);
        place.Slug = await UniqueSlugAsync(orgId, request.Slug, place.Name, place.Id, place.Id, cancellationToken);

        foreach (var hour in place.OpeningHours.ToList())
            _context.PlaceOpeningHours.Remove(hour);
        foreach (var amenity in place.Amenities.ToList())
            _context.PlaceAmenities.Remove(amenity);
        place.OpeningHours.Clear();
        place.Amenities.Clear();
        PlaceMutations.ReplaceHours(place, request.OpeningHours);
        PlaceMutations.ReplaceAmenities(place, request.Amenities);

        foreach (var cafe in place.Cafes.Where(c => !c.IsDeleted))
            PlaceCafeSync.ApplyPlaceToCafe(place, cafe);

        await _context.SaveChangesAsync(cancellationToken);
        _cache.Invalidate();
        await AuditLogsController.LogAsync(_context, _currentUser.Email ?? "admin", "Admin", "Place_Update", "Places", "Place", place.Id.ToString(), null, place.Name, null);
        return Ok(Result<object>.Ok(PlaceMapper.ToAdmin(place), "Tesis güncellendi."));
    }

    [HttpPost("{id:guid}/publish")]
    public async Task<IActionResult> Publish(Guid id, [FromQuery] bool published = true, CancellationToken cancellationToken = default)
    {
        var orgId = await ResolveOrganizationIdAsync(cancellationToken);
        var place = await _context.Places.FirstOrDefaultAsync(p => p.Id == id && p.OrganizationId == orgId, cancellationToken);
        if (place == null)
            return NotFound(Result<object>.Fail("Tesis bulunamadı."));
        place.IsPublished = published;
        await _context.SaveChangesAsync(cancellationToken);
        _cache.Invalidate();
        return Ok(Result<object>.Ok(new { place.Id, place.IsPublished }, published ? "Tesis yayına alındı." : "Tesis taslağa alındı."));
    }

    [HttpPost("{id:guid}/active")]
    public async Task<IActionResult> SetActive(Guid id, [FromQuery] bool active = true, CancellationToken cancellationToken = default)
    {
        var orgId = await ResolveOrganizationIdAsync(cancellationToken);
        var place = await _context.Places.Include(p => p.Cafes).FirstOrDefaultAsync(p => p.Id == id && p.OrganizationId == orgId, cancellationToken);
        if (place == null)
            return NotFound(Result<object>.Fail("Tesis bulunamadı."));
        place.IsActive = active;
        foreach (var cafe in place.Cafes.Where(c => !c.IsDeleted))
            cafe.IsActive = active && place.IsPublished;
        await _context.SaveChangesAsync(cancellationToken);
        _cache.Invalidate();
        return Ok(Result<object>.Ok(new { place.Id, place.IsActive }));
    }

    [HttpPost("{id:guid}/images")]
    public async Task<IActionResult> AddImage(Guid id, [FromBody] AddPlaceImageRequest request, CancellationToken cancellationToken)
    {
        var url = MediaUrlNormalizer.Normalize(request.ImageUrl);
        if (url == null)
            return BadRequest(Result<object>.Fail("Görsel adresi geçersiz."));

        var orgId = await ResolveOrganizationIdAsync(cancellationToken);
        var place = await _context.Places.Include(p => p.Images)
            .FirstOrDefaultAsync(p => p.Id == id && p.OrganizationId == orgId, cancellationToken);
        if (place == null)
            return NotFound(Result<object>.Fail("Tesis bulunamadı."));

        var liveCount = place.Images.Count(i => !i.IsDeleted);
        if (liveCount >= PlaceRules.MaxGalleryImages)
            return BadRequest(Result<object>.Fail($"En fazla {PlaceRules.MaxGalleryImages} görsel eklenebilir."));

        if (request.IsCover || liveCount == 0)
        {
            foreach (var image in place.Images.Where(i => i.IsCover))
                image.IsCover = false;
            place.CoverImageUrl = url;
        }

        var entity = new PlaceImage
        {
            Id = Guid.NewGuid(),
            PlaceId = place.Id,
            ImageUrl = url,
            AltText = string.IsNullOrWhiteSpace(request.AltText) ? null : request.AltText.Trim(),
            SortOrder = liveCount,
            IsCover = request.IsCover || liveCount == 0
        };
        _context.PlaceImages.Add(entity);
        await _context.SaveChangesAsync(cancellationToken);
        _cache.Invalidate();
        return Ok(Result<object>.Ok(new PlaceImageDto(entity.Id, entity.ImageUrl, entity.AltText, entity.SortOrder, entity.IsCover), "Görsel eklendi."));
    }

    [HttpDelete("{id:guid}/images/{imageId:guid}")]
    public async Task<IActionResult> DeleteImage(Guid id, Guid imageId, CancellationToken cancellationToken)
    {
        var orgId = await ResolveOrganizationIdAsync(cancellationToken);
        var place = await _context.Places.Include(p => p.Images)
            .FirstOrDefaultAsync(p => p.Id == id && p.OrganizationId == orgId, cancellationToken);
        if (place == null)
            return NotFound(Result<object>.Fail("Tesis bulunamadı."));
        var image = place.Images.FirstOrDefault(i => i.Id == imageId);
        if (image == null)
            return NotFound(Result<object>.Fail("Görsel bulunamadı."));
        _context.PlaceImages.Remove(image);
        if (image.IsCover)
        {
            var next = place.Images.Where(i => i.Id != imageId && !i.IsDeleted).OrderBy(i => i.SortOrder).FirstOrDefault();
            if (next != null)
            {
                next.IsCover = true;
                place.CoverImageUrl = next.ImageUrl;
            }
        }
        await _context.SaveChangesAsync(cancellationToken);
        _cache.Invalidate();
        return Ok(Result<object>.Ok(new { id, imageId }, "Görsel silindi."));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var orgId = await ResolveOrganizationIdAsync(cancellationToken);
        var place = await _context.Places.FirstOrDefaultAsync(p => p.Id == id && p.OrganizationId == orgId, cancellationToken);
        if (place == null)
            return NotFound(Result<object>.Fail("Tesis bulunamadı."));
        place.IsDeleted = true;
        place.DeletedDate = DateTime.UtcNow;
        place.IsPublished = false;
        place.IsActive = false;
        await _context.SaveChangesAsync(cancellationToken);
        _cache.Invalidate();
        return Ok(Result<object>.Ok(new { id }, "Tesis silindi."));
    }

    private async Task<string> UniqueSlugAsync(Guid orgId, string? requested, string name, Guid id, Guid? currentId, CancellationToken cancellationToken)
    {
        var slug = string.IsNullOrWhiteSpace(requested)
            ? PlaceText.Slugify(name, id)
            : PlaceText.Slugify(requested, id);
        var exists = await _context.Places.AnyAsync(
            p => p.OrganizationId == orgId && p.Slug == slug && (!currentId.HasValue || p.Id != currentId.Value),
            cancellationToken);
        return exists ? PlaceText.Slugify(name, Guid.NewGuid()) : slug;
    }

    private async Task<Guid> ResolveOrganizationIdAsync(CancellationToken cancellationToken)
    {
        if (_currentUser.UserId is Guid userId)
        {
            var fromUser = await _context.Users.AsNoTracking()
                .Where(u => u.Id == userId)
                .Select(u => u.OrganizationId)
                .FirstOrDefaultAsync(cancellationToken);
            if (fromUser != Guid.Empty)
                return fromUser;
        }

        var orgId = await _context.Organizations.AsNoTracking()
            .OrderBy(o => o.CreatedDate)
            .Select(o => o.Id)
            .FirstOrDefaultAsync(cancellationToken);
        return orgId == Guid.Empty ? KnownOrganizations.Sehitkamil : orgId;
    }
}
