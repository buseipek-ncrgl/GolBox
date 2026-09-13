using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using GolBox.Application.Common;

namespace GolBox.Api.Hubs;

[Authorize]
public class NotificationHub : Hub
{
    public const string AdminGroup = "Admins";

    public override async Task OnConnectedAsync()
    {
        var role = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
        if (RoleMatrix.IsStaffOrAdmin(role))
            await Groups.AddToGroupAsync(Context.ConnectionId, AdminGroup);

        await base.OnConnectedAsync();
    }

    public Task JoinAdminGroup()
    {
        var role = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
        if (!RoleMatrix.IsStaffOrAdmin(role))
            return Task.CompletedTask;

        return Groups.AddToGroupAsync(Context.ConnectionId, AdminGroup);
    }
}
