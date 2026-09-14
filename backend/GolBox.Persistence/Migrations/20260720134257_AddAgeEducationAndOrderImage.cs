using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GolBox.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddAgeEducationAndOrderImage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BirthDate",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "TargetEducationLevel",
                table: "MenuItems");

            migrationBuilder.AlterColumn<string>(
                name: "EducationLevel",
                table: "Users",
                type: "TEXT",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50,
                oldNullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Age",
                table: "Users",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ImageUrl",
                table: "Orders",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RequiredEducation",
                table: "MenuItems",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Age",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ImageUrl",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "RequiredEducation",
                table: "MenuItems");

            migrationBuilder.AlterColumn<string>(
                name: "EducationLevel",
                table: "Users",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "BirthDate",
                table: "Users",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TargetEducationLevel",
                table: "MenuItems",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);
        }
    }
}
