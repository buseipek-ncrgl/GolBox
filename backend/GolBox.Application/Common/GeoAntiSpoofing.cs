using System;

namespace GolBox.Application.Common;

public static class GeoAntiSpoofing
{
    // Maximum plausible speed (in km/h) between consecutive field drop captures
    private const double MaxAllowedSpeedKmH = 150.0;

    public static (bool IsValid, string? ErrorMessage) ValidateLocationCapture(
        decimal currentLat,
        decimal currentLng,
        bool? isMockLocation,
        decimal? previousLat,
        decimal? previousLng,
        DateTime? previousTimestamp,
        DateTime currentTimestamp)
    {
        // 1. Basic coordinate bounds check
        if (currentLat < -90m || currentLat > 90m || currentLng < -180m || currentLng > 180m)
        {
            return (false, "Geçersiz konum koordinatları.");
        }

        // Native clients may send true. Web browsers cannot reliably detect mock GPS;
        // a missing/null flag is treated as unsupported, not as a pass/fail signal.
        if (isMockLocation == true)
        {
            return (false, "Sahte konum (Mock Location) tespiti nedeniyle işlem reddedildi.");
        }

        // 3. Teleportation / speed limit check
        if (previousLat.HasValue && previousLng.HasValue && previousTimestamp.HasValue)
        {
            var secondsPassed = (currentTimestamp - previousTimestamp.Value).TotalSeconds;
            if (secondsPassed > 0 && secondsPassed < 86400) // Within 24 hours
            {
                var distanceMeters = GeoDistance.Meters(previousLat.Value, previousLng.Value, currentLat, currentLng);
                var speedKmH = (distanceMeters / 1000.0) / (secondsPassed / 3600.0);

                if (speedKmH > MaxAllowedSpeedKmH && distanceMeters > 500)
                {
                    return (false, $"Şüpheli hızlı konum değişimi saptandı ({Math.Round(speedKmH)} km/s). Saha kutusu toplanamadı.");
                }
            }
        }

        return (true, null);
    }
}
