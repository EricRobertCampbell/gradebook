import type { InputHTMLAttributes, ReactNode } from "react";
import { FieldFrame } from "./FieldFrame";

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "required"> {
  label: string;
  required?: boolean;
  suffix?: ReactNode;
}

export function TextField({ label, required = false, suffix, ...inputProps }: TextFieldProps) {
  const input = <input {...inputProps} required={required} />;

  return (
    <FieldFrame label={label} required={required}>
      {suffix ? (
        <span className="field-suffix">
          {input}
          {suffix}
        </span>
      ) : (
        input
      )}
    </FieldFrame>
  );
}
