using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Kanban.Todo.Api.Migrations
{
    /// <inheritdoc />
    public partial class KanbanStatuses : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("UPDATE Tasks SET Status = 'Todo' WHERE Status = 'Active';");
            migrationBuilder.Sql("UPDATE Tasks SET Status = 'Done' WHERE Status = 'Completed';");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("UPDATE Tasks SET Status = 'Active' WHERE Status IN ('Todo', 'InProgress');");
            migrationBuilder.Sql("UPDATE Tasks SET Status = 'Completed' WHERE Status = 'Done';");
        }
    }
}
