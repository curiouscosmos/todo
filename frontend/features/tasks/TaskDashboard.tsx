"use client";

import { Box, Flex, Heading, HStack } from "@chakra-ui/react";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { toaster } from "@/components/ui/Toaster";
import { useTodoStore } from "@/hooks/useTodoStore";
import { TaskList } from "./TaskList";

const columns = [
  { status: "Todo", title: "Todo", canCreateTask: true },
  { status: "InProgress", title: "In Progress" },
  { status: "Done", title: "Done" },
] as const;

export const TaskDashboard = observer(function TaskDashboard() {
  const store = useTodoStore();

  useEffect(() => {
    // Initial load stays in the dashboard so the store remains framework-agnostic.
    void store.fetchTodoItems();
  }, [store]);

  useEffect(() => {
    // Toasts are side effects of observable state changes, not state themselves.
    if (store.notice) {
      window.setTimeout(() => {
        toaster.create({ title: store.notice, type: "success" });
      }, 0);
    }
  }, [store.notice]);

  useEffect(() => {
    // Keep API failures visible without coupling the store to Chakra's toaster implementation.
    if (store.error) {
      window.setTimeout(() => {
        toaster.create({ title: store.error, type: "error" });
      }, 0);
    }
  }, [store.error]);

  return (
    <Box as="main" minH="100vh" px={{ base: "4", md: "12" }} py={{ base: "6", md: "10" }}>
      <Flex as="header" justify="space-between" align="center" gap="6" pb={{ base: "8", md: "14" }} wrap="wrap">
        <HStack gap="5">
          <Flex
            aria-hidden="true"
            w="14"
            h="14"
            align="center"
            justify="center"
            borderRadius="lg"
            bgGradient="linear(145deg, green.600, green.800)"
            color="black"
            fontSize="2xl"
            fontWeight="black"
            boxShadow="md"
          >
            ✓
          </Flex>
          <Heading as="h1" size="xl">
            Todo Task Management
          </Heading>
        </HStack>
      </Flex>

      <Box as="section" aria-label="Tasks" minH="calc(100vh - 150px)" pb="4">
        {store.loading ? (
          <LoadingSpinner />
        ) : store.error ? (
          <ErrorState message={store.error} onRetry={() => store.fetchTodoItems()} />
        ) : (
          <TaskList
            tasks={store.tasks}
            columns={[...columns]}
            disabled={store.saving}
            onCreate={(status, values) => store.createTask(values, status)}
            onUpdate={(id, values) => store.updateTask(id, values)}
            onMove={(id, status) => store.setStatus(id, status)}
            onDelete={(id) => store.deleteTask(id)}
          />
        )}
      </Box>
    </Box>
  );
});
