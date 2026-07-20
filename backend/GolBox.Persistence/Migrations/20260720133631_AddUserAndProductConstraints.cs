using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GolBox.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddUserAndProductConstraints : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "BirthDate",
                table: "Users",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EducationLevel",
                table: "Users",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MaxAge",
                table: "MenuItems",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MinAge",
                table: "MenuItems",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TargetEducationLevel",
                table: "MenuItems",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BirthDate",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "EducationLevel",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "MaxAge",
                table: "MenuItems");

            migrationBuilder.DropColumn(
                name: "MinAge",
                table: "MenuItems");

            migrationBuilder.DropColumn(
                name: "TargetEducationLevel",
                table: "MenuItems");
        }
    }
}
