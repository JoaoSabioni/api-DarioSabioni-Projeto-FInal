using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EleganceStudio.API.Migrations
{
    /// <inheritdoc />
    public partial class v3_5_UpdatePasswords : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("c0c0c0c0-0000-0000-0000-000000000001"),
                column: "PasswordHash",
                value: "$2a$11$F/3ALbxtG0XpFPvj7tuu8ONJDu2ibccJ5N8k8zMXuNxb1Ov9E1yH2");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("c0c0c0c0-0000-0000-0000-000000000002"),
                column: "PasswordHash",
                value: "$2a$11$WXBksBKQ34WTNrK6RIzMW.69t8rkf9YExC76gCorB2X8qmc.hC8OC");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("c0c0c0c0-0000-0000-0000-000000000003"),
                column: "PasswordHash",
                value: "$2a$11$EVSVBwepA4jz0NmsYc5Z7uzNbGgJsiZ7ATTdFuD.GCg.OtpnzjhQi");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("c0c0c0c0-0000-0000-0000-000000000004"),
                column: "PasswordHash",
                value: "$2a$11$mg0855dOiHUJrpllFodIK.6o9AZE9LcHpatNSqhBe76Y946OfgFf.");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("c0c0c0c0-0000-0000-0000-000000000001"),
                column: "PasswordHash",
                value: "$2a$11$oyKzedD6ZP7BjWmY6UwdgOWKvvxkxZpviYPcz870wBi2.l6o7iebS");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("c0c0c0c0-0000-0000-0000-000000000002"),
                column: "PasswordHash",
                value: "$2a$11$PeUUZSzXHjM6pPeEqAF6jeLPkX8dEjrQZHG13qCLmJ0RQFtYwefry");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("c0c0c0c0-0000-0000-0000-000000000003"),
                column: "PasswordHash",
                value: "$2a$11$YL7DzsSWlKLX8wUGOXxBheM8NWIqKe3ZuXTxKyIQq1oq4v0WmUn5C");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("c0c0c0c0-0000-0000-0000-000000000004"),
                column: "PasswordHash",
                value: "$2a$11$9itTZu8gCgdNES8VvT5sAuUD/zH8eib3XXEuOE2MbDC6gLlcOpUZO");
        }
    }
}
