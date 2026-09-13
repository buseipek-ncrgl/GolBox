using System;
using System.Linq;
using System.Threading.Tasks;
using GolBox.Application.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GolBox.Application.Common;
using GolBox.Application.Interfaces;
using GolBox.Domain.Entities;

namespace GolBox.Api.Controllers;

[Authorize(Policy = AuthorizationPolicies.AdminOnly)]
public class AuditLogsController : BaseApiController
{
    private readonly IAppDbContext _context;

    public AuditLogsController(IAppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetLogs([FromQuery] string? module = null, [FromQuery] string? search = null)
    {
        var query = _context.AuditLogs.AsQueryable();

        if (!string.IsNullOrEmpty(module) && module != "All")
        {
            query = query.Where(l => l.ModuleName == module);
        }

        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(l => l.UserEmail.Contains(search) || l.ActionType.Contains(search) || (l.Reason != null && l.Reason.Contains(search)));
        }

        var logs = await query
            .OrderByDescending(l => l.CreatedDate)
            .Take(100)
            .Select(l => new
            {
                l.Id,
                l.UserId,
                l.UserEmail,
                l.UserRole,
                l.ActionType,
                l.ModuleName,
                l.EntityName,
                l.EntityId,
                l.OldValues,
                l.NewValues,
                l.Reason,
                l.IpAddress,
                l.CreatedDate
            })
            .ToListAsync();

        return Ok(Result<object>.Ok(logs));
    }

    public static async System.Threading.Tasks.Task LogAsync(IAppDbContext context, string userEmail, string userRole, string actionType, string moduleName, string entityName, string? entityId, string? oldVal, string? newVal, string? reason, string? ip = "127.0.0.1")
    {
        context.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            UserEmail = userEmail,
            UserRole = userRole,
            ActionType = actionType,
            ModuleName = moduleName,
            EntityName = entityName,
            EntityId = entityId,
            OldValues = oldVal,
            NewValues = newVal,
            Reason = reason,
            IpAddress = ip,
            CreatedDate = DateTime.UtcNow
        });
        await context.SaveChangesAsync();
    }
}
