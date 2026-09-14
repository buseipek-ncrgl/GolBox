using System;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using GolBox.Application.Interfaces;

namespace GolBox.Infrastructure.Services;

public class DynamicQrService : IDynamicQrService
{
    public const int TimeStepSeconds = 30;
    private const int AllowedStepSkew = 1;

    private readonly byte[] _keyBytes;

    public DynamicQrService(IConfiguration configuration)
    {
        var secretKey = configuration["Security:DynamicQr:HmacKey"];
        if (string.IsNullOrWhiteSpace(secretKey) || secretKey.Length < 32)
        {
            throw new InvalidOperationException(
                "Security:DynamicQr:HmacKey is not configured or is shorter than 32 characters.");
        }

        _keyBytes = Encoding.UTF8.GetBytes(secretKey);
    }

    public string GenerateDynamicQrToken(Guid userId)
    {
        var timeStep = CurrentTimeStep();
        var hash = ComputeHash(userId, timeStep);
        return $"GBQR:{userId:D}:{timeStep}:{hash}";
    }

    public DynamicQrValidationResult ValidateDynamicQrToken(string qrToken)
    {
        if (string.IsNullOrWhiteSpace(qrToken) || !qrToken.StartsWith("GBQR:", StringComparison.OrdinalIgnoreCase))
            return DynamicQrValidationResult.Fail("Geçersiz QR kod formatı.");

        var parts = qrToken.Split(':');
        if (parts.Length != 4)
            return DynamicQrValidationResult.Fail("Geçersiz QR kod yapısı.");

        if (!Guid.TryParse(parts[1], out var userId) || userId == Guid.Empty)
            return DynamicQrValidationResult.Fail("Geçersiz kullanıcı kimliği.");

        if (!long.TryParse(parts[2], out var tokenTimeStep))
            return DynamicQrValidationResult.Fail("Geçersiz zaman damgası.");

        var currentTimeStep = CurrentTimeStep();
        if (Math.Abs(currentTimeStep - tokenTimeStep) > AllowedStepSkew)
        {
            return DynamicQrValidationResult.Fail(
                "QR kodun süresi dolmuş (30 saniye geçerlidir). Lütfen yeni QR kod oluşturun.");
        }

        var expectedHash = ComputeHash(userId, tokenTimeStep);
        var providedHash = parts[3];
        if (expectedHash.Length != providedHash.Length)
            return DynamicQrValidationResult.Fail("QR kod imzası geçersiz veya sahte.");

        var expectedBytes = Encoding.UTF8.GetBytes(expectedHash);
        var providedBytes = Encoding.UTF8.GetBytes(providedHash);
        if (!CryptographicOperations.FixedTimeEquals(expectedBytes, providedBytes))
            return DynamicQrValidationResult.Fail("QR kod imzası geçersiz veya sahte.");

        return DynamicQrValidationResult.Ok(userId, tokenTimeStep);
    }

    private static long CurrentTimeStep() =>
        DateTimeOffset.UtcNow.ToUnixTimeSeconds() / TimeStepSeconds;

    private string ComputeHash(Guid userId, long timeStep)
    {
        var rawPayload = $"{userId:D}:{timeStep}";
        using var hmac = new HMACSHA256(_keyBytes);
        return Convert.ToBase64String(hmac.ComputeHash(Encoding.UTF8.GetBytes(rawPayload)))
            .Replace("+", "-")
            .Replace("/", "_")
            .TrimEnd('=');
    }
}
