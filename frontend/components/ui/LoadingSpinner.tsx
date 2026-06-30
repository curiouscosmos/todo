import { HStack, Spinner, Text } from "@chakra-ui/react";

export function LoadingSpinner() {
  return (
    <HStack role="status" aria-live="polite" border="1px dashed" borderColor="border" borderRadius="lg" bg="bg.subtle" color="fg.muted" p="6">
      <Spinner size="sm" />
      <Text>Loading tasks...</Text>
    </HStack>
  );
}
