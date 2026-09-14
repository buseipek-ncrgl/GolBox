using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using GolBox.Persistence.Context;

#nullable disable

namespace GolBox.Persistence.Migrations
{
    /// <summary>
    /// Creates operational tables that existed only via runtime Ensure* SQL helpers.
    /// Must run before AddCityContentAndCitizenNotifications, which alters Notifications.
    /// </summary>
    [DbContext(typeof(AppDbContext))]
    [Migration("20260913110000_AddOperationalTables")]
    public partial class AddOperationalTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ApprovalRequests",
                columns: table => new
                {
                    Id = table.Column<Guid>(nullable: false),
                    CreatedDate = table.Column<DateTime>(nullable: false),
                    CreatedBy = table.Column<Guid>(nullable: true),
                    UpdatedDate = table.Column<DateTime>(nullable: true),
                    UpdatedBy = table.Column<Guid>(nullable: true),
                    DeletedDate = table.Column<DateTime>(nullable: true),
                    DeletedBy = table.Column<Guid>(nullable: true),
                    IsDeleted = table.Column<bool>(nullable: false),
                    RequestType = table.Column<string>(type: "TEXT", nullable: false),
                    RequesterUserId = table.Column<Guid>(nullable: false),
                    RequesterEmail = table.Column<string>(type: "TEXT", nullable: false),
                    BranchId = table.Column<Guid>(nullable: true),
                    TargetEntityId = table.Column<string>(type: "TEXT", nullable: true),
                    OldValue = table.Column<string>(type: "TEXT", nullable: true),
                    NewValue = table.Column<string>(type: "TEXT", nullable: true),
                    Reason = table.Column<string>(type: "TEXT", nullable: false),
                    Status = table.Column<string>(type: "TEXT", nullable: false),
                    ApproverUserId = table.Column<Guid>(nullable: true),
                    ApproverEmail = table.Column<string>(type: "TEXT", nullable: true),
                    ApprovalNote = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ApprovalRequests", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AuditLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(nullable: false),
                    CreatedDate = table.Column<DateTime>(nullable: false),
                    CreatedBy = table.Column<Guid>(nullable: true),
                    UpdatedDate = table.Column<DateTime>(nullable: true),
                    UpdatedBy = table.Column<Guid>(nullable: true),
                    DeletedDate = table.Column<DateTime>(nullable: true),
                    DeletedBy = table.Column<Guid>(nullable: true),
                    IsDeleted = table.Column<bool>(nullable: false),
                    UserId = table.Column<Guid>(nullable: true),
                    UserEmail = table.Column<string>(type: "TEXT", nullable: false),
                    UserRole = table.Column<string>(type: "TEXT", nullable: false),
                    ActionType = table.Column<string>(type: "TEXT", nullable: false),
                    ModuleName = table.Column<string>(type: "TEXT", nullable: false),
                    EntityName = table.Column<string>(type: "TEXT", nullable: false),
                    EntityId = table.Column<string>(type: "TEXT", nullable: true),
                    OldValues = table.Column<string>(type: "TEXT", nullable: true),
                    NewValues = table.Column<string>(type: "TEXT", nullable: true),
                    Reason = table.Column<string>(type: "TEXT", nullable: true),
                    IpAddress = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditLogs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Campaigns",
                columns: table => new
                {
                    Id = table.Column<Guid>(nullable: false),
                    CreatedDate = table.Column<DateTime>(nullable: false),
                    CreatedBy = table.Column<Guid>(nullable: true),
                    UpdatedDate = table.Column<DateTime>(nullable: true),
                    UpdatedBy = table.Column<Guid>(nullable: true),
                    DeletedDate = table.Column<DateTime>(nullable: true),
                    DeletedBy = table.Column<Guid>(nullable: true),
                    IsDeleted = table.Column<bool>(nullable: false),
                    OrganizationId = table.Column<Guid>(nullable: false),
                    Title = table.Column<string>(type: "TEXT", nullable: false),
                    Description = table.Column<string>(type: "TEXT", nullable: false),
                    ImageUrl = table.Column<string>(type: "TEXT", nullable: true),
                    CampaignType = table.Column<string>(type: "TEXT", nullable: false),
                    StartDate = table.Column<DateTime>(nullable: false),
                    EndDate = table.Column<DateTime>(nullable: false),
                    TargetUserGroup = table.Column<string>(type: "TEXT", nullable: false),
                    CafeId = table.Column<Guid>(nullable: true),
                    MenuItemId = table.Column<Guid>(nullable: true),
                    TotalUsageLimit = table.Column<int>(nullable: true),
                    PerUserLimit = table.Column<int>(nullable: true),
                    CurrentUsageCount = table.Column<int>(nullable: false),
                    IsActive = table.Column<bool>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Campaigns", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Notifications",
                columns: table => new
                {
                    Id = table.Column<Guid>(nullable: false),
                    CreatedDate = table.Column<DateTime>(nullable: false),
                    CreatedBy = table.Column<Guid>(nullable: true),
                    UpdatedDate = table.Column<DateTime>(nullable: true),
                    UpdatedBy = table.Column<Guid>(nullable: true),
                    DeletedDate = table.Column<DateTime>(nullable: true),
                    DeletedBy = table.Column<Guid>(nullable: true),
                    IsDeleted = table.Column<bool>(nullable: false),
                    OrganizationId = table.Column<Guid>(nullable: false),
                    Title = table.Column<string>(type: "TEXT", nullable: false),
                    Message = table.Column<string>(type: "TEXT", nullable: false),
                    ImageUrl = table.Column<string>(type: "TEXT", nullable: true),
                    NotificationType = table.Column<string>(type: "TEXT", nullable: false),
                    TargetUserGroup = table.Column<string>(type: "TEXT", nullable: false),
                    TargetUserId = table.Column<Guid>(nullable: true),
                    ScheduledDate = table.Column<DateTime>(nullable: true),
                    SentDate = table.Column<DateTime>(nullable: true),
                    Status = table.Column<string>(type: "TEXT", nullable: false),
                    SentCount = table.Column<int>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notifications", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Coupons",
                columns: table => new
                {
                    Id = table.Column<Guid>(nullable: false),
                    CreatedDate = table.Column<DateTime>(nullable: false),
                    CreatedBy = table.Column<Guid>(nullable: true),
                    UpdatedDate = table.Column<DateTime>(nullable: true),
                    UpdatedBy = table.Column<Guid>(nullable: true),
                    DeletedDate = table.Column<DateTime>(nullable: true),
                    DeletedBy = table.Column<Guid>(nullable: true),
                    IsDeleted = table.Column<bool>(nullable: false),
                    CouponCode = table.Column<string>(type: "TEXT", nullable: false),
                    UserId = table.Column<Guid>(nullable: false),
                    RewardId = table.Column<Guid>(nullable: false),
                    Status = table.Column<string>(type: "TEXT", nullable: false),
                    ExpiryDate = table.Column<DateTime>(nullable: false),
                    UsedCafeId = table.Column<Guid>(nullable: true),
                    UsedDate = table.Column<DateTime>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Coupons", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "StaffUsers",
                columns: table => new
                {
                    Id = table.Column<Guid>(nullable: false),
                    CreatedDate = table.Column<DateTime>(nullable: false),
                    CreatedBy = table.Column<Guid>(nullable: true),
                    UpdatedDate = table.Column<DateTime>(nullable: true),
                    UpdatedBy = table.Column<Guid>(nullable: true),
                    DeletedDate = table.Column<DateTime>(nullable: true),
                    DeletedBy = table.Column<Guid>(nullable: true),
                    IsDeleted = table.Column<bool>(nullable: false),
                    UserId = table.Column<Guid>(nullable: false),
                    RegistrationNumber = table.Column<string>(type: "TEXT", nullable: false),
                    Role = table.Column<string>(type: "TEXT", nullable: false),
                    BranchId = table.Column<Guid>(nullable: true),
                    IsActive = table.Column<bool>(nullable: false),
                    LastLoginDate = table.Column<DateTime>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StaffUsers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "FieldDrops",
                columns: table => new
                {
                    Id = table.Column<Guid>(nullable: false),
                    CreatedDate = table.Column<DateTime>(nullable: false),
                    CreatedBy = table.Column<Guid>(nullable: true),
                    UpdatedDate = table.Column<DateTime>(nullable: true),
                    UpdatedBy = table.Column<Guid>(nullable: true),
                    DeletedDate = table.Column<DateTime>(nullable: true),
                    DeletedBy = table.Column<Guid>(nullable: true),
                    IsDeleted = table.Column<bool>(nullable: false),
                    OrganizationId = table.Column<Guid>(nullable: false),
                    CafeId = table.Column<Guid>(nullable: true),
                    CatalogRewardId = table.Column<Guid>(nullable: true),
                    Title = table.Column<string>(maxLength: 256, nullable: false),
                    Description = table.Column<string>(maxLength: 1000, nullable: false),
                    Latitude = table.Column<decimal>(type: "decimal(18,10)", nullable: false),
                    Longitude = table.Column<decimal>(type: "decimal(18,10)", nullable: false),
                    RadiusMeters = table.Column<int>(nullable: false),
                    PointsGranted = table.Column<int>(nullable: false),
                    TotalStock = table.Column<int>(nullable: true),
                    CapturedCount = table.Column<int>(nullable: false),
                    PerUserLimit = table.Column<int>(nullable: false),
                    StartsAt = table.Column<DateTime>(nullable: false),
                    EndsAt = table.Column<DateTime>(nullable: false),
                    ImageUrl = table.Column<string>(maxLength: 1000, nullable: true),
                    ModelGlbUrl = table.Column<string>(maxLength: 1000, nullable: true),
                    IsActive = table.Column<bool>(nullable: false),
                    RowVersion = table.Column<int>(nullable: false, defaultValue: 0)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FieldDrops", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FieldDrops_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "UserFieldCaptures",
                columns: table => new
                {
                    Id = table.Column<Guid>(nullable: false),
                    CreatedDate = table.Column<DateTime>(nullable: false),
                    CreatedBy = table.Column<Guid>(nullable: true),
                    UpdatedDate = table.Column<DateTime>(nullable: true),
                    UpdatedBy = table.Column<Guid>(nullable: true),
                    DeletedDate = table.Column<DateTime>(nullable: true),
                    DeletedBy = table.Column<Guid>(nullable: true),
                    IsDeleted = table.Column<bool>(nullable: false),
                    OrganizationId = table.Column<Guid>(nullable: false),
                    FieldDropId = table.Column<Guid>(nullable: false),
                    UserId = table.Column<Guid>(nullable: false),
                    CapturedLatitude = table.Column<decimal>(type: "decimal(18,10)", nullable: false),
                    CapturedLongitude = table.Column<decimal>(type: "decimal(18,10)", nullable: false),
                    AccuracyMeters = table.Column<double>(nullable: true),
                    PointsGranted = table.Column<int>(nullable: false),
                    DistanceMeters = table.Column<double>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserFieldCaptures", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserFieldCaptures_FieldDrops_FieldDropId",
                        column: x => x.FieldDropId,
                        principalTable: "FieldDrops",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_UserFieldCaptures_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_FieldDrops_OrganizationId_IsActive",
                table: "FieldDrops",
                columns: new[] { "OrganizationId", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_FieldDrops_IsDeleted",
                table: "FieldDrops",
                column: "IsDeleted",
                filter: "IsDeleted = 0");

            migrationBuilder.CreateIndex(
                name: "IX_UserFieldCaptures_FieldDropId_UserId",
                table: "UserFieldCaptures",
                columns: new[] { "FieldDropId", "UserId" });

            migrationBuilder.CreateIndex(
                name: "IX_UserFieldCaptures_IsDeleted",
                table: "UserFieldCaptures",
                column: "IsDeleted",
                filter: "IsDeleted = 0");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "UserFieldCaptures");
            migrationBuilder.DropTable(name: "FieldDrops");
            migrationBuilder.DropTable(name: "StaffUsers");
            migrationBuilder.DropTable(name: "Coupons");
            migrationBuilder.DropTable(name: "Notifications");
            migrationBuilder.DropTable(name: "Campaigns");
            migrationBuilder.DropTable(name: "AuditLogs");
            migrationBuilder.DropTable(name: "ApprovalRequests");
        }
    }
}
