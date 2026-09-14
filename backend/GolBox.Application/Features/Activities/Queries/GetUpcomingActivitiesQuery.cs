using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using GolBox.Application.Common;
using GolBox.Application.Interfaces;

namespace GolBox.Application.Features.Activities.Queries;

public record GetUpcomingActivitiesQuery : IRequest<Result<List<ActivityDto>>>;

public record ActivityDto(
    Guid Id,
    string Title,
    string Description,
    int PointsReward,
    string Location,
    string? ImageUrl,
    int? Capacity,
    int JoinedCount,
    DateTime StartDate,
    DateTime EndDate,
    bool IsJoined
);

public class GetUpcomingActivitiesQueryHandler : IRequestHandler<GetUpcomingActivitiesQuery, Result<List<ActivityDto>>>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetUpcomingActivitiesQueryHandler(IAppDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<Result<List<ActivityDto>>> Handle(GetUpcomingActivitiesQuery request, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUserService.UserId;
        if (currentUserId == null || currentUserId == Guid.Empty)
        {
            return Result<List<ActivityDto>>.Fail("Kullanıcı kimliği doğrulanamadı.");
        }

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == currentUserId.Value, cancellationToken);

        if (user == null)
        {
            return Result<List<ActivityDto>>.Fail("Kullanıcı bulunamadı.");
        }

        var now = DateTime.UtcNow;
        var activities = await _context.Activities
            .Where(a => a.OrganizationId == user.OrganizationId && a.Status == "Active" && a.EndDate >= now)
            .OrderBy(a => a.StartDate)
            .Select(a => new
            {
                a.Id,
                a.Title,
                a.Description,
                a.PointsReward,
                a.Location,
                a.ImageUrl,
                a.Capacity,
                a.StartDate,
                a.EndDate,
                JoinedCount = a.UserActivities.Count()
            })
            .ToListAsync(cancellationToken);

        var joinedActivityIds = await _context.UserActivities
            .Where(ua => ua.UserId == user.Id)
            .Select(ua => ua.ActivityId)
            .ToListAsync(cancellationToken);

        var result = activities.Select(a => new ActivityDto(
            a.Id,
            a.Title,
            a.Description,
            a.PointsReward,
            a.Location,
            a.ImageUrl,
            a.Capacity,
            a.JoinedCount,
            a.StartDate,
            a.EndDate,
            joinedActivityIds.Contains(a.Id)
        )).ToList();

        return Result<List<ActivityDto>>.Ok(result, "Yaklaşan etkinlikler başarıyla listelendi.");
    }
}
