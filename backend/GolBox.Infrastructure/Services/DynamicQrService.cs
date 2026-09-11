using System;
using System.Security.Cryptography;
using System.Text;

namespace GolBox.Infrastructure.Services;

public interface IDynamicQrService
{
    string GenerateDynamicQrToken(Guid userId);
    (bool IsValid, Guid? UserId, string? ErrorMessage) ValidateDynamicQrToken(string qrToken);
}

public class DynamicQrService : IDynamicQrService
{
    private const string SecretKey = "GolBox_SuperSecret_DynamicQR_HMACKey_2026";
    private const int TimeStepSeconds = 30;

    public string GenerateDynamicQrToken(Guid userId)
    {
        var epoch = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        var timeStep = epoch / TimeStepSeconds;
        var rawPayload = $"{userId}:{timeStep}";

        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(SecretKey));
        var hash = Convert.ToBase64String(hmac.ComputeHash(Encoding.UTF8.GetBytes(rawPayload)))
            .Replace("+", "-")
            .Replace("/", "_")
            .TrimEnd('=');

        return $"GBQR:{userId}:{timeStep}:{hash}";
    }

    public (bool IsValid, Guid? UserId, string? ErrorMessage) ValidateDynamicQrToken(string qrToken)
    {
        if (string.IsNullOrWhiteSpace(qrToken) || !qrToken.StartsWith("GBQR:"))
        {
            // Fallback for simple legacy QR tokens during transition
            if (Guid.TryParse(qrToken, out var legacyGuid))
            {
                return (true, legacyGuid, null);
            }
            return (false, null, "Geçersiz QR kod formatı.");
        }

        var parts = qrToken.Split(':');
        if (parts.Length != 4)
        {
            return (false, null, "Geçersiz QR kod yapısı.");
        }

        if (!Guid.TryParse(parts[1], out var userId))
        {
            return (false, null, "Geçersiz kullanıcı kimliği.");
        }

        if (!long.TryParse(parts[2], out var tokenTimeStep))
        {
            return (false, null, "Geçersiz zaman damgası.");
        }

        var currentEpoch = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        var currentTimeStep = currentEpoch / TimeStepSeconds;

        // Allow current time step and 1 previous time step (max 60 seconds tolerance)
        if (Math.Abs(currentTimeStep - tokenTimeStep) > 1)
        {
            return (false, null, "QR kodun süresi dolmuş (30 saniye geçerlidir). Lütfen yeni QR kod oluşturun.");
        }

        var expectedPayload = $"{userId}:{tokenTimeStep}";
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(SecretKey));
        var expectedHash = Convert.ToBase64String(hmac.ComputeHash(Encoding.UTF8.GetBytes(expectedPayload)))
            .Replace("+", "-")
            .Replace("/", "_")
            .TrimEnd('=');

        if (parts[3] != expectedHash)
        {
            return (false, null, "QR kod imzası geçersiz veya sahte.");
        }

        return (true, userId, null);
    }
}
