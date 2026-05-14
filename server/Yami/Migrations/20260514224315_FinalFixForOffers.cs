using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Yami.Migrations
{
    /// <inheritdoc />
    public partial class FinalFixForOffers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Delivery_Couriers_CourierId",
                table: "Delivery");

            migrationBuilder.DropForeignKey(
                name: "FK_DeliveryOffer_Delivery_DeliveryId",
                table: "DeliveryOffer");

            migrationBuilder.DropForeignKey(
                name: "FK_DeliveryOffer_Orders_OrderId",
                table: "DeliveryOffer");

            migrationBuilder.DropForeignKey(
                name: "FK_OrderItem_Menus_MenuId",
                table: "OrderItem");

            migrationBuilder.DropTable(
                name: "DeliveryOffers");

            migrationBuilder.DropIndex(
                name: "IX_DeliveryOffer_DeliveryId",
                table: "DeliveryOffer");

            migrationBuilder.DropIndex(
                name: "IX_DeliveryOffer_OrderId",
                table: "DeliveryOffer");

            migrationBuilder.DropColumn(
                name: "DeliveredTime",
                table: "DeliveryOffer");

            migrationBuilder.DropColumn(
                name: "DeliveryId",
                table: "DeliveryOffer");

            migrationBuilder.DropColumn(
                name: "DistanceFromPreviousStop",
                table: "DeliveryOffer");

            migrationBuilder.DropColumn(
                name: "OrderId",
                table: "DeliveryOffer");

            migrationBuilder.RenameColumn(
                name: "StopIndex",
                table: "DeliveryOffer",
                newName: "DeliveryOrderId");

            migrationBuilder.RenameColumn(
                name: "Status",
                table: "DeliveryOffer",
                newName: "CourierId");

            migrationBuilder.AddColumn<bool>(
                name: "Accepted",
                table: "DeliveryOffer",
                type: "bit",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DeliveryOrderId1",
                table: "DeliveryOffer",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "OfferedAt",
                table: "DeliveryOffer",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.CreateTable(
                name: "DeliveryOrder",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DeliveryId = table.Column<int>(type: "int", nullable: false),
                    OrderId = table.Column<int>(type: "int", nullable: false),
                    StopIndex = table.Column<int>(type: "int", nullable: false),
                    DistanceFromPreviousStop = table.Column<double>(type: "float", nullable: false),
                    DeliveredTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Status = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DeliveryOrder", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DeliveryOrder_Delivery_DeliveryId",
                        column: x => x.DeliveryId,
                        principalTable: "Delivery",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DeliveryOrder_Orders_OrderId",
                        column: x => x.OrderId,
                        principalTable: "Orders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryOffer_CourierId",
                table: "DeliveryOffer",
                column: "CourierId");

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryOffer_DeliveryOrderId",
                table: "DeliveryOffer",
                column: "DeliveryOrderId");

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryOffer_DeliveryOrderId1",
                table: "DeliveryOffer",
                column: "DeliveryOrderId1");

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryOrder_DeliveryId",
                table: "DeliveryOrder",
                column: "DeliveryId");

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryOrder_OrderId",
                table: "DeliveryOrder",
                column: "OrderId");

            migrationBuilder.AddForeignKey(
                name: "FK_Delivery_Couriers_CourierId",
                table: "Delivery",
                column: "CourierId",
                principalTable: "Couriers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_DeliveryOffer_Couriers_CourierId",
                table: "DeliveryOffer",
                column: "CourierId",
                principalTable: "Couriers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_DeliveryOffer_DeliveryOrder_DeliveryOrderId",
                table: "DeliveryOffer",
                column: "DeliveryOrderId",
                principalTable: "DeliveryOrder",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_DeliveryOffer_DeliveryOrder_DeliveryOrderId1",
                table: "DeliveryOffer",
                column: "DeliveryOrderId1",
                principalTable: "DeliveryOrder",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_OrderItem_Menus_MenuId",
                table: "OrderItem",
                column: "MenuId",
                principalTable: "Menus",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Delivery_Couriers_CourierId",
                table: "Delivery");

            migrationBuilder.DropForeignKey(
                name: "FK_DeliveryOffer_Couriers_CourierId",
                table: "DeliveryOffer");

            migrationBuilder.DropForeignKey(
                name: "FK_DeliveryOffer_DeliveryOrder_DeliveryOrderId",
                table: "DeliveryOffer");

            migrationBuilder.DropForeignKey(
                name: "FK_DeliveryOffer_DeliveryOrder_DeliveryOrderId1",
                table: "DeliveryOffer");

            migrationBuilder.DropForeignKey(
                name: "FK_OrderItem_Menus_MenuId",
                table: "OrderItem");

            migrationBuilder.DropTable(
                name: "DeliveryOrder");

            migrationBuilder.DropIndex(
                name: "IX_DeliveryOffer_CourierId",
                table: "DeliveryOffer");

            migrationBuilder.DropIndex(
                name: "IX_DeliveryOffer_DeliveryOrderId",
                table: "DeliveryOffer");

            migrationBuilder.DropIndex(
                name: "IX_DeliveryOffer_DeliveryOrderId1",
                table: "DeliveryOffer");

            migrationBuilder.DropColumn(
                name: "Accepted",
                table: "DeliveryOffer");

            migrationBuilder.DropColumn(
                name: "DeliveryOrderId1",
                table: "DeliveryOffer");

            migrationBuilder.DropColumn(
                name: "OfferedAt",
                table: "DeliveryOffer");

            migrationBuilder.RenameColumn(
                name: "DeliveryOrderId",
                table: "DeliveryOffer",
                newName: "StopIndex");

            migrationBuilder.RenameColumn(
                name: "CourierId",
                table: "DeliveryOffer",
                newName: "Status");

            migrationBuilder.AddColumn<DateTime>(
                name: "DeliveredTime",
                table: "DeliveryOffer",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DeliveryId",
                table: "DeliveryOffer",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<double>(
                name: "DistanceFromPreviousStop",
                table: "DeliveryOffer",
                type: "float",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<int>(
                name: "OrderId",
                table: "DeliveryOffer",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "DeliveryOffers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CourierId = table.Column<int>(type: "int", nullable: false),
                    DeliveryOrderId = table.Column<int>(type: "int", nullable: false),
                    Accepted = table.Column<bool>(type: "bit", nullable: true),
                    OfferedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DeliveryOffers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DeliveryOffers_Couriers_CourierId",
                        column: x => x.CourierId,
                        principalTable: "Couriers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_DeliveryOffers_DeliveryOffer_DeliveryOrderId",
                        column: x => x.DeliveryOrderId,
                        principalTable: "DeliveryOffer",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryOffer_DeliveryId",
                table: "DeliveryOffer",
                column: "DeliveryId");

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryOffer_OrderId",
                table: "DeliveryOffer",
                column: "OrderId");

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryOffers_CourierId",
                table: "DeliveryOffers",
                column: "CourierId");

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryOffers_DeliveryOrderId",
                table: "DeliveryOffers",
                column: "DeliveryOrderId");

            migrationBuilder.AddForeignKey(
                name: "FK_Delivery_Couriers_CourierId",
                table: "Delivery",
                column: "CourierId",
                principalTable: "Couriers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_DeliveryOffer_Delivery_DeliveryId",
                table: "DeliveryOffer",
                column: "DeliveryId",
                principalTable: "Delivery",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_DeliveryOffer_Orders_OrderId",
                table: "DeliveryOffer",
                column: "OrderId",
                principalTable: "Orders",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_OrderItem_Menus_MenuId",
                table: "OrderItem",
                column: "MenuId",
                principalTable: "Menus",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
