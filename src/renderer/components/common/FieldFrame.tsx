import type { PropsWithChildren } from "react";
import "./Field.css";
import { FieldLabel } from "./FieldLabel";

interface FieldFrameProps extends PropsWithChildren {
  label: string;
  required: boolean;
}

export function FieldFrame({ label, required, children }: FieldFrameProps) {
  return (
    <label className="field">
      <FieldLabel required={required}>{label}</FieldLabel>
      {children}
    </label>
  );
}
