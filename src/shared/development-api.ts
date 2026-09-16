export const DEVELOPMENT_API_PORT = 8787;
export const DEVELOPMENT_API_STATUS_PATH = "/api/database/status";
export const DEVELOPMENT_API_EXPORT_PATH = "/api/database/export";
export const DEVELOPMENT_API_IMPORT_PATH = "/api/database/import";
export const DEVELOPMENT_API_SCHOOL_YEARS_PATH = "/api/school-years";

export function schoolYearClassesPath(schoolYearName: string): string {
  return `${DEVELOPMENT_API_SCHOOL_YEARS_PATH}/${encodeURIComponent(schoolYearName)}/classes`;
}

export function schoolYearClassPath(schoolYearName: string, internalName: string): string {
  return `${schoolYearClassesPath(schoolYearName)}/${encodeURIComponent(internalName)}`;
}

export const DEVELOPMENT_API_STUDENTS_PATH = "/api/students";
export const DEVELOPMENT_API_PARENTS_PATH = "/api/parents";

export function studentPath(studentId: number): string {
  return `${DEVELOPMENT_API_STUDENTS_PATH}/${studentId}`;
}

export function studentParentsPath(studentId: number): string {
  return `${studentPath(studentId)}/parents`;
}

export function studentParentPath(studentId: number, parentId: number): string {
  return `${studentParentsPath(studentId)}/${parentId}`;
}

export function studentClassesPath(studentId: number): string {
  return `${studentPath(studentId)}/classes`;
}

export function parentPath(parentId: number): string {
  return `${DEVELOPMENT_API_PARENTS_PATH}/${parentId}`;
}

export function classStudentsPath(schoolYearName: string, internalName: string): string {
  return `${schoolYearClassPath(schoolYearName, internalName)}/students`;
}

export function classStudentPath(
  schoolYearName: string,
  internalName: string,
  studentId: number,
): string {
  return `${classStudentsPath(schoolYearName, internalName)}/${studentId}`;
}

export function classCategoriesPath(schoolYearName: string, internalName: string): string {
  return `${schoolYearClassPath(schoolYearName, internalName)}/categories`;
}

export function classGradingStructurePath(schoolYearName: string, internalName: string): string {
  return `${schoolYearClassPath(schoolYearName, internalName)}/grading-structure`;
}

export function classGradebookPath(schoolYearName: string, internalName: string): string {
  return `${schoolYearClassPath(schoolYearName, internalName)}/gradebook`;
}

export const DEVELOPMENT_API_CATEGORIES_PATH = "/api/categories";
export const DEVELOPMENT_API_SUBCATEGORIES_PATH = "/api/subcategories";
export const DEVELOPMENT_API_WORKS_PATH = "/api/works";
export const DEVELOPMENT_API_ASSESSMENTS_PATH = "/api/assessments";
export const DEVELOPMENT_API_ADJUSTMENTS_PATH = "/api/adjustments";

export function categoryPath(categoryId: number): string {
  return `${DEVELOPMENT_API_CATEGORIES_PATH}/${categoryId}`;
}

export function categorySubcategoriesPath(categoryId: number): string {
  return `${categoryPath(categoryId)}/subcategories`;
}

export function categoryWorksPath(categoryId: number): string {
  return `${categoryPath(categoryId)}/works`;
}

export function subcategoryPath(subcategoryId: number): string {
  return `${DEVELOPMENT_API_SUBCATEGORIES_PATH}/${subcategoryId}`;
}

export function subcategoryWorksPath(subcategoryId: number): string {
  return `${subcategoryPath(subcategoryId)}/works`;
}

export function workPath(workId: number): string {
  return `${DEVELOPMENT_API_WORKS_PATH}/${workId}`;
}

export function workStudentAssessmentPath(workId: number, studentId: number): string {
  return `${workPath(workId)}/students/${studentId}/assessment`;
}

export function assessmentAdjustmentsPath(assessmentId: number): string {
  return `${DEVELOPMENT_API_ASSESSMENTS_PATH}/${assessmentId}/adjustments`;
}

export function adjustmentPath(adjustmentId: number): string {
  return `${DEVELOPMENT_API_ADJUSTMENTS_PATH}/${adjustmentId}`;
}

export const DEVELOPMENT_API_YEARS_PATH = "/api/years";
export const DEVELOPMENT_API_CLASSES_PATH = "/api/classes";

export function yearByIdPath(yearId: number): string {
  return `${DEVELOPMENT_API_YEARS_PATH}/${yearId}`;
}

export function classByIdPath(classId: number): string {
  return `${DEVELOPMENT_API_CLASSES_PATH}/${classId}`;
}

export function categoryCopyPath(categoryId: number): string {
  return `${categoryPath(categoryId)}/copy`;
}

export function subcategoryCopyPath(subcategoryId: number): string {
  return `${subcategoryPath(subcategoryId)}/copy`;
}

export function workCopyPath(workId: number): string {
  return `${workPath(workId)}/copy`;
}
