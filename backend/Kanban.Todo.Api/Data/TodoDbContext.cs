using Kanban.Todo.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace Kanban.Todo.Api.Data;

public sealed class TodoDbContext(DbContextOptions<TodoDbContext> options) : DbContext(options)
{
    public DbSet<TaskItem> Tasks => Set<TaskItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var task = modelBuilder.Entity<TaskItem>();

        task.HasKey(x => x.Id);
        task.Property(x => x.Title).HasMaxLength(120).IsRequired();
        task.Property(x => x.Description).HasMaxLength(1000);
        task.Property(x => x.Priority).HasConversion<string>().HasMaxLength(20).IsRequired();
        task.Property(x => x.Status).HasConversion<string>().HasMaxLength(20).IsRequired();
        task.Property(x => x.DueDate)
            .HasConversion(
                x => x.HasValue ? x.Value.UtcTicks : (long?)null,
                x => x.HasValue ? new DateTimeOffset(x.Value, TimeSpan.Zero) : null);
        task.Property(x => x.CreatedAt)
            .HasConversion(x => x.UtcTicks, x => new DateTimeOffset(x, TimeSpan.Zero));
        task.Property(x => x.UpdatedAt)
            .HasConversion(x => x.UtcTicks, x => new DateTimeOffset(x, TimeSpan.Zero));
        task.Property(x => x.CompletedAt)
            .HasConversion(
                x => x.HasValue ? x.Value.UtcTicks : (long?)null,
                x => x.HasValue ? new DateTimeOffset(x.Value, TimeSpan.Zero) : null);
        task.HasIndex(x => x.Status);
        task.HasIndex(x => x.DueDate);
        // The list endpoint intentionally returns newest tasks first, so keep that access path indexed.
        task.HasIndex(x => x.CreatedAt);
    }
}
