using GolBox.Api.Controllers;
using GolBox.Application.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Xunit;

namespace GolBox.Tests;

public class ContentAuthorizationTests
{
    [Fact]
    public void Public_Content_Is_Anonymous_And_Writes_Are_Admin_Only()
    {
        var hero = typeof(ContentController).GetMethod(nameof(ContentController.GetHero));
        var create = typeof(ContentController).GetMethod(nameof(ContentController.Create));
        Assert.NotNull(hero?.GetCustomAttributes(typeof(AllowAnonymousAttribute), true).FirstOrDefault());
        var policy = create?.GetCustomAttributes(typeof(AuthorizeAttribute), true).Cast<AuthorizeAttribute>().FirstOrDefault();
        Assert.Equal(AuthorizationPolicies.AdminOnly, policy?.Policy);
    }

    [Fact]
    public void Citizen_Notification_Inbox_Is_Authorized_Without_Admin_Policy()
    {
        var mine = typeof(NotificationsController).GetMethod(nameof(NotificationsController.GetMyNotifications));
        Assert.NotNull(mine);
        var methodPolicy = mine!.GetCustomAttributes(typeof(AuthorizeAttribute), true).Cast<AuthorizeAttribute>().FirstOrDefault();
        Assert.True(methodPolicy == null || string.IsNullOrEmpty(methodPolicy.Policy));
        Assert.NotNull(typeof(NotificationsController).GetCustomAttributes(typeof(AuthorizeAttribute), true).FirstOrDefault());
    }

    [Fact]
    public void Public_Activities_Are_Anonymous()
    {
        var method = typeof(ActivitiesController).GetMethod(nameof(ActivitiesController.GetPublicActivities));
        Assert.NotNull(method?.GetCustomAttributes(typeof(AllowAnonymousAttribute), true).FirstOrDefault());
        var join = typeof(ActivitiesController).GetMethod(nameof(ActivitiesController.JoinActivity));
        Assert.Null(join?.GetCustomAttributes(typeof(AllowAnonymousAttribute), true).FirstOrDefault());
    }
}
