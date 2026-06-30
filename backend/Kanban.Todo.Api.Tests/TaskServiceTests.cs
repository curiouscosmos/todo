using Kanban.Todo.Api.Contracts;
using Kanban.Todo.Api.Data;
using Kanban.Todo.Api.Features.Tasks;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace Kanban.Todo.Api.Tests;

public sealed class TaskServiceTests
{
    [Fact]
    public async Task CreateTaskAsync_creates_valid_task_and_trims_text()
    {
        await using var fixture = await ServiceFixture.CreateAsync();

        var result = await fixture.Service.CreateTaskAsync(
            new CreateTaskRequest("  Labs  ", "  Schedule appointment  ", "High", null),
            CancellationToken.None);

        Assert.True(result.IsValid);
        Assert.Equal("Labs", result.Value!.Title);
        Assert.Equal("Schedule appointment", result.Value.Description);
        Assert.Equal("High", result.Value.Priority);
        Assert.Equal("Todo", result.Value.Status);
    }

    [Fact]
    public async Task CreateTaskAsync_rejects_empty_title()
    {
        await using var fixture = await ServiceFixture.CreateAsync();

        var result = await fixture.Service.CreateTaskAsync(
            new CreateTaskRequest(" ", null, "Medium", null),
            CancellationToken.None);

        Assert.False(result.IsValid);
        Assert.Contains("title", result.Errors!.Keys);
    }

    [Fact]
    public async Task UpdateStatusAsync_sets_and_clears_completed_at()
    {
        await using var fixture = await ServiceFixture.CreateAsync();
        var created = await fixture.Service.CreateTaskAsync(
            new CreateTaskRequest("Review", null, "Medium", null),
            CancellationToken.None);

        var completed = await fixture.Service.UpdateStatusAsync(
            created.Value!.Id,
            new UpdateTaskStatusRequest("Done"),
            CancellationToken.None);
        var reopened = await fixture.Service.UpdateStatusAsync(
            created.Value.Id,
            new UpdateTaskStatusRequest("Todo"),
            CancellationToken.None);

        Assert.Equal("Done", completed.Value!.Status);
        Assert.NotNull(completed.Value.CompletedAt);
        Assert.Equal("Todo", reopened.Value!.Status);
        Assert.Null(reopened.Value.CompletedAt);
    }

    [Fact]
    public async Task GetTaskAsync_returns_null_for_missing_task()
    {
        await using var fixture = await ServiceFixture.CreateAsync();

        var task = await fixture.Service.GetTaskAsync(Guid.NewGuid(), CancellationToken.None);

        Assert.Null(task);
    }

    [Fact]
    public async Task GetTasksAsync_returns_newest_tasks_first()
    {
        await using var fixture = await ServiceFixture.CreateAsync();
        var first = await fixture.Service.CreateTaskAsync(
            new CreateTaskRequest("First task", null, "Low", null),
            CancellationToken.None);
        await Task.Delay(5);
        var second = await fixture.Service.CreateTaskAsync(
            new CreateTaskRequest("Second task", null, "Low", null),
            CancellationToken.None);

        var result = await fixture.Service.GetTasksAsync(new TaskQueryParameters(), CancellationToken.None);

        Assert.Equal(second.Value!.Id, result.Items[0].Id);
        Assert.Equal(first.Value!.Id, result.Items[1].Id);
    }

    [Fact]
    public async Task GetTasksAsync_clamps_pagination_bounds()
    {
        await using var fixture = await ServiceFixture.CreateAsync();
        for (var i = 0; i < 3; i++)
        {
            await fixture.Service.CreateTaskAsync(
                new CreateTaskRequest($"Task {i}", null, "Medium", null),
                CancellationToken.None);
        }

        var result = await fixture.Service.GetTasksAsync(
            new TaskQueryParameters(Page: -10, PageSize: 100),
            CancellationToken.None);

        Assert.Equal(1, result.Page);
        Assert.Equal(50, result.PageSize);
        Assert.Equal(3, result.TotalCount);
    }

    private sealed class ServiceFixture : IAsyncDisposable
    {
        private readonly SqliteConnection _connection;
        private readonly TodoDbContext _db;

        private ServiceFixture(SqliteConnection connection, TodoDbContext db)
        {
            _connection = connection;
            _db = db;
            Service = new TaskService(db, TimeProvider.System);
        }

        public TaskService Service { get; }

        public static async Task<ServiceFixture> CreateAsync()
        {
            var connection = new SqliteConnection("Data Source=:memory:");
            await connection.OpenAsync();
            var options = new DbContextOptionsBuilder<TodoDbContext>()
                .UseSqlite(connection)
                .Options;
            var db = new TodoDbContext(options);
            await db.Database.EnsureCreatedAsync();
            return new ServiceFixture(connection, db);
        }

        public async ValueTask DisposeAsync()
        {
            await _db.DisposeAsync();
            await _connection.DisposeAsync();
        }
    }
}
