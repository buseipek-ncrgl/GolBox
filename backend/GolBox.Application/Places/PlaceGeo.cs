using GolBox.Application.Common;

namespace GolBox.Application.Places;

public static class PlaceGeo
{
    public const double NearbyDefaultRadiusKm = 12d;
    public const double ListDefaultRadiusKm = 40d;
    public const int NearbyDefaultLimit = 8;
    public const int NearbyMaxLimit = 30;
    public const int CandidateCap = 250;

    public static (decimal MinLat, decimal MaxLat, decimal MinLng, decimal MaxLng) BoundingBox(
        decimal latitude,
        decimal longitude,
        double radiusKm)
    {
        var latDelta = (decimal)(radiusKm / 111.0);
        var cos = Math.Cos((double)latitude * Math.PI / 180d);
        var lngDelta = (decimal)(radiusKm / (111.0 * Math.Max(0.2, Math.Abs(cos))));
        return (
            Clamp(latitude - latDelta, -90m, 90m),
            Clamp(latitude + latDelta, -90m, 90m),
            Clamp(longitude - lngDelta, -180m, 180m),
            Clamp(longitude + lngDelta, -180m, 180m)
        );
    }

    public static bool IsValidLatitude(decimal? value) =>
        value is >= -90m and <= 90m;

    public static bool IsValidLongitude(decimal? value) =>
        value is >= -180m and <= 180m;

    public static bool HasCoordinates(decimal? latitude, decimal? longitude) =>
        latitude.HasValue && longitude.HasValue &&
        IsValidLatitude(latitude) && IsValidLongitude(longitude);

    public static double? Meters(decimal? fromLat, decimal? fromLng, decimal? toLat, decimal? toLng)
    {
        if (!HasCoordinates(fromLat, fromLng) || !HasCoordinates(toLat, toLng))
            return null;
        return GeoDistance.Meters(fromLat!.Value, fromLng!.Value, toLat!.Value, toLng!.Value);
    }

    private static decimal Clamp(decimal value, decimal min, decimal max) =>
        value < min ? min : value > max ? max : value;
}
