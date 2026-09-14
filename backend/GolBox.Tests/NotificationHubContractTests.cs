using GolBox.Api.Hubs;
using Microsoft.AspNetCore.Authorization;
using Xunit;

namespace GolBox.Tests;

public class NotificationHubContractTests
{
    [Fact]
    public void Hub_Requires_Jwt_And_Does_Not_Expose_Foreign_Group_Join()
    {
        Assert.Contains(typeof(NotificationHub).GetCustomAttributes(true), attr => attr is AuthorizeAttribute);
        Assert.Null(typeof(NotificationHub).GetMethod("JoinUserGroup"));
        Assert.Null(typeof(NotificationHub).GetMethod("LeaveUserGroup"));
        Assert.NotNull(typeof(NotificationHub).GetMethod("JoinAdminGroup"));
    }
}
