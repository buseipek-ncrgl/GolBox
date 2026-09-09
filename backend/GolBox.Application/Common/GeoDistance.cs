using System;

namespace GolBox.Application.Common;

public static class GeoDistance
{
    public static double Meters(decimal latitude1, decimal longitude1, decimal latitude2, decimal longitude2)
    {
        const double earthRadiusMeters = 6371000d;
        var lat1 = ToRadians((double)latitude1);
        var lat2 = ToRadians((double)latitude2);
        var deltaLat = ToRadians((double)(latitude2 - latitude1));
        var deltaLng = ToRadians((double)(longitude2 - longitude1));

        var a = Math.Sin(deltaLat / 2) * Math.Sin(deltaLat / 2)
                + Math.Cos(lat1) * Math.Cos(lat2) * Math.Sin(deltaLng / 2) * Math.Sin(deltaLng / 2);
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return earthRadiusMeters * c;
    }

    private static double ToRadians(double degrees) => degrees * Math.PI / 180d;
}
