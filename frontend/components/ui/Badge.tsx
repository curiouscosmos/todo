import { Badge as ChakraBadge } from "@chakra-ui/react";
import type { ReactNode } from "react";

export function Badge({ tone, children }: { tone: "low" | "medium" | "high" | "todo" | "inprogress" | "done"; children: ReactNode }) {
  const colors = {
    low: "green",
    medium: "blue",
    high: "red",
    todo: "blue",
    inprogress: "yellow",
    done: "gray",
  } as const;

  return (
    <ChakraBadge colorPalette={colors[tone]} variant="subtle" borderRadius="sm" fontWeight="bold">
      {children}
    </ChakraBadge>
  );
}
