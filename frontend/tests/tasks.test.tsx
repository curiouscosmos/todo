import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { ErrorState } from "@/components/ui/ErrorState";
import { TaskForm } from "@/features/tasks/TaskForm";
import { TaskList } from "@/features/tasks/TaskList";
import type { KanbanColumn, TaskItem } from "@/types/types";
import { render } from "./test-utils";

const columns: KanbanColumn[] = [
  { status: "Todo", title: "Todo", canCreateTask: true },
  { status: "InProgress", title: "In Progress" },
  { status: "Done", title: "Done" },
];

const task: TaskItem = {
  id: "task-1",
  title: "Review labs",
  description: "Check due date",
  priority: "High",
  status: "Todo",
  dueDate: "2026-07-01T00:00:00Z",
  createdAt: "2026-06-28T00:00:00Z",
  updatedAt: "2026-06-28T00:00:00Z",
  completedAt: null,
};

describe("task UI", () => {
  test("validates the task form", async () => {
    const onSubmit = vi.fn();
    render(<TaskForm onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole("button", { name: "Create task" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Title is required.");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("renders Kanban columns and tasks", () => {
    render(
      <TaskList
        columns={columns}
        tasks={[task]}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onMove={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByRole("region", { name: "Todo column" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "In Progress column" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Done column" })).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "Todo column" })).getByRole("heading", { name: "Review labs" })).toBeInTheDocument();
  });

  test("empty columns show a drop hint", () => {
    render(
      <TaskList
        columns={columns}
        tasks={[]}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onMove={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("Create a task to get started")).toBeInTheDocument();
    expect(screen.getAllByText("Drop a task here")).toHaveLength(2);
  });

  test("creates a task in a specific column", async () => {
    const onCreate = vi.fn();
    render(
      <TaskList
        columns={columns}
        tasks={[]}
        onCreate={onCreate}
        onUpdate={vi.fn()}
        onMove={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    fireEvent.click(screen.getAllByRole("button", { name: /Add task/ })[0]);
    fireEvent.change(screen.getByRole("textbox", { name: "Title" }), { target: { value: "New card" } });
    fireEvent.click(screen.getByRole("button", { name: "Add to Todo" }));

    await waitFor(() => expect(onCreate).toHaveBeenCalledWith("Todo", expect.objectContaining({ title: "New card" })));
  });

  test("dropping a card on a column calls move mutation", () => {
    const onMove = vi.fn();
    const dataTransfer = {
      getData: vi.fn(() => "task-1"),
      setData: vi.fn(),
    };

    render(
      <TaskList
        columns={columns}
        tasks={[task]}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onMove={onMove}
        onDelete={vi.fn()}
      />,
    );

    const doneColumn = screen.getByRole("region", { name: "Done column" });
    fireEvent.drop(doneColumn, { dataTransfer });

    expect(onMove).toHaveBeenCalledWith("task-1", "Done");
  });

  test("dropping a card on its current column does not call move mutation", () => {
    const onMove = vi.fn();
    const dataTransfer = {
      getData: vi.fn((type: string) => (type === "text/task-id" ? "task-1" : "Todo")),
      setData: vi.fn(),
    };

    render(
      <TaskList
        columns={columns}
        tasks={[task]}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onMove={onMove}
        onDelete={vi.fn()}
      />,
    );

    const todoColumn = screen.getByRole("region", { name: "Todo column" });
    fireEvent.drop(todoColumn, { dataTransfer });

    expect(onMove).not.toHaveBeenCalled();
  });

  test("highlights empty drop hints while a task is dragged", () => {
    const transferData = new Map<string, string>();
    const dataTransfer = {
      getData: vi.fn((type: string) => transferData.get(type) ?? ""),
      setData: vi.fn((type: string, value: string) => transferData.set(type, value)),
    };

    render(
      <TaskList
        columns={columns}
        tasks={[task]}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onMove={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    fireEvent.dragStart(screen.getByRole("article"), { dataTransfer });

    expect(screen.getAllByText("Drop a task here").map((element) => element.dataset.highlighted)).toEqual(["true", "true"]);
  });

  test("edits an existing task and submits updated values", async () => {
    const onUpdate = vi.fn();
    render(
      <TaskList
        columns={columns}
        tasks={[task]}
        onCreate={vi.fn()}
        onUpdate={onUpdate}
        onMove={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Title" }), { target: { value: "Review imaging" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Priority" }), { target: { value: "Low" } });
    fireEvent.change(screen.getByLabelText("Due date"), { target: { value: "2026-07-10" } });
    fireEvent.click(screen.getByRole("button", { name: "Save task" }));

    // Edit coverage protects the modal form wiring, not just the standalone TaskForm validation.
    await waitFor(() =>
      expect(onUpdate).toHaveBeenCalledWith(
        "task-1",
        expect.objectContaining({
          title: "Review imaging",
          priority: "Low",
          dueDate: "2026-07-10",
        }),
      ),
    );
  });

  test("delete confirmation calls mutation only after confirmation", async () => {
    const onDelete = vi.fn();
    render(
      <TaskList
        columns={columns}
        tasks={[task]}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onMove={vi.fn()}
        onDelete={onDelete}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onDelete).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Delete task" }));

    await waitFor(() => expect(onDelete).toHaveBeenCalledWith("task-1"));
  });

  test("API error state displays user-friendly message", () => {
    render(<ErrorState message="Something went wrong. Check that the API is running." onRetry={vi.fn()} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong");
  });
});
