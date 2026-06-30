namespace Kanban.Todo.Api.Infrastructure;

public static class AppLog
{
    public static void Info(ILogger logger, string message, params (string Key, object? Value)[] properties)
    {
        // Keep logging calls structured and centralized so sensitive payloads are not logged ad hoc in feature code.
        using var scope = logger.BeginScope(ToDictionary(properties));
        logger.LogInformation("{Message}", message);
    }

    public static void Error(ILogger logger, Exception exception, string message, params (string Key, object? Value)[] properties)
    {
        using var scope = logger.BeginScope(ToDictionary(properties));
        logger.LogError(exception, "{Message}", message);
    }

    private static Dictionary<string, object?> ToDictionary((string Key, object? Value)[] properties)
    {
        return properties.ToDictionary(x => x.Key, x => x.Value);
    }
}
