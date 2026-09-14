namespace GolBox.Application.Authorization;

/// <summary>
/// Central role and policy names.
/// Database still stores citizen role as "User"; JWT and policies also accept "Citizen".
/// </summary>
public static class AuthorizationPolicies
{
    public const string CitizenOnly = "CitizenOnly";
    public const string StaffOrAdmin = "StaffOrAdmin";
    public const string AdminOnly = "AdminOnly";

    public const string RoleCitizen = "Citizen";
    public const string RoleUser = "User";
    public const string RoleStaff = "Staff";
    public const string RoleAdmin = "Admin";
}
