using GolBox.Application.Common;
using GolBox.Application.Content;
using GolBox.Application.Places;
using GolBox.Domain.Entities;
using Xunit;

namespace GolBox.Tests;

public class PlaceRulesTests
{
    [Fact]
    public void Name_Is_Required()
    {
        var result = PlaceRules.ValidateWrite("", PlaceCategories.Library, 37m, 37m, null, null, null, null, null);
        Assert.False(result.Success);
    }

    [Fact]
    public void Invalid_Coordinates_Are_Rejected()
    {
        Assert.False(PlaceRules.ValidateWrite("Park", PlaceCategories.Park, 91m, 37m, null, null, null, null, null).Success);
        Assert.False(PlaceRules.ValidateWrite("Park", PlaceCategories.Park, 37m, 200m, null, null, null, null, null).Success);
        Assert.False(PlaceRules.ValidateWrite("Park", PlaceCategories.Park, 37m, null, null, null, null, null, null).Success);
        Assert.True(PlaceRules.ValidateWrite("Park", PlaceCategories.Park, 37.07m, 37.38m, null, null, null, null, null).Success);
    }

    [Fact]
    public void Website_Must_Be_Http()
    {
        Assert.False(PlaceRules.ValidateWrite("Park", PlaceCategories.Park, null, null, null, null, "ftp://x", null, null).Success);
        Assert.True(PlaceRules.ValidateWrite("Park", PlaceCategories.Park, null, null, null, null, "https://www.sehitkamil.bel.tr", null, null).Success);
    }

    [Fact]
    public void Email_And_Phone_Are_Optional_But_Validated()
    {
        Assert.True(PlaceRules.ValidateWrite("Park", PlaceCategories.Park, null, null, null, null, null, null, null).Success);
        Assert.False(PlaceRules.ValidateWrite("Park", PlaceCategories.Park, null, null, "abc", null, null, null, null).Success);
        Assert.True(PlaceRules.ValidateWrite("Park", PlaceCategories.Park, null, null, "+90 342 000 00 00", "info@sehitkamil.bel.tr", null, null, null).Success);
        Assert.False(PlaceRules.ValidateWrite("Park", PlaceCategories.Park, null, null, null, "not-an-email", null, null, null).Success);
    }

    [Fact]
    public void Opening_Hours_Use_Istanbul_Clock()
    {
        var hours = new[]
        {
            new PlaceOpeningHour { DayOfWeek = (int)DayOfWeek.Monday, OpenTime = "09:00", CloseTime = "18:00", IsClosed = false }
        };
        var mondayNoonUtc = new DateTime(2026, 9, 14, 9, 0, 0, DateTimeKind.Utc); // 12:00 Istanbul in September (UTC+3)
        Assert.Equal(PlaceOpenStatuses.Open, PlaceClock.ResolveOpenStatus(hours, mondayNoonUtc));
        var mondayNightUtc = new DateTime(2026, 9, 14, 18, 0, 0, DateTimeKind.Utc); // 21:00 Istanbul
        Assert.Equal(PlaceOpenStatuses.Closed, PlaceClock.ResolveOpenStatus(hours, mondayNightUtc));
        Assert.Equal(PlaceOpenStatuses.Unknown, PlaceClock.ResolveOpenStatus([], mondayNoonUtc));
    }

    [Fact]
    public void Place_Cta_Requires_Guid()
    {
        Assert.True(ContentCtaValidator.Validate(ContentCtaTypes.Place, Guid.NewGuid().ToString()).Success);
        Assert.False(ContentCtaValidator.Validate(ContentCtaTypes.Place, "map").Success);
        Assert.True(ContentCtaTypes.IsKnown(ContentCtaTypes.Place));
    }

    [Fact]
    public void Search_Fold_Is_Turkish_Insensitive()
    {
        Assert.Contains("sehitkamil", PlaceText.Fold("Şehitkamil Kütüphane"));
        Assert.Contains("kutuphane", PlaceText.Fold("KÜTÜPHANE"));
    }

    [Fact]
    public void Bounding_Box_Does_Not_Cover_The_Planet()
    {
        var box = PlaceGeo.BoundingBox(37.07m, 37.38m, 5);
        Assert.True(box.MaxLat - box.MinLat < 1m);
        Assert.True(box.MaxLng - box.MinLng < 1m);
        Assert.True(PlaceGeo.Meters(37.07m, 37.38m, 37.08m, 37.38m) is > 500 and < 2000);
    }
}
