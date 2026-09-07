export function unknownRecord(value: unknown, message: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null) {
    throw new Error(message);
  }

  const record: Record<string, unknown> = {};

  for (const [key, entry] of Object.entries(value)) {
    record[key] = entry;
  }

  return record;
}
