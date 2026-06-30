using Kanban.Todo.Api.Infrastructure;
using Microsoft.AspNetCore.Mvc;

namespace Kanban.Todo.Api.Middleware;

public sealed class ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            AppLog.Error(logger, ex, "Unexpected API error");

            if (context.Response.HasStarted)
            {
                throw;
            }

            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            // Return a stable problem-details shape without leaking stack traces or implementation details.
            await context.Response.WriteAsJsonAsync(new ProblemDetails
            {
                Type = "https://httpstatuses.com/500",
                Title = "Unexpected error",
                Status = StatusCodes.Status500InternalServerError,
                Detail = "An unexpected error occurred."
            });
        }
    }
}
