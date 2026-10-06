using System;
using System.Linq;
using System.Threading.Tasks;
using GolBox.Application.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GolBox.Application.Common;
using GolBox.Application.Interfaces;
using GolBox.Domain.Entities;

namespace GolBox.Api.Controllers;

[Authorize(Policy = AuthorizationPolicies.AdminOnly)]
public class StaffController : BaseApiController
{
    private static readonly string[] AllowedDuties = { "BranchManager", "BranchStaff", "Cashier", "OrderPreparer", "EventCoordinator", "ReportingUser" };
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public StaffController(IAppDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    [HttpGet]
    public async Task<IActionResult> GetStaff()
    {
        var staffRows = await _context.StaffUsers
            .Include(s => s.User)
            .Include(s => s.Branch)
            .ToListAsync();

        var staffByUser = staffRows.ToDictionary(s => s.UserId, s => s);
        var personnel = await _context.Users
            .Where(u => u.Role == "Admin" || u.Role == "Staff")
            .OrderBy(u => u.LastName)
            .ThenBy(u => u.FirstName)
            .ToListAsync();

        var list = personnel.Select(u =>
        {
            staffByUser.TryGetValue(u.Id, out var staff);
            return new
            {
                id = staff?.Id ?? u.Id,
                userId = u.Id,
                userFullName = $"{u.FirstName} {u.LastName}".Trim(),
                userEmail = u.Email,
                registrationNumber = staff?.RegistrationNumber ?? "",
                role = u.Role,
                duty = staff?.Role,
                branchId = staff?.BranchId,
                branchName = staff?.Branch != null ? staff.Branch.Name : null,
                isActive = staff?.IsActive ?? true,
                lastLoginDate = staff?.LastLoginDate
            };
        }).ToList();

        return Ok(Result<object>.Ok(list));
    }

    [HttpPost]
    public async Task<IActionResult> AddStaff([FromBody] AddStaffRequest request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (user == null) return NotFound(Result<object>.Fail("Kullanıcı bulunamadı. Lütfen önce vatandaşı sisteme kaydedin."));

        var appRole = CanonicalAppRole(request.Role);
        var duty = CanonicalDuty(request.Duty ?? request.Role, appRole);
        if (appRole == "Staff" && (!request.BranchId.HasValue || request.BranchId == Guid.Empty))
            return BadRequest(Result<object>.Fail("Şube personeli için şube seçimi zorunludur."));
        if (request.BranchId.HasValue && request.BranchId != Guid.Empty && !await _context.Cafes.AnyAsync(c => c.Id == request.BranchId.Value && c.IsActive))
            return BadRequest(Result<object>.Fail("Seçilen şube bulunamadı veya aktif değil."));
        var existing = await _context.StaffUsers.FirstOrDefaultAsync(s => s.UserId == user.Id);
        if (existing != null)
        {
            existing.IsActive = true;
            existing.Role = duty;
            existing.RegistrationNumber = string.IsNullOrWhiteSpace(request.RegistrationNumber)
                ? existing.RegistrationNumber
                : request.RegistrationNumber;
            existing.BranchId = request.BranchId ?? existing.BranchId;
            existing.UpdatedDate = DateTime.UtcNow;
        }
        else
        {
            _context.StaffUsers.Add(new StaffUser
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                RegistrationNumber = request.RegistrationNumber,
                Role = duty,
                BranchId = request.BranchId,
                IsActive = true,
                CreatedDate = DateTime.UtcNow
            });
        }

        user.Role = appRole;
        await _context.SaveChangesAsync();

        var currentUser = await _context.Users.FindAsync(_currentUserService.UserId);
        await AuditLogsController.LogAsync(
            _context,
            currentUser?.Email ?? "admin@golbox.gov.tr",
            currentUser?.Role ?? "Admin",
            "Staff_Assigned",
            "Staff",
            "User",
            user.Id.ToString(),
            null,
            appRole,
            $"Yeni personel yetkilendirmesi yapıldı: {user.Email}"
        );

        return Ok(Result<object>.Ok(user.Id, "Personel yetkisi başarıyla tanımlandı."));
    }

    [HttpPut("{userId:guid}/assignment")]
    public async Task<IActionResult> UpdateAssignment(Guid userId, [FromBody] UpdateStaffAssignmentRequest request)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null || user.Role is not ("Admin" or "Staff"))
            return NotFound(Result<object>.Fail("Personel bulunamadı."));

        var staff = await EnsureStaffRowAsync(user);
        var duty = CanonicalDuty(request.Duty, user.Role);
        if (user.Role == "Staff" && (!request.BranchId.HasValue || request.BranchId == Guid.Empty))
            return BadRequest(Result<object>.Fail("Şube personeli için şube seçimi zorunludur."));
        if (request.BranchId.HasValue && request.BranchId != Guid.Empty && !await _context.Cafes.AnyAsync(c => c.Id == request.BranchId.Value && c.IsActive))
            return BadRequest(Result<object>.Fail("Seçilen şube bulunamadı veya aktif değil."));

        var previous = $"{staff.Role}/{staff.BranchId}";
        staff.Role = duty;
        staff.BranchId = user.Role == "Admin" ? request.BranchId : request.BranchId!.Value;
        staff.RegistrationNumber = request.RegistrationNumber?.Trim() ?? staff.RegistrationNumber;
        staff.UpdatedDate = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        await AuditLogsController.LogAsync(_context, _currentUserService.Email ?? "admin", "Admin", "Staff_Assignment", "Staff", "User", userId.ToString(), previous, $"{staff.Role}/{staff.BranchId}", "Personel görevi ve şube kapsamı güncellendi.");
        return Ok(Result<object>.Ok(new { userId, duty = staff.Role, branchId = staff.BranchId }, "Personel ataması güncellendi."));
    }

    [HttpPost("{userId:guid}/role")]
    public async Task<IActionResult> ChangeRole(Guid userId, [FromBody] ChangeStaffRoleRequest request)
    {
        var newRole = CanonicalAppRole(request.Role);
        if (newRole is not ("Admin" or "Staff"))
            return BadRequest(Result<object>.Fail("Rol yalnız Admin veya Staff olabilir."));

        var user = await _context.Users.FindAsync(userId);
        if (user == null)
            return NotFound(Result<object>.Fail("Personel bulunamadı."));

        if (_currentUserService.UserId == userId && newRole != "Admin" && user.Role == "Admin")
            return BadRequest(Result<object>.Fail("Kendi Admin rolünüzü düşüremezsiniz."));

        if (user.Role == "Admin" && newRole != "Admin")
        {
            var remaining = await CountActiveAdminsAsync(exceptUserId: userId);
            if (remaining < 1)
                return BadRequest(Result<object>.Fail("Son aktif yönetici Staff rolüne düşürülemez."));
        }

        var previous = user.Role;
        user.Role = newRole;
        var staff = await EnsureStaffRowAsync(user);
        staff.IsActive = true;
        staff.UpdatedDate = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        var currentUser = await _context.Users.FindAsync(_currentUserService.UserId);
        await AuditLogsController.LogAsync(
            _context,
            currentUser?.Email ?? "admin@golbox.gov.tr",
            currentUser?.Role ?? "Admin",
            "Staff_RoleChange",
            "Staff",
            "User",
            user.Id.ToString(),
            previous,
            newRole,
            $"{user.Email} rolü {previous} → {newRole}");

        return Ok(Result<object>.Ok(new { userId = user.Id, role = user.Role }, "Personel rolü güncellendi."));
    }

    [HttpPost("{userId:guid}/active")]
    public async Task<IActionResult> SetActive(Guid userId, [FromBody] SetStaffActiveRequest request)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
            return NotFound(Result<object>.Fail("Personel bulunamadı."));

        if (_currentUserService.UserId == userId && !request.IsActive)
            return BadRequest(Result<object>.Fail("Kendi hesabınızı pasife alamazsınız."));

        if (!request.IsActive && user.Role == "Admin")
        {
            var remaining = await CountActiveAdminsAsync(exceptUserId: userId);
            if (remaining < 1)
                return BadRequest(Result<object>.Fail("Son aktif yönetici pasife alınamaz."));
        }

        var staff = await EnsureStaffRowAsync(user);
        var previous = staff.IsActive;
        staff.IsActive = request.IsActive;
        staff.UpdatedDate = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        var currentUser = await _context.Users.FindAsync(_currentUserService.UserId);
        await AuditLogsController.LogAsync(
            _context,
            currentUser?.Email ?? "admin@golbox.gov.tr",
            currentUser?.Role ?? "Admin",
            request.IsActive ? "Staff_Activate" : "Staff_Deactivate",
            "Staff",
            "User",
            user.Id.ToString(),
            previous.ToString(),
            request.IsActive.ToString(),
            $"{user.Email} {(request.IsActive ? "aktif edildi" : "pasife alındı")}");

        return Ok(Result<object>.Ok(new { userId = user.Id, isActive = staff.IsActive },
            request.IsActive ? "Personel aktif edildi." : "Personel pasife alındı."));
    }

    private async Task<int> CountActiveAdminsAsync(Guid exceptUserId)
    {
        var admins = await _context.Users.Where(u => u.Role == "Admin" && u.Id != exceptUserId).Select(u => u.Id).ToListAsync();
        if (admins.Count == 0) return 0;
        var inactive = await _context.StaffUsers
            .Where(s => admins.Contains(s.UserId) && !s.IsActive)
            .Select(s => s.UserId)
            .ToListAsync();
        return admins.Count(id => !inactive.Contains(id));
    }

    private async Task<StaffUser> EnsureStaffRowAsync(User user)
    {
        var staff = await _context.StaffUsers.FirstOrDefaultAsync(s => s.UserId == user.Id);
        if (staff != null) return staff;
        staff = new StaffUser
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            RegistrationNumber = "",
            Role = user.Role,
            IsActive = true,
            CreatedDate = DateTime.UtcNow
        };
        _context.StaffUsers.Add(staff);
        return staff;
    }

    private static string CanonicalAppRole(string? role)
    {
        if (string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(role, "SuperAdmin", StringComparison.OrdinalIgnoreCase))
            return "Admin";
        return "Staff";
    }

    private static string CanonicalDuty(string? duty, string appRole)
    {
        if (appRole == "Admin") return "MunicipalManager";
        var value = string.IsNullOrWhiteSpace(duty) || duty == "Staff" ? "BranchStaff" : duty.Trim();
        return AllowedDuties.Contains(value, StringComparer.OrdinalIgnoreCase)
            ? AllowedDuties.First(x => string.Equals(x, value, StringComparison.OrdinalIgnoreCase))
            : "BranchStaff";
    }

    public class AddStaffRequest
    {
        public string Email { get; set; } = string.Empty;
        public string RegistrationNumber { get; set; } = string.Empty;
        public string Role { get; set; } = "Staff";
        public Guid? BranchId { get; set; }
        public string? Duty { get; set; }
    }

    public class UpdateStaffAssignmentRequest
    {
        public string Duty { get; set; } = "BranchStaff";
        public Guid? BranchId { get; set; }
        public string? RegistrationNumber { get; set; }
    }

    public class ChangeStaffRoleRequest
    {
        public string Role { get; set; } = "Staff";
    }

    public class SetStaffActiveRequest
    {
        public bool IsActive { get; set; }
    }
}
