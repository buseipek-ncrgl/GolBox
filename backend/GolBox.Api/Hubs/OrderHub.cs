using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using GolBox.Application.Common;

namespace GolBox.Api.Hubs;

[Authorize]
public class OrderHub : Hub
{
    public const string StaffGroup = "staff";

    public override async Task OnConnectedAsync()
    {
        var role = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
        if (RoleMatrix.IsStaffOrAdmin(role))
            await Groups.AddToGroupAsync(Context.ConnectionId, StaffGroup);

        await base.OnConnectedAsync();
    }

    public Task JoinUserGroup(string userId)
    {
        var currentId = Context.UserIdentifier;
        if (!string.Equals(currentId, userId, System.StringComparison.OrdinalIgnoreCase) &&
            !RoleMatrix.IsStaffOrAdmin(Context.User?.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value))
        {
            return Task.CompletedTask;
        }

        return Groups.AddToGroupAsync(Context.ConnectionId, $"User_{userId}");
    }

    public Task LeaveUserGroup(string userId) =>
        Groups.RemoveFromGroupAsync(Context.ConnectionId, $"User_{userId}");
}
