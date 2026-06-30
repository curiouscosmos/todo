import { Dialog, Portal } from "@chakra-ui/react";
import type { ReactNode } from "react";
import { Button } from "./Button";

export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    // This wrapper keeps modal usage simple for feature components while Chakra handles focus trapping and portal placement.
    <Dialog.Root open onOpenChange={(details) => !details.open && onClose()}>
      <Portal>
        <Dialog.Backdrop bg="blackAlpha.600" />
        <Dialog.Positioner p="5">
          <Dialog.Content maxW="640px" borderRadius="lg">
            <Dialog.Header>
              <Dialog.Title>{title}</Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <Button aria-label="Close dialog" onClick={onClose}>
                  Close
                </Button>
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body>{children}</Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
