using GolBox.Application.Authorization;
using GolBox.Application.Common;
using GolBox.Application.Content;
using GolBox.Application.Interfaces;
using GolBox.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GolBox.Api.Controllers;

public class ContentController : BaseApiController
{
    private static readonly TimeSpan PublicCacheTtl = TimeSpan.FromSeconds(45);

    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly ICityContentCache _cache;

    public ContentController(IAppDbContext context, ICurrentUserService currentUser, ICityContentCache cache)
    {
        _context = context;
        _currentUser = currentUser;
        _cache = cache;
    }

    [HttpGet("hero")]
    [AllowAnonymous]
    public async Task<IActionResult> GetHero(CancellationToken cancellationToken)
    {
        var orgId = await ResolveOrganizationIdAsync(cancellationToken);
        var audience = await ResolveAudienceAsync(cancellationToken);
        var cacheKey = $"hero:{_cache.Version}:{orgId}:{AudienceKey(audience)}";
        if (_cache.TryGet<List<CityContentPublicDto>>(cacheKey, out var cached) && cached != null)
            return Ok(Result<object>.Ok(cached));

        var now = DateTime.UtcNow;
        var rows = await CityContentRules.WhereAudience(
                CityContentRules.WhereLive(_context.CityContents.AsNoTracking(), orgId, now)
                    .Where(c => c.Type == CityContentTypes.Hero || c.Type == CityContentTypes.MayorMessage),
                audience)
            .OrderBy(c => c.Priority)
            .ThenBy(c => c.StartAt)
            .Take(CityContentRules.HeroMaxCount)
            .ToListAsync(cancellationToken);

        var items = rows.Select(CityContentMapper.ToPublic).ToList();
        _cache.Set(cacheKey, items, PublicCacheTtl);
        return Ok(Result<object>.Ok(items));
    }

    [HttpGet("agenda")]
    [AllowAnonymous]
    public async Task<IActionResult> GetAgenda(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = CityContentRules.AgendaDefaultPageSize,
        [FromQuery] string? type = null,
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, CityContentRules.MaxPageSize);

        var orgId = await ResolveOrganizationIdAsync(cancellationToken);
        var audience = await ResolveAudienceAsync(cancellationToken);
        var cacheKey = $"agenda:{_cache.Version}:{orgId}:{AudienceKey(audience)}:{page}:{pageSize}:{type}:{from?.Ticks}:{to?.Ticks}";
        if (_cache.TryGet<PagedResult<CityContentPublicDto>>(cacheKey, out var cached) && cached != null)
            return Ok(Result<object>.Ok(cached));

        var now = DateTime.UtcNow;
        var query = CityContentRules.WhereAudience(
            CityContentRules.WhereLive(_context.CityContents.AsNoTracking(), orgId, now)
                .Where(c => c.Type != CityContentTypes.Hero),
            audience);

        if (!string.IsNullOrWhiteSpace(type) && CityContentTypes.IsKnown(type))
        {
            var canonical = CityContentTypes.Canonical(type);
            query = query.Where(c => c.Type == canonical);
        }
        if (from.HasValue)
            query = query.Where(c => c.EndAt == null || c.EndAt >= from.Value);
        if (to.HasValue)
            query = query.Where(c => c.StartAt <= to.Value);

        var total = await query.CountAsync(cancellationToken);
        var rows = await query
            .OrderBy(c => c.Priority)
            .ThenBy(c => c.StartAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var pageResult = new PagedResult<CityContentPublicDto>(
            rows.Select(CityContentMapper.ToPublic).ToList(),
            page,
            pageSize,
            total);
        _cache.Set(cacheKey, pageResult, PublicCacheTtl);
        return Ok(Result<object>.Ok(pageResult));
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPublicById(Guid id, CancellationToken cancellationToken)
    {
        var orgId = await ResolveOrganizationIdAsync(cancellationToken);
        var audience = await ResolveAudienceAsync(cancellationToken);
        var now = DateTime.UtcNow;
        var content = await _context.CityContents.AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id && c.OrganizationId == orgId, cancellationToken);

        if (content == null || !CityContentRules.IsLive(content, now) || !CityContentRules.MatchesAudience(content, audience))
            return NotFound(Result<object>.Fail("İçerik bulunamadı."));

        return Ok(Result<object>.Ok(CityContentMapper.ToPublic(content)));
    }

    [HttpGet("admin")]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> AdminList(
        [FromQuery] string? type = null,
        [FromQuery] string? status = null,
        [FromQuery] string? search = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, CityContentRules.MaxPageSize);
        var orgId = await ResolveOrganizationIdAsync(cancellationToken);
        var now = DateTime.UtcNow;
        var query = _context.CityContents.AsNoTracking().Where(c => c.OrganizationId == orgId);

        if (!string.IsNullOrWhiteSpace(type) && CityContentTypes.IsKnown(type))
        {
            var canonical = CityContentTypes.Canonical(type);
            query = query.Where(c => c.Type == canonical);
        }
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(c => c.Title.Contains(term) || (c.Subtitle != null && c.Subtitle.Contains(term)));
        }

        query = CityContentRules.WhereAdminStatus(query, status, now);
        var total = await query.CountAsync(cancellationToken);
        var rows = await query
            .OrderBy(c => c.Priority)
            .ThenByDescending(c => c.CreatedDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var items = rows.Select(c => CityContentMapper.ToAdmin(c, now)).ToList();

        return Ok(Result<object>.Ok(new PagedResult<CityContentAdminDto>(items, page, pageSize, total)));
    }

    [HttpGet("admin/{id:guid}")]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> AdminGet(Guid id, CancellationToken cancellationToken)
    {
        var orgId = await ResolveOrganizationIdAsync(cancellationToken);
        var content = await _context.CityContents.AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id && c.OrganizationId == orgId, cancellationToken);
        if (content == null)
            return NotFound(Result<object>.Fail("İçerik bulunamadı."));
        return Ok(Result<object>.Ok(CityContentMapper.ToAdmin(content, DateTime.UtcNow)));
    }

    [HttpPost]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> Create([FromBody] UpsertCityContentRequest request, CancellationToken cancellationToken)
    {
        var parsed = ValidateWrite(request);
        if (!parsed.Success)
            return BadRequest(Result<object>.Fail(parsed.Message));

        var orgId = await ResolveOrganizationIdAsync(cancellationToken);
        var entity = new CityContent { Id = Guid.NewGuid(), OrganizationId = orgId };
        ApplyWrite(entity, request);
        entity.CreatedBy = _currentUser.UserId;
        _context.CityContents.Add(entity);
        await _context.SaveChangesAsync(cancellationToken);
        _cache.InvalidatePublicContent();
        await AuditLogsController.LogAsync(_context, _currentUser.Email ?? "admin", "Admin", "Content_Create", "Content", "CityContent", entity.Id.ToString(), null, entity.Title, null);
        return Ok(Result<object>.Ok(CityContentMapper.ToAdmin(entity, DateTime.UtcNow), "İçerik oluşturuldu."));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpsertCityContentRequest request, CancellationToken cancellationToken)
    {
        var parsed = ValidateWrite(request);
        if (!parsed.Success)
            return BadRequest(Result<object>.Fail(parsed.Message));

        var orgId = await ResolveOrganizationIdAsync(cancellationToken);
        var entity = await _context.CityContents.FirstOrDefaultAsync(c => c.Id == id && c.OrganizationId == orgId, cancellationToken);
        if (entity == null)
            return NotFound(Result<object>.Fail("İçerik bulunamadı."));

        ApplyWrite(entity, request);
        entity.UpdatedBy = _currentUser.UserId;
        await _context.SaveChangesAsync(cancellationToken);
        _cache.InvalidatePublicContent();
        await AuditLogsController.LogAsync(_context, _currentUser.Email ?? "admin", "Admin", "Content_Update", "Content", "CityContent", entity.Id.ToString(), null, entity.Title, null);
        return Ok(Result<object>.Ok(CityContentMapper.ToAdmin(entity, DateTime.UtcNow), "İçerik güncellendi."));
    }

    [HttpPost("{id:guid}/publish")]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> Publish(Guid id, CancellationToken cancellationToken) =>
        await SetPublishedAsync(id, true, cancellationToken);

    [HttpPost("{id:guid}/unpublish")]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> Unpublish(Guid id, CancellationToken cancellationToken) =>
        await SetPublishedAsync(id, false, cancellationToken);

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var orgId = await ResolveOrganizationIdAsync(cancellationToken);
        var entity = await _context.CityContents.FirstOrDefaultAsync(c => c.Id == id && c.OrganizationId == orgId, cancellationToken);
        if (entity == null)
            return NotFound(Result<object>.Fail("İçerik bulunamadı."));

        entity.IsDeleted = true;
        entity.DeletedDate = DateTime.UtcNow;
        entity.DeletedBy = _currentUser.UserId;
        await _context.SaveChangesAsync(cancellationToken);
        _cache.InvalidatePublicContent();
        await AuditLogsController.LogAsync(_context, _currentUser.Email ?? "admin", "Admin", "Content_Delete", "Content", "CityContent", entity.Id.ToString(), entity.Title, null, null);
        return Ok(Result<object>.Ok(new { id }, "İçerik arşivlendi."));
    }

    private async Task<IActionResult> SetPublishedAsync(Guid id, bool published, CancellationToken cancellationToken)
    {
        var orgId = await ResolveOrganizationIdAsync(cancellationToken);
        var entity = await _context.CityContents.FirstOrDefaultAsync(c => c.Id == id && c.OrganizationId == orgId, cancellationToken);
        if (entity == null)
            return NotFound(Result<object>.Fail("İçerik bulunamadı."));

        entity.IsPublished = published;
        entity.UpdatedBy = _currentUser.UserId;
        await _context.SaveChangesAsync(cancellationToken);
        _cache.InvalidatePublicContent();
        return Ok(Result<object>.Ok(CityContentMapper.ToAdmin(entity, DateTime.UtcNow), published ? "İçerik yayına alındı." : "İçerik taslağa alındı."));
    }

    private static Result ValidateWrite(UpsertCityContentRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
            return Result.Fail("Başlık zorunludur.");
        if (!CityContentTypes.IsKnown(request.Type))
            return Result.Fail("Geçersiz içerik tipi.");
        if (!AudienceTypes.IsKnown(request.AudienceType) && !string.IsNullOrWhiteSpace(request.AudienceType))
            return Result.Fail("Geçersiz hedef kitle.");
        if (!ContentCtaTypes.IsKnown(request.CtaType) && !string.IsNullOrWhiteSpace(request.CtaType))
            return Result.Fail("Geçersiz CTA tipi.");
        if (request.EndAt.HasValue && request.EndAt.Value < request.StartAt)
            return Result.Fail("Bitiş tarihi başlangıçtan önce olamaz.");
        var cta = ContentCtaValidator.Validate(request.CtaType, request.CtaTarget);
        if (!cta.Success)
            return cta;
        if (CityContentTypes.Canonical(request.Type) == CityContentTypes.EventPromo && request.ActivityId == null &&
            ContentCtaTypes.Canonical(request.CtaType) != ContentCtaTypes.Activity)
        {
            // EventPromo may still be editorial; ActivityId is optional.
        }
        return Result.Ok();
    }

    private static void ApplyWrite(CityContent entity, UpsertCityContentRequest request)
    {
        var type = CityContentTypes.Canonical(request.Type);
        var ctaType = ContentCtaTypes.Canonical(request.CtaType);
        entity.Type = type;
        entity.Title = request.Title.Trim();
        entity.Subtitle = string.IsNullOrWhiteSpace(request.Subtitle) ? null : request.Subtitle.Trim();
        entity.Body = string.IsNullOrWhiteSpace(request.Body) ? null : request.Body.Trim();
        entity.ImageUrl = MediaUrlNormalizer.Normalize(request.ImageUrl);
        entity.ImageFocus = string.IsNullOrWhiteSpace(request.ImageFocus) ? null : request.ImageFocus.Trim();
        entity.CtaLabel = string.IsNullOrWhiteSpace(request.CtaLabel) ? null : request.CtaLabel.Trim();
        entity.CtaType = ctaType;
        entity.CtaTarget = ContentCtaValidator.NormalizeTarget(ctaType, request.CtaTarget);
        entity.Priority = request.Priority;
        entity.StartAt = DateTime.SpecifyKind(request.StartAt, DateTimeKind.Utc);
        entity.EndAt = request.EndAt.HasValue ? DateTime.SpecifyKind(request.EndAt.Value, DateTimeKind.Utc) : null;
        entity.IsPublished = request.IsPublished;
        entity.AudienceType = AudienceTypes.Canonical(request.AudienceType);
        entity.AudienceMinAge = request.AudienceMinAge;
        entity.AudienceMaxAge = request.AudienceMaxAge;
        entity.AudienceEducationLevel = string.IsNullOrWhiteSpace(request.AudienceEducationLevel)
            ? null
            : CityContentRules.NormalizeEducation(request.AudienceEducationLevel);
        entity.ActivityId = request.ActivityId;
        if (type == CityContentTypes.MayorMessage)
        {
            entity.AuthorName = string.IsNullOrWhiteSpace(request.AuthorName) ? null : request.AuthorName.Trim();
            entity.AuthorTitle = string.IsNullOrWhiteSpace(request.AuthorTitle) ? null : request.AuthorTitle.Trim();
            entity.AuthorImageUrl = MediaUrlNormalizer.Normalize(request.AuthorImageUrl);
        }
        else
        {
            entity.AuthorName = null;
            entity.AuthorTitle = null;
            entity.AuthorImageUrl = null;
        }
    }

    private async Task<Guid> ResolveOrganizationIdAsync(CancellationToken cancellationToken)
    {
        var orgId = await _context.Organizations.AsNoTracking()
            .OrderBy(o => o.CreatedDate)
            .Select(o => o.Id)
            .FirstOrDefaultAsync(cancellationToken);
        return orgId == Guid.Empty ? KnownOrganizations.Sehitkamil : orgId;
    }

    private async Task<AudienceContext?> ResolveAudienceAsync(CancellationToken cancellationToken)
    {
        if (!_currentUser.IsAuthenticated || _currentUser.UserId is null)
            return null;

        var user = await _context.Users.AsNoTracking()
            .Where(u => u.Id == _currentUser.UserId.Value)
            .Select(u => new { u.Age, u.EducationLevel })
            .FirstOrDefaultAsync(cancellationToken);
        return new AudienceContext(true, user?.Age, user?.EducationLevel);
    }

    private static string AudienceKey(AudienceContext? audience)
    {
        if (audience is null || !audience.IsAuthenticated)
            return "guest";
        return $"u:{audience.Age?.ToString() ?? "-"}:{CityContentRules.NormalizeEducation(audience.EducationLevel ?? "")}";
    }
}
