using System;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GolBox.Application.Common;
using GolBox.Application.Features.Qr.Commands;
using GolBox.Application.Interfaces;
using GolBox.Infrastructure.Services;

namespace GolBox.Api.Controllers;

[Route("api/v1/qr")]
public class QrController : BaseApiController
{
    private readonly IMediator _mediator;
    private readonly IDynamicQrService _qrService;
    private readonly ICurrentUserService _currentUser;

    public QrController(IMediator mediator, IDynamicQrService qrService, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _qrService = qrService;
        _currentUser = currentUser;
    }

    [HttpPost("scan")]
    [AllowAnonymous]
    public async Task<IActionResult> ScanQr([FromBody] ScanQrCommand command)
    {
        var result = await _mediator.Send(command);
        return HandleResult(result);
    }

    [Authorize]
    [HttpGet("generate-dynamic")]
    public IActionResult GenerateDynamicQr()
    {
        var userId = _currentUser.UserId;
        if (userId == null || userId == Guid.Empty)
            return Unauthorized(Result<object>.Fail("Oturum doğrulanamadı."));

        var token = _qrService.GenerateDynamicQrToken(userId.Value);
        return Ok(Result<object>.Ok(new { qrToken = token, expiresInSeconds = 30 }));
    }

    [AllowAnonymous]
    [HttpPost("verify-dynamic")]
    public IActionResult VerifyDynamicQr([FromBody] VerifyDynamicQrRequest request)
    {
        var validation = _qrService.ValidateDynamicQrToken(request.QrToken);
        if (!validation.IsValid)
            return BadRequest(Result<object>.Fail(validation.ErrorMessage ?? "Geçersiz QR kod."));

        return Ok(Result<object>.Ok(new { userId = validation.UserId, valid = true }));
    }
}

public class VerifyDynamicQrRequest
{
    public string QrToken { get; set; } = string.Empty;
}
