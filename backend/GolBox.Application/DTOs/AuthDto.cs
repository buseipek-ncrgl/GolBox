namespace GolBox.Application.DTOs;

public record AuthDto(
    string AccessToken,
    int ExpiresIn,
    string RefreshToken,
    UserDto User
);

public record UserDto(
    System.Guid Id,
    string FirstName,
    string LastName,
    string Email,
    int PointsBalance,
    System.Collections.Generic.List<string> Roles,
    System.Guid? BranchId = null,
    string? Duty = null
);
