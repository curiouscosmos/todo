import { Box, Grid, Heading, HStack, Text, VStack } from "@chakra-ui/react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { TaskCard } from "./TaskCard";
import { TaskForm } from "./TaskForm";
import type {
  CreateTaskHandler,
  DeleteTaskHandler,
  KanbanColumn,
  MoveTaskHandler,
  TaskItem,
  TaskStatus,
  UpdateTaskHandler,
} from "@/types/types";

const columnColors: Record<TaskStatus, string> = {
  Todo: "blue.500",
  InProgress: "yellow.500",
  Done: "green.500",
};

export function TaskList({
  tasks,
  columns,
  disabled,
  onCreate,
  onUpdate,
  onMove,
  onDelete,
}: {
  tasks: TaskItem[];
  columns: KanbanColumn[];
  disabled?: boolean;
  onCreate: CreateTaskHandler;
  onUpdate: UpdateTaskHandler;
  onMove: MoveTaskHandler;
  onDelete: DeleteTaskHandler;
}) {
  const [creatingStatus, setCreatingStatus] = useState<TaskStatus | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const creatingColumn = columns.find((column) => column.status === creatingStatus);
  // Track the active drag locally so empty columns can show drop affordance without touching global state.
  const draggedTask = draggedTaskId ? tasks.find((task) => task.id === draggedTaskId) : null;

  return (
    <Grid
      as="section"
      aria-label="Kanban board"
      templateColumns={{ base: "minmax(280px, 1fr)", lg: "repeat(3, minmax(260px, 1fr))" }}
      gap={{ base: "7", lg: "18" }}
      alignItems="start"
      overflowX="auto"
      pb="1"
      onDragStart={(event) => {
        const id = event.dataTransfer.getData("text/task-id");

        if (id) {
          setDraggedTaskId(id);
        }
      }}
      onDragEnd={() => setDraggedTaskId(null)}
    >
      {columns.map((column) => (
        <VStack
          as="section"
          key={column.status}
          aria-label={`${column.title} column`}
          align="stretch"
          gap="4"
          minH={{ base: "auto", lg: "640px" }}
          bg="bg.panel"
          border="1px solid"
          borderColor="border"
          borderRadius="lg"
          boxShadow="md"
          p="5"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            const id = event.dataTransfer.getData("text/task-id");
            const task = tasks.find((item) => item.id === id);

            setDraggedTaskId(null);

            // Dropping back onto the source column is a visual no-op and should not trigger a backend mutation.
            if (!task || task.status === column.status) {
              return;
            }

            void onMove(id, column.status);
          }}
        >
          <HStack as="header" justify="space-between" minH="8" borderBottom="1px solid" borderBottomColor="border" pb={4}>
            <HStack gap="3">
              <Box
                aria-hidden="true"
                w="4"
                h="4"
                borderRadius="full"
                bg={columnColors[column.status]}
                outline="3px solid"
                outlineColor="bg.emphasized"
              />
              <Heading as="h2" id={`column-${column.status}`} size="md">
                {column.title}
              </Heading>
            </HStack>
            <Text fontWeight="bold">{tasks.filter((task) => task.status === column.status).length}</Text>
          </HStack>
          <VStack align="stretch" gap="5">
            {tasks
              .filter((task) => task.status === column.status)
              .map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  disabled={disabled}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                />
              ))}
          </VStack>
          {tasks.some((task) => task.status === column.status) ? null : (
            <Box
              border="1px dashed"
              borderColor={draggedTask && draggedTask.status !== column.status ? columnColors[column.status] : "border"}
              borderRadius="lg"
              color={draggedTask && draggedTask.status !== column.status ? columnColors[column.status] : "fg.muted"}
              bg={draggedTask && draggedTask.status !== column.status ? "bg.subtle" : "transparent"}
              boxShadow={draggedTask && draggedTask.status !== column.status ? "0 0 0 3px var(--chakra-colors-bg-emphasized)" : "none"}
              data-highlighted={draggedTask && draggedTask.status !== column.status ? "true" : undefined}
              fontWeight={draggedTask && draggedTask.status !== column.status ? "semibold" : "normal"}
              p="4"
              textAlign="center"
              transition="border-color 120ms ease, box-shadow 120ms ease, color 120ms ease"
            >
              {column.canCreateTask ? "Create a task to get started" : "Drop a task here"}
            </Box>
          )}
          {column.canCreateTask ? (
            <Button
              minH="14"
              justifyContent="center"
              border="2px dashed"
              borderRadius={22}
              borderColor={columnColors[column.status]}
              color={columnColors[column.status]}
              bg="transparent"
              variant="secondary"
              fontSize={18}
              onClick={() => setCreatingStatus(column.status)}
            >
              <span aria-hidden="true">＋</span> Add task
            </Button>
          ) : null}
        </VStack>
      ))}
      {creatingColumn ? (
        <Modal title={`Add card to ${creatingColumn.title}`} onClose={() => setCreatingStatus(null)}>
          <TaskForm
            disabled={disabled}
            submitLabel={`Add to ${creatingColumn.title}`}
            onCancel={() => setCreatingStatus(null)}
            onSubmit={async (values) => {
              await onCreate(creatingColumn.status, values);
              setCreatingStatus(null);
            }}
          />
        </Modal>
      ) : null}
    </Grid>
  );
}
