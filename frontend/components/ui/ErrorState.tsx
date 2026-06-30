import { Box, Heading, Text, VStack } from "@chakra-ui/react";
import { Button } from "./Button";

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Box as="section" role="alert" border="1px solid" borderColor="red.200" borderRadius="lg" bg="red.50" color="red.900" p="6">
      <VStack align="start" gap="3">
        <Heading as="h2" size="md">
          Unable to load tasks
        </Heading>
        <Text>{message}</Text>
      <Button onClick={onRetry}>Retry</Button>
      </VStack>
    </Box>
  );
}
