import { Field, Textarea as ChakraTextarea } from "@chakra-ui/react";
import type { ComponentProps } from "react";

type TextareaProps = ComponentProps<typeof ChakraTextarea> & {
  label: string;
  error?: string;
};

export function Textarea({ label, error, id, ...props }: TextareaProps) {
  const textareaId = id ?? props.name;

  return (
    // Match Input's label/error pattern so forms stay accessible and visually consistent.
    <Field.Root invalid={!!error}>
      <Field.Label htmlFor={textareaId} fontWeight="semibold">
        {label}
      </Field.Label>
      <ChakraTextarea id={textareaId} resize="vertical" {...props} />
      {error ? <Field.ErrorText role="alert">{error}</Field.ErrorText> : null}
    </Field.Root>
  );
}
