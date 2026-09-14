using GolBox.Application.Common;
using GolBox.Domain.Entities;

namespace GolBox.Application.Places;

public record PlaceListItemDto(
    Guid Id,
    string Name,
    string Slug,
    string Category,
    string? ShortDescription,
    string? AddressSummary,
    string? District,
    string? Neighborhood,
    decimal? Latitude,
    decimal? Longitude,
    string? CoverImageUrl,
    string OpenStatus,
    double? DistanceMeters,
    int SortOrder);

public record PlaceNearbyDto(
    Guid Id,
    string Name,
    string Category,
    string? CoverImageUrl,
    double DistanceMeters,
    string OpenStatus,
    string? AddressSummary);

public record PlaceImageDto(Guid Id, string ImageUrl, string? AltText, int SortOrder, bool IsCover);

public record PlaceHourDto(int DayOfWeek, string? OpenTime, string? CloseTime, bool IsClosed);

public record PlaceActivityDto(Guid Id, string Title, DateTime StartDate, DateTime EndDate, string? Location);

public record PlaceDetailDto(
    Guid Id,
    string Name,
    string Slug,
    string Category,
    string? ShortDescription,
    string? Description,
    string? Address,
    string? District,
    string? Neighborhood,
    string? AddressSummary,
    decimal? Latitude,
    decimal? Longitude,
    string? Phone,
    string? Email,
    string? WebsiteUrl,
    string? CoverImageUrl,
    string OpenStatus,
    double? DistanceMeters,
    bool? WheelchairAccessible,
    bool? AccessibleToilet,
    IReadOnlyList<string> Amenities,
    IReadOnlyList<PlaceImageDto> Images,
    IReadOnlyList<PlaceHourDto> OpeningHours,
    Guid? CafeId,
    IReadOnlyList<PlaceActivityDto> UpcomingEvents);

public record PlaceAdminDto(
    Guid Id,
    Guid OrganizationId,
    string Name,
    string Slug,
    string Category,
    string? ShortDescription,
    string? Description,
    string? Address,
    string? District,
    string? Neighborhood,
    decimal? Latitude,
    decimal? Longitude,
    string? Phone,
    string? Email,
    string? WebsiteUrl,
    string? CoverImageUrl,
    bool IsActive,
    bool IsPublished,
    int SortOrder,
    bool? WheelchairAccessible,
    bool? AccessibleToilet,
    IReadOnlyList<string> Amenities,
    IReadOnlyList<PlaceImageDto> Images,
    IReadOnlyList<PlaceHourDto> OpeningHours,
    Guid? CafeId);

public class UpsertPlaceRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string Category { get; set; } = PlaceCategories.Other;
    public string? ShortDescription { get; set; }
    public string? Description { get; set; }
    public string? Address { get; set; }
    public string? District { get; set; }
    public string? Neighborhood { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? WebsiteUrl { get; set; }
    public string? CoverImageUrl { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsPublished { get; set; }
    public int SortOrder { get; set; }
    public bool? WheelchairAccessible { get; set; }
    public bool? AccessibleToilet { get; set; }
    public List<string> Amenities { get; set; } = [];
    public List<PlaceHourDto> OpeningHours { get; set; } = [];
}

public class AddPlaceImageRequest
{
    public string ImageUrl { get; set; } = string.Empty;
    public string? AltText { get; set; }
    public bool IsCover { get; set; }
}

public static class PlaceMapper
{
    public static PlaceListItemDto ToListItem(Place place, DateTime utcNow, double? distanceMeters = null) =>
        new(
            place.Id,
            place.Name,
            place.Slug,
            PlaceCategories.Canonical(place.Category),
            place.ShortDescription,
            PlaceText.AddressSummary(place),
            place.District,
            place.Neighborhood,
            place.Latitude,
            place.Longitude,
            place.CoverImageUrl,
            PlaceClock.ResolveOpenStatus(place.OpeningHours, utcNow),
            distanceMeters,
            place.SortOrder);

    public static PlaceNearbyDto ToNearby(Place place, DateTime utcNow, double distanceMeters) =>
        new(
            place.Id,
            place.Name,
            PlaceCategories.Canonical(place.Category),
            place.CoverImageUrl,
            Math.Round(distanceMeters, 0),
            PlaceClock.ResolveOpenStatus(place.OpeningHours, utcNow),
            PlaceText.AddressSummary(place));

    public static PlaceDetailDto ToDetail(Place place, DateTime utcNow, double? distanceMeters, IReadOnlyList<PlaceActivityDto> events)
    {
        var cafeId = place.Cafes.Where(c => !c.IsDeleted).Select(c => (Guid?)c.Id).FirstOrDefault();
        var images = place.Images
            .Where(i => !i.IsDeleted)
            .OrderBy(i => i.SortOrder)
            .ThenBy(i => i.CreatedDate)
            .Select(i => new PlaceImageDto(i.Id, i.ImageUrl, i.AltText, i.SortOrder, i.IsCover))
            .ToList();
        var hours = place.OpeningHours
            .Where(h => !h.IsDeleted)
            .OrderBy(h => h.DayOfWeek)
            .Select(h => new PlaceHourDto(h.DayOfWeek, h.OpenTime, h.CloseTime, h.IsClosed))
            .ToList();
        var amenities = place.Amenities.Select(a => PlaceAmenities.Canonical(a.AmenityId)).Where(a => a.Length > 0).Distinct().ToList();
        return new PlaceDetailDto(
            place.Id,
            place.Name,
            place.Slug,
            PlaceCategories.Canonical(place.Category),
            place.ShortDescription,
            place.Description,
            place.Address,
            place.District,
            place.Neighborhood,
            PlaceText.AddressSummary(place),
            place.Latitude,
            place.Longitude,
            place.Phone,
            place.Email,
            place.WebsiteUrl,
            place.CoverImageUrl,
            PlaceClock.ResolveOpenStatus(place.OpeningHours, utcNow),
            distanceMeters,
            place.WheelchairAccessible,
            place.AccessibleToilet,
            amenities,
            images,
            hours,
            cafeId,
            events);
    }

    public static PlaceAdminDto ToAdmin(Place place)
    {
        var cafeId = place.Cafes.Where(c => !c.IsDeleted).Select(c => (Guid?)c.Id).FirstOrDefault();
        return new PlaceAdminDto(
            place.Id,
            place.OrganizationId,
            place.Name,
            place.Slug,
            PlaceCategories.Canonical(place.Category),
            place.ShortDescription,
            place.Description,
            place.Address,
            place.District,
            place.Neighborhood,
            place.Latitude,
            place.Longitude,
            place.Phone,
            place.Email,
            place.WebsiteUrl,
            place.CoverImageUrl,
            place.IsActive,
            place.IsPublished,
            place.SortOrder,
            place.WheelchairAccessible,
            place.AccessibleToilet,
            place.Amenities.Select(a => PlaceAmenities.Canonical(a.AmenityId)).Where(a => a.Length > 0).Distinct().ToList(),
            place.Images.Where(i => !i.IsDeleted).OrderBy(i => i.SortOrder).Select(i => new PlaceImageDto(i.Id, i.ImageUrl, i.AltText, i.SortOrder, i.IsCover)).ToList(),
            place.OpeningHours.Where(h => !h.IsDeleted).OrderBy(h => h.DayOfWeek).Select(h => new PlaceHourDto(h.DayOfWeek, h.OpenTime, h.CloseTime, h.IsClosed)).ToList(),
            cafeId);
    }
}
