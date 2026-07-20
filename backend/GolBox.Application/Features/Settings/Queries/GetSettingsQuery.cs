using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using GolBox.Application.Common;
using GolBox.Application.Interfaces;

namespace GolBox.Application.Features.Settings.Queries;

public record GetSettingsQuery : IRequest<Result<List<SettingDto>>>;

public record SettingDto(
    string Key,
    string Value,
    string? Description
);

public class GetSettingsQueryHandler : IRequestHandler<GetSettingsQuery, Result<List<SettingDto>>>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetSettingsQueryHandler(IAppDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<Result<List<SettingDto>>> Handle(GetSettingsQuery request, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUserService.UserId;
        if (currentUserId == null || currentUserId == Guid.Empty)
        {
            return Result<List<SettingDto>>.Fail("Kullanıcı kimliği doğrulanamadı.");
        }

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == currentUserId.Value, cancellationToken);

        if (user == null)
        {
            return Result<List<SettingDto>>.Fail("Kullanıcı bulunamadı.");
        }

        var settings = await _context.Settings
            .Where(s => s.OrganizationId == user.OrganizationId)
            .Select(s => new SettingDto(s.Key, s.Value, s.Description))
            .ToListAsync(cancellationToken);

        return Result<List<SettingDto>>.Ok(settings, "Ayarlar başarıyla getirildi.");
    }
}
