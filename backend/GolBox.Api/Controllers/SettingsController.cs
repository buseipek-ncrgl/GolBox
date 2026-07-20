using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GolBox.Application.Features.Settings.Commands;
using GolBox.Application.Features.Settings.Queries;

namespace GolBox.Api.Controllers;

[Authorize]
public class SettingsController : BaseApiController
{
    private readonly IMediator _mediator;

    public SettingsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<IActionResult> GetSettings()
    {
        var result = await _mediator.Send(new GetSettingsQuery());
        return HandleResult(result);
    }

    [HttpPut("{key}")]
    public async Task<IActionResult> UpdateSetting(string key, [FromBody] UpdateSettingRequest request)
    {
        var result = await _mediator.Send(new UpdateSettingCommand(key, request.Value));
        return HandleResult(result);
    }
}

public record UpdateSettingRequest(string Value);
