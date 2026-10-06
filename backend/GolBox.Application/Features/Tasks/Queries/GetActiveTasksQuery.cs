using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using GolBox.Application.Common;
using GolBox.Application.Interfaces;
using GolBox.Application.Features.Tasks;

namespace GolBox.Application.Features.Tasks.Queries;

public record GetActiveTasksQuery : IRequest<Result<List<ActiveTaskDto>>>;

public record ActiveTaskDto(
    Guid Id,
    string Title,
    string Description,
    int PointsReward,
    DateTime StartDate,
    DateTime EndDate,
    int MaxCompletions,
    int CompletedCount,
    bool IsCompleted,
    string ShortDescription,
    string Category,
    string MissionType,
    int TargetProgress,
    int CurrentProgress,
    string TargetAudience,
    string? HowToCompleteJson,
    bool IsEligible,
    string? EligibilityMessage
);

public class GetActiveTasksQueryHandler : IRequestHandler<GetActiveTasksQuery, Result<List<ActiveTaskDto>>>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetActiveTasksQueryHandler(IAppDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<Result<List<ActiveTaskDto>>> Handle(GetActiveTasksQuery request, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUserService.UserId;
        if (currentUserId == null || currentUserId == Guid.Empty)
        {
            return Result<List<ActiveTaskDto>>.Fail("Kullanıcı kimliği doğrulanamadı.");
        }

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == currentUserId.Value, cancellationToken);

        if (user == null)
        {
            return Result<List<ActiveTaskDto>>.Fail("Kullanıcı bulunamadı.");
        }

        var now = DateTime.UtcNow;
        var activeTasks = await _context.Tasks
            .Where(t => t.OrganizationId == user.OrganizationId && t.Status == "Active" && t.StartDate <= now && t.EndDate >= now)
            .ToListAsync(cancellationToken);

        var userTasks = await _context.UserTasks
            .Where(ut => ut.UserId == user.Id)
            .ToListAsync(cancellationToken);

        var result = new List<ActiveTaskDto>();
        foreach (var t in activeTasks)
        {
            var completedCount = userTasks.Count(ut => ut.TaskId == t.Id);
            var progress = await MissionProgressEvaluator.EvaluateAsync(_context, user, t, cancellationToken);
            result.Add(new ActiveTaskDto(
                t.Id,
                t.Title,
                t.Description,
                t.PointsReward,
                t.StartDate,
                t.EndDate,
                t.MaxCompletions,
                completedCount,
                completedCount > 0,
                t.ShortDescription,
                t.Category,
                t.MissionType,
                Math.Max(1, t.TargetProgress),
                progress.Current,
                t.TargetAudience,
                t.HowToCompleteJson,
                progress.Eligible,
                progress.Reason
            ));
        }

        return Result<List<ActiveTaskDto>>.Ok(result, "Aktif görevler başarıyla listelendi.");
    }
}
