namespace Kanban.Todo.Api.Features.Tasks;

public sealed record TaskResult<T>(T? Value, Dictionary<string, string[]>? Errors = null, bool NotFound = false)
{
    public bool IsValid => Errors is null || Errors.Count == 0;

    public static TaskResult<T> Ok(T value) => new(value);

    public static TaskResult<T> Invalid(Dictionary<string, string[]> errors) => new(default, errors);

    public static TaskResult<T> Missing() => new(default, NotFound: true);
}

