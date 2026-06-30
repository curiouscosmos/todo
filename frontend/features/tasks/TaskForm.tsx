import { Grid, HStack, VStack } from "@chakra-ui/react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { taskSchema } from "@/types/taskSchema";
import type { TaskFormValues, TaskItem } from "@/types/types";

const emptyValues: TaskFormValues = {
  title: "",
  description: "",
  priority: "Medium",
  dueDate: "",
};

export function TaskForm({
  task,
  disabled,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  task?: TaskItem | null;
  disabled?: boolean;
  submitLabel?: string;
  onSubmit: (values: TaskFormValues) => Promise<void> | void;
  onCancel?: () => void;
}) {
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<TaskFormValues>({
    defaultValues: task ? toFormValues(task) : emptyValues,
  });

  useEffect(() => {
    reset(task ? toFormValues(task) : emptyValues);
  }, [reset, task]);

  return (
    <form
      onSubmit={handleSubmit(async (values) => {
        // React Hook Form gathers values; Zod owns the final client-side contract before the API call.
        const parsed = taskSchema.safeParse(values);
        if (!parsed.success) {
          for (const issue of parsed.error.issues) {
            setError(issue.path[0] as keyof TaskFormValues, { message: issue.message });
          }
          return;
        }

        await onSubmit(parsed.data);
        if (!task) reset(emptyValues);
      })}
    >
      <VStack align="stretch" gap="4">
        <Input label="Title" maxLength={120} error={errors.title?.message} {...register("title")} />
        <Textarea maxLength={1000} label="Description" rows={3} error={errors.description?.message} {...register("description")} />
        <Grid templateColumns={{ base: "1fr", md: "repeat(2, minmax(0, 1fr))" }} gap="4">
          <Select label="Priority" error={errors.priority?.message} {...register("priority")}>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </Select>
          <Input label="Due date" type="date" error={errors.dueDate?.message} {...register("dueDate")} />
        </Grid>
        <HStack gap="3" flexWrap="wrap">
          <Button type="submit" variant="primary" disabled={disabled}>
            {submitLabel ?? (task ? "Save task" : "Create task")}
          </Button>
          {onCancel ? (
            <Button type="button" onClick={onCancel}>
              Cancel
            </Button>
          ) : null}
        </HStack>
      </VStack>
    </form>
  );
}

function toFormValues(task: TaskItem): TaskFormValues {
  // Native date inputs expect YYYY-MM-DD, while the API returns ISO timestamps.
  return {
    title: task.title,
    description: task.description ?? "",
    priority: task.priority,
    dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
  };
}
