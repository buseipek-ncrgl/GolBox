using System;
using GolBox.Application.Interfaces;

namespace GolBox.Application.Security;

public sealed class QrIdentity
{
    public bool IsValid { get; init; }
    public Guid? UserId { get; init; }
    public long? TimeStep { get; init; }
    public string Kind { get; init; } = "unknown";
    public string? ErrorMessage { get; init; }
    public string Fingerprint { get; init; } = string.Empty;

    public static QrIdentity Fail(string message) =>
        new() { IsValid = false, ErrorMessage = message, Kind = "invalid" };

    public static QrIdentity Hmac(Guid userId, long timeStep) =>
        new()
        {
            IsValid = true,
            UserId = userId,
            TimeStep = timeStep,
            Kind = "hmac",
            Fingerprint = $"hmac:{userId:D}:{timeStep}"
        };

    public static QrIdentity LegacyGuid(Guid userId) =>
        new()
        {
            IsValid = true,
            UserId = userId,
            Kind = "legacy-guid",
            Fingerprint = $"legacy:{userId:D}"
        };
}

/// <summary>
/// Resolves cashier-scanned tokens. Production path is HMAC only: GBQR:{userId}:{timeStep}:{hmac}.
/// Raw GUID acceptance is disabled unless an explicit development flag is set.
/// </summary>
public static class QrTokenParser
{
    public static QrIdentity Resolve(string? qrToken, IDynamicQrService hmacService, bool allowLegacyGuid = false)
    {
        if (string.IsNullOrWhiteSpace(qrToken))
            return QrIdentity.Fail("QR kod boş.");

        var token = qrToken.Trim();
        if (token.StartsWith("GBQR:", StringComparison.OrdinalIgnoreCase))
        {
            var validation = hmacService.ValidateDynamicQrToken(token);
            if (!validation.IsValid || validation.UserId is null || validation.TimeStep is null)
                return QrIdentity.Fail(validation.ErrorMessage ?? "Geçersiz QR kod.");

            return QrIdentity.Hmac(validation.UserId.Value, validation.TimeStep.Value);
        }

        if (allowLegacyGuid)
            return TryLegacyUserGuid(token);

        if (Guid.TryParse(token, out _))
            return QrIdentity.Fail("Ham GUID QR kodları kabul edilmez. GBQR HMAC formatı kullanın.");

        return QrIdentity.Fail("Geçersiz QR kod formatı.");
    }

    /// <summary>
    /// Development-only helper. Do not call from production scan paths.
    /// </summary>
    public static QrIdentity TryLegacyUserGuid(string token)
    {
        if (Guid.TryParse(token.Trim(), out var userId) && userId != Guid.Empty)
            return QrIdentity.LegacyGuid(userId);

        return QrIdentity.Fail("Geçersiz QR kod formatı.");
    }
}
