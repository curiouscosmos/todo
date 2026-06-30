"use client";

import {
  createToaster,
  Toast,
  Toaster as ChakraToaster,
  VStack,
  type ToastOptions,
} from "@chakra-ui/react";

export const toaster = createToaster({
  placement: "top-end",
  duration: 3500,
});

export function Toaster() {
  return (
    <ChakraToaster toaster={toaster}>
      {(toast: ToastOptions) => (
        // Styling stays centralized here so feature code only sends the message and toast type.
        <Toast.Root
          minW="min(360px, calc(100vw - 32px))"
          border="1px solid"
          borderColor={toast.type === "error" ? "red.500" : toast.type === "success" ? "green.500" : "border"}
          borderRadius="lg"
          bg="bg.panel"
          color="fg"
          boxShadow="xl"
          p="3"
        >
          <VStack align="start" gap="1">
            <Toast.Title>{toast.title}</Toast.Title>
            {toast.description ? <Toast.Description>{toast.description}</Toast.Description> : null}
          </VStack>
          <Toast.CloseTrigger />
        </Toast.Root>
      )}
    </ChakraToaster>
  );
}
