using GolBox.Application.Common;
using GolBox.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace GolBox.Application.Places;

public static class PlaceQueries
{
    public static IQueryable<Place> WhereOrg(this IQueryable<Place> query, Guid organizationId) =>
        query.Where(p => p.OrganizationId == organizationId);

    public static IQueryable<Place> WhereCitizenVisible(this IQueryable<Place> query, Guid organizationId) =>
        query.Where(p => p.OrganizationId == organizationId && p.IsPublished && p.IsActive);

    public static IQueryable<Place> WhereCategory(this IQueryable<Place> query, string? category)
    {
        if (string.IsNullOrWhiteSpace(category) || string.Equals(category, "all", StringComparison.OrdinalIgnoreCase))
            return query;
        var canonical = PlaceCategories.Canonical(category);
        return query.Where(p => p.Category == canonical);
    }

    public static IQueryable<Place> WhereSearch(this IQueryable<Place> query, string? search)
    {
        if (string.IsNullOrWhiteSpace(search))
            return query;
        var folded = PlaceText.Fold(search);
        if (folded.Length == 0)
            return query;
        return query.Where(p => p.SearchNormalized.Contains(folded));
    }

    public static IQueryable<Place> WhereDistrict(this IQueryable<Place> query, string? district)
    {
        if (string.IsNullOrWhiteSpace(district))
            return query;
        var value = district.Trim();
        return query.Where(p => p.District != null && p.District == value);
    }

    public static IQueryable<Place> WhereNeighborhood(this IQueryable<Place> query, string? neighborhood)
    {
        if (string.IsNullOrWhiteSpace(neighborhood))
            return query;
        var value = neighborhood.Trim();
        return query.Where(p => p.Neighborhood != null && p.Neighborhood == value);
    }

    public static IQueryable<Place> WhereBoundingBox(
        this IQueryable<Place> query,
        decimal latitude,
        decimal longitude,
        double radiusKm)
    {
        var box = PlaceGeo.BoundingBox(latitude, longitude, radiusKm);
        return query.Where(p =>
            p.Latitude != null &&
            p.Longitude != null &&
            p.Latitude >= box.MinLat &&
            p.Latitude <= box.MaxLat &&
            p.Longitude >= box.MinLng &&
            p.Longitude <= box.MaxLng);
    }

    public static IQueryable<Place> IncludeDetails(this IQueryable<Place> query) =>
        query
            .Include(p => p.Images)
            .Include(p => p.OpeningHours)
            .Include(p => p.Amenities)
            .Include(p => p.Cafes);
}
