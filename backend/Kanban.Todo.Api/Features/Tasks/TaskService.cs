using Kanban.Todo.Api.Contracts;
using Kanban.Todo.Api.Data;
using Kanban.Todo.Api.Domain;
using Kanban.Todo.Api.Validation;
using Microsoft.EntityFrameworkCore;
using TaskStatus = Kanban.Todo.Api.Domain.TaskStatus;

namespace Kanban.Todo.Api.Features.Tasks;

public sealed class TaskService(TodoDbContext db, TimeProvider clock) : ITaskService
{
    public async Task<PagedResult<TaskDto>> GetTasksAsync(TaskQueryParameters query, CancellationToken ct)
    {
        var page = Math.Max(1, query.Page);
        var pageSize = Math.Clamp(query.PageSize, 1, 50);
        var tasks = db.Tasks.AsNoTracking();

        var totalCount = await tasks.CountAsync(ct);
        var items = await tasks
            // The frontend renders a board from the latest server state; extra filtering/sorting knobs were removed to keep the API honest.
            .OrderByDescending(x => x.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => ToDto(x))
            .ToListAsync(ct);

        return new PagedResult<TaskDto>(items, page, pageSize, totalCount, (int)Math.Ceiling(totalCount / (double)pageSize));
    }

    public async Task<TaskDto?> GetTaskAsync(Guid id, CancellationToken ct)
    {
        return await db.Tasks.AsNoTracking()
            .Where(x => x.Id == id)
            .Select(x => ToDto(x))
            .SingleOrDefaultAsync(ct);
    }

    public async Task<TaskResult<TaskDto>> CreateTaskAsync(CreateTaskRequest request, CancellationToken ct)
    {
        var errors = TaskValidation.Validate(request);
        if (errors.Count > 0)
        {
            return TaskResult<TaskDto>.Invalid(errors);
        }

        var now = clock.GetUtcNow();
        var priority = TaskValidation.ParsePriority(request.Priority)!.Value;
        var status = string.IsNullOrWhiteSpace(request.Status)
            ? TaskStatus.Todo
            : TaskValidation.ParseStatus(request.Status)!.Value;
        var task = new TaskItem
        {
            Id = Guid.NewGuid(),
            Title = request.Title.Trim(),
            Description = NormalizeDescription(request.Description),
            Priority = priority,
            Status = status,
            DueDate = request.DueDate,
            CreatedAt = now,
            UpdatedAt = now,
            CompletedAt = status == TaskStatus.Done ? now : null
        };

        db.Tasks.Add(task);
        await db.SaveChangesAsync(ct);
        return TaskResult<TaskDto>.Ok(ToDto(task));
    }

    public async Task<TaskResult<TaskDto>> UpdateTaskAsync(Guid id, UpdateTaskRequest request, CancellationToken ct)
    {
        var errors = TaskValidation.Validate(request);
        if (errors.Count > 0)
        {
            return TaskResult<TaskDto>.Invalid(errors);
        }

        var task = await db.Tasks.SingleOrDefaultAsync(x => x.Id == id, ct);
        if (task is null)
        {
            return TaskResult<TaskDto>.Missing();
        }

        task.Title = request.Title.Trim();
        task.Description = NormalizeDescription(request.Description);
        task.Priority = TaskValidation.ParsePriority(request.Priority)!.Value;
        task.DueDate = request.DueDate;
        task.UpdatedAt = clock.GetUtcNow();

        await db.SaveChangesAsync(ct);
        return TaskResult<TaskDto>.Ok(ToDto(task));
    }

    public async Task<TaskResult<TaskDto>> UpdateStatusAsync(Guid id, UpdateTaskStatusRequest request, CancellationToken ct)
    {
        var errors = TaskValidation.Validate(request);
        if (errors.Count > 0)
        {
            return TaskResult<TaskDto>.Invalid(errors);
        }

        var task = await db.Tasks.SingleOrDefaultAsync(x => x.Id == id, ct);
        if (task is null)
        {
            return TaskResult<TaskDto>.Missing();
        }

        var status = TaskValidation.ParseStatus(request.Status)!.Value;
        var now = clock.GetUtcNow();
        task.Status = status;
        task.CompletedAt = status == TaskStatus.Done ? now : null;
        task.UpdatedAt = now;

        await db.SaveChangesAsync(ct);
        return TaskResult<TaskDto>.Ok(ToDto(task));
    }

    public async Task<bool> DeleteTaskAsync(Guid id, CancellationToken ct)
    {
        // ExecuteDelete avoids loading the row just to delete it and still returns whether anything changed.
        return await db.Tasks.Where(x => x.Id == id).ExecuteDeleteAsync(ct) > 0;
    }

    private static string? NormalizeDescription(string? description)
    {
        var trimmed = description?.Trim();
        return string.IsNullOrWhiteSpace(trimmed) ? null : trimmed;
    }

    private static TaskDto ToDto(TaskItem task)
    {
        return new TaskDto(
            task.Id,
            task.Title,
            task.Description,
            task.Priority.ToString(),
            task.Status.ToString(),
            task.DueDate,
            task.CreatedAt,
            task.UpdatedAt,
            task.CompletedAt
        );
    }
}
