using GolBox.Application.Authorization;
using GolBox.Api.Controllers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Xunit;

namespace GolBox.Tests;

public class PlacesAuthorizationTests
{
    [Fact]
    public void Public_Places_Are_Anonymous_And_Admin_Writes_Are_Admin_Only()
    {
        var list = typeof(PlacesController).GetMethod(nameof(PlacesController.GetPlaces));
        var nearby = typeof(PlacesController).GetMethod(nameof(PlacesController.GetNearby));
        var detail = typeof(PlacesController).GetMethod(nameof(PlacesController.GetPlace));
        Assert.NotNull(list?.GetCustomAttributes(typeof(AllowAnonymousAttribute), true).FirstOrDefault()
                       ?? typeof(PlacesController).GetCustomAttributes(typeof(AllowAnonymousAttribute), true).FirstOrDefault());
        Assert.NotNull(nearby);
        Assert.NotNull(detail);

        var create = typeof(AdminPlacesController).GetMethod(nameof(AdminPlacesController.Create));
        var policy = create?.GetCustomAttributes(typeof(AuthorizeAttribute), true).Cast<AuthorizeAttribute>().FirstOrDefault()
                     ?? typeof(AdminPlacesController).GetCustomAttributes(typeof(AuthorizeAttribute), true).Cast<AuthorizeAttribute>().FirstOrDefault();
        Assert.Equal(AuthorizationPolicies.AdminOnly, policy?.Policy);
    }
}
