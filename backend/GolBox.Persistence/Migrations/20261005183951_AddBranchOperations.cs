using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GolBox.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddBranchOperations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "PaymentStatus",
                table: "Orders",
                type: "TEXT",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "TEXT");

            migrationBuilder.AlterColumn<string>(
                name: "PaymentMethod",
                table: "Orders",
                type: "TEXT",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "TEXT");

            migrationBuilder.AlterColumn<string>(
                name: "ProductName",
                table: "OrderItems",
                type: "TEXT",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "TEXT");

            migrationBuilder.AddColumn<string>(
                name: "City",
                table: "Cafes",
                type: "TEXT",
                maxLength: 120,
                nullable: false,
                defaultValue: "Gaziantep");

            migrationBuilder.AddColumn<string>(
                name: "Code",
                table: "Cafes",
                type: "TEXT",
                maxLength: 40,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "Cafes",
                type: "TEXT",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "District",
                table: "Cafes",
                type: "TEXT",
                maxLength: 120,
                nullable: false,
                defaultValue: "Şehitkamil");

            migrationBuilder.AddColumn<string>(
                name: "PhoneNumber",
                table: "Cafes",
                type: "TEXT",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PickupPauseReason",
                table: "Cafes",
                type: "TEXT",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PickupPausedAt",
                table: "Cafes",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PickupPausedBy",
                table: "Cafes",
                type: "TEXT",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PickupStatus",
                table: "Cafes",
                type: "TEXT",
                maxLength: 20,
                nullable: false,
                defaultValue: "AVAILABLE");

            migrationBuilder.CreateTable(
                name: "BranchSpecialHours",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    CafeId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Date = table.Column<DateTime>(type: "TEXT", nullable: false),
                    IsClosed = table.Column<bool>(type: "INTEGER", nullable: false),
                    OpenTime = table.Column<string>(type: "TEXT", maxLength: 5, nullable: true),
                    CloseTime = table.Column<string>(type: "TEXT", maxLength: 5, nullable: true),
                    Reason = table.Column<string>(type: "TEXT", maxLength: 250, nullable: true),
                    CreatedDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "TEXT", nullable: true),
                    UpdatedDate = table.Column<DateTime>(type: "TEXT", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "TEXT", nullable: true),
                    DeletedDate = table.Column<DateTime>(type: "TEXT", nullable: true),
                    DeletedBy = table.Column<Guid>(type: "TEXT", nullable: true),
                    IsDeleted = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BranchSpecialHours", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BranchSpecialHours_Cafes_CafeId",
                        column: x => x.CafeId,
                        principalTable: "Cafes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            // Existing rows predate branch codes. Assign a deterministic unique code
            // before creating the unique index so upgrades remain safe.
            migrationBuilder.Sql(
                "UPDATE Cafes SET Code = 'BR-' || replace(Id, '-', '') WHERE Code IS NULL OR Code = '';"
            );

            // Preserve existing branch menus while keeping newly created branches
            // opt-in: only legacy menu rows are initialized as available here.
            migrationBuilder.Sql(
                "INSERT OR IGNORE INTO BranchProducts (Id, CafeId, MenuItemId, IsAvailable, CreatedDate, IsDeleted) " +
                "SELECT lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1,1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))), " +
                "CafeId, Id, IsActive, CURRENT_TIMESTAMP, 0 FROM MenuItems WHERE IsDeleted = 0;");

            migrationBuilder.CreateIndex(
                name: "IX_Cafes_Code",
                table: "Cafes",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_BranchProducts_CafeId_MenuItemId",
                table: "BranchProducts",
                columns: new[] { "CafeId", "MenuItemId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_BranchSpecialHours_CafeId_Date",
                table: "BranchSpecialHours",
                columns: new[] { "CafeId", "Date" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BranchSpecialHours");

            migrationBuilder.DropIndex(
                name: "IX_Cafes_Code",
                table: "Cafes");

            migrationBuilder.DropIndex(
                name: "IX_BranchProducts_CafeId_MenuItemId",
                table: "BranchProducts");

            migrationBuilder.DropColumn(
                name: "City",
                table: "Cafes");

            migrationBuilder.DropColumn(
                name: "Code",
                table: "Cafes");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "Cafes");

            migrationBuilder.DropColumn(
                name: "District",
                table: "Cafes");

            migrationBuilder.DropColumn(
                name: "PhoneNumber",
                table: "Cafes");

            migrationBuilder.DropColumn(
                name: "PickupPauseReason",
                table: "Cafes");

            migrationBuilder.DropColumn(
                name: "PickupPausedAt",
                table: "Cafes");

            migrationBuilder.DropColumn(
                name: "PickupPausedBy",
                table: "Cafes");

            migrationBuilder.DropColumn(
                name: "PickupStatus",
                table: "Cafes");

            migrationBuilder.AlterColumn<string>(
                name: "PaymentStatus",
                table: "Orders",
                type: "TEXT",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "TEXT",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "PaymentMethod",
                table: "Orders",
                type: "TEXT",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "TEXT",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "ProductName",
                table: "OrderItems",
                type: "TEXT",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "TEXT",
                oldNullable: true);

        }
    }
}
