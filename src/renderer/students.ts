import { DEVELOPMENT_API_STUDENTS_PATH, studentPath } from "../shared/development-api";
import {
  deleteResultSchema,
  studentCreateInputSchema,
  studentIdInputSchema,
  studentListSchema,
  studentSchema,
  studentUpdateInputSchema,
  type DeleteResult,
  type Student,
  type StudentCreateInput,
  type StudentIdInput,
  type StudentUpdateInput,
} from "../shared/ipc";
import { requestDevelopmentApi } from "./development-request";

export async function listStudents(): Promise<Array<Student>> {
  if (hasPreloadStudentsApi() && window.gradebook) {
    return window.gradebook.students.list();
  }

  return studentListSchema.parse(
    await requestDevelopmentApi(
      DEVELOPMENT_API_STUDENTS_PATH,
      undefined,
      "The students could not be loaded.",
    ),
  );
}

export async function getStudent(input: StudentIdInput): Promise<Student> {
  const lookup = parseStudentId(input);

  if (hasPreloadStudentsApi() && window.gradebook) {
    return window.gradebook.students.get(lookup);
  }

  return studentSchema.parse(
    await requestDevelopmentApi(studentPath(lookup.id), undefined, "That student was not found."),
  );
}

export async function createStudent(input: StudentCreateInput): Promise<Student> {
  const parsed = parseCreate(input);

  if (hasPreloadStudentsApi() && window.gradebook) {
    return window.gradebook.students.create(parsed);
  }

  return studentSchema.parse(
    await requestDevelopmentApi(
      DEVELOPMENT_API_STUDENTS_PATH,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      },
      "The student could not be created.",
    ),
  );
}

export async function updateStudent(input: StudentUpdateInput): Promise<Student> {
  const parsed = parseUpdate(input);

  if (hasPreloadStudentsApi() && window.gradebook) {
    return window.gradebook.students.update(parsed);
  }

  return studentSchema.parse(
    await requestDevelopmentApi(
      studentPath(parsed.id),
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(studentFields(parsed)),
      },
      "The student could not be updated.",
    ),
  );
}

export async function deleteStudent(input: StudentIdInput): Promise<DeleteResult> {
  const lookup = parseStudentId(input);

  if (hasPreloadStudentsApi() && window.gradebook) {
    return window.gradebook.students.delete(lookup);
  }

  return deleteResultSchema.parse(
    await requestDevelopmentApi(
      studentPath(lookup.id),
      { method: "DELETE" },
      "The student could not be deleted.",
    ),
  );
}

function hasPreloadStudentsApi(): boolean {
  return typeof window.gradebook?.students?.list === "function";
}

function parseStudentId(input: StudentIdInput): StudentIdInput {
  const result = studentIdInputSchema.safeParse(input);

  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "That student was not found.");
  }

  return result.data;
}

function parseCreate(input: StudentCreateInput): StudentCreateInput {
  const result = studentCreateInputSchema.safeParse(input);

  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "The student could not be created.");
  }

  return result.data;
}

function parseUpdate(input: StudentUpdateInput): StudentUpdateInput {
  const result = studentUpdateInputSchema.safeParse(input);

  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "The student could not be updated.");
  }

  return result.data;
}

function studentFields(input: StudentUpdateInput) {
  return {
    firstName: input.firstName,
    lastName: input.lastName,
    preferredName: input.preferredName,
    notes: input.notes,
    email: input.email,
  };
}
