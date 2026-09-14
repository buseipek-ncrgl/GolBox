using GolBox.Application.Common;
using GolBox.Application.Content;
using GolBox.Application.Interfaces;
using GolBox.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace GolBox.Application.Places;

public static class PlaceCafeSync
{
    public static async System.Threading.Tasks.Task EnsureLinkedPlaceAsync(IAppDbContext context, Cafe cafe, CancellationToken cancellationToken = default)
    {
        if (cafe.PlaceId.HasValue)
        {
            var existing = await context.Places.FirstOrDefaultAsync(p => p.Id == cafe.PlaceId.Value, cancellationToken);
            if (existing != null)
            {
                ApplyCafeToPlace(cafe, existing);
                existing.SearchNormalized = PlaceText.BuildSearchNormalized(existing);
                return;
            }
        }

        var slug = PlaceText.CafeSlug(cafe.Id);
        var mapped = await context.Places.FirstOrDefaultAsync(
            p => p.OrganizationId == cafe.OrganizationId && p.Slug == slug,
            cancellationToken);
        if (mapped != null)
        {
            cafe.PlaceId = mapped.Id;
            ApplyCafeToPlace(cafe, mapped);
            mapped.SearchNormalized = PlaceText.BuildSearchNormalized(mapped);
            return;
        }

        var place = new Place
        {
            Id = Guid.NewGuid(),
            OrganizationId = cafe.OrganizationId,
            Name = cafe.Name,
            Slug = slug,
            Category = PlaceCategories.Cafe,
            Address = string.IsNullOrWhiteSpace(cafe.Address) ? null : cafe.Address,
            Latitude = cafe.Latitude,
            Longitude = cafe.Longitude,
            CoverImageUrl = MediaUrlNormalizer.Normalize(cafe.ImageUrl) ?? cafe.ImageUrl,
            IsActive = cafe.IsActive,
            IsPublished = cafe.IsActive,
            SortOrder = 0
        };
        place.SearchNormalized = PlaceText.BuildSearchNormalized(place);
        context.Places.Add(place);
        cafe.PlaceId = place.Id;
    }

    public static void ApplyCafeToPlace(Cafe cafe, Place place)
    {
        place.Name = cafe.Name;
        if (!string.IsNullOrWhiteSpace(cafe.Address))
            place.Address = cafe.Address;
        place.Latitude = cafe.Latitude;
        place.Longitude = cafe.Longitude;
        if (!string.IsNullOrWhiteSpace(cafe.ImageUrl))
            place.CoverImageUrl = MediaUrlNormalizer.Normalize(cafe.ImageUrl) ?? cafe.ImageUrl;
        place.IsActive = cafe.IsActive;
        if (!place.IsPublished && cafe.IsActive)
            place.IsPublished = true;
        place.Category = PlaceCategories.Cafe;
        place.SearchNormalized = PlaceText.BuildSearchNormalized(place);
    }

    public static void ApplyPlaceToCafe(Place place, Cafe cafe)
    {
        cafe.Name = place.Name;
        if (!string.IsNullOrWhiteSpace(place.Address))
            cafe.Address = place.Address;
        if (place.Latitude.HasValue)
            cafe.Latitude = place.Latitude.Value;
        if (place.Longitude.HasValue)
            cafe.Longitude = place.Longitude.Value;
        if (!string.IsNullOrWhiteSpace(place.CoverImageUrl))
            cafe.ImageUrl = place.CoverImageUrl;
        cafe.IsActive = place.IsActive && place.IsPublished;
    }
}
