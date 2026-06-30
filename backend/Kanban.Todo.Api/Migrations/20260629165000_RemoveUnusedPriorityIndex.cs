using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kanban.Todo.Api.Migrations
{
    /// <inheritdoc />
    public partial class RemoveUnusedPriorityIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Tasks_Priority",
                table: "Tasks");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Tasks_Priority",
                table: "Tasks",
                column: "Priority");
        }
    }
}
