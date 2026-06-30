import { apiClient } from "@/lib/apiClient";
import { ApiError } from "@/lib/apiClient";
import type { PagedResult, TaskFormValues, TaskItem, TaskStatus } from "@/types/types";
import { z } from "zod";

const taskStatusSchema = z.enum(["Todo", "InProgress", "Done"]);
const taskPrioritySchema = z.enum(["Low", "Medium", "High"]);

const nullableDateStringSchema = z
  .string()
  .nullable()
  .optional()
  .refine((value) => !value || !Number.isNaN(Date.parse(value)), "Expected a valid date string.");

const taskItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  priority: taskPrioritySchema,
  status: taskStatusSchema,
  dueDate: nullableDateStringSchema,
  createdAt: z.string().refine((value) => !Number.isNaN(Date.parse(value)), "Expected a valid creation date."),
  updatedAt: z.string().refine((value) => !Number.isNaN(Date.parse(value)), "Expected a valid update date."),
  completedAt: nullableDateStringSchema,
});

const taskListSchema = z.object({
  items: z.array(taskItemSchema),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  totalCount: z.number().int().min(0),
  totalPages: z.number().int().min(0),
});

function body(values: TaskFormValues, status?: TaskStatus) {
  return {
    title: values.title,
    description: values.description || null,
    priority: values.priority,
    dueDate: values.dueDate ? new Date(`${values.dueDate}T00:00:00`).toISOString() : null,
    status,
  };
}

export const tasksApi = {
  async list() {
    // The backend intentionally owns the default newest-first ordering; the board does not expose filters/search.
    const response = await apiClient<unknown>("/api/tasks?page=1&pageSize=50");
    const parsed = taskListSchema.safeParse(response);

    if (!parsed.success) {
      // Validate server data before rendering so corrupted rows fail through the normal error UI instead of crashing cards.
      throw new ApiError("The API returned invalid task data.", 0);
    }

    return parsed.data satisfies PagedResult<TaskItem>;
  },
  async create(values: TaskFormValues, status: TaskStatus) {
    return apiClient<TaskItem>("/api/tasks", {
      method: "POST",
      body: JSON.stringify(body(values, status)),
    });
  },
  async update(id: string, values: TaskFormValues) {
    return apiClient<TaskItem>(`/api/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(body(values)),
    });
  },
  async setStatus(id: string, status: TaskStatus) {
    return apiClient<TaskItem>(`/api/tasks/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },
  delete(id: string) {
    return apiClient<void>(`/api/tasks/${id}`, { method: "DELETE" });
  },
};
