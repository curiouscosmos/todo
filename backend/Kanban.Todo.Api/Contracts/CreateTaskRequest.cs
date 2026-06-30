namespace Kanban.Todo.Api.Contracts;

public sealed record CreateTaskRequest(
    string Title,
    string? Description,
    string Priority,
    DateTimeOffset? DueDate,
    string? Status = null
);
