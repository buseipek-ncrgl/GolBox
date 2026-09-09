using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GolBox.Application.Common;
using GolBox.Application.Interfaces;
using GolBox.Domain.Entities;

namespace GolBox.Api.Controllers;

[Authorize]
[Route("api/v1/field-drops")]
public class FieldDropsController : BaseApiController
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public FieldDropsController(IAppDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<IActionResult> GetFieldDrops()
    {
        var drops = await _context.FieldDrops
            .Include(d => d.Cafe)
            .OrderByDescending(d => d.CreatedDate)
            .ToListAsync();

        var list = drops.Select(ToAdminDto).ToList();
        return Ok(Result<object>.Ok(list));
    }

    [HttpGet("nearby")]
    [AllowAnonymous]
    public async Task<IActionResult> GetNearby([FromQuery] decimal latitude, [FromQuery] decimal longitude, [FromQuery] int limit = 20)
    {
        if (!IsValidCoordinate(latitude, longitude))
            return BadRequest(Result<object>.Fail("Geçerli bir konum gönderin."));

        var now = DateTime.UtcNow;
        var drops = await _context.FieldDrops
            .Where(d => d.IsActive && d.StartsAt <= now && d.EndsAt >= now)
            .ToListAsync();

        var nearby = drops
            .Select(d => new
            {
                drop = d,
                distanceMeters = GeoDistance.Meters(latitude, longitude, d.Latitude, d.Longitude)
            })
            .OrderBy(x => x.distanceMeters)
            .Take(Math.Clamp(limit, 1, 50))
            .Select(x => new
            {
                x.drop.Id,
                x.drop.Title,
                x.drop.Description,
                x.drop.Latitude,
                x.drop.Longitude,
                x.drop.RadiusMeters,
                x.drop.PointsGranted,
                x.drop.ImageUrl,
                x.drop.ModelGlbUrl,
                x.drop.CafeId,
                remainingStock = x.drop.TotalStock.HasValue
                    ? Math.Max(0, x.drop.TotalStock.Value - x.drop.CapturedCount)
                    : (int?)null,
                inRange = x.distanceMeters <= x.drop.RadiusMeters,
                distanceMeters = Math.Round(x.distanceMeters, 1)
            })
            .ToList();

        return Ok(Result<object>.Ok(nearby));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetFieldDrop(Guid id)
    {
        var drop = await _context.FieldDrops.Include(d => d.Cafe).FirstOrDefaultAsync(d => d.Id == id);
        if (drop == null)
            return NotFound(Result<object>.Fail("Saha hediyesi bulunamadı."));

        return Ok(Result<object>.Ok(ToAdminDto(drop)));
    }

    [HttpGet("{id}/captures")]
    public async Task<IActionResult> GetCaptures(Guid id)
    {
        var exists = await _context.FieldDrops.AnyAsync(d => d.Id == id);
        if (!exists)
            return NotFound(Result<object>.Fail("Saha hediyesi bulunamadı."));

        var captures = await _context.UserFieldCaptures
            .Include(c => c.User)
            .Where(c => c.FieldDropId == id)
            .OrderByDescending(c => c.CreatedDate)
            .Select(c => new
            {
                c.Id,
                c.UserId,
                userFullName = c.User.FirstName + " " + c.User.LastName,
                userEmail = c.User.Email,
                c.PointsGranted,
                c.DistanceMeters,
                c.CapturedLatitude,
                c.CapturedLongitude,
                c.CreatedDate
            })
            .ToListAsync();

        return Ok(Result<object>.Ok(captures));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] UpsertFieldDropRequest request)
    {
        var error = Validate(request);
        if (error != null)
            return BadRequest(Result<object>.Fail(error));

        var org = await _context.Organizations.FirstOrDefaultAsync();
        if (request.CafeId.HasValue && request.CafeId.Value != Guid.Empty)
        {
            var cafeExists = await _context.Cafes.AnyAsync(c => c.Id == request.CafeId.Value);
            if (!cafeExists)
                return BadRequest(Result<object>.Fail("Seçilen tesis bulunamadı."));
        }

        if (request.CatalogRewardId.HasValue && request.CatalogRewardId.Value != Guid.Empty)
        {
            var rewardExists = await _context.Rewards.AnyAsync(r => r.Id == request.CatalogRewardId.Value);
            if (!rewardExists)
                return BadRequest(Result<object>.Fail("Seçilen katalog ödülü bulunamadı."));
        }

        var drop = new FieldDrop
        {
            Id = Guid.NewGuid(),
            OrganizationId = org?.Id ?? Guid.Parse("11111111-1111-1111-1111-111111111111"),
            CafeId = EmptyToNull(request.CafeId),
            CatalogRewardId = EmptyToNull(request.CatalogRewardId),
            Title = request.Title.Trim(),
            Description = request.Description?.Trim() ?? string.Empty,
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            RadiusMeters = request.RadiusMeters,
            PointsGranted = request.PointsGranted,
            TotalStock = request.TotalStock,
            PerUserLimit = request.PerUserLimit <= 0 ? 1 : request.PerUserLimit,
            StartsAt = request.StartsAt ?? DateTime.UtcNow,
            EndsAt = request.EndsAt ?? DateTime.UtcNow.AddDays(30),
            ImageUrl = request.ImageUrl,
            ModelGlbUrl = request.ModelGlbUrl,
            IsActive = request.IsActive,
            CreatedDate = DateTime.UtcNow
        };

        _context.FieldDrops.Add(drop);
        await _context.SaveChangesAsync();

        var admin = await _context.Users.FindAsync(_currentUser.UserId);
        await AuditLogsController.LogAsync(
            _context,
            admin?.Email ?? "admin@golbox.gov.tr",
            admin?.Role ?? "Admin",
            "FieldDrop_Create",
            "FieldDrops",
            "FieldDrop",
            drop.Id.ToString(),
            null,
            drop.Title,
            $"Konum: {drop.Latitude},{drop.Longitude} yarıçap {drop.RadiusMeters}m"
        );

        return Ok(Result<object>.Ok(new { id = drop.Id }, "Saha hediyesi oluşturuldu."));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpsertFieldDropRequest request)
    {
        var drop = await _context.FieldDrops.FindAsync(id);
        if (drop == null)
            return NotFound(Result<object>.Fail("Saha hediyesi bulunamadı."));

        var error = Validate(request);
        if (error != null)
            return BadRequest(Result<object>.Fail(error));

        drop.CafeId = EmptyToNull(request.CafeId);
        drop.CatalogRewardId = EmptyToNull(request.CatalogRewardId);
        drop.Title = request.Title.Trim();
        drop.Description = request.Description?.Trim() ?? string.Empty;
        drop.Latitude = request.Latitude;
        drop.Longitude = request.Longitude;
        drop.RadiusMeters = request.RadiusMeters;
        drop.PointsGranted = request.PointsGranted;
        drop.TotalStock = request.TotalStock;
        drop.PerUserLimit = request.PerUserLimit <= 0 ? 1 : request.PerUserLimit;
        drop.StartsAt = request.StartsAt ?? drop.StartsAt;
        drop.EndsAt = request.EndsAt ?? drop.EndsAt;
        drop.ImageUrl = request.ImageUrl;
        drop.ModelGlbUrl = request.ModelGlbUrl;
        drop.IsActive = request.IsActive;
        drop.UpdatedDate = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(Result<object>.Ok(new { id = drop.Id }, "Saha hediyesi güncellendi."));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var drop = await _context.FieldDrops.FindAsync(id);
        if (drop == null)
            return NotFound(Result<object>.Fail("Saha hediyesi bulunamadı."));

        drop.IsDeleted = true;
        drop.IsActive = false;
        drop.DeletedDate = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return Ok(Result<object>.Ok(new { id }, "Saha hediyesi kaldırıldı."));
    }

    [HttpPost("{id}/capture")]
    public async Task<IActionResult> Capture(Guid id, [FromBody] CaptureFieldDropRequest request)
    {
        var userId = _currentUser.UserId;
        if (userId == null || userId == Guid.Empty)
            return Unauthorized(Result<object>.Fail("Oturum doğrulanamadı."));

        if (!IsValidCoordinate(request.Latitude, request.Longitude))
            return BadRequest(Result<object>.Fail("Geçerli bir konum gönderin."));

        var user = await _context.Users.FindAsync(userId.Value);
        if (user == null)
            return NotFound(Result<object>.Fail("Kullanıcı bulunamadı."));

        var drop = await _context.FieldDrops.FindAsync(id);
        if (drop == null)
            return NotFound(Result<object>.Fail("Saha hediyesi bulunamadı."));

        var now = DateTime.UtcNow;
        if (!drop.IsActive)
            return BadRequest(Result<object>.Fail("Bu saha hediyesi yayında değil."));
        if (now < drop.StartsAt || now > drop.EndsAt)
            return BadRequest(Result<object>.Fail("Bu saha hediyesi şu an aktif değil."));
        if (drop.TotalStock.HasValue && drop.CapturedCount >= drop.TotalStock.Value)
            return BadRequest(Result<object>.Fail("Bu hediyenin stoğu tükendi."));

        var already = await _context.UserFieldCaptures.CountAsync(c => c.FieldDropId == drop.Id && c.UserId == user.Id);
        if (already >= drop.PerUserLimit)
            return BadRequest(Result<object>.Fail("Bu hediyeyi daha önce topladınız."));

        var distance = GeoDistance.Meters(request.Latitude, request.Longitude, drop.Latitude, drop.Longitude);
        if (distance > drop.RadiusMeters)
            return BadRequest(Result<object>.Fail($"Hediyeye henüz yeterince yakın değilsiniz. Kalan mesafe yaklaşık {Math.Ceiling(distance - drop.RadiusMeters)} metre."));

        drop.CapturedCount += 1;
        user.PointsBalance += drop.PointsGranted;

        var capture = new UserFieldCapture
        {
            Id = Guid.NewGuid(),
            OrganizationId = drop.OrganizationId,
            FieldDropId = drop.Id,
            UserId = user.Id,
            CapturedLatitude = request.Latitude,
            CapturedLongitude = request.Longitude,
            AccuracyMeters = request.AccuracyMeters,
            PointsGranted = drop.PointsGranted,
            DistanceMeters = Math.Round(distance, 1),
            CreatedDate = now
        };
        _context.UserFieldCaptures.Add(capture);

        if (drop.PointsGranted != 0)
        {
            _context.PointTransactions.Add(new PointTransaction
            {
                Id = Guid.NewGuid(),
                OrganizationId = drop.OrganizationId,
                UserId = user.Id,
                Amount = drop.PointsGranted,
                Type = "Earn",
                Description = $"Saha hediyesi: {drop.Title}",
                ReferenceType = "FieldDrop",
                ReferenceId = drop.Id,
                CreatedDate = now
            });
        }

        await _context.SaveChangesAsync();

        return Ok(Result<object>.Ok(new
        {
            id = capture.Id,
            dropId = drop.Id,
            pointsGranted = drop.PointsGranted,
            newPointsBalance = user.PointsBalance,
            distanceMeters = capture.DistanceMeters
        }, "Saha hediyesi alındı."));
    }

    private static object ToAdminDto(FieldDrop d) => new
    {
        d.Id,
        d.OrganizationId,
        d.CafeId,
        cafeName = d.Cafe != null ? d.Cafe.Name : null,
        d.CatalogRewardId,
        d.Title,
        d.Description,
        d.Latitude,
        d.Longitude,
        d.RadiusMeters,
        d.PointsGranted,
        d.TotalStock,
        d.CapturedCount,
        remainingStock = d.TotalStock.HasValue ? Math.Max(0, d.TotalStock.Value - d.CapturedCount) : (int?)null,
        d.PerUserLimit,
        d.StartsAt,
        d.EndsAt,
        d.ImageUrl,
        d.ModelGlbUrl,
        d.IsActive,
        d.CreatedDate
    };

    private static string? Validate(UpsertFieldDropRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
            return "Başlık zorunludur.";
        if (!IsValidCoordinate(request.Latitude, request.Longitude))
            return "Geçerli bir enlem/boylam girin.";
        if (request.RadiusMeters < 10 || request.RadiusMeters > 500)
            return "Yarıçap 10 ile 500 metre arasında olmalıdır.";
        if (request.PointsGranted < 0 || request.PointsGranted > 10000)
            return "Puan 0 ile 10000 arasında olmalıdır.";
        if (request.TotalStock.HasValue && request.TotalStock.Value < 1)
            return "Stok en az 1 olmalıdır.";
        if (request.StartsAt.HasValue && request.EndsAt.HasValue && request.EndsAt <= request.StartsAt)
            return "Bitiş tarihi başlangıçtan sonra olmalıdır.";
        return null;
    }

    private static bool IsValidCoordinate(decimal latitude, decimal longitude) =>
        latitude is >= -90 and <= 90 && longitude is >= -180 and <= 180 && (latitude != 0 || longitude != 0);

    private static Guid? EmptyToNull(Guid? value) =>
        value.HasValue && value.Value != Guid.Empty ? value : null;
}

public class UpsertFieldDropRequest
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Latitude { get; set; }
    public decimal Longitude { get; set; }
    public int RadiusMeters { get; set; } = 40;
    public int PointsGranted { get; set; }
    public int? TotalStock { get; set; }
    public int PerUserLimit { get; set; } = 1;
    public DateTime? StartsAt { get; set; }
    public DateTime? EndsAt { get; set; }
    public string? ImageUrl { get; set; }
    public string? ModelGlbUrl { get; set; }
    public Guid? CafeId { get; set; }
    public Guid? CatalogRewardId { get; set; }
    public bool IsActive { get; set; } = true;
}

public class CaptureFieldDropRequest
{
    public decimal Latitude { get; set; }
    public decimal Longitude { get; set; }
    public double? AccuracyMeters { get; set; }
}
