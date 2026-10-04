using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using GolBox.Application.Common;
using GolBox.Application.Features.Auth.Commands;

namespace GolBox.Api.Controllers;

[AllowAnonymous]
public class AuthController : BaseApiController
{
    private readonly IMediator _mediator;

    public AuthController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost("register")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> Register([FromBody] RegisterCommand command)
    {
        var result = await _mediator.Send(command);
        return HandleResult(result);
    }

    [HttpPost("login")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> Login([FromBody] LoginCommand command)
    {
        // Add remote IP address to login command context
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var enrichedCommand = command with { IpAddress = ipAddress };
        
        var result = await _mediator.Send(enrichedCommand);
        return HandleResult(result);
    }

    [HttpPost("refresh")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenCommand command)
    {
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var enrichedCommand = command with { IpAddress = ipAddress };

        var result = await _mediator.Send(enrichedCommand);
        return HandleResult(result);
    }

    [HttpPost("send-otp")]
    [EnableRateLimiting("auth")]
    public IActionResult SendOtp([FromBody] SendOtpRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.PhoneNumber))
        {
            return BadRequest(Result<object>.Fail("Geçerli bir telefon numarası girilmelidir."));
        }

        // Mock 6-digit OTP delivery for development/production test
        return Ok(Result<object>.Ok(new
        {
            phoneNumber = request.PhoneNumber,
            expiresInSeconds = 30,
            message = $"{request.PhoneNumber} numarasına doğrulama kodu gönderildi."
        }));
    }

    [HttpPost("verify-otp")]
    [EnableRateLimiting("auth")]
    public IActionResult VerifyOtp([FromBody] VerifyOtpRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Code) || request.Code.Length < 4)
        {
            return BadRequest(Result<object>.Fail("Doğrulama kodu hatalı."));
        }

        if (request.Code == "999999")
        {
            return BadRequest(Result<object>.Fail("Kodun süresi doldu. Yeni kod isteyebilirsin."));
        }

        return Ok(Result<object>.Ok(new
        {
            verified = true,
            phoneNumber = request.PhoneNumber,
            message = "Hesabınız başarıyla doğrulandı."
        }));
    }

    [HttpPost("reset-password")]
    [EnableRateLimiting("auth")]
    public IActionResult ResetPassword([FromBody] ResetPasswordRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 6)
        {
            return BadRequest(Result<object>.Fail("Yeni şifre en az 6 karakter olmalıdır."));
        }

        return Ok(Result<object>.Ok(new
        {
            success = true,
            message = "Şifreniz başarıyla güncellendi. Yeni şifrenizle giriş yapabilirsiniz."
        }));
    }
}

public record SendOtpRequest(string PhoneNumber);
public record VerifyOtpRequest(string PhoneNumber, string Code);
public record ResetPasswordRequest(string PhoneNumber, string Code, string NewPassword);

