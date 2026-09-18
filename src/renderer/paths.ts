export function schoolYearPath(schoolYearId: number): string {
  return `/${schoolYearId}`;
}

export function schoolYearSettingsPath(schoolYearId: number): string {
  return `${schoolYearPath(schoolYearId)}/settings`;
}

export function classPath(schoolYearId: number, classId: number): string {
  return `/${schoolYearId}/${classId}`;
}

export function classSettingsPath(schoolYearId: number, classId: number): string {
  return `${classPath(schoolYearId, classId)}/settings`;
}

export function classDataPath(classId: number): string {
  return `/${classId}/data`;
}

export function classWorkDataPath(classId: number, workId: number): string {
  return `${classDataPath(classId)}/${workId}`;
}

export function studentClassReportPath(studentId: number, classId: number): string {
  return `/${studentId}/${classId}/individualreport`;
}

export function studentClassDataPath(studentId: number, classId: number): string {
  return `/${studentId}/${classId}/data`;
}

export function studentPath(studentId: number): string {
  return `/students/${studentId}`;
}

export function studentSettingsPath(studentId: number): string {
  return `${studentPath(studentId)}/settings`;
}

export function parseRouteId(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return undefined;
  }

  return parsed;
}
