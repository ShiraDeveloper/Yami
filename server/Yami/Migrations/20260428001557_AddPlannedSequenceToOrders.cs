using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yami.Migrations
{
    /// <inheritdoc />
    public partial class AddPlannedSequenceToOrders : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "PlannedSequence",
                table: "Orders",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PlannedSequence",
                table: "Orders");
        }
    }
}
