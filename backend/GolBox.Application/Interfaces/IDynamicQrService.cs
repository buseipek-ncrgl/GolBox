using System;

namespace GolBox.Application.Interfaces;

public sealed class DynamicQrValidationResult
{
    public bool IsValid { get; init; }
    public Guid? UserId { get; init; }
    public long? TimeStep { get; init; }
    public string? ErrorMessage { get; init; }

    public static DynamicQrValidationResult Ok(Guid userId, long timeStep) =>
        new() { IsValid = true, UserId = userId, TimeStep = timeStep };

    public static DynamicQrValidationResult Fail(string message) =>
        new() { IsValid = false, ErrorMessage = message };
}

public interface IDynamicQrService
{
    string GenerateDynamicQrToken(Guid userId);
    DynamicQrValidationResult ValidateDynamicQrToken(string qrToken);
}
