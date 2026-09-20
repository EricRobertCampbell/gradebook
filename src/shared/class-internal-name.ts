export function classInternalNameFromDisplayName(displayName: string): string {
  return displayName
    .replaceAll("/", " ")
    .replaceAll("#", " ")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function nextClassInternalName(
  nextDisplayName: string,
  previousDisplayName: string,
  currentInternalName: string,
): string {
  if (!isLinkedClassInternalName(previousDisplayName, currentInternalName)) {
    return currentInternalName;
  }

  return classInternalNameFromDisplayName(nextDisplayName);
}

function isLinkedClassInternalName(displayName: string, internalName: string): boolean {
  return internalName === classInternalNameFromDisplayName(displayName);
}
