namespace Kanban.Todo.Api.Contracts;

public sealed record TaskDto(
    Guid Id,
    string Title,
    string? Description,
    string Priority,
    string Status,
    DateTimeOffset? DueDate,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    DateTimeOffset? CompletedAt
);

