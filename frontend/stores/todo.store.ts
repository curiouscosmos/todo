"use client";

import { makeAutoObservable, runInAction } from "mobx";
import { ApiError } from "@/lib/apiClient";
import { tasksApi } from "@/lib/api";
import type { TaskFormValues, TaskItem, TaskStatus } from "@/types/types";
import { logger } from "@/util/logger";

export class TodoStore {
  tasks: TaskItem[] = [];
  loading = false;
  saving = false;
  error = "";
  notice = "";
  totalCount = 0;
  totalPages = 0;

  constructor() {
    makeAutoObservable(this);
  }

  async fetchTodoItems() {
    this.loading = true;
    this.error = "";
    try {
      const result = await tasksApi.list();

      runInAction(() => {
        this.tasks = result.items;
        this.totalCount = result.totalCount;
        this.totalPages = result.totalPages;
      });
    } catch (error) {
      logger.error("Failed to fetch tasks.", { error });

      runInAction(() => {
        this.error = formatErrorMessage(error);
      });
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  async createTask(values: TaskFormValues, status: TaskStatus) {
    await this.mutate(`Task created in ${status}.`, () => tasksApi.create(values, status));
  }

  async updateTask(id: string, values: TaskFormValues) {
    await this.mutate("Task updated.", () => tasksApi.update(id, values));
  }

  async setStatus(id: string, status: TaskStatus) {
    await this.mutate(`Task moved to ${status}.`, () => tasksApi.setStatus(id, status));
  }

  async deleteTask(id: string) {
    await this.mutate("Task deleted.", () => tasksApi.delete(id));
  }

  private async mutate(message: string, action: () => Promise<unknown>) {
    this.saving = true;
    this.error = "";
    this.notice = "";
    try {
      await action();
      runInAction(() => {
        this.notice = message;
      });
      // Re-fetch after mutations so the board reflects the server-authoritative task state.
      await this.fetchTodoItems();
    } catch (error) {
      logger.error("Task mutation failed.", { error });

      runInAction(() => {
        this.error = formatErrorMessage(error);
      });
    } finally {
      runInAction(() => {
        this.saving = false;
      });
    }
  }
}

function formatErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.problem?.detail ?? error.message;
  }

  return "Something went wrong. Please check the API status.";
}

export const todoStore = new TodoStore();
