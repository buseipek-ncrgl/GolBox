using GolBox.Application.Common;
using GolBox.Application.Content;
using GolBox.Domain.Entities;
using Xunit;

namespace GolBox.Tests;

public class CityContentRulesTests
{
    private static CityContent Item(
        bool published = true,
        DateTime? start = null,
        DateTime? end = null,
        string audience = AudienceTypes.Everyone,
        int? minAge = null,
        int? maxAge = null,
        string? education = null,
        int priority = 10) => new()
    {
        Id = Guid.NewGuid(),
        OrganizationId = KnownOrganizations.Sehitkamil,
        Type = CityContentTypes.Hero,
        Title = "Test",
        IsPublished = published,
        StartAt = start ?? DateTime.UtcNow.AddHours(-1),
        EndAt = end,
        AudienceType = audience,
        AudienceMinAge = minAge,
        AudienceMaxAge = maxAge,
        AudienceEducationLevel = education,
        Priority = priority,
        CtaType = ContentCtaTypes.None
    };

    [Fact]
    public void Unpublished_Is_Not_Live()
    {
        var now = DateTime.UtcNow;
        Assert.False(CityContentRules.IsLive(Item(published: false), now));
    }

    [Fact]
    public void Expired_Is_Not_Live()
    {
        var now = DateTime.UtcNow;
        Assert.False(CityContentRules.IsLive(Item(end: now.AddMinutes(-1)), now));
    }

    [Fact]
    public void Scheduled_Is_Not_Live()
    {
        var now = DateTime.UtcNow;
        Assert.False(CityContentRules.IsLive(Item(start: now.AddHours(1)), now));
    }

    [Fact]
    public void Published_Window_Is_Live()
    {
        var now = DateTime.UtcNow;
        Assert.True(CityContentRules.IsLive(Item(start: now.AddMinutes(-5), end: now.AddHours(1)), now));
    }

    [Fact]
    public void Guest_Only_Sees_Everyone()
    {
        var guest = new AudienceContext(false, null, null);
        Assert.True(CityContentRules.MatchesAudience(Item(audience: AudienceTypes.Everyone), guest));
        Assert.False(CityContentRules.MatchesAudience(Item(audience: AudienceTypes.LoggedIn), guest));
        Assert.False(CityContentRules.MatchesAudience(Item(audience: AudienceTypes.AgeRange, minAge: 18), null));
    }

    [Fact]
    public void Age_Range_Filters_On_Server()
    {
        var teen = new AudienceContext(true, 16, "Lise");
        var adult = new AudienceContext(true, 30, "Üniversite");
        var content = Item(audience: AudienceTypes.AgeRange, minAge: 18, maxAge: 25);
        Assert.False(CityContentRules.MatchesAudience(content, teen));
        Assert.False(CityContentRules.MatchesAudience(content, adult));
        Assert.True(CityContentRules.MatchesAudience(content, new AudienceContext(true, 20, null)));
    }

    [Fact]
    public void Education_Matches_Canonical_Aliases()
    {
        var content = Item(audience: AudienceTypes.EducationLevel, education: "HighSchool");
        Assert.True(CityContentRules.MatchesAudience(content, new AudienceContext(true, 17, "Lise")));
        Assert.False(CityContentRules.MatchesAudience(content, new AudienceContext(true, 22, "Üniversite")));
        Assert.False(CityContentRules.MatchesAudience(content, new AudienceContext(true, 17, null)));
    }

    [Fact]
    public void Priority_Sorts_Ascending()
    {
        var now = DateTime.UtcNow;
        var items = new[]
        {
            Item(priority: 30),
            Item(priority: 10),
            Item(priority: 20)
        };
        var ordered = items.Where(i => CityContentRules.IsLive(i, now)).OrderBy(i => i.Priority).Select(i => i.Priority).ToArray();
        Assert.Equal(new[] { 10, 20, 30 }, ordered);
    }

    [Fact]
    public void External_Url_Allowlist_Rejects_Arbitrary_Hosts()
    {
        Assert.False(ContentCtaValidator.Validate(ContentCtaTypes.ExternalUrl, "https://evil.example/phish").Success);
        Assert.True(ContentCtaValidator.Validate(ContentCtaTypes.ExternalUrl, "https://www.sehitkamil.bel.tr/duyuru").Success);
        Assert.False(ContentCtaValidator.Validate(ContentCtaTypes.InternalRoute, "/admin/secret").Success);
        Assert.True(ContentCtaValidator.Validate(ContentCtaTypes.InternalRoute, "map").Success);
        Assert.True(ContentCtaValidator.Validate(ContentCtaTypes.InternalRoute, "coupons").Success);
        Assert.True(ContentCtaValidator.Validate(ContentCtaTypes.InternalRoute, "places").Success);
    }

    [Fact]
    public void Admin_Status_Labels()
    {
        var now = DateTime.UtcNow;
        Assert.Equal(AdminContentStatuses.Draft, CityContentRules.AdminStatus(Item(published: false), now));
        Assert.Equal(AdminContentStatuses.Scheduled, CityContentRules.AdminStatus(Item(start: now.AddDays(1)), now));
        Assert.Equal(AdminContentStatuses.Expired, CityContentRules.AdminStatus(Item(end: now.AddDays(-1)), now));
        Assert.Equal(AdminContentStatuses.Published, CityContentRules.AdminStatus(Item(), now));
    }
}
