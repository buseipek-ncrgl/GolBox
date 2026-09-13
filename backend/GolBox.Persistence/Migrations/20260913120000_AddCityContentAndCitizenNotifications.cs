using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GolBox.Persistence.Migrations
{
    [DbContext(typeof(GolBox.Persistence.Context.AppDbContext))]
    [Migration("20260913120000_AddCityContentAndCitizenNotifications")]
    public partial class AddCityContentAndCitizenNotifications : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ImageUrl",
                table: "Activities",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Capacity",
                table: "Activities",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MinAge",
                table: "Notifications",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MaxAge",
                table: "Notifications",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EducationLevel",
                table: "Notifications",
                maxLength: 80,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TargetType",
                table: "Notifications",
                maxLength: 40,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TargetId",
                table: "Notifications",
                maxLength: 256,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "CityContents",
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
                    Type = table.Column<string>(maxLength: 40, nullable: false),
                    Title = table.Column<string>(maxLength: 256, nullable: false),
                    Subtitle = table.Column<string>(maxLength: 512, nullable: true),
                    Body = table.Column<string>(maxLength: 8000, nullable: true),
                    ImageUrl = table.Column<string>(maxLength: 1000, nullable: true),
                    ImageFocus = table.Column<string>(maxLength: 64, nullable: true),
                    CtaLabel = table.Column<string>(maxLength: 80, nullable: true),
                    CtaType = table.Column<string>(maxLength: 40, nullable: false),
                    CtaTarget = table.Column<string>(maxLength: 1000, nullable: true),
                    Priority = table.Column<int>(nullable: false),
                    StartAt = table.Column<DateTime>(nullable: false),
                    EndAt = table.Column<DateTime>(nullable: true),
                    IsPublished = table.Column<bool>(nullable: false),
                    AudienceType = table.Column<string>(maxLength: 40, nullable: false),
                    AudienceMinAge = table.Column<int>(nullable: true),
                    AudienceMaxAge = table.Column<int>(nullable: true),
                    AudienceEducationLevel = table.Column<string>(maxLength: 80, nullable: true),
                    AuthorName = table.Column<string>(maxLength: 160, nullable: true),
                    AuthorTitle = table.Column<string>(maxLength: 160, nullable: true),
                    AuthorImageUrl = table.Column<string>(maxLength: 1000, nullable: true),
                    ActivityId = table.Column<Guid>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CityContents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CityContents_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CityContents_Activities_ActivityId",
                        column: x => x.ActivityId,
                        principalTable: "Activities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "UserNotifications",
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
                    UserId = table.Column<Guid>(nullable: false),
                    BroadcastId = table.Column<Guid>(nullable: true),
                    Title = table.Column<string>(maxLength: 256, nullable: false),
                    Body = table.Column<string>(maxLength: 2000, nullable: false),
                    Type = table.Column<string>(maxLength: 40, nullable: false),
                    TargetType = table.Column<string>(maxLength: 40, nullable: true),
                    TargetId = table.Column<string>(maxLength: 256, nullable: true),
                    IsRead = table.Column<bool>(nullable: false),
                    ReadAt = table.Column<DateTime>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserNotifications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserNotifications_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_UserNotifications_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CityContents_OrganizationId_IsPublished_Type",
                table: "CityContents",
                columns: new[] { "OrganizationId", "IsPublished", "Type" });

            migrationBuilder.CreateIndex(
                name: "IX_CityContents_OrganizationId_StartAt_EndAt_Priority",
                table: "CityContents",
                columns: new[] { "OrganizationId", "StartAt", "EndAt", "Priority" });

            migrationBuilder.CreateIndex(
                name: "IX_CityContents_ActivityId",
                table: "CityContents",
                column: "ActivityId");

            migrationBuilder.CreateIndex(
                name: "IX_UserNotifications_UserId_IsRead_CreatedDate",
                table: "UserNotifications",
                columns: new[] { "UserId", "IsRead", "CreatedDate" });

            migrationBuilder.CreateIndex(
                name: "IX_UserNotifications_OrganizationId_CreatedDate",
                table: "UserNotifications",
                columns: new[] { "OrganizationId", "CreatedDate" });

            migrationBuilder.CreateIndex(
                name: "IX_UserNotifications_BroadcastId",
                table: "UserNotifications",
                column: "BroadcastId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "CityContents");
            migrationBuilder.DropTable(name: "UserNotifications");
            migrationBuilder.DropColumn(name: "ImageUrl", table: "Activities");
            migrationBuilder.DropColumn(name: "Capacity", table: "Activities");
            migrationBuilder.DropColumn(name: "MinAge", table: "Notifications");
            migrationBuilder.DropColumn(name: "MaxAge", table: "Notifications");
            migrationBuilder.DropColumn(name: "EducationLevel", table: "Notifications");
            migrationBuilder.DropColumn(name: "TargetType", table: "Notifications");
            migrationBuilder.DropColumn(name: "TargetId", table: "Notifications");
        }
    }
}
