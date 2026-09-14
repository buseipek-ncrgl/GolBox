using GolBox.Application.Authorization;
using GolBox.Application.Common;
using GolBox.Application.Interfaces;
using GolBox.Application.Places;
using GolBox.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GolBox.Api.Controllers;

[AllowAnonymous]
public class PlacesController : BaseApiController
{
    private static readonly TimeSpan PublicCacheTtl = TimeSpan.FromSeconds(PlaceRules.PublicCacheSeconds);

    private readonly IAppDbContext _context;
    private readonly IPlaceCache _cache;

    public PlacesController(IAppDbContext context, IPlaceCache cache)
    {
        _context = context;
        _cache = cache;
    }

    [HttpGet]
    public async Task<IActionResult> GetPlaces(
        [FromQuery] string? category,
        [FromQuery] string? search,
        [FromQuery] string? district,
        [FromQuery] string? neighborhood,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = PlaceRules.DefaultPageSize,
        [FromQuery] decimal? lat = null,
        [FromQuery] decimal? lng = null,
        [FromQuery] double? radiusKm = null,
        [FromQuery] bool openNow = false,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, PlaceRules.MaxPageSize);

        if (lat.HasValue || lng.HasValue)
        {
            if (!PlaceGeo.HasCoordinates(lat, lng))
                return BadRequest(Result<object>.Fail("Geçersiz koordinat."));
        }

        var orgId = await ResolveOrganizationIdAsync(cancellationToken);
        var utcNow = DateTime.UtcNow;
        var useGeo = PlaceGeo.HasCoordinates(lat, lng);
        var canCache = !useGeo && !openNow && string.IsNullOrWhiteSpace(search);
        var cacheKey = $"list:{_cache.Version}:{orgId}:{category}:{district}:{neighborhood}:{page}:{pageSize}";
        if (canCache && _cache.TryGet<PagedResult<PlaceListItemDto>>(cacheKey, out var cached) && cached != null)
            return Ok(Result<object>.Ok(cached));

        var query = _context.Places.AsNoTracking()
            .Include(p => p.OpeningHours)
            .WhereCitizenVisible(orgId)
            .WhereCategory(category)
            .WhereSearch(search)
            .WhereDistrict(district)
            .WhereNeighborhood(neighborhood);

        PagedResult<PlaceListItemDto> pageResult;
        if (useGeo)
        {
            var radius = radiusKm is > 0 and <= 80 ? radiusKm.Value : PlaceGeo.ListDefaultRadiusKm;
            var candidates = await query
                .WhereBoundingBox(lat!.Value, lng!.Value, radius)
                .OrderBy(p => p.SortOrder)
                .ThenBy(p => p.Name)
                .Take(PlaceGeo.CandidateCap)
                .ToListAsync(cancellationToken);

            var ranked = candidates
                .Select(p =>
                {
                    var distance = PlaceGeo.Meters(lat, lng, p.Latitude, p.Longitude);
                    return new { Place = p, Distance = distance };
                })
                .Where(x => x.Distance.HasValue && x.Distance.Value <= radius * 1000d)
                .Where(x => !openNow || PlaceClock.IsOpenNow(x.Place.OpeningHours, utcNow))
                .OrderBy(x => x.Distance)
                .ThenBy(x => x.Place.SortOrder)
                .ToList();

            var total = ranked.Count;
            var items = ranked
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(x => PlaceMapper.ToListItem(x.Place, utcNow, x.Distance))
                .ToList();
            pageResult = new PagedResult<PlaceListItemDto>(items, page, pageSize, total);
        }
        else if (openNow)
        {
            var candidates = await query
                .OrderBy(p => p.SortOrder)
                .ThenBy(p => p.Name)
                .Take(PlaceGeo.CandidateCap)
                .ToListAsync(cancellationToken);
            var open = candidates.Where(p => PlaceClock.IsOpenNow(p.OpeningHours, utcNow)).ToList();
            var items = open
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(p => PlaceMapper.ToListItem(p, utcNow))
                .ToList();
            pageResult = new PagedResult<PlaceListItemDto>(items, page, pageSize, open.Count);
        }
        else
        {
            var total = await query.CountAsync(cancellationToken);
            var rows = await query
                .OrderBy(p => p.SortOrder)
                .ThenBy(p => p.Name)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);
            var items = rows.Select(p => PlaceMapper.ToListItem(p, utcNow)).ToList();
            pageResult = new PagedResult<PlaceListItemDto>(items, page, pageSize, total);
        }

        if (canCache)
            _cache.Set(cacheKey, pageResult, PublicCacheTtl);

        return Ok(Result<object>.Ok(pageResult));
    }

    [HttpGet("nearby")]
    public async Task<IActionResult> GetNearby(
        [FromQuery] decimal lat,
        [FromQuery] decimal lng,
        [FromQuery] int limit = PlaceGeo.NearbyDefaultLimit,
        [FromQuery] double? radiusKm = null,
        CancellationToken cancellationToken = default)
    {
        if (!PlaceGeo.HasCoordinates(lat, lng))
            return BadRequest(Result<object>.Fail("Geçersiz koordinat."));

        limit = Math.Clamp(limit, 1, PlaceGeo.NearbyMaxLimit);
        var radius = radiusKm is > 0 and <= 40 ? radiusKm.Value : PlaceGeo.NearbyDefaultRadiusKm;
        var orgId = await ResolveOrganizationIdAsync(cancellationToken);
        var utcNow = DateTime.UtcNow;

        var candidates = await _context.Places.AsNoTracking()
            .Include(p => p.OpeningHours)
            .WhereCitizenVisible(orgId)
            .WhereBoundingBox(lat, lng, radius)
            .OrderBy(p => p.SortOrder)
            .Take(PlaceGeo.CandidateCap)
            .ToListAsync(cancellationToken);

        var items = candidates
            .Select(p =>
            {
                var distance = PlaceGeo.Meters(lat, lng, p.Latitude, p.Longitude);
                return new { Place = p, Distance = distance };
            })
            .Where(x => x.Distance.HasValue && x.Distance.Value <= radius * 1000d)
            .OrderBy(x => x.Distance)
            .Take(limit)
            .Select(x => PlaceMapper.ToNearby(x.Place, utcNow, x.Distance!.Value))
            .ToList();

        return Ok(Result<object>.Ok(items));
    }

    [HttpGet("{idOrSlug}")]
    public async Task<IActionResult> GetPlace(string idOrSlug, [FromQuery] decimal? lat = null, [FromQuery] decimal? lng = null, CancellationToken cancellationToken = default)
    {
        if ((lat.HasValue || lng.HasValue) && !PlaceGeo.HasCoordinates(lat, lng))
            return BadRequest(Result<object>.Fail("Geçersiz koordinat."));

        var orgId = await ResolveOrganizationIdAsync(cancellationToken);
        var utcNow = DateTime.UtcNow;
        var query = _context.Places.AsNoTracking().IncludeDetails().WhereCitizenVisible(orgId);
        Place? place = Guid.TryParse(idOrSlug, out var id)
            ? await query.FirstOrDefaultAsync(p => p.Id == id, cancellationToken)
            : await query.FirstOrDefaultAsync(p => p.Slug == idOrSlug, cancellationToken);

        if (place == null)
            return NotFound(Result<object>.Fail("Tesis bulunamadı."));

        var cacheKey = $"detail:{_cache.Version}:{orgId}:{place.Id}";
        PlaceDetailDto? dto = null;
        if (!lat.HasValue && _cache.TryGet<PlaceDetailDto>(cacheKey, out var cached) && cached != null)
        {
            dto = cached;
        }
        else
        {
            var events = await _context.Activities.AsNoTracking()
                .Where(a => a.PlaceId == place.Id && a.OrganizationId == orgId && a.Status == "Active" && a.EndDate >= utcNow)
                .OrderBy(a => a.StartDate)
                .Take(5)
                .Select(a => new PlaceActivityDto(a.Id, a.Title, a.StartDate, a.EndDate, a.Location))
                .ToListAsync(cancellationToken);

            var distance = PlaceGeo.Meters(lat, lng, place.Latitude, place.Longitude);
            dto = PlaceMapper.ToDetail(place, utcNow, distance, events);
            if (!lat.HasValue)
                _cache.Set(cacheKey, dto, PublicCacheTtl);
        }

        return Ok(Result<object>.Ok(dto));
    }

    private async Task<Guid> ResolveOrganizationIdAsync(CancellationToken cancellationToken)
    {
        var orgId = await _context.Organizations.AsNoTracking()
            .OrderBy(o => o.CreatedDate)
            .Select(o => o.Id)
            .FirstOrDefaultAsync(cancellationToken);
        return orgId == Guid.Empty ? KnownOrganizations.Sehitkamil : orgId;
    }
}
