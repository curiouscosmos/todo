export type TaskPriority = "Low" | "Medium" | "High";
export type TaskStatus = "Todo" | "InProgress" | "Done";

export type TaskItem = {
  id: string;
  title: string;
  description?: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
};

export type PagedResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export type TaskFormValues = {
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: string;
};

export type KanbanColumn = {
  status: TaskStatus;
  title: string;
  canCreateTask?: boolean;
};

export type TaskActionResult = Promise<void> | void;

export type CreateTaskHandler = (status: TaskStatus, values: TaskFormValues) => TaskActionResult;
export type UpdateTaskHandler = (id: string, values: TaskFormValues) => TaskActionResult;
export type MoveTaskHandler = (id: string, status: TaskStatus) => TaskActionResult;
export type DeleteTaskHandler = (id: string) => TaskActionResult;
