using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace GolBox.Api.Hubs;

[AllowAnonymous]
public class NotificationHub : Hub
{
    public async Task JoinUserGroup(string userId)
    {
        if (string.IsNullOrWhiteSpace(userId))
            return;

        var currentId = Context.UserIdentifier
            ?? Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var role = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
        var isStaff = string.Equals(role, "Staff", StringComparison.OrdinalIgnoreCase)
                      || string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase);
        if (!isStaff && !string.Equals(currentId, userId, StringComparison.OrdinalIgnoreCase))
            return;

        await Groups.AddToGroupAsync(Context.ConnectionId, $"User_{userId}");
    }

    public async Task LeaveUserGroup(string userId)
    {
        if (!string.IsNullOrWhiteSpace(userId))
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"User_{userId}");
        }
    }

    public async Task JoinAdminGroup()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, "Admins");
    }

    public override async Task OnConnectedAsync()
    {
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await base.OnDisconnectedAsync(exception);
    }
}
