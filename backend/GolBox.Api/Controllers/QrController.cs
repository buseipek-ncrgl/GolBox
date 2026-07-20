using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GolBox.Application.Features.Qr.Commands;

namespace GolBox.Api.Controllers;

// In a real-world scenario, POS endpoints might use specific API keys or client certificates,
// but for development, we will support authenticated calls or regular calls since the QR Token
// itself verifies the user. Let's keep it under [Authorize] or allow anonymous POS scanner.
// AllowAnonymous since POS scanner is a server-to-server or standalone integration.
[AllowAnonymous]
public class QrController : BaseApiController
{
    private readonly IMediator _mediator;

    public QrController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost("scan")]
    public async Task<IActionResult> ScanQr([FromBody] ScanQrCommand command)
    {
        var result = await _mediator.Send(command);
        return HandleResult(result);
    }
}
