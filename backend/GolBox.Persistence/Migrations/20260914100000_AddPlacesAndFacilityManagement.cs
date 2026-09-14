using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GolBox.Persistence.Migrations
{
    [DbContext(typeof(GolBox.Persistence.Context.AppDbContext))]
    [Migration("20260914100000_AddPlacesAndFacilityManagement")]
    public partial class AddPlacesAndFacilityManagement : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Places",
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
                    Name = table.Column<string>(maxLength: 256, nullable: false),
                    Slug = table.Column<string>(maxLength: 160, nullable: false),
                    Category = table.Column<string>(maxLength: 40, nullable: false),
                    ShortDescription = table.Column<string>(maxLength: 512, nullable: true),
                    Description = table.Column<string>(maxLength: 8000, nullable: true),
                    Address = table.Column<string>(maxLength: 500, nullable: true),
                    District = table.Column<string>(maxLength: 120, nullable: true),
                    Neighborhood = table.Column<string>(maxLength: 120, nullable: true),
                    Latitude = table.Column<decimal>(type: "decimal(18,10)", nullable: true),
                    Longitude = table.Column<decimal>(type: "decimal(18,10)", nullable: true),
                    Phone = table.Column<string>(maxLength: 40, nullable: true),
                    Email = table.Column<string>(maxLength: 256, nullable: true),
                    WebsiteUrl = table.Column<string>(maxLength: 500, nullable: true),
                    CoverImageUrl = table.Column<string>(maxLength: 1000, nullable: true),
                    IsActive = table.Column<bool>(nullable: false),
                    IsPublished = table.Column<bool>(nullable: false),
                    SortOrder = table.Column<int>(nullable: false),
                    WheelchairAccessible = table.Column<bool>(nullable: true),
                    AccessibleToilet = table.Column<bool>(nullable: true),
                    SearchNormalized = table.Column<string>(maxLength: 1000, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Places", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Places_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PlaceImages",
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
                    PlaceId = table.Column<Guid>(nullable: false),
                    ImageUrl = table.Column<string>(maxLength: 1000, nullable: false),
                    AltText = table.Column<string>(maxLength: 200, nullable: true),
                    SortOrder = table.Column<int>(nullable: false),
                    IsCover = table.Column<bool>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlaceImages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PlaceImages_Places_PlaceId",
                        column: x => x.PlaceId,
                        principalTable: "Places",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PlaceOpeningHours",
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
                    PlaceId = table.Column<Guid>(nullable: false),
                    DayOfWeek = table.Column<int>(nullable: false),
                    OpenTime = table.Column<string>(maxLength: 8, nullable: true),
                    CloseTime = table.Column<string>(maxLength: 8, nullable: true),
                    IsClosed = table.Column<bool>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlaceOpeningHours", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PlaceOpeningHours_Places_PlaceId",
                        column: x => x.PlaceId,
                        principalTable: "Places",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PlaceAmenities",
                columns: table => new
                {
                    PlaceId = table.Column<Guid>(nullable: false),
                    AmenityId = table.Column<string>(maxLength: 40, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlaceAmenities", x => new { x.PlaceId, x.AmenityId });
                    table.ForeignKey(
                        name: "FK_PlaceAmenities_Places_PlaceId",
                        column: x => x.PlaceId,
                        principalTable: "Places",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.AddColumn<Guid>(
                name: "PlaceId",
                table: "Cafes",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "PlaceId",
                table: "Activities",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Places_OrganizationId_Slug",
                table: "Places",
                columns: new[] { "OrganizationId", "Slug" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Places_OrganizationId_IsPublished_IsActive",
                table: "Places",
                columns: new[] { "OrganizationId", "IsPublished", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_Places_OrganizationId_Category",
                table: "Places",
                columns: new[] { "OrganizationId", "Category" });

            migrationBuilder.CreateIndex(
                name: "IX_Places_OrganizationId_District",
                table: "Places",
                columns: new[] { "OrganizationId", "District" });

            migrationBuilder.CreateIndex(
                name: "IX_Places_OrganizationId_Neighborhood",
                table: "Places",
                columns: new[] { "OrganizationId", "Neighborhood" });

            migrationBuilder.CreateIndex(
                name: "IX_Places_Latitude_Longitude",
                table: "Places",
                columns: new[] { "Latitude", "Longitude" });

            migrationBuilder.CreateIndex(
                name: "IX_Places_SearchNormalized",
                table: "Places",
                column: "SearchNormalized");

            migrationBuilder.CreateIndex(
                name: "IX_PlaceImages_PlaceId_SortOrder",
                table: "PlaceImages",
                columns: new[] { "PlaceId", "SortOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_PlaceOpeningHours_PlaceId_DayOfWeek",
                table: "PlaceOpeningHours",
                columns: new[] { "PlaceId", "DayOfWeek" },
                unique: true,
                filter: "IsDeleted = 0");

            migrationBuilder.CreateIndex(
                name: "IX_Cafes_PlaceId",
                table: "Cafes",
                column: "PlaceId");

            migrationBuilder.CreateIndex(
                name: "IX_Activities_PlaceId",
                table: "Activities",
                column: "PlaceId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(name: "IX_Activities_PlaceId", table: "Activities");
            migrationBuilder.DropIndex(name: "IX_Cafes_PlaceId", table: "Cafes");
            migrationBuilder.DropColumn(name: "PlaceId", table: "Activities");
            migrationBuilder.DropColumn(name: "PlaceId", table: "Cafes");
            migrationBuilder.DropTable(name: "PlaceAmenities");
            migrationBuilder.DropTable(name: "PlaceImages");
            migrationBuilder.DropTable(name: "PlaceOpeningHours");
            migrationBuilder.DropTable(name: "Places");
        }
    }
}
