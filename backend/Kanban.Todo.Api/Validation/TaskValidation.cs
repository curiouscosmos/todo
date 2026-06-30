using Kanban.Todo.Api.Contracts;
using Kanban.Todo.Api.Domain;
using TaskStatus = Kanban.Todo.Api.Domain.TaskStatus;

namespace Kanban.Todo.Api.Validation;

public static class TaskValidation
{
    public static Dictionary<string, string[]> Validate(CreateTaskRequest request)
    {
        var errors = ValidateText(request.Title, request.Description);
        if (ParsePriority(request.Priority) is null)
        {
            errors["priority"] = ["Priority must be Low, Medium, or High."];
        }

        if (!string.IsNullOrWhiteSpace(request.Status) && ParseStatus(request.Status) is null)
        {
            errors["status"] = ["Status must be Todo, InProgress, or Done."];
        }

        return errors;
    }

    public static Dictionary<string, string[]> Validate(UpdateTaskRequest request)
    {
        var errors = ValidateText(request.Title, request.Description);
        if (ParsePriority(request.Priority) is null)
        {
            errors["priority"] = ["Priority must be Low, Medium, or High."];
        }

        return errors;
    }

    public static Dictionary<string, string[]> Validate(UpdateTaskStatusRequest request)
    {
        return ParseStatus(request.Status) is not null
            ? []
            : new Dictionary<string, string[]> { ["status"] = ["Status must be Todo, InProgress, or Done."] };
    }

    public static Dictionary<string, string[]> Validate(TaskQueryParameters query)
    {
        var errors = new Dictionary<string, string[]>();
        if (query.Page < 1)
        {
            errors["page"] = ["Page must be 1 or greater."];
        }

        if (query.PageSize is < 1 or > 50)
        {
            errors["pageSize"] = ["PageSize must be between 1 and 50."];
        }

        return errors;
    }

    public static TaskPriority? ParsePriority(string? priority)
    {
        return Enum.TryParse<TaskPriority>(priority, true, out var parsed) && Enum.IsDefined(parsed)
            ? parsed
            : null;
    }

    public static TaskStatus? ParseStatus(string? status)
    {
        return Enum.TryParse<TaskStatus>(status, true, out var parsed) && Enum.IsDefined(parsed)
            ? parsed
            : null;
    }

    private static Dictionary<string, string[]> ValidateText(string? title, string? description)
    {
        var errors = new Dictionary<string, string[]>();
        var trimmedTitle = title?.Trim();
        var trimmedDescription = description?.Trim();

        if (string.IsNullOrWhiteSpace(trimmedTitle))
        {
            errors["title"] = ["Title is required."];
        }
        else if (trimmedTitle.Length > 120)
        {
            errors["title"] = ["Title must be 120 characters or fewer."];
        }

        if (trimmedDescription?.Length > 1000)
        {
            errors["description"] = ["Description must be 1,000 characters or fewer."];
        }

        return errors;
    }
}
