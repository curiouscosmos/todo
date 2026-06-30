import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { render as rtlRender } from "@testing-library/react";
import type { ReactElement } from "react";

// Component tests render below the app layout, so they need the same Chakra provider explicitly.
export function render(ui: ReactElement) {
  return rtlRender(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}
