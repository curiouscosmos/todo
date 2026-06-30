import { Button as ChakraButton, type ButtonProps as ChakraButtonProps } from "@chakra-ui/react";
import type { ReactNode } from "react";

type ButtonProps = Omit<ChakraButtonProps, "variant"> & {
  variant?: "primary" | "secondary" | "danger";
  children: ReactNode;
};

export function Button({ variant = "secondary", children, ...props }: ButtonProps) {
  // Keep app-level button variants stable while Chakra owns the rendering and accessibility behavior.
  const variantProps: Record<NonNullable<ButtonProps["variant"]>, Partial<ChakraButtonProps>> = {
    primary: {
      colorPalette: "green",
      variant: "solid",
    },
    secondary: {
      colorPalette: "gray",
      variant: "subtle",
    },
    danger: {
      colorPalette: "red",
      variant: "outline",
    },
  };

  return (
    <ChakraButton borderRadius="md" fontWeight="semibold" {...variantProps[variant]} {...props}>
      {children}
    </ChakraButton>
  );
}
