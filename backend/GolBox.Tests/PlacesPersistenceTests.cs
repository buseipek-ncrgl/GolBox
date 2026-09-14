using GolBox.Application.Common;
using GolBox.Application.Places;
using GolBox.Domain.Entities;
using GolBox.Persistence.Context;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace GolBox.Tests;

public class PlacesPersistenceTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly AppDbContext _db;
    private readonly Guid _orgId = KnownOrganizations.Sehitkamil;
    private readonly Guid _otherOrg = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

    public PlacesPersistenceTests()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();
        var options = new DbContextOptionsBuilder<AppDbContext>().UseSqlite(_connection).Options;
        _db = new AppDbContext(options);
        _db.Database.EnsureCreated();
        _db.Organizations.AddRange(
            new Organization { Id = _orgId, Name = "Şehitkamil", CreatedDate = DateTime.UtcNow },
            new Organization { Id = _otherOrg, Name = "Other", CreatedDate = DateTime.UtcNow }
        );
        _db.SaveChanges();
    }

    [Fact]
    public void Citizen_Query_Hides_Draft_And_Inactive()
    {
        _db.Places.AddRange(
            Place("live", published: true, active: true),
            Place("draft", published: false, active: true),
            Place("off", published: true, active: false)
        );
        _db.SaveChanges();

        var visible = PlaceQueries.WhereCitizenVisible(_db.Places, _orgId).Select(p => p.Name).ToList();
        Assert.Equal(new[] { "live" }, visible);
    }

    [Fact]
    public void Org_Isolation_Hides_Other_Municipality()
    {
        _db.Places.Add(Place("mine", org: _orgId));
        _db.Places.Add(Place("theirs", org: _otherOrg));
        _db.SaveChanges();
        Assert.Equal(new[] { "mine" }, PlaceQueries.WhereCitizenVisible(_db.Places, _orgId).Select(p => p.Name).ToList());
        Assert.DoesNotContain("theirs", PlaceQueries.WhereOrg(_db.Places, _orgId).Select(p => p.Name).ToList());
    }

    [Fact]
    public void Category_Search_And_Pagination_Stay_In_Sql()
    {
        for (var i = 1; i <= 8; i++)
        {
            var place = Place($"Kütüphane {i:00}", category: PlaceCategories.Library);
            place.Neighborhood = i % 2 == 0 ? "İncilipınar" : "Atatürk";
            place.SearchNormalized = PlaceText.BuildSearchNormalized(place);
            _db.Places.Add(place);
        }
        _db.Places.Add(Place("Park A", category: PlaceCategories.Park));
        _db.SaveChanges();

        var libraries = PlaceQueries.WhereCitizenVisible(_db.Places, _orgId).WhereCategory(PlaceCategories.Library);
        Assert.Equal(8, libraries.Count());
        var page = libraries.OrderBy(p => p.Name).Skip(5).Take(3).Select(p => p.Name).ToList();
        Assert.Equal(new[] { "Kütüphane 06", "Kütüphane 07", "Kütüphane 08" }, page);

        var search = PlaceQueries.WhereCitizenVisible(_db.Places, _orgId)
            .WhereSearch("kutuphane")
            .Select(p => p.Name)
            .ToList();
        Assert.Equal(8, search.Count);
        Assert.DoesNotContain("Park A", search);
    }

    [Fact]
    public void Nearby_Orders_By_Distance_After_Bounding_Box()
    {
        var originLat = 37.0700m;
        var originLng = 37.3800m;
        _db.Places.Add(Place("near", lat: 37.0710m, lng: 37.3810m));
        _db.Places.Add(Place("far", lat: 37.1200m, lng: 37.4300m));
        _db.Places.Add(Place("nocoords", lat: null, lng: null));
        _db.SaveChanges();

        var boxed = PlaceQueries.WhereCitizenVisible(_db.Places, _orgId)
            .WhereBoundingBox(originLat, originLng, 8)
            .ToList();
        Assert.Contains(boxed, p => p.Name == "near");
        Assert.DoesNotContain(boxed, p => p.Name == "nocoords");

        var ranked = boxed
            .Select(p => (p.Name, Distance: PlaceGeo.Meters(originLat, originLng, p.Latitude, p.Longitude)))
            .Where(x => x.Distance.HasValue)
            .OrderBy(x => x.Distance)
            .Select(x => x.Name)
            .ToList();
        Assert.Equal("near", ranked[0]);
    }

    [Fact]
    public async System.Threading.Tasks.Task Cafe_Link_Is_Idempotent_And_Keeps_Cafe_Record()
    {
        var category = new CafeCategory { Id = Guid.NewGuid(), OrganizationId = _orgId, Name = "Kafe" };
        var cafe = new Cafe
        {
            Id = Guid.Parse("33333333-3333-3333-3333-333333333333"),
            OrganizationId = _orgId,
            CategoryId = category.Id,
            Name = "Merkez Kitap Kafe",
            Address = "Merkez",
            Latitude = 37.0750m,
            Longitude = 37.3825m,
            IsActive = true
        };
        _db.CafeCategories.Add(category);
        _db.Cafes.Add(cafe);
        _db.SaveChanges();

        await PlaceCafeSync.EnsureLinkedPlaceAsync(_db, cafe);
        await _db.SaveChangesAsync();
        var firstId = cafe.PlaceId;
        Assert.NotNull(firstId);
        Assert.Equal(1, _db.Places.Count());

        await PlaceCafeSync.EnsureLinkedPlaceAsync(_db, cafe);
        await _db.SaveChangesAsync();
        Assert.Equal(firstId, cafe.PlaceId);
        Assert.Equal(1, _db.Places.Count());
        Assert.Equal("Merkez Kitap Kafe", _db.Cafes.Single().Name);
        Assert.Equal(PlaceCategories.Cafe, _db.Places.Single().Category);
    }

    [Fact]
    public void Activity_Can_Reference_Place_Without_Dropping_Location()
    {
        var place = Place("Bilim");
        _db.Places.Add(place);
        _db.Activities.Add(new Activity
        {
            OrganizationId = _orgId,
            Title = "Atölye",
            Description = "Deney",
            Location = "Serbest metin",
            PlaceId = place.Id,
            StartDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddDays(1),
            Status = "Active"
        });
        _db.SaveChanges();
        var activity = _db.Activities.Single();
        Assert.Equal(place.Id, activity.PlaceId);
        Assert.Equal("Serbest metin", activity.Location);
    }

    private Place Place(
        string name,
        bool published = true,
        bool active = true,
        string category = PlaceCategories.Other,
        Guid? org = null,
        decimal? lat = 37.07m,
        decimal? lng = 37.38m)
    {
        var place = new Place
        {
            OrganizationId = org ?? _orgId,
            Name = name,
            Slug = PlaceText.Slugify(name, Guid.NewGuid()),
            Category = category,
            Latitude = lat,
            Longitude = lng,
            IsPublished = published,
            IsActive = active
        };
        place.SearchNormalized = PlaceText.BuildSearchNormalized(place);
        return place;
    }

    public void Dispose()
    {
        _db.Dispose();
        _connection.Dispose();
    }
}
