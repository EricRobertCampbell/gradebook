export function requiredFieldLabel(label: string, required: boolean): string {
  return required ? `${label}*` : label;
}
