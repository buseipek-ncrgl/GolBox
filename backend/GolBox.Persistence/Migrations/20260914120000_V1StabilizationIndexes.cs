using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using GolBox.Persistence.Context;

#nullable disable

namespace GolBox.Persistence.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260914120000_V1StabilizationIndexes")]
    public partial class V1StabilizationIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_UserFieldCaptures_FieldDropId_UserId",
                table: "UserFieldCaptures");

            migrationBuilder.CreateIndex(
                name: "IX_UserFieldCaptures_FieldDropId_UserId",
                table: "UserFieldCaptures",
                columns: new[] { "FieldDropId", "UserId" },
                unique: true,
                filter: "IsDeleted = 0");

            migrationBuilder.CreateIndex(
                name: "IX_UserActivities_UserId_ActivityId",
                table: "UserActivities",
                columns: new[] { "UserId", "ActivityId" },
                unique: true,
                filter: "IsDeleted = 0");

            // These columns historically existed only via EnsureProviderSchemaAsync.
            if (migrationBuilder.ActiveProvider?.Contains("Sqlite", StringComparison.OrdinalIgnoreCase) == true)
            {
                migrationBuilder.Sql("""
                    ALTER TABLE Users ADD COLUMN Role TEXT NOT NULL DEFAULT 'User';
                    """);
                migrationBuilder.Sql("""
                    ALTER TABLE Cafes ADD COLUMN ImageUrl TEXT NULL;
                    """);
            }
            else
            {
                migrationBuilder.Sql("""
                    IF COL_LENGTH('dbo.Users', 'Role') IS NULL
                    BEGIN
                        ALTER TABLE dbo.Users ADD Role nvarchar(32) NOT NULL CONSTRAINT DF_Users_Role DEFAULT N'User';
                    END
                    """);
                migrationBuilder.Sql("""
                    IF COL_LENGTH('dbo.Cafes', 'ImageUrl') IS NULL
                    BEGIN
                        ALTER TABLE dbo.Cafes ADD ImageUrl nvarchar(1000) NULL;
                    END
                    """);
            }
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_UserActivities_UserId_ActivityId",
                table: "UserActivities");

            migrationBuilder.DropIndex(
                name: "IX_UserFieldCaptures_FieldDropId_UserId",
                table: "UserFieldCaptures");

            migrationBuilder.CreateIndex(
                name: "IX_UserFieldCaptures_FieldDropId_UserId",
                table: "UserFieldCaptures",
                columns: new[] { "FieldDropId", "UserId" });
        }
    }
}
