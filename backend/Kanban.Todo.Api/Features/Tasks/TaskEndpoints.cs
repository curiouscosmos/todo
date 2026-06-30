using Kanban.Todo.Api.Contracts;
using Kanban.Todo.Api.Infrastructure;
using Kanban.Todo.Api.Validation;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Kanban.Todo.Api.Features.Tasks;

public static class TaskEndpoints
{
    public static RouteGroupBuilder MapTaskEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/tasks")
            .WithTags("Tasks");

        group.MapGet("/", async Task<Results<Ok<PagedResult<TaskDto>>, ValidationProblem>> (
            int? page,
            int? pageSize,
            ITaskService service,
            CancellationToken ct) =>
        {
            var query = new TaskQueryParameters(page ?? 1, pageSize ?? 50);
            var errors = TaskValidation.Validate(query);
            if (errors.Count > 0)
            {
                return ValidationProblemResult(errors);
            }

            return TypedResults.Ok(await service.GetTasksAsync(query, ct));
        });

        group.MapGet("/{id:guid}", async Task<Results<Ok<TaskDto>, NotFound>> (
            Guid id,
            ITaskService service,
            CancellationToken ct) =>
        {
            var task = await service.GetTaskAsync(id, ct);
            return task is null ? TypedResults.NotFound() : TypedResults.Ok(task);
        });

        group.MapPost("/", async Task<Results<Created<TaskDto>, ValidationProblem>> (
            CreateTaskRequest request,
            ITaskService service,
            ILoggerFactory loggerFactory,
            CancellationToken ct) =>
        {
            var result = await service.CreateTaskAsync(request, ct);
            if (!result.IsValid)
            {
                return ValidationProblemResult(result.Errors!);
            }

            AppLog.Info(loggerFactory.CreateLogger("Tasks"), "Task created", ("TaskId", result.Value!.Id));
            return TypedResults.Created($"/api/tasks/{result.Value.Id}", result.Value);
        });

        group.MapPut("/{id:guid}", async Task<Results<Ok<TaskDto>, NotFound, ValidationProblem>> (
            Guid id,
            UpdateTaskRequest request,
            ITaskService service,
            ILoggerFactory loggerFactory,
            CancellationToken ct) =>
        {
            var result = await service.UpdateTaskAsync(id, request, ct);
            if (result.NotFound)
            {
                return TypedResults.NotFound();
            }

            if (!result.IsValid)
            {
                return ValidationProblemResult(result.Errors!);
            }

            AppLog.Info(loggerFactory.CreateLogger("Tasks"), "Task updated", ("TaskId", id));
            return TypedResults.Ok(result.Value!);
        });

        group.MapPatch("/{id:guid}/status", async Task<Results<Ok<TaskDto>, NotFound, ValidationProblem>> (
            Guid id,
            UpdateTaskStatusRequest request,
            ITaskService service,
            ILoggerFactory loggerFactory,
            CancellationToken ct) =>
        {
            var result = await service.UpdateStatusAsync(id, request, ct);
            if (result.NotFound)
            {
                return TypedResults.NotFound();
            }

            if (!result.IsValid)
            {
                return ValidationProblemResult(result.Errors!);
            }

            AppLog.Info(loggerFactory.CreateLogger("Tasks"), "Task status changed", ("TaskId", id));
            return TypedResults.Ok(result.Value!);
        });

        group.MapDelete("/{id:guid}", async Task<Results<NoContent, NotFound>> (
            Guid id,
            ITaskService service,
            ILoggerFactory loggerFactory,
            CancellationToken ct) =>
        {
            var deleted = await service.DeleteTaskAsync(id, ct);
            if (!deleted)
            {
                return TypedResults.NotFound();
            }

            AppLog.Info(loggerFactory.CreateLogger("Tasks"), "Task deleted", ("TaskId", id));
            return TypedResults.NoContent();
        });

        return group;
    }

    private static ValidationProblem ValidationProblemResult(Dictionary<string, string[]> errors)
    {
        return TypedResults.ValidationProblem(
            errors,
            title: "Validation failed",
            detail: "One or more validation errors occurred.",
            type: "https://httpstatuses.com/400");
    }
}
