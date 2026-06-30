"use client";

import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { useSyncExternalStore, type ReactNode } from "react";
import { Toaster } from "@/components/ui/Toaster";

export function Providers({ children }: { children: ReactNode }) {
  const mounted = useSyncExternalStore(emptySubscribe, getBrowserSnapshot, getServerSnapshot);

  if (!mounted) {
    // Chakra generates browser-dependent style output, so render the app shell only after hydration starts.
    return null;
  }

  return (
    <ChakraProvider value={defaultSystem}>
      {children}
      <Toaster />
    </ChakraProvider>
  );
}

function emptySubscribe() {
  return () => {};
}

function getBrowserSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}
