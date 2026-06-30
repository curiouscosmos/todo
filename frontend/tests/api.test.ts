import { afterEach, describe, expect, test, vi } from "vitest";
import { tasksApi } from "@/lib/api";
import { ApiError, apiClient } from "@/lib/apiClient";
import type { TaskFormValues } from "@/types/types";

const okJsonResponse = (data: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  text: async () => JSON.stringify(data),
});

const noContentResponse = () => ({
  ok: true,
  status: 204,
  text: async () => "",
});

describe("tasksApi", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("returns API task statuses without client-side legacy mapping", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        okJsonResponse({
          items: [
            {
              id: "1",
              title: "Legacy active",
              description: null,
              priority: "Medium",
              status: "Todo",
              dueDate: null,
              createdAt: "2026-06-28T00:00:00Z",
              updatedAt: "2026-06-28T00:00:00Z",
              completedAt: null,
            },
            {
              id: "2",
              title: "Legacy completed",
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
        }),
      ),
    );

    const result = await tasksApi.list();

    expect(result.items.map((task) => task.status)).toEqual(["Todo", "Done"]);
  });

  test("requests the simplified newest-first task list", async () => {
    const fetchMock = vi.fn(async () => okJsonResponse({ items: [], page: 2, pageSize: 25, totalCount: 0, totalPages: 0 }));
    vi.stubGlobal("fetch", fetchMock);

    await tasksApi.list();

    const [[url]] = fetchMock.mock.calls as unknown as Array<[string, RequestInit]>;
    const parsed = new URL(String(url));

    // The frontend no longer exposes filters/search/sort, so the client should not send stale query knobs.
    expect(parsed.pathname).toBe("/api/tasks");
    expect(parsed.searchParams.get("page")).toBe("1");
    expect(parsed.searchParams.get("pageSize")).toBe("50");
    expect(parsed.searchParams.has("status")).toBe(false);
    expect(parsed.searchParams.has("priority")).toBe(false);
    expect(parsed.searchParams.has("search")).toBe(false);
    expect(parsed.searchParams.has("sortBy")).toBe(false);
    expect(parsed.searchParams.has("sortDirection")).toBe(false);
  });

  test("rejects malformed task data before it reaches the UI", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        okJsonResponse({
          items: [
            {
              id: "broken-task",
              description: "Missing title and priority",
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

    // Runtime validation protects TaskCard from assuming required server fields exist.
    await expect(tasksApi.list()).rejects.toMatchObject({
      message: "The API returned invalid task data.",
      status: 0,
    });
  });

  test("sends create, update, status, and delete requests with expected methods and bodies", async () => {
    const taskValues: TaskFormValues = {
      title: "Review labs",
      description: "",
      priority: "High",
      dueDate: "2026-07-01",
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(okJsonResponse({ id: "new-task" }))
      .mockResolvedValueOnce(okJsonResponse({ id: "task-1" }))
      .mockResolvedValueOnce(okJsonResponse({ id: "task-1" }))
      .mockResolvedValueOnce(noContentResponse());
    vi.stubGlobal("fetch", fetchMock);

    await tasksApi.create(taskValues, "Todo");
    await tasksApi.update("task-1", { ...taskValues, description: "Updated" });
    await tasksApi.setStatus("task-1", "Done");
    await tasksApi.delete("task-1");

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "http://localhost:5000/api/tasks",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"status":"Todo"'),
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
      }),
    );
    const requestCalls = fetchMock.mock.calls as unknown as Array<[string, RequestInit]>;

    expect(JSON.parse(String(requestCalls[0][1].body))).toMatchObject({
      title: "Review labs",
      description: null,
      priority: "High",
      dueDate: new Date("2026-07-01T00:00:00").toISOString(),
      status: "Todo",
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "http://localhost:5000/api/tasks/task-1",
      expect.objectContaining({ method: "PUT", body: expect.stringContaining('"description":"Updated"') }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "http://localhost:5000/api/tasks/task-1/status",
      expect.objectContaining({ method: "PATCH", body: JSON.stringify({ status: "Done" }) }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      "http://localhost:5000/api/tasks/task-1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  test("wraps invalid JSON as ApiError", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        text: async () => "not-json",
      })),
    );

    await expect(apiClient("/bad-json")).rejects.toBeInstanceOf(ApiError);
  });

  test("wraps network failure as ApiError", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );

    await expect(apiClient("/offline")).rejects.toMatchObject({
      message: "Unable to reach the API. Check that the backend is running.",
      status: 0,
    });
  });
});
