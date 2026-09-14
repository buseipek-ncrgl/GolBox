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
    public async Task<IActionResult> GetLogs(
        [FromQuery] string? module = null,
        [FromQuery] string? search = null,
        [FromQuery] string? action = null,
        [FromQuery] string? staff = null,
        [FromQuery] string? preset = null,
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = AdminPaging.DefaultPageSize)
    {
        (page, pageSize) = AdminPaging.Normalize(page, pageSize);
        var query = _context.AuditLogs.AsQueryable();

        if (!string.IsNullOrEmpty(module) && module != "All")
            query = query.Where(l => l.ModuleName == module);

        if (!string.IsNullOrWhiteSpace(action) && action != "All")
            query = query.Where(l => l.ActionType == action);

        if (!string.IsNullOrWhiteSpace(staff))
        {
            var term = staff.Trim();
            query = query.Where(l => l.UserEmail.Contains(term));
        }

        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(l =>
                l.UserEmail.Contains(search) ||
                l.ActionType.Contains(search) ||
                (l.Reason != null && l.Reason.Contains(search)) ||
                (l.EntityId != null && l.EntityId.Contains(search)));
        }

        if (!string.IsNullOrWhiteSpace(preset) || from.HasValue || to.HasValue)
        {
            var range = AdminDateRange.Resolve(preset, from, to);
            query = query.Where(l => l.CreatedDate >= range.FromUtc && l.CreatedDate < range.ToUtc);
        }

        var totalCount = await query.CountAsync();
        var logs = await query
            .OrderByDescending(l => l.CreatedDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
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

        return Ok(Result<object>.Ok(new { items = logs, page, pageSize, totalCount }));
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
