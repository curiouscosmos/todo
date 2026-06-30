import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { TaskDashboard } from "@/features/tasks/TaskDashboard";
import { rootStore } from "@/stores/root.store";
import { render } from "./test-utils";

const tasksResponse = {
  items: [
    {
      id: "todo-1",
      title: "Todo card",
      description: null,
      priority: "Medium",
      status: "Todo",
      dueDate: null,
      createdAt: "2026-06-28T00:00:00Z",
      updatedAt: "2026-06-28T00:00:00Z",
      completedAt: null,
    },
    {
      id: "done-1",
      title: "Done card",
      description: null,
      priority: "Low",
      status: "Done",
      dueDate: null,
      createdAt: "2026-06-28T00:00:00Z",
      updatedAt: "2026-06-28T00:00:00Z",
      completedAt: "2026-06-28T00:00:00Z",
    },
  ],
  page: 1,
  pageSize: 50,
  totalCount: 2,
  totalPages: 1,
};

function okJsonResponse(data: unknown) {
  return {
    ok: true,
    status: 200,
    text: async () => JSON.stringify(data),
  };
}

describe("TaskDashboard", () => {
  beforeEach(() => {
    rootStore.todoStore.tasks = [];
    rootStore.todoStore.error = "";
    rootStore.todoStore.notice = "";
    rootStore.todoStore.loading = false;
    rootStore.todoStore.saving = false;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => okJsonResponse(tasksResponse)),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("loads tasks into their Kanban columns", async () => {
    render(<TaskDashboard />);

    const todoColumn = await screen.findByRole("region", { name: "Todo column" });
    const doneColumn = screen.getByRole("region", { name: "Done column" });

    await waitFor(() => expect(within(todoColumn).getByText("Todo card")).toBeInTheDocument());
    expect(within(doneColumn).getByText("Done card")).toBeInTheDocument();
  });

  test("shows a friendly API error and retries loading tasks", async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new Error("network down")).mockResolvedValueOnce(okJsonResponse(tasksResponse));
    vi.stubGlobal("fetch", fetchMock);

    render(<TaskDashboard />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to reach the API");

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    // This is a dashboard-level workflow check: error UI, retry action, store reload, and board render.
    expect(await screen.findByText("Todo card")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test("shows an error instead of rendering malformed task data", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        okJsonResponse({
          items: [
            {
              id: "broken-task",
              description: "Missing fields from a corrupted backend row",
              status: "Todo",
              dueDate: null,
              createdAt: "2026-06-28T00:00:00Z",
              updatedAt: "2026-06-28T00:00:00Z",
              completedAt: null,
            },
          ],
          page: 1,
          pageSize: 50,
          totalCount: 1,
          totalPages: 1,
        }),
      ),
    );

    render(<TaskDashboard />);

    // The dashboard should fail closed through the existing alert, not let malformed cards crash rendering.
    expect(await screen.findByRole("alert")).toHaveTextContent("The API returned invalid task data.");
    expect(screen.queryByText("Missing fields from a corrupted backend row")).not.toBeInTheDocument();
  });
});
