using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GolBox.Persistence.Migrations
{
    /// <summary>
    /// Snapshot sync only. Schema changes for P1/P2/operational tables and unique
    /// indexes are already applied by earlier migrations. Do not replay model diffs here.
    /// </summary>
    public partial class SyncModelSnapshot : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}
