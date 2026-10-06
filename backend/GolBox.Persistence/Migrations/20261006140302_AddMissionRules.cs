using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GolBox.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddMissionRules : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Tasks_OrganizationId",
                table: "Tasks");

            migrationBuilder.AddColumn<string>(
                name: "Category",
                table: "Tasks",
                type: "TEXT",
                maxLength: 50,
                nullable: false,
                defaultValue: "GölBOX");

            migrationBuilder.AddColumn<string>(
                name: "HowToCompleteJson",
                table: "Tasks",
                type: "TEXT",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MissionType",
                table: "Tasks",
                type: "TEXT",
                maxLength: 50,
                nullable: false,
                defaultValue: "ORDER_COMPLETED");

            migrationBuilder.AddColumn<string>(
                name: "ShortDescription",
                table: "Tasks",
                type: "TEXT",
                maxLength: 300,
                nullable: false,
                defaultValue: "All");

            migrationBuilder.AddColumn<string>(
                name: "TargetAudience",
                table: "Tasks",
                type: "TEXT",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "TargetProgress",
                table: "Tasks",
                type: "INTEGER",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.CreateIndex(
                name: "IX_Tasks_OrganizationId_Status_StartDate_EndDate",
                table: "Tasks",
                columns: new[] { "OrganizationId", "Status", "StartDate", "EndDate" });

        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Tasks_OrganizationId_Status_StartDate_EndDate",
                table: "Tasks");

            migrationBuilder.DropColumn(
                name: "Category",
                table: "Tasks");

            migrationBuilder.DropColumn(
                name: "HowToCompleteJson",
                table: "Tasks");

            migrationBuilder.DropColumn(
                name: "MissionType",
                table: "Tasks");

            migrationBuilder.DropColumn(
                name: "ShortDescription",
                table: "Tasks");

            migrationBuilder.DropColumn(
                name: "TargetAudience",
                table: "Tasks");

            migrationBuilder.DropColumn(
                name: "TargetProgress",
                table: "Tasks");

            migrationBuilder.CreateIndex(
                name: "IX_Tasks_OrganizationId",
                table: "Tasks",
                column: "OrganizationId");
        }
    }
}
