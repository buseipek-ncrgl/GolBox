using GolBox.Persistence.Context;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GolBox.Persistence.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20261005193000_AlignCatalogOptionSchema")]
public sealed class AlignCatalogOptionSchema : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "SelectionType",
            table: "ProductOptionGroups",
            type: "TEXT",
            nullable: false,
            defaultValue: "SINGLE");
        migrationBuilder.AddColumn<bool>(
            name: "Required",
            table: "ProductOptionGroups",
            type: "INTEGER",
            nullable: false,
            defaultValue: false);
        migrationBuilder.AddColumn<int>(
            name: "MinSelections",
            table: "ProductOptionGroups",
            type: "INTEGER",
            nullable: false,
            defaultValue: 0);
        migrationBuilder.AddColumn<int>(
            name: "MaxSelections",
            table: "ProductOptionGroups",
            type: "INTEGER",
            nullable: false,
            defaultValue: 1);
        migrationBuilder.AddColumn<decimal>(
            name: "PriceModifier",
            table: "ProductOptions",
            type: "decimal(18,2)",
            nullable: false,
            defaultValue: 0m);
        migrationBuilder.AddColumn<bool>(
            name: "IsActive",
            table: "ProductOptions",
            type: "INTEGER",
            nullable: false,
            defaultValue: true);

        migrationBuilder.Sql("UPDATE ProductOptionGroups SET Required = IsRequired, MinSelections = MinSelect, MaxSelections = MaxSelect;");
        migrationBuilder.Sql("UPDATE ProductOptions SET PriceModifier = PriceAdjustment, IsActive = IsAvailable;");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "SelectionType", table: "ProductOptionGroups");
        migrationBuilder.DropColumn(name: "Required", table: "ProductOptionGroups");
        migrationBuilder.DropColumn(name: "MinSelections", table: "ProductOptionGroups");
        migrationBuilder.DropColumn(name: "MaxSelections", table: "ProductOptionGroups");
        migrationBuilder.DropColumn(name: "PriceModifier", table: "ProductOptions");
        migrationBuilder.DropColumn(name: "IsActive", table: "ProductOptions");
    }
}
