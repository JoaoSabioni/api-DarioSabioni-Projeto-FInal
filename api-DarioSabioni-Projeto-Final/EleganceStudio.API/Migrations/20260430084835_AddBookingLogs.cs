using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EleganceStudio.API.Migrations
{
    /// <inheritdoc />
    public partial class AddBookingLogs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BookingLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OriginalBookingId = table.Column<Guid>(type: "uuid", nullable: false),
                    BarberId = table.Column<Guid>(type: "uuid", nullable: false),
                    BarberName = table.Column<string>(type: "text", nullable: false),
                    ServiceName = table.Column<string>(type: "text", nullable: false),
                    ServicePrice = table.Column<decimal>(type: "numeric", nullable: false),
                    ServiceDurationMinutes = table.Column<int>(type: "integer", nullable: false),
                    BookingDate = table.Column<DateOnly>(type: "date", nullable: false),
                    BookingTime = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    ClientName = table.Column<string>(type: "text", nullable: false),
                    ClientPhone = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ArchivedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BookingLogs", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BookingLogs_ArchivedAt",
                table: "BookingLogs",
                column: "ArchivedAt");

            migrationBuilder.CreateIndex(
                name: "IX_BookingLogs_BarberId",
                table: "BookingLogs",
                column: "BarberId");

            migrationBuilder.CreateIndex(
                name: "IX_BookingLogs_BookingDate",
                table: "BookingLogs",
                column: "BookingDate");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BookingLogs");
        }
    }
}
