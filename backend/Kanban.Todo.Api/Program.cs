using Kanban.Todo.Api.Data;
using Kanban.Todo.Api.Features.Tasks;
using Kanban.Todo.Api.Infrastructure;
using Kanban.Todo.Api.Middleware;
using Microsoft.EntityFrameworkCore;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddProblemDetails();
var allowedFrontendOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>()
    ?? ["http://localhost:3000", "http://127.0.0.1:3000"];
var todoConnectionString = builder.Configuration.GetConnectionString("TodoDb");
if (string.IsNullOrWhiteSpace(todoConnectionString))
{
    throw new InvalidOperationException("Connection string 'TodoDb' is required.");
}

builder.Services.AddDbContext<TodoDbContext>(options =>
    options.UseSqlite(todoConnectionString));
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddScoped<ITaskService, TaskService>();
builder.Services.AddRateLimiter(options =>
{
    // A modest global API limit is enough for the demo and keeps abuse protection visible without adding auth complexity.
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(_ =>
        RateLimitPartition.GetFixedWindowLimiter("api", _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 120,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0,
            QueueProcessingOrder = QueueProcessingOrder.OldestFirst
        }));
});
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy.WithOrigins(allowedFrontendOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseMiddleware<ErrorHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// Keep CORS independent of the launch profile so the local Next.js app can call the API from a browser.
app.UseCors("Frontend");
app.UseHttpsRedirection();
app.UseRateLimiter();

Directory.CreateDirectory(Path.Combine(app.Environment.ContentRootPath, "App_Data"));

if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<TodoDbContext>();
    db.Database.Migrate();
}

AppLog.Info(app.Logger, "API startup complete");

app.MapGet("/health", () => Results.Ok(new { status = "ok" }))
    .WithName("HealthCheck");

app.MapTaskEndpoints();

app.Run();

public partial class Program;
