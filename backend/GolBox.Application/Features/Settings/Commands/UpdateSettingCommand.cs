using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using GolBox.Application.Common;
using GolBox.Application.Interfaces;
using GolBox.Application.Settings;
using GolBox.Domain.Entities;

namespace GolBox.Application.Features.Settings.Commands;

public record UpdateSettingCommand(
    string Key,
    string Value
) : IRequest<Result>;

public class UpdateSettingCommandHandler : IRequestHandler<UpdateSettingCommand, Result>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public UpdateSettingCommandHandler(IAppDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<Result> Handle(UpdateSettingCommand request, CancellationToken cancellationToken)
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

        var validation = SettingRules.Validate(request.Key, request.Value);
        if (!validation.Success)
            return validation;

        var canonicalKey = SettingRules.CanonicalKey(request.Key);
        var setting = await _context.Settings
            .FirstOrDefaultAsync(s => s.OrganizationId == user.OrganizationId && s.Key.ToLower() == canonicalKey.ToLower(), cancellationToken);

        if (setting == null)
        {
            setting = new Setting
            {
                OrganizationId = user.OrganizationId,
                Key = canonicalKey,
                Value = request.Value.Trim(),
                Description = "Sistem tarafından otomatik oluşturuldu."
            };
            _context.Settings.Add(setting);
        }
        else
        {
            setting.Value = request.Value.Trim();
        }

        await _context.SaveChangesAsync(cancellationToken);

        return Result.Ok("Ayar başarıyla güncellendi.");
    }
}
