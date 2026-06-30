namespace Kanban.Todo.Api.Contracts;

public sealed record TaskQueryParameters(
    int Page = 1,
    int PageSize = 10
);
