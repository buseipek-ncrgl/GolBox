using GolBox.Application.Common;
using GolBox.Application.Content;
using GolBox.Domain.Entities;
using GolBox.Persistence.Context;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace GolBox.Tests;

public class CitizenPlatformPersistenceTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly AppDbContext _db;
    private readonly Guid _orgId = KnownOrganizations.Sehitkamil;
    private readonly Guid _userId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

    public CitizenPlatformPersistenceTests()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();
        var options = new DbContextOptionsBuilder<AppDbContext>().UseSqlite(_connection).Options;
        _db = new AppDbContext(options);
        _db.Database.EnsureCreated();
        _db.Organizations.Add(new Organization
        {
            Id = _orgId,
            Name = "Şehitkamil",
            CreatedDate = DateTime.UtcNow
        });
        _db.Users.Add(new User
        {
            Id = _userId,
            OrganizationId = _orgId,
            Email = "citizen@test.local",
            NormalizedEmail = "CITIZEN@TEST.LOCAL",
            PasswordHash = "x",
            FirstName = "Test",
            LastName = "User",
            Role = "User",
            Age = 20,
            EducationLevel = "Üniversite"
        });
        _db.SaveChanges();
    }

    [Fact]
    public void Public_Query_Hides_Unpublished_Expired_And_Scheduled()
    {
        var now = DateTime.UtcNow;
        _db.CityContents.AddRange(
            Live("live", now, 1),
            Live("draft", now, 2, published: false),
            Live("expired", now, 3, end: now.AddHours(-2)),
            Live("later", now, 4, start: now.AddHours(3))
        );
        _db.SaveChanges();

        var visible = CityContentRules.WhereLive(_db.CityContents, _orgId, now)
            .OrderBy(c => c.Priority)
            .Select(c => c.Title)
            .ToList();
        Assert.Equal(new[] { "live" }, visible);
    }

    [Fact]
    public void Audience_Age_And_Education_Stay_On_Server()
    {
        var now = DateTime.UtcNow;
        _db.CityContents.Add(Live("age", now, 1, audience: AudienceTypes.AgeRange, minAge: 30));
        _db.CityContents.Add(Live("edu", now, 2, audience: AudienceTypes.EducationLevel, education: "Lise"));
        _db.CityContents.Add(Live("open", now, 3));
        _db.SaveChanges();

        var guest = CityContentRules.FilterAudience(_db.CityContents.ToList(), null).Select(c => c.Title).ToList();
        Assert.Equal(new[] { "open" }, guest);

        var user = new AudienceContext(true, 20, "Üniversite");
        var targeted = CityContentRules.FilterAudience(_db.CityContents.ToList(), user).Select(c => c.Title).ToList();
        Assert.Equal(new[] { "open" }, targeted);
    }

    [Fact]
    public void Notification_Ownership_And_Unread_Count()
    {
        var other = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        _db.Users.Add(new User
        {
            Id = other,
            OrganizationId = _orgId,
            Email = "other@test.local",
            NormalizedEmail = "OTHER@TEST.LOCAL",
            PasswordHash = "x",
            FirstName = "Other",
            LastName = "User",
            Role = "User"
        });
        _db.UserNotifications.Add(new UserNotification
        {
            OrganizationId = _orgId,
            UserId = _userId,
            Title = "Mine",
            Body = "Hello",
            Type = "General",
            IsRead = false
        });
        _db.UserNotifications.Add(new UserNotification
        {
            OrganizationId = _orgId,
            UserId = other,
            Title = "Theirs",
            Body = "Secret",
            Type = "General",
            IsRead = false
        });
        _db.SaveChanges();

        var mine = _db.UserNotifications.Where(n => n.UserId == _userId).Select(n => n.Title).ToList();
        Assert.Equal(new[] { "Mine" }, mine);
        Assert.Equal(1, _db.UserNotifications.Count(n => n.UserId == _userId && !n.IsRead));

        var row = _db.UserNotifications.Single(n => n.UserId == _userId);
        row.IsRead = true;
        row.ReadAt = DateTime.UtcNow;
        _db.SaveChanges();
        Assert.Equal(0, _db.UserNotifications.Count(n => n.UserId == _userId && !n.IsRead));
        Assert.False(_db.UserNotifications.Any(n => n.UserId == other && n.IsRead));
    }

    private CityContent Live(
        string title,
        DateTime now,
        int priority,
        bool published = true,
        DateTime? start = null,
        DateTime? end = null,
        string audience = AudienceTypes.Everyone,
        int? minAge = null,
        string? education = null) => new()
    {
        OrganizationId = _orgId,
        Type = CityContentTypes.Announcement,
        Title = title,
        CtaType = ContentCtaTypes.None,
        Priority = priority,
        IsPublished = published,
        StartAt = start ?? now.AddHours(-1),
        EndAt = end ?? now.AddDays(1),
        AudienceType = audience,
        AudienceMinAge = minAge,
        AudienceEducationLevel = education
    };

    public void Dispose()
    {
        _db.Dispose();
        _connection.Dispose();
    }
}
