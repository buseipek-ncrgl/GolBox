using GolBox.Application.Common;
using GolBox.Application.Interfaces;
using GolBox.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace GolBox.Application.Features.Tasks;

public record MissionProgressResult(int Current, int Target, bool Eligible, bool Completed, string? Reason);

public static class MissionProgressEvaluator
{
    public static async Task<MissionProgressResult> EvaluateAsync(
        IAppDbContext context,
        User user,
        GolBox.Domain.Entities.Task task,
        CancellationToken cancellationToken = default)
    {
        var target = Math.Max(1, task.TargetProgress);
        var audienceReason = AudienceReason(user, task.TargetAudience);
        if (audienceReason != null) return new(0, target, false, false, audienceReason);

        var orders = context.Orders.AsNoTracking().Where(o =>
            o.UserId == user.Id && o.OrganizationId == user.OrganizationId &&
            o.Status == OrderStatuses.Completed &&
            o.CreatedDate >= task.StartDate && o.CreatedDate <= task.EndDate);

        int progress;
        switch (task.MissionType)
        {
            case "FIRST_ORDER":
                progress = await orders.AnyAsync(cancellationToken) ? 1 : 0;
                break;
            case "DISTINCT_BRANCH":
                progress = await orders.Select(o => o.CafeId).Distinct().CountAsync(cancellationToken);
                break;
            case "DISTINCT_CATEGORY":
                progress = await context.OrderItems.AsNoTracking()
                    .Where(oi => oi.Order.UserId == user.Id && oi.Order.OrganizationId == user.OrganizationId &&
                        oi.Order.Status == OrderStatuses.Completed && oi.Order.CreatedDate >= task.StartDate && oi.Order.CreatedDate <= task.EndDate &&
                        oi.MenuItem.CategoryId != null)
                    .Select(oi => oi.MenuItem.CategoryId).Distinct().CountAsync(cancellationToken);
                break;
            case "EVENT_ATTENDED":
                progress = await context.UserActivities.AsNoTracking().CountAsync(ua =>
                    ua.UserId == user.Id && ua.OrganizationId == user.OrganizationId && ua.CheckedInAt != null &&
                    ua.CheckedInAt >= task.StartDate && ua.CheckedInAt <= task.EndDate, cancellationToken);
                break;
            default:
                var completedDates = await orders.Select(o => o.CompletedAt ?? o.CreatedDate).ToListAsync(cancellationToken);
                progress = completedDates.Select(value => value.Date).Distinct().Count();
                break;
        }

        progress = Math.Min(progress, target);
        return new(progress, target, true, progress >= target, progress >= target ? null : "Görev hedefi henüz tamamlanmadı.");
    }

    private static string? AudienceReason(User user, string? audience)
    {
        if (string.Equals(audience, "Youth", StringComparison.OrdinalIgnoreCase) && (!user.Age.HasValue || user.Age.Value > 30))
            return "Bu görev genç kullanıcılar içindir.";
        if (string.Equals(audience, "Student", StringComparison.OrdinalIgnoreCase) && string.IsNullOrWhiteSpace(user.EducationLevel))
            return "Bu görev öğrenci kullanıcılar içindir.";
        return null;
    }
}
