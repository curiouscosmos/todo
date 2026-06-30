import { beforeEach, describe, expect, test, vi } from "vitest";
import { ApiError } from "@/lib/apiClient";
import { TodoStore } from "@/stores/todo.store";
import type { PagedResult, TaskItem } from "@/types/types";

const apiMocks = vi.hoisted(() => ({
  create: vi.fn(),
  list: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  tasksApi: {
    create: apiMocks.create,
    list: apiMocks.list,
    update: vi.fn(),
    setStatus: vi.fn(),
    delete: vi.fn(),
  },
}));

const createdTask: TaskItem = {
  id: "task-1",
  title: "Created task",
  description: null,
  priority: "Medium",
  status: "Todo",
  dueDate: null,
  createdAt: "2026-06-28T00:00:00Z",
  updatedAt: "2026-06-28T00:00:00Z",
  completedAt: null,
};

function pagedTasks(items: TaskItem[]): PagedResult<TaskItem> {
  return {
    items,
    page: 1,
    pageSize: 50,
    totalCount: items.length,
    totalPages: 1,
  };
}

describe("TodoStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("refetches server-owned task state after a successful mutation", async () => {
    apiMocks.create.mockResolvedValue(createdTask);
    apiMocks.list.mockResolvedValue(pagedTasks([createdTask]));
    const store = new TodoStore();

    await store.createTask(
      {
        title: "Created task",
        description: "",
        priority: "Medium",
        dueDate: "",
      },
      "Todo",
    );

    // Store tests cover the MobX/API workflow that component callback tests intentionally mock out.
    expect(apiMocks.create).toHaveBeenCalledOnce();
    expect(apiMocks.list).toHaveBeenCalledOnce();
    expect(store.tasks).toEqual([createdTask]);
    expect(store.notice).toBe("Task created in Todo.");
    expect(store.saving).toBe(false);
  });

  test("surfaces API problem details when a mutation fails", async () => {
    apiMocks.create.mockRejectedValue(new ApiError("Validation failed", 400, { detail: "Title is required." }));
    const store = new TodoStore();

    await store.createTask(
      {
        title: "",
        description: "",
        priority: "Medium",
        dueDate: "",
      },
      "Todo",
    );

    expect(store.error).toBe("Title is required.");
    expect(store.saving).toBe(false);
    expect(apiMocks.list).not.toHaveBeenCalled();
  });
});
