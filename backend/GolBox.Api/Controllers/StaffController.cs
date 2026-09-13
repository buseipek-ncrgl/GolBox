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
        var staffList = await _context.StaffUsers
            .Include(s => s.User)
            .Include(s => s.Branch)
            .OrderByDescending(s => s.CreatedDate)
            .Select(s => new
            {
                s.Id,
                s.UserId,
                UserFullName = $"{s.User.FirstName} {s.User.LastName}",
                UserEmail = s.User.Email,
                s.RegistrationNumber,
                s.Role,
                s.BranchId,
                BranchName = s.Branch != null ? s.Branch.Name : "Tüm Şubeler (Genel)",
                s.IsActive,
                s.LastLoginDate
            })
            .ToListAsync();

        return Ok(Result<object>.Ok(staffList));
    }

    [HttpPost]
    public async Task<IActionResult> AddStaff([FromBody] AddStaffRequest request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (user == null) return NotFound(Result<object>.Fail("Kullanıcı bulunamadı. Lütfen önce vatandaşı sisteme kaydedin."));

        var staff = new StaffUser
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            RegistrationNumber = request.RegistrationNumber,
            Role = request.Role,
            BranchId = request.BranchId,
            IsActive = true,
            CreatedDate = DateTime.UtcNow
        };

        user.Role = string.Equals(request.Role, "Admin", StringComparison.OrdinalIgnoreCase)
            ? "Admin"
            : "Staff";

        _context.StaffUsers.Add(staff);
        await _context.SaveChangesAsync();

        var currentUser = await _context.Users.FindAsync(_currentUserService.UserId);
        await AuditLogsController.LogAsync(
            _context,
            currentUser?.Email ?? "admin@golbox.gov.tr",
            currentUser?.Role ?? "Admin",
            "Staff_Assigned",
            "Staff",
            "StaffUser",
            staff.Id.ToString(),
            null,
            $"{request.Role} ({request.RegistrationNumber})",
            $"Yeni personel yetkilendirmesi yapıldı: {user.Email}"
        );

        return Ok(Result<object>.Ok(staff.Id, "Personel yetkisi başarıyla tanımlandı."));
    }

    public class AddStaffRequest
    {
        public string Email { get; set; } = string.Empty;
        public string RegistrationNumber { get; set; } = string.Empty;
        public string Role { get; set; } = "Cashier";
        public Guid? BranchId { get; set; }
    }
}
