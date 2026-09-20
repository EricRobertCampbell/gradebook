import type { SelectHTMLAttributes } from "react";
import { FieldFrame } from "./FieldFrame";

interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "required"> {
  label: string;
  required?: boolean;
}

export function SelectField({ label, required = false, ...selectProps }: SelectFieldProps) {
  return (
    <FieldFrame label={label} required={required}>
      <select {...selectProps} required={required} />
    </FieldFrame>
  );
}
