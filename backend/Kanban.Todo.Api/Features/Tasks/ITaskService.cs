using Kanban.Todo.Api.Contracts;

namespace Kanban.Todo.Api.Features.Tasks;

public interface ITaskService
{
    Task<PagedResult<TaskDto>> GetTasksAsync(TaskQueryParameters query, CancellationToken ct);
    Task<TaskDto?> GetTaskAsync(Guid id, CancellationToken ct);
    Task<TaskResult<TaskDto>> CreateTaskAsync(CreateTaskRequest request, CancellationToken ct);
    Task<TaskResult<TaskDto>> UpdateTaskAsync(Guid id, UpdateTaskRequest request, CancellationToken ct);
    Task<TaskResult<TaskDto>> UpdateStatusAsync(Guid id, UpdateTaskStatusRequest request, CancellationToken ct);
    Task<bool> DeleteTaskAsync(Guid id, CancellationToken ct);
}
