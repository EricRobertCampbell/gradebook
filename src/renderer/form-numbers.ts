export function parseRequiredNumber(value: string, message: string): number {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error(message);
  }

  const parsed = Number(trimmed);

  if (!Number.isFinite(parsed)) {
    throw new Error(message);
  }

  return parsed;
}

export function parseOptionalNumber(value: string): number | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);

  if (!Number.isFinite(parsed)) {
    throw new Error("Enter a valid number.");
  }

  return parsed;
}

export function numberInputValue(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}
