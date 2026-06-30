namespace Kanban.Todo.Api.Contracts;

public sealed record UpdateTaskRequest(
    string Title,
    string? Description,
    string Priority,
    DateTimeOffset? DueDate
);

