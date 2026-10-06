using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using GolBox.Application.Common;
using GolBox.Application.Interfaces;
using GolBox.Domain.Entities;
using GolBox.Application.Features.Tasks;

namespace GolBox.Application.Features.Tasks.Commands;

public record CompleteTaskCommand(
    Guid TaskId
) : IRequest<Result>;

public class CompleteTaskCommandHandler : IRequestHandler<CompleteTaskCommand, Result>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public CompleteTaskCommandHandler(IAppDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<Result> Handle(CompleteTaskCommand request, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUserService.UserId;
        if (currentUserId == null || currentUserId == Guid.Empty)
        {
            return Result.Fail("Kullanıcı kimliği doğrulanamadı.");
        }

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == currentUserId.Value, cancellationToken);

        if (user == null)
        {
            return Result.Fail("Kullanıcı bulunamadı.");
        }

        var task = await _context.Tasks
            .FirstOrDefaultAsync(t => t.Id == request.TaskId && t.OrganizationId == user.OrganizationId, cancellationToken);

        if (task == null || task.Status != "Active")
        {
            return Result.Fail("Görev aktif değil veya bulunamadı.");
        }

        var now = DateTime.UtcNow;
        if (task.StartDate > now || task.EndDate < now)
        {
            return Result.Fail("Görevin geçerlilik süresi dışında işlem yapılamaz.");
        }

        if (await _context.UserTasks.AnyAsync(ut => ut.TaskId == task.Id && ut.UserId == user.Id, cancellationToken))
            return Result.Fail("Bu görevin ödülü daha önce hesabınıza aktarıldı.");

        var progress = await MissionProgressEvaluator.EvaluateAsync(_context, user, task, cancellationToken);
        if (!progress.Eligible || !progress.Completed)
            return Result.Fail(progress.Reason ?? $"Görev ilerlemesi tamamlanmadı: {progress.Current}/{progress.Target}.");

        // 1. Log UserTask completion
        var userTask = new UserTask
        {
            UserId = user.Id,
            TaskId = task.Id,
            CompletedAt = now,
            PointsEarned = task.PointsReward,
            OrganizationId = user.OrganizationId
        };
        _context.UserTasks.Add(userTask);

        // 2. Award Points
        user.PointsBalance += task.PointsReward;

        var transaction = new PointTransaction
        {
            UserId = user.Id,
            OrganizationId = user.OrganizationId,
            Amount = task.PointsReward,
            Type = "Earn",
            Description = $"\"{task.Title}\" Görevi Tamamlandı",
            ReferenceType = "Task",
            ReferenceId = task.Id,
            BalanceAfter = user.PointsBalance
        };
        _context.PointTransactions.Add(transaction);

        await _context.SaveChangesAsync(cancellationToken);

        return Result.Ok("Görev başarıyla tamamlandı ve puanınız eklendi.");
    }
}
