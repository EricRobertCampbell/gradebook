import { classStudentPath, classStudentsPath, studentClassesPath } from "../shared/development-api";
import {
  classLookupInputSchema,
  classStudentInputSchema,
  deleteResultSchema,
  enrolledClassListSchema,
  studentIdInputSchema,
  studentListSchema,
  studentSchema,
  type ClassLookupInput,
  type ClassStudentInput,
  type DeleteResult,
  type EnrolledClass,
  type Student,
  type StudentIdInput,
} from "../shared/ipc";
import { requestDevelopmentApi } from "./development-request";

export async function listStudentsForClass(input: ClassLookupInput): Promise<Array<Student>> {
  const lookup = parseLookup(input);

  if (hasPreloadEnrolmentApi() && window.gradebook) {
    return window.gradebook.classes.listStudents(lookup);
  }

  return studentListSchema.parse(
    await requestDevelopmentApi(
      classStudentsPath(lookup.schoolYearName, lookup.internalName),
      undefined,
      "The class students could not be loaded.",
    ),
  );
}

export async function listClassesForStudent(input: StudentIdInput): Promise<Array<EnrolledClass>> {
  const lookup = parseStudentId(input);

  if (hasPreloadEnrolmentApi() && window.gradebook) {
    return window.gradebook.students.listClasses(lookup);
  }

  return enrolledClassListSchema.parse(
    await requestDevelopmentApi(
      studentClassesPath(lookup.id),
      undefined,
      "The student's classes could not be loaded.",
    ),
  );
}

export async function addStudentToClass(input: ClassStudentInput): Promise<Student> {
  const parsed = parseClassStudent(input);

  if (hasPreloadEnrolmentApi() && window.gradebook) {
    return window.gradebook.classes.addStudent(parsed);
  }

  return studentSchema.parse(
    await requestDevelopmentApi(
      classStudentsPath(parsed.schoolYearName, parsed.internalName),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: parsed.studentId }),
      },
      "The student could not be added to this class.",
    ),
  );
}

export async function removeStudentFromClass(input: ClassStudentInput): Promise<DeleteResult> {
  const parsed = parseClassStudent(input);

  if (hasPreloadEnrolmentApi() && window.gradebook) {
    return window.gradebook.classes.removeStudent(parsed);
  }

  return deleteResultSchema.parse(
    await requestDevelopmentApi(
      classStudentPath(parsed.schoolYearName, parsed.internalName, parsed.studentId),
      { method: "DELETE" },
      "The student could not be removed from this class.",
    ),
  );
}

function hasPreloadEnrolmentApi(): boolean {
  return typeof window.gradebook?.classes?.listStudents === "function";
}

function parseLookup(input: ClassLookupInput): ClassLookupInput {
  const result = classLookupInputSchema.safeParse(input);

  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "That class was not found.");
  }

  return result.data;
}

function parseStudentId(input: StudentIdInput): StudentIdInput {
  const result = studentIdInputSchema.safeParse(input);

  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "That student was not found.");
  }

  return result.data;
}

function parseClassStudent(input: ClassStudentInput): ClassStudentInput {
  const result = classStudentInputSchema.safeParse(input);

  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "That enrolment could not be changed.");
  }

  return result.data;
}
