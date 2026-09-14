using GolBox.Application.Common;
using GolBox.Application.Content;
using GolBox.Domain.Entities;

namespace GolBox.Application.Places;

public static class PlaceMutations
{
    public static void ApplyCore(Place place, UpsertPlaceRequest request)
    {
        place.Name = request.Name.Trim();
        place.Category = PlaceCategories.Canonical(request.Category);
        place.ShortDescription = EmptyToNull(request.ShortDescription, 512);
        place.Description = EmptyToNull(request.Description, 8000);
        place.Address = EmptyToNull(request.Address, 500);
        place.District = EmptyToNull(request.District, 120);
        place.Neighborhood = EmptyToNull(request.Neighborhood, 120);
        place.Latitude = request.Latitude;
        place.Longitude = request.Longitude;
        place.Phone = EmptyToNull(request.Phone, 40);
        place.Email = EmptyToNull(request.Email, 256);
        place.WebsiteUrl = string.IsNullOrWhiteSpace(request.WebsiteUrl) ? null : request.WebsiteUrl.Trim();
        place.CoverImageUrl = MediaUrlNormalizer.Normalize(request.CoverImageUrl);
        place.IsActive = request.IsActive;
        place.IsPublished = request.IsPublished;
        place.SortOrder = request.SortOrder;
        place.WheelchairAccessible = request.WheelchairAccessible;
        place.AccessibleToilet = request.AccessibleToilet;
        place.SearchNormalized = PlaceText.BuildSearchNormalized(place);
    }

    public static void ReplaceHours(Place place, IEnumerable<PlaceHourDto>? hours)
    {
        place.OpeningHours.Clear();
        if (hours == null)
            return;

        foreach (var hour in hours)
        {
            if (hour.DayOfWeek is < 0 or > 6)
                continue;
            place.OpeningHours.Add(new PlaceOpeningHour
            {
                Id = Guid.NewGuid(),
                PlaceId = place.Id,
                DayOfWeek = hour.DayOfWeek,
                OpenTime = hour.IsClosed ? null : PlaceClock.NormalizeHm(hour.OpenTime),
                CloseTime = hour.IsClosed ? null : PlaceClock.NormalizeHm(hour.CloseTime),
                IsClosed = hour.IsClosed
            });
        }
    }

    public static void ReplaceAmenities(Place place, IEnumerable<string>? amenities)
    {
        place.Amenities.Clear();
        foreach (var amenity in PlaceAmenities.CanonicalList(amenities))
        {
            place.Amenities.Add(new PlaceAmenity
            {
                PlaceId = place.Id,
                AmenityId = amenity
            });
        }
    }

    private static string? EmptyToNull(string? value, int max)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;
        var trimmed = value.Trim();
        return trimmed.Length > max ? trimmed[..max] : trimmed;
    }
}
