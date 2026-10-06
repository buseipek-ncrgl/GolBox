using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GolBox.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddRewardOperationalRules : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Rewards_OrganizationId",
                table: "Rewards");

            migrationBuilder.AddColumn<int>(
                name: "IssuedCount",
                table: "Rewards",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "MinAge",
                table: "Rewards",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PerUserLimit",
                table: "Rewards",
                type: "INTEGER",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<string>(
                name: "RequiredEducation",
                table: "Rewards",
                type: "TEXT",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TotalStock",
                table: "Rewards",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Rewards_OrganizationId_Status",
                table: "Rewards",
                columns: new[] { "OrganizationId", "Status" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Rewards_OrganizationId_Status",
                table: "Rewards");

            migrationBuilder.DropColumn(
                name: "IssuedCount",
                table: "Rewards");

            migrationBuilder.DropColumn(
                name: "MinAge",
                table: "Rewards");

            migrationBuilder.DropColumn(
                name: "PerUserLimit",
                table: "Rewards");

            migrationBuilder.DropColumn(
                name: "RequiredEducation",
                table: "Rewards");

            migrationBuilder.DropColumn(
                name: "TotalStock",
                table: "Rewards");

            migrationBuilder.CreateIndex(
                name: "IX_Rewards_OrganizationId",
                table: "Rewards",
                column: "OrganizationId");
        }
    }
}
