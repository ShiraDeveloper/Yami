using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yami.Migrations
{
    /// <inheritdoc />
    public partial class AddStoreImageUrl : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ImageUrl",
                table: "Stores",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ImageUrl",
                table: "Menus",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ImageUrl",
                table: "Stores");

            migrationBuilder.DropColumn(
                name: "ImageUrl",
                table: "Menus");
        }
    }
}
