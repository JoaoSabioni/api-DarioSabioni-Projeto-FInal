using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace EleganceStudio.API.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Barbers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Phone = table.Column<string>(type: "text", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Barbers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Services",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Price = table.Column<decimal>(type: "numeric", nullable: false),
                    DurationMinutes = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Services", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Bookings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ClientName = table.Column<string>(type: "text", nullable: false),
                    PhoneNumber = table.Column<string>(type: "text", nullable: false),
                    BarberId = table.Column<Guid>(type: "uuid", nullable: false),
                    ServiceId = table.Column<Guid>(type: "uuid", nullable: false),
                    BookingDate = table.Column<DateOnly>(type: "date", nullable: false),
                    BookingTime = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Bookings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Bookings_Barbers_BarberId",
                        column: x => x.BarberId,
                        principalTable: "Barbers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Bookings_Services_ServiceId",
                        column: x => x.ServiceId,
                        principalTable: "Services",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "Barbers",
                columns: new[] { "Id", "IsActive", "Name", "Phone" },
                values: new object[,]
                {
                    { new Guid("a1a1a1a1-0000-0000-0000-000000000001"), true, "Edi", "+351933320269" },
                    { new Guid("a1a1a1a1-0000-0000-0000-000000000002"), true, "Tomas", "+351914302079" },
                    { new Guid("a1a1a1a1-0000-0000-0000-000000000003"), true, "Abreu", "+351913388301" }
                });

            migrationBuilder.InsertData(
                table: "Services",
                columns: new[] { "Id", "DurationMinutes", "Name", "Price" },
                values: new object[,]
                {
                    { new Guid("b2b2b2b2-0000-0000-0000-000000000001"), 0, "Sobrancelhas", 3m },
                    { new Guid("b2b2b2b2-0000-0000-0000-000000000002"), 0, "Barba", 6m },
                    { new Guid("b2b2b2b2-0000-0000-0000-000000000003"), 0, "Corte Simples", 10m },
                    { new Guid("b2b2b2b2-0000-0000-0000-000000000004"), 0, "Corte/Degradê", 15m },
                    { new Guid("b2b2b2b2-0000-0000-0000-000000000005"), 0, "Corte & Barba", 17m }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_BarberId",
                table: "Bookings",
                column: "BarberId");

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_ServiceId",
                table: "Bookings",
                column: "ServiceId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Bookings");

            migrationBuilder.DropTable(
                name: "Barbers");

            migrationBuilder.DropTable(
                name: "Services");
        }
    }
}
