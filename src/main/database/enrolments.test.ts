import path from "node:path";
import { describe, expect, it } from "vitest";
import { createClass } from "./classes";
import { bootstrapDatabase } from "./client";
import {
  addStudentToClass,
  listClassesForStudent,
  listStudentsForClass,
  removeStudentFromClass,
} from "./enrolments";
import { createSchoolYear } from "./school-years";
import { createStudent } from "./students";

describe("enrolments", () => {
  it("adds students to classes and lists both sides of the enrolment", async () => {
    const { db, sqlite } = await bootstrapDatabase({
      databasePath: ":memory:",
      migrationsFolder: path.resolve(process.cwd(), "drizzle"),
    });

    try {
      await createSchoolYear(db, "2024-2025");
      const science = await createClass(db, classInput("2024-2025", "Science", "sci-9"));
      const english = await createClass(db, classInput("2024-2025", "English", "eng-9"));
      const zoe = await createStudent(db, studentInput("Zoe", "Young"));
      const ada = await createStudent(db, studentInput("Ada", "Lovelace"));

      await expect(
        addStudentToClass(db, {
          schoolYearName: "2024-2025",
          internalName: "sci-9",
          studentId: zoe.id,
        }),
      ).resolves.toEqual(zoe);
      await addStudentToClass(db, {
        schoolYearName: "2024-2025",
        internalName: "sci-9",
        studentId: ada.id,
      });
      await addStudentToClass(db, {
        schoolYearName: "2024-2025",
        internalName: "eng-9",
        studentId: ada.id,
      });

      await expect(
        listStudentsForClass(db, { schoolYearName: "2024-2025", internalName: "sci-9" }),
      ).resolves.toEqual([ada, zoe]);

      await expect(listClassesForStudent(db, { id: ada.id })).resolves.toEqual([
        expect.objectContaining({
          id: english.id,
          displayName: "English",
          schoolYearName: "2024-2025",
        }),
        expect.objectContaining({
          id: science.id,
          displayName: "Science",
          schoolYearName: "2024-2025",
        }),
      ]);

      await expect(
        removeStudentFromClass(db, {
          schoolYearName: "2024-2025",
          internalName: "sci-9",
          studentId: zoe.id,
        }),
      ).resolves.toEqual({ deleted: true });
      await expect(
        listStudentsForClass(db, { schoolYearName: "2024-2025", internalName: "sci-9" }),
      ).resolves.toEqual([ada]);
    } finally {
      sqlite.close();
    }
  });

  it("rejects duplicate enrolments", async () => {
    const { db, sqlite } = await bootstrapDatabase({
      databasePath: ":memory:",
      migrationsFolder: path.resolve(process.cwd(), "drizzle"),
    });

    try {
      await createSchoolYear(db, "2024-2025");
      await createClass(db, classInput("2024-2025", "Science", "sci-9"));
      const ada = await createStudent(db, studentInput("Ada", "Lovelace"));

      await addStudentToClass(db, {
        schoolYearName: "2024-2025",
        internalName: "sci-9",
        studentId: ada.id,
      });
      await expect(
        addStudentToClass(db, {
          schoolYearName: "2024-2025",
          internalName: "sci-9",
          studentId: ada.id,
        }),
      ).rejects.toThrow("That student is already enrolled in this class.");
    } finally {
      sqlite.close();
    }
  });
});

function classInput(schoolYearName: string, displayName: string, internalName: string) {
  return {
    schoolYearName,
    displayName,
    internalName,
    subject: "Science",
    section: "9A",
    notes: "Course description",
  };
}

function studentInput(firstName: string, lastName: string) {
  return {
    firstName,
    lastName,
    preferredName: "",
    notes: "",
    email: "",
  };
}
