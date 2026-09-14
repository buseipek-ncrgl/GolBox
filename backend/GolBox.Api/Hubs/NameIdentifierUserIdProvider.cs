using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;

namespace GolBox.Api.Hubs;

public sealed class NameIdentifierUserIdProvider : IUserIdProvider
{
    public string? GetUserId(HubConnectionContext connection) =>
        connection.User?.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? connection.User?.FindFirstValue("sub");
}
