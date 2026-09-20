import { describe, expect, it } from "vitest";
import { DATABASE_STATUS_SUCCESS_MESSAGE } from "../shared/constants";
import {
  classGradebookPath,
  classStudentPath,
  classStudentsPath,
  DEVELOPMENT_API_EXPORT_PATH,
  DEVELOPMENT_API_IMPORT_PATH,
  DEVELOPMENT_API_SCHOOL_YEARS_PATH,
  DEVELOPMENT_API_STATUS_PATH,
  DEVELOPMENT_API_STUDENTS_PATH,
  DEVELOPMENT_API_SUBJECTS_PATH,
  parentPath,
  categoryCopyPath,
  classByIdPath,
  schoolYearClassPath,
  schoolYearClassesPath,
  yearByIdPath,
  studentClassesPath,
  studentParentPath,
  studentParentsPath,
  studentPath,
} from "../shared/development-api";
import { handleDevelopmentApiRequest, type DevelopmentApiHandlers } from "./development-api";

const unusedHandlers: DevelopmentApiHandlers = {
  getStatus: async () => ({
    connected: true,
    message: DATABASE_STATUS_SUCCESS_MESSAGE,
  }),
  exportDatabase: async () => new Uint8Array([83, 81, 76]),
  importDatabase: async () => ({ imported: true, cancelled: false }),
  listSchoolYears: async () => [],
  getSchoolYear: async ({ id }) => ({ id, name: "2025-2026" }),
  createSchoolYear: async (name) => ({ id: 1, name }),
  deleteSchoolYear: async () => ({ deleted: true }),
  listClasses: async () => [],
  listSubjects: async () => [],
  getClass: async ({ internalName }) => sampleClass(internalName),
  getClassById: async ({ id }) => sampleClass("sci-9", { id }),
  createClass: async ({ displayName, internalName, subject, section, notes }) => ({
    id: 1,
    displayName,
    internalName,
    subject,
    section,
    notes,
    schoolYearId: 1,
  }),
  updateClass: async ({ displayName, internalName, subject, section, notes }) => ({
    id: 1,
    displayName,
    internalName,
    subject,
    section,
    notes,
    schoolYearId: 1,
  }),
  deleteClass: async () => ({ deleted: true }),
  listStudents: async () => [],
  getStudent: async ({ id }) => sampleStudent(id),
  createStudent: async (input) => ({ id: 1, ...input }),
  updateStudent: async (input) => input,
  deleteStudent: async () => ({ deleted: true }),
  listClassesForStudent: async () => [],
  listParentsForStudent: async () => [],
  createParentForStudent: async ({ studentId: _studentId, ...fields }) => ({ id: 1, ...fields }),
  updateParent: async (input) => input,
  deleteParentForStudent: async () => ({ deleted: true }),
  listStudentsForClass: async () => [],
  addStudentToClass: async ({ studentId }) => sampleStudent(studentId),
  removeStudentFromClass: async () => ({ deleted: true }),
  getGradingStructure: async () => ({ categories: [] }),
  getClassGradebook: async () => ({ categories: [], students: [] }),
  createCategory: async ({ name, notes, weight }) => ({
    id: 1,
    classId: 1,
    name,
    notes,
    weight,
  }),
  updateCategory: async ({ id, name, notes, weight }) => ({
    id,
    classId: 1,
    name,
    notes,
    weight,
  }),
  deleteCategory: async () => ({ deleted: true }),
  copyCategory: async ({ id }) => ({
    id: id + 100,
    classId: 1,
    name: "Copy of Unit",
    notes: "",
    weight: 1,
  }),
  createSubcategory: async ({ categoryId, name, weight }) => ({
    id: 1,
    categoryId,
    name,
    weight,
  }),
  updateSubcategory: async ({ id, name, weight }) => ({
    id,
    categoryId: 1,
    name,
    weight,
  }),
  deleteSubcategory: async () => ({ deleted: true }),
  copySubcategory: async ({ id }) => ({
    id: id + 100,
    categoryId: 1,
    name: "Copy of Quiz",
    weight: 1,
  }),
  createWork: async ({ categoryId, subcategoryId, name, notes, date, maximumScore, weight }) => ({
    id: 1,
    categoryId: categoryId ?? null,
    subcategoryId: subcategoryId ?? null,
    name,
    notes,
    date: date ?? null,
    maximumScore,
    weight,
  }),
  updateWork: async ({ id, name, notes, date, maximumScore, weight }) => ({
    id,
    categoryId: null,
    subcategoryId: 1,
    name,
    notes,
    date: date ?? null,
    maximumScore,
    weight,
  }),
  deleteWork: async () => ({ deleted: true }),
  copyWork: async ({ id }) => ({
    id: id + 100,
    categoryId: null,
    subcategoryId: 1,
    name: "Copy of Homework",
    notes: "",
    date: null,
    maximumScore: 10,
    weight: 1,
  }),
  upsertAssessment: async ({ workId, studentId, score, date, weight, notes, status }) => ({
    id: 1,
    workId,
    studentId,
    score,
    date: date ?? "2026-09-01",
    weight: weight ?? 1,
    notes: notes ?? "",
    status: status ?? "counted",
  }),
  deleteAssessment: async () => ({ deleted: true }),
  createAdjustment: async ({ assessmentId, percentChange, rawChange, description, notes }) => ({
    id: 1,
    assessmentId,
    percentChange,
    rawChange,
    description,
    notes,
  }),
  updateAdjustment: async ({ id, percentChange, rawChange, description, notes }) => ({
    id,
    assessmentId: 1,
    percentChange,
    rawChange,
    description,
    notes,
  }),
  deleteAdjustment: async () => ({ deleted: true }),
};

describe("handleDevelopmentApiRequest", () => {
  it("returns the database status for the typed development route", async () => {
    await expect(
      handleDevelopmentApiRequest({
        ...unusedHandlers,
        method: "GET",
        pathname: DEVELOPMENT_API_STATUS_PATH,
      }),
    ).resolves.toEqual({
      statusCode: 200,
      body: {
        connected: true,
        message: DATABASE_STATUS_SUCCESS_MESSAGE,
      },
    });
  });

  it("exports and imports the database on the typed development routes", async () => {
    const exported = new Uint8Array([1, 2, 3, 4]);

    await expect(
      handleDevelopmentApiRequest({
        ...unusedHandlers,
        method: "GET",
        pathname: DEVELOPMENT_API_EXPORT_PATH,
        exportDatabase: async () => exported,
      }),
    ).resolves.toEqual({
      statusCode: 200,
      body: exported,
      contentType: "application/vnd.sqlite3",
      fileName: "gradebook.sqlite",
    });

    await expect(
      handleDevelopmentApiRequest({
        ...unusedHandlers,
        method: "POST",
        pathname: DEVELOPMENT_API_IMPORT_PATH,
        body: exported,
        importDatabase: async (contents) => {
          expect(contents).toEqual(exported);
          return { imported: true, cancelled: false };
        },
      }),
    ).resolves.toEqual({
      statusCode: 200,
      body: { imported: true, cancelled: false },
    });
  });

  it("lists, creates, and deletes school years on the typed development routes", async () => {
    await expect(
      handleDevelopmentApiRequest({
        ...unusedHandlers,
        method: "GET",
        pathname: DEVELOPMENT_API_SCHOOL_YEARS_PATH,
        listSchoolYears: async () => [{ id: 2, name: "2025-2026" }],
      }),
    ).resolves.toEqual({
      statusCode: 200,
      body: [{ id: 2, name: "2025-2026" }],
    });

    await expect(
      handleDevelopmentApiRequest({
        ...unusedHandlers,
        method: "POST",
        pathname: DEVELOPMENT_API_SCHOOL_YEARS_PATH,
        body: { name: "2024-2025" },
      }),
    ).resolves.toEqual({
      statusCode: 201,
      body: { id: 1, name: "2024-2025" },
    });

    await expect(
      handleDevelopmentApiRequest({
        ...unusedHandlers,
        method: "DELETE",
        pathname: `${DEVELOPMENT_API_SCHOOL_YEARS_PATH}/2024-2025`,
      }),
    ).resolves.toEqual({
      statusCode: 200,
      body: { deleted: true },
    });
  });

  it("lists, creates, fetches, and deletes classes on the typed development routes", async () => {
    await expect(
      handleDevelopmentApiRequest({
        ...unusedHandlers,
        method: "GET",
        pathname: DEVELOPMENT_API_SUBJECTS_PATH,
        listSubjects: async () => ["Biology", "Mathematics 30-1"],
      }),
    ).resolves.toEqual({
      statusCode: 200,
      body: ["Biology", "Mathematics 30-1"],
    });

    await expect(
      handleDevelopmentApiRequest({
        ...unusedHandlers,
        method: "GET",
        pathname: schoolYearClassesPath("2024-2025"),
        listClasses: async () => [sampleClass("sci-9", { id: 3 })],
      }),
    ).resolves.toEqual({
      statusCode: 200,
      body: [sampleClass("sci-9", { id: 3 })],
    });

    await expect(
      handleDevelopmentApiRequest({
        ...unusedHandlers,
        method: "POST",
        pathname: schoolYearClassesPath("2024-2025"),
        body: {
          displayName: "Science",
          internalName: "sci-9",
          subject: "Biology",
          section: "9A",
          notes: "",
        },
      }),
    ).resolves.toEqual({
      statusCode: 201,
      body: sampleClass("sci-9", { subject: "Biology" }),
    });

    await expect(
      handleDevelopmentApiRequest({
        ...unusedHandlers,
        method: "GET",
        pathname: schoolYearClassPath("2024-2025", "sci-9"),
      }),
    ).resolves.toEqual({
      statusCode: 200,
      body: sampleClass("sci-9"),
    });

    await expect(
      handleDevelopmentApiRequest({
        ...unusedHandlers,
        method: "PATCH",
        pathname: schoolYearClassPath("2024-2025", "sci-9"),
        body: {
          displayName: "Science 9",
          internalName: "sci-9a",
          subject: "Chemistry",
          section: "9C",
          notes: "Moved set",
        },
      }),
    ).resolves.toEqual({
      statusCode: 200,
      body: {
        id: 1,
        displayName: "Science 9",
        internalName: "sci-9a",
        subject: "Chemistry",
        section: "9C",
        notes: "Moved set",
        schoolYearId: 1,
      },
    });

    await expect(
      handleDevelopmentApiRequest({
        ...unusedHandlers,
        method: "DELETE",
        pathname: schoolYearClassPath("2024-2025", "sci-9"),
      }),
    ).resolves.toEqual({
      statusCode: 200,
      body: { deleted: true },
    });
  });

  it("lists, creates, fetches, and deletes students on the typed development routes", async () => {
    await expect(
      handleDevelopmentApiRequest({
        ...unusedHandlers,
        method: "GET",
        pathname: DEVELOPMENT_API_STUDENTS_PATH,
        listStudents: async () => [sampleStudent(3)],
      }),
    ).resolves.toEqual({
      statusCode: 200,
      body: [sampleStudent(3)],
    });

    await expect(
      handleDevelopmentApiRequest({
        ...unusedHandlers,
        method: "POST",
        pathname: DEVELOPMENT_API_STUDENTS_PATH,
        body: {
          firstName: "Ada",
          lastName: "Lovelace",
          preferredName: "",
          notes: "",
          email: "",
        },
      }),
    ).resolves.toEqual({
      statusCode: 201,
      body: sampleStudent(1),
    });

    await expect(
      handleDevelopmentApiRequest({
        ...unusedHandlers,
        method: "GET",
        pathname: studentPath(4),
      }),
    ).resolves.toEqual({
      statusCode: 200,
      body: sampleStudent(4),
    });

    await expect(
      handleDevelopmentApiRequest({
        ...unusedHandlers,
        method: "PATCH",
        pathname: studentPath(4),
        body: {
          firstName: "Ada",
          lastName: "Lovelace",
          preferredName: "Ada",
          notes: "Notes",
          email: "ada@school.test",
        },
      }),
    ).resolves.toEqual({
      statusCode: 200,
      body: {
        id: 4,
        firstName: "Ada",
        lastName: "Lovelace",
        preferredName: "Ada",
        notes: "Notes",
        email: "ada@school.test",
      },
    });

    await expect(
      handleDevelopmentApiRequest({
        ...unusedHandlers,
        method: "DELETE",
        pathname: studentPath(4),
      }),
    ).resolves.toEqual({
      statusCode: 200,
      body: { deleted: true },
    });
  });

  it("lists parents and class students on the typed development routes", async () => {
    await expect(
      handleDevelopmentApiRequest({
        ...unusedHandlers,
        method: "GET",
        pathname: studentParentsPath(2),
        listParentsForStudent: async () => [sampleParent(8)],
      }),
    ).resolves.toEqual({
      statusCode: 200,
      body: [sampleParent(8)],
    });

    await expect(
      handleDevelopmentApiRequest({
        ...unusedHandlers,
        method: "POST",
        pathname: studentParentsPath(2),
        body: {
          firstName: "Annabella",
          lastName: "Byron",
          preferredName: "",
          notes: "",
          emailAddress1: "",
          emailAddress2: "",
        },
      }),
    ).resolves.toEqual({
      statusCode: 201,
      body: sampleParent(1, { firstName: "Annabella", lastName: "Byron" }),
    });

    await expect(
      handleDevelopmentApiRequest({
        ...unusedHandlers,
        method: "PATCH",
        pathname: parentPath(8),
        body: {
          firstName: "Annabella",
          lastName: "Byron",
          preferredName: "Anna",
          notes: "",
          emailAddress1: "",
          emailAddress2: "",
        },
      }),
    ).resolves.toEqual({
      statusCode: 200,
      body: sampleParent(8, { firstName: "Annabella", lastName: "Byron", preferredName: "Anna" }),
    });

    await expect(
      handleDevelopmentApiRequest({
        ...unusedHandlers,
        method: "DELETE",
        pathname: studentParentPath(2, 8),
      }),
    ).resolves.toEqual({
      statusCode: 200,
      body: { deleted: true },
    });

    await expect(
      handleDevelopmentApiRequest({
        ...unusedHandlers,
        method: "GET",
        pathname: studentClassesPath(2),
        listClassesForStudent: async () => [
          { ...sampleClass("sci-9"), schoolYearName: "2024-2025" },
        ],
      }),
    ).resolves.toEqual({
      statusCode: 200,
      body: [{ ...sampleClass("sci-9"), schoolYearName: "2024-2025" }],
    });

    await expect(
      handleDevelopmentApiRequest({
        ...unusedHandlers,
        method: "GET",
        pathname: classStudentsPath("2024-2025", "sci-9"),
        listStudentsForClass: async () => [sampleStudent(2)],
      }),
    ).resolves.toEqual({
      statusCode: 200,
      body: [sampleStudent(2)],
    });

    await expect(
      handleDevelopmentApiRequest({
        ...unusedHandlers,
        method: "POST",
        pathname: classStudentsPath("2024-2025", "sci-9"),
        body: { studentId: 2 },
      }),
    ).resolves.toEqual({
      statusCode: 201,
      body: sampleStudent(2),
    });

    await expect(
      handleDevelopmentApiRequest({
        ...unusedHandlers,
        method: "DELETE",
        pathname: classStudentPath("2024-2025", "sci-9", 2),
      }),
    ).resolves.toEqual({
      statusCode: 200,
      body: { deleted: true },
    });
  });

  it("loads the class gradebook on the typed development route", async () => {
    await expect(
      handleDevelopmentApiRequest({
        ...unusedHandlers,
        method: "GET",
        pathname: classGradebookPath("2024-2025", "sci-9"),
        getClassGradebook: async (lookup) => {
          expect(lookup).toEqual({ schoolYearName: "2024-2025", internalName: "sci-9" });
          return { categories: [], students: [] };
        },
      }),
    ).resolves.toEqual({
      statusCode: 200,
      body: { categories: [], students: [] },
    });
  });

  it("loads a school year and class by id", async () => {
    await expect(
      handleDevelopmentApiRequest({
        ...unusedHandlers,
        method: "GET",
        pathname: yearByIdPath(4),
        getSchoolYear: async ({ id }) => ({ id, name: "2026-2027" }),
      }),
    ).resolves.toEqual({
      statusCode: 200,
      body: { id: 4, name: "2026-2027" },
    });

    await expect(
      handleDevelopmentApiRequest({
        ...unusedHandlers,
        method: "GET",
        pathname: classByIdPath(7),
        getClassById: async ({ id }) => sampleClass("sci-9", { id }),
      }),
    ).resolves.toEqual({
      statusCode: 200,
      body: sampleClass("sci-9", { id: 7 }),
    });
  });

  it("copies a category on the typed development route", async () => {
    await expect(
      handleDevelopmentApiRequest({
        ...unusedHandlers,
        method: "POST",
        pathname: categoryCopyPath(3),
        copyCategory: async ({ id }) => ({
          id: id + 9,
          classId: 1,
          name: "Copy of Unit",
          notes: "",
          weight: 1,
        }),
      }),
    ).resolves.toEqual({
      statusCode: 201,
      body: {
        id: 12,
        classId: 1,
        name: "Copy of Unit",
        notes: "",
        weight: 1,
      },
    });
  });

  it("does not expose any other route", async () => {
    await expect(
      handleDevelopmentApiRequest({
        ...unusedHandlers,
        method: "GET",
        pathname: "/api/sql",
      }),
    ).resolves.toEqual({
      statusCode: 404,
      body: { error: "Not found." },
    });
  });
});

function sampleClass(
  internalName: string,
  overrides: Partial<{
    id: number;
    displayName: string;
    subject: string;
    section: string;
    notes: string;
    schoolYearId: number;
  }> = {},
) {
  return {
    id: 1,
    displayName: "Science",
    internalName,
    subject: "Science",
    section: "9A",
    notes: "",
    schoolYearId: 1,
    ...overrides,
  };
}

function sampleStudent(
  id: number,
  overrides: Partial<{
    firstName: string;
    lastName: string;
    preferredName: string;
    notes: string;
    email: string;
  }> = {},
) {
  return {
    id,
    firstName: "Ada",
    lastName: "Lovelace",
    preferredName: "",
    notes: "",
    email: "",
    ...overrides,
  };
}

function sampleParent(
  id: number,
  overrides: Partial<{
    firstName: string;
    lastName: string;
    preferredName: string;
    notes: string;
    emailAddress1: string;
    emailAddress2: string;
  }> = {},
) {
  return {
    id,
    firstName: "Annabella",
    lastName: "Byron",
    preferredName: "",
    notes: "",
    emailAddress1: "",
    emailAddress2: "",
    ...overrides,
  };
}
