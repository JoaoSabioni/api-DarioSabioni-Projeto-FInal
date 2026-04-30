using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EleganceStudio.API.Migrations
{
    /// <inheritdoc />
    public partial class AddBookingIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Bookings_BarberId_BookingDate",
                table: "Bookings",
                columns: new[] { "BarberId", "BookingDate" });

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_BookingDate",
                table: "Bookings",
                column: "BookingDate");

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_ClientPhone",
                table: "Bookings",
                column: "ClientPhone");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Bookings_BarberId_BookingDate",
                table: "Bookings");

            migrationBuilder.DropIndex(
                name: "IX_Bookings_BookingDate",
                table: "Bookings");

            migrationBuilder.DropIndex(
                name: "IX_Bookings_ClientPhone",
                table: "Bookings");
        }
    }
}
