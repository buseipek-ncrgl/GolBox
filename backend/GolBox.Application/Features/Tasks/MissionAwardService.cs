using GolBox.Application.Interfaces;
using GolBox.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace GolBox.Application.Features.Tasks;

public static class MissionAwardService
{
    public static async Task<int> AwardEligibleAsync(IAppDbContext context, Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await context.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
        if (user == null) return 0;
        var now = DateTime.UtcNow;
        var tasks = await context.Tasks.Where(t => t.OrganizationId == user.OrganizationId && t.Status == "Active" && t.StartDate <= now && t.EndDate >= now).ToListAsync(cancellationToken);
        var awardedTaskIds = await context.UserTasks.Where(ut => ut.UserId == userId).Select(ut => ut.TaskId).ToListAsync(cancellationToken);
        var awarded = 0;
        foreach (var task in tasks.Where(t => !awardedTaskIds.Contains(t.Id)))
        {
            var progress = await MissionProgressEvaluator.EvaluateAsync(context, user, task, cancellationToken);
            if (!progress.Eligible || !progress.Completed) continue;
            user.PointsBalance += task.PointsReward;
            context.UserTasks.Add(new UserTask { Id = Guid.NewGuid(), UserId = user.Id, TaskId = task.Id, CompletedAt = now, PointsEarned = task.PointsReward, OrganizationId = user.OrganizationId });
            context.PointTransactions.Add(new PointTransaction { Id = Guid.NewGuid(), UserId = user.Id, OrganizationId = user.OrganizationId,
                Amount = task.PointsReward, Type = "MissionReward", Description = $"{task.Title} görevi tamamlandı", ReferenceType = "Mission", ReferenceId = task.Id,
                BalanceAfter = user.PointsBalance, CreatedDate = now });
            awarded += task.PointsReward;
        }
        if (awarded > 0) await context.SaveChangesAsync(cancellationToken);
        return awarded;
    }
}
