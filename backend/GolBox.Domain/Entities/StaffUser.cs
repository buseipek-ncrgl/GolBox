using System;
using GolBox.Domain.Common;

namespace GolBox.Domain.Entities;

public class StaffUser : BaseEntity
{
    public Guid UserId { get; set; }
    public string RegistrationNumber { get; set; } = string.Empty; // Sicil no
    public string Role { get; set; } = "Cashier"; // SuperAdmin, MunicipalManager, BranchManager, Cashier, OrderPreparer, EventCoordinator, ReportingUser
    public Guid? BranchId { get; set; } // Optional branch scope limit
    public bool IsActive { get; set; } = true;
    public DateTime? LastLoginDate { get; set; }

    // Navigations
    public virtual User User { get; set; } = null!;
    public virtual Cafe? Branch { get; set; }
}
