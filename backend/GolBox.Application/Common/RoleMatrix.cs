using GolBox.Application.Authorization;

namespace GolBox.Application.Common;

/// <summary>
/// Server-side authorization matrix. Client menu hiding is not security.
/// Citizen (User): own profile, own points, own orders, checkout, generate-dynamic QR, nearby/capture.
/// Staff: POS scan, order status, cafe/menu/field-drop ops, ledger read, dashboard.
/// Admin: grants, catalog/campaign/staff/settings/audit/reports.
/// </summary>
public static class RoleMatrix
{
    public static bool IsCitizen(string? role) =>
        string.Equals(role, AuthorizationPolicies.RoleUser, StringComparison.OrdinalIgnoreCase) ||
        string.Equals(role, AuthorizationPolicies.RoleCitizen, StringComparison.OrdinalIgnoreCase);

    public static bool IsStaff(string? role) =>
        string.Equals(role, AuthorizationPolicies.RoleStaff, StringComparison.OrdinalIgnoreCase);

    public static bool IsAdmin(string? role) =>
        string.Equals(role, AuthorizationPolicies.RoleAdmin, StringComparison.OrdinalIgnoreCase);

    public static bool IsStaffOrAdmin(string? role) => IsStaff(role) || IsAdmin(role);
}
