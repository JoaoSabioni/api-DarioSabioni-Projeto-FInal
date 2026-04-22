using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace EleganceStudio.API.Migrations
{
    /// <inheritdoc />
    public partial class v3_4_ModelsUpdate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Bookings_BarberId",
                table: "Bookings");

            migrationBuilder.RenameColumn(
                name: "PhoneNumber",
                table: "Bookings",
                newName: "ClientPhone");

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "Bookings",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Bookings",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Bookings",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Username = table.Column<string>(type: "text", nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: false),
                    Role = table.Column<string>(type: "text", nullable: false),
                    BarberId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.UpdateData(
                table: "Services",
                keyColumn: "Id",
                keyValue: new Guid("b2b2b2b2-0000-0000-0000-000000000001"),
                column: "DurationMinutes",
                value: 30);

            migrationBuilder.UpdateData(
                table: "Services",
                keyColumn: "Id",
                keyValue: new Guid("b2b2b2b2-0000-0000-0000-000000000002"),
                column: "DurationMinutes",
                value: 30);

            migrationBuilder.UpdateData(
                table: "Services",
                keyColumn: "Id",
                keyValue: new Guid("b2b2b2b2-0000-0000-0000-000000000003"),
                column: "DurationMinutes",
                value: 30);

            migrationBuilder.UpdateData(
                table: "Services",
                keyColumn: "Id",
                keyValue: new Guid("b2b2b2b2-0000-0000-0000-000000000004"),
                column: "DurationMinutes",
                value: 45);

            migrationBuilder.UpdateData(
                table: "Services",
                keyColumn: "Id",
                keyValue: new Guid("b2b2b2b2-0000-0000-0000-000000000005"),
                column: "DurationMinutes",
                value: 60);

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "BarberId", "PasswordHash", "Role", "Username" },
                values: new object[,]
                {
                    { new Guid("c0c0c0c0-0000-0000-0000-000000000001"), null, "$2a$11$oyKzedD6ZP7BjWmY6UwdgOWKvvxkxZpviYPcz870wBi2.l6o7iebS", "Admin", "admin" },
                    { new Guid("c0c0c0c0-0000-0000-0000-000000000002"), new Guid("a1a1a1a1-0000-0000-0000-000000000001"), "$2a$11$PeUUZSzXHjM6pPeEqAF6jeLPkX8dEjrQZHG13qCLmJ0RQFtYwefry", "Barber", "edi" },
                    { new Guid("c0c0c0c0-0000-0000-0000-000000000003"), new Guid("a1a1a1a1-0000-0000-0000-000000000002"), "$2a$11$YL7DzsSWlKLX8wUGOXxBheM8NWIqKe3ZuXTxKyIQq1oq4v0WmUn5C", "Barber", "tomas" },
                    { new Guid("c0c0c0c0-0000-0000-0000-000000000004"), new Guid("a1a1a1a1-0000-0000-0000-000000000003"), "$2a$11$9itTZu8gCgdNES8VvT5sAuUD/zH8eib3XXEuOE2MbDC6gLlcOpUZO", "Barber", "abreu" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_BarberId_BookingDate_BookingTime",
                table: "Bookings",
                columns: new[] { "BarberId", "BookingDate", "BookingTime" },
                unique: true,
                filter: "\"Status\" != 'Cancelled' AND \"IsDeleted\" = false");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Bookings_BarberId_BookingDate_BookingTime",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "Bookings");

            migrationBuilder.RenameColumn(
                name: "ClientPhone",
                table: "Bookings",
                newName: "PhoneNumber");

            migrationBuilder.UpdateData(
                table: "Services",
                keyColumn: "Id",
                keyValue: new Guid("b2b2b2b2-0000-0000-0000-000000000001"),
                column: "DurationMinutes",
                value: 0);

            migrationBuilder.UpdateData(
                table: "Services",
                keyColumn: "Id",
                keyValue: new Guid("b2b2b2b2-0000-0000-0000-000000000002"),
                column: "DurationMinutes",
                value: 0);

            migrationBuilder.UpdateData(
                table: "Services",
                keyColumn: "Id",
                keyValue: new Guid("b2b2b2b2-0000-0000-0000-000000000003"),
                column: "DurationMinutes",
                value: 0);

            migrationBuilder.UpdateData(
                table: "Services",
                keyColumn: "Id",
                keyValue: new Guid("b2b2b2b2-0000-0000-0000-000000000004"),
                column: "DurationMinutes",
                value: 0);

            migrationBuilder.UpdateData(
                table: "Services",
                keyColumn: "Id",
                keyValue: new Guid("b2b2b2b2-0000-0000-0000-000000000005"),
                column: "DurationMinutes",
                value: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_BarberId",
                table: "Bookings",
                column: "BarberId");
        }
    }
}
