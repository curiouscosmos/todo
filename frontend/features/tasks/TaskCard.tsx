import { Box, Flex, Heading, HStack, Text } from "@chakra-ui/react";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatDate } from "@/lib/formatDate";
import { DeleteTaskDialog } from "./DeleteTaskDialog";
import { TaskForm } from "./TaskForm";
import type { DeleteTaskHandler, TaskItem, UpdateTaskHandler } from "@/types/types";

const DESC_LENGTH_CHAR_LIMIT = 80;
export function TaskCard({
  task,
  disabled,
  onUpdate,
  onDelete,
}: {
  task: TaskItem;
  disabled?: boolean;
  onUpdate: UpdateTaskHandler;
  onDelete: DeleteTaskHandler;
}) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const tone = task.priority.toLowerCase() as "low" | "medium" | "high";
  const stripeColor = {
    low: "green.500",
    medium: "blue.500",
    high: "red.500",
  }[tone];

  const descLength = task?.description?.length;
  const description = descLength && descLength > DESC_LENGTH_CHAR_LIMIT ? task?.description?.substring(0, DESC_LENGTH_CHAR_LIMIT) : task?.description;
  return (
    <Box
      as="article"
      position="relative"
      minH="150px"
      borderRadius="lg"
      bg="bg.panel"
      boxShadow="sm"
      cursor="grab"
      overflow="hidden"
      p="4"
      pl="6"
      draggable
      _before={{
        content: '""',
        position: "absolute",
        inset: "0 auto 0 0",
        w: "1",
        bg: stripeColor,
      }}
      _active={{ cursor: "grabbing" }}
      onDragStart={(event) => {
        event.dataTransfer.setData("text/task-id", task.id);
        event.dataTransfer.setData("text/task-status", task.status);
      }}
    >
      <Flex as="header" justify="space-between" align="flex-start" gap="4" direction={{ base: "column", md: "row" }}>
        <Box>
          <Heading as="h3" size="md" mb="2" textTransform="capitalize" textDecoration={task.status === "Done" ? "line-through" : "none"}>
            {task.title}
          </Heading>
          <Text color="fg.muted" lineHeight="1.45">
            {description || "No description"} {descLength && descLength > DESC_LENGTH_CHAR_LIMIT ? "...": ""}
          </Text>
        </Box>
        <HStack role="group" aria-label={`Actions for ${task.title}`} gap="2" flexWrap="wrap" justify="flex-end">
          <Button size="sm" onClick={() => setEditing(true)}>
            Edit
          </Button>
          <Button size="sm" variant="danger" onClick={() => setConfirmingDelete(true)}>
            Delete
          </Button>
        </HStack>
      </Flex>
      <HStack as="footer" gap="6" mt="5" color="fg.muted" flexWrap="wrap">
        <Badge tone={tone}>⚑ {task.priority}</Badge>
        <Text fontSize="sm">Due {formatDate(task.dueDate)}</Text>
      </HStack>

      {editing ? (
        <Modal title="Edit task" onClose={() => setEditing(false)}>
          <TaskForm
            task={task}
            disabled={disabled}
            onCancel={() => setEditing(false)}
            onSubmit={async (values) => {
              await onUpdate(task.id, values);
              setEditing(false);
            }}
          />
        </Modal>
      ) : null}

      {confirmingDelete ? (
        <DeleteTaskDialog
          taskTitle={task.title}
          disabled={disabled}
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={async () => {
            await onDelete(task.id);
            setConfirmingDelete(false);
          }}
        />
      ) : null}
    </Box>
  );
}
