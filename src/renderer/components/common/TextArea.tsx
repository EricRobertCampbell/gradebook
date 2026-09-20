import type { TextareaHTMLAttributes } from "react";
import { FieldFrame } from "./FieldFrame";

interface TextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "required"> {
  label: string;
  required?: boolean;
}

export function TextArea({ label, required = false, ...textareaProps }: TextAreaProps) {
  return (
    <FieldFrame label={label} required={required}>
      <textarea {...textareaProps} required={required} />
    </FieldFrame>
  );
}
