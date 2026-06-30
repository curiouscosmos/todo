import { Box, Heading } from "@chakra-ui/react";
import type { ReactNode } from "react";

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <Box as="section" aria-live="polite" border="1px dashed" borderColor="border" borderRadius="lg" bg="bg.subtle" color="fg.muted" p="6">
      <Heading as="h2" size="md" color="fg" mb={children ? "2" : "0"}>
        {title}
      </Heading>
      {children}
    </Box>
  );
}
