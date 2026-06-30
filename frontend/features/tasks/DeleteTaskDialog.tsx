import { HStack, Text } from "@chakra-ui/react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

export function DeleteTaskDialog({
  taskTitle,
  disabled,
  onCancel,
  onConfirm,
}: {
  taskTitle: string;
  disabled?: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void> | void;
}) {
  return (
    <Modal title="Delete task" onClose={onCancel}>
      <Text mb="4">
        Delete <strong>{taskTitle}</strong>? This cannot be undone.
      </Text>
      <HStack gap="3" flexWrap="wrap">
        <Button onClick={onCancel}>Cancel</Button>
        <Button variant="danger" onClick={onConfirm} disabled={disabled}>
          Delete task
        </Button>
      </HStack>
    </Modal>
  );
}
