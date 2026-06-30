"use client";

import { rootStore } from "@/stores/root.store";

export function useTodoStore() {
  return rootStore.todoStore;
}

