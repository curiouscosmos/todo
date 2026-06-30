import { z } from "zod";

export const taskSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(120, "Title must be 120 characters or fewer."),
  description: z.string().trim().max(1000, "Description must be 1,000 characters or fewer."),
  priority: z.enum(["Low", "Medium", "High"]),
  dueDate: z.string(),
});

