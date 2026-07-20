using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using GolBox.Application.Common;
using GolBox.Application.Interfaces;
using GolBox.Domain.Entities;

namespace GolBox.Application.Features.Tasks.Commands;

public record CreateTaskCommand(
    Guid OrganizationId,
    string Title,
    string Description,
    int PointsReward,
    DateTime StartDate,
    DateTime EndDate,
    int MaxCompletions
) : IRequest<Result<Guid>>;

public class CreateTaskCommandHandler : IRequestHandler<CreateTaskCommand, Result<Guid>>
{
    private readonly IAppDbContext _context;

    public CreateTaskCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<Result<Guid>> Handle(CreateTaskCommand request, CancellationToken cancellationToken)
    {
        var task = new Domain.Entities.Task
        {
            OrganizationId = request.OrganizationId,
            Title = request.Title,
            Description = request.Description,
            PointsReward = request.PointsReward,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            MaxCompletions = request.MaxCompletions,
            Status = "Active"
        };

        _context.Tasks.Add(task);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Ok(task.Id, "Görev başarıyla oluşturuldu.");
    }
}
