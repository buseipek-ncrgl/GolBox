using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GolBox.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddEventCheckInLifecycle : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(name: "CheckInNotes", table: "UserActivities", type: "TEXT", nullable: true);
            migrationBuilder.AddColumn<DateTime>(name: "CheckedInAt", table: "UserActivities", type: "TEXT", nullable: true);
            migrationBuilder.AddColumn<Guid>(name: "CheckedInBy", table: "UserActivities", type: "TEXT", nullable: true);
            migrationBuilder.AddColumn<DateTime>(name: "PointsAwardedAt", table: "UserActivities", type: "TEXT", nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "CheckInNotes", table: "UserActivities");
            migrationBuilder.DropColumn(name: "CheckedInAt", table: "UserActivities");
            migrationBuilder.DropColumn(name: "CheckedInBy", table: "UserActivities");
            migrationBuilder.DropColumn(name: "PointsAwardedAt", table: "UserActivities");
        }
    }
}
