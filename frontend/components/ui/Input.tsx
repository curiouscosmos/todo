import { Field, Input as ChakraInput } from "@chakra-ui/react";
import type { ComponentProps } from "react";

type InputProps = ComponentProps<typeof ChakraInput> & {
  label: string;
  error?: string;
};

export function Input({ label, error, id, ...props }: InputProps) {
  const inputId = id ?? props.name;

  return (
    // Field.Root connects label, invalid state, and error text for assistive tech.
    <Field.Root invalid={!!error}>
      <Field.Label htmlFor={inputId} fontWeight="semibold">
        {label}
      </Field.Label>
      <ChakraInput id={inputId} {...props} />
      {error ? <Field.ErrorText role="alert">{error}</Field.ErrorText> : null}
    </Field.Root>
  );
}
