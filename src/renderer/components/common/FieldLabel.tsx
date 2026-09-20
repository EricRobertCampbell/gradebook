import { requiredFieldLabel } from "./field-label";

export function FieldLabel({ children, required = false }: FieldLabelProps) {
  return <span className="field-label">{requiredFieldLabel(children, required)}</span>;
}

interface FieldLabelProps {
  children: string;
  required?: boolean;
}
