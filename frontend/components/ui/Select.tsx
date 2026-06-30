import { Field, NativeSelect } from "@chakra-ui/react";
import type { ComponentProps } from "react";

type SelectProps = ComponentProps<typeof NativeSelect.Field> & {
  label: string;
  error?: string;
};

export function Select({ label, error, id, children, ...props }: SelectProps) {
  const selectId = id ?? props.name;

  return (
    // NativeSelect keeps browser select semantics while Chakra provides consistent field styling.
    <Field.Root invalid={!!error}>
      <Field.Label htmlFor={selectId} fontWeight="semibold">
        {label}
      </Field.Label>
      <NativeSelect.Root>
        <NativeSelect.Field id={selectId} {...props}>
          {children}
        </NativeSelect.Field>
        <NativeSelect.Indicator />
      </NativeSelect.Root>
      {error ? <Field.ErrorText role="alert">{error}</Field.ErrorText> : null}
    </Field.Root>
  );
}
