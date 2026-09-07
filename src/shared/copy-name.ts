export function uniqueCopyName(originalName: string, existingNames: Array<string>): string {
  const base = `Copy of ${originalName}`;
  const taken = new Set(existingNames);

  if (!taken.has(base)) {
    return base;
  }

  let suffix = 1;
  let candidate = `${base} (${suffix})`;

  while (taken.has(candidate)) {
    suffix += 1;
    candidate = `${base} (${suffix})`;
  }

  return candidate;
}
