using System.Net;
using System.Net.Http.Json;
using Kanban.Todo.Api.Contracts;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Kanban.Todo.Api.Tests;

public sealed class TaskEndpointTests
{
    [Fact]
    public async Task Post_and_get_tasks_returns_created_task()
    {
        await using var app = new TodoApiFactory();
        var client = app.CreateClient();

        var createResponse = await client.PostAsJsonAsync("/api/tasks", new CreateTaskRequest(
            "Endpoint task",
            "Created by integration test",
            "High",
            null,
            "InProgress"));
        var created = await createResponse.Content.ReadFromJsonAsync<TaskDto>();
        var list = await client.GetFromJsonAsync<PagedResult<TaskDto>>("/api/tasks");

        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        Assert.NotNull(created);
        Assert.Equal("InProgress", created.Status);
        Assert.Contains(list!.Items, task => task.Id == created.Id);
    }

    [Fact]
    public async Task Invalid_pagination_query_returns_validation_problem()
    {
        await using var app = new TodoApiFactory();
        var client = app.CreateClient();

        var response = await client.GetAsync("/api/tasks?page=0&pageSize=100");
        var problem = await response.Content.ReadFromJsonAsync<HttpValidationProblemDetails>();

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.NotNull(problem);
        Assert.Contains("page", problem.Errors.Keys);
        Assert.Contains("pageSize", problem.Errors.Keys);
    }

    [Fact]
    public async Task Missing_task_returns_not_found()
    {
        await using var app = new TodoApiFactory();
        var client = app.CreateClient();

        var response = await client.GetAsync($"/api/tasks/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Frontend_origin_preflight_is_allowed()
    {
        await using var app = new TodoApiFactory();
        var client = app.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Options, "/api/tasks");
        request.Headers.Add("Origin", "http://localhost:3000");
        request.Headers.Add("Access-Control-Request-Method", "POST");
        request.Headers.Add("Access-Control-Request-Headers", "content-type");

        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.True(response.Headers.TryGetValues("Access-Control-Allow-Origin", out var origins));
        Assert.Contains("http://localhost:3000", origins);
    }

    private sealed class TodoApiFactory : WebApplicationFactory<Program>
    {
        private readonly string _dbDirectory = Path.Combine(Path.GetTempPath(), "kanban-todo-tests");
        private readonly string _dbPath;

        public TodoApiFactory()
        {
            Directory.CreateDirectory(_dbDirectory);
            _dbPath = Path.Combine(_dbDirectory, $"todo-tests-{Guid.NewGuid():N}.db");
            Environment.SetEnvironmentVariable("ConnectionStrings__TodoDb", $"Data Source={_dbPath}");
        }

        public override async ValueTask DisposeAsync()
        {
            await base.DisposeAsync();
            Environment.SetEnvironmentVariable("ConnectionStrings__TodoDb", null);
            if (File.Exists(_dbPath))
            {
                File.Delete(_dbPath);
            }
        }
    }
}
