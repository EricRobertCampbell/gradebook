import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { bootstrapDatabase } from "./client";
import { createParentForStudent, listParentsForStudent } from "./parents";
import { createStudent, deleteStudent, getStudent, listStudents, updateStudent } from "./students";

const createdDirectories: Array<string> = [];

afterEach(async () => {
  await Promise.all(
    createdDirectories
      .splice(0)
      .map((directory) => fs.rm(directory, { recursive: true, force: true })),
  );
});

describe("students", () => {
  it("creates, lists alphabetically by last name, updates, and deletes students", async () => {
    const { db, sqlite } = await openTestDatabase();

    try {
      await expect(listStudents(db)).resolves.toEqual([]);

      const zoe = await createStudent(db, {
        firstName: "  Zoe  ",
        lastName: "  Young  ",
        preferredName: "  Zo  ",
        notes: "  Form captain  ",
        email: "  zoe@school.test  ",
      });
      expect(zoe).toEqual({
        id: zoe.id,
        firstName: "Zoe",
        lastName: "Young",
        preferredName: "Zo",
        notes: "Form captain",
        email: "zoe@school.test",
      });

      await createStudent(db, studentInput("Ada", "Lovelace"));

      await expect(listStudents(db)).resolves.toEqual([
        expect.objectContaining({ firstName: "Ada", lastName: "Lovelace" }),
        expect.objectContaining({ firstName: "Zoe", lastName: "Young" }),
      ]);

      await expect(getStudent(db, { id: zoe.id })).resolves.toEqual(zoe);

      const updated = await updateStudent(db, {
        id: zoe.id,
        firstName: "Zoe",
        lastName: "Younger",
        preferredName: "",
        notes: "",
        email: "",
      });
      expect(updated).toEqual({
        id: zoe.id,
        firstName: "Zoe",
        lastName: "Younger",
        preferredName: "",
        notes: "",
        email: "",
      });

      await expect(deleteStudent(db, { id: zoe.id })).resolves.toEqual({ deleted: true });
      await expect(listStudents(db)).resolves.toEqual([
        expect.objectContaining({ firstName: "Ada" }),
      ]);
    } finally {
      sqlite.close();
    }
  });

  it("rejects missing names and invalid email addresses", async () => {
    const { db, sqlite } = await bootstrapDatabase({
      databasePath: ":memory:",
      migrationsFolder: path.resolve(process.cwd(), "drizzle"),
    });

    try {
      await expect(createStudent(db, { ...studentInput("Ada", "   ") })).rejects.toThrow(
        "A last name is required.",
      );
      await expect(
        createStudent(db, { ...studentInput("Ada", "Lovelace"), email: "not-an-email" }),
      ).rejects.toThrow("Enter a valid email address.");
      await expect(getStudent(db, { id: 99 })).rejects.toThrow("That student was not found.");
    } finally {
      sqlite.close();
    }
  });

  it("removes orphaned parents when a student is deleted", async () => {
    const { db, sqlite } = await bootstrapDatabase({
      databasePath: ":memory:",
      migrationsFolder: path.resolve(process.cwd(), "drizzle"),
    });

    try {
      const student = await createStudent(db, studentInput("Ada", "Lovelace"));
      await createParentForStudent(db, {
        studentId: student.id,
        firstName: "Annabella",
        lastName: "Byron",
        preferredName: "",
        notes: "",
        emailAddress1: "",
        emailAddress2: "",
      });

      await deleteStudent(db, { id: student.id });
      await expect(listParentsForStudent(db, { id: student.id })).rejects.toThrow(
        "That student was not found.",
      );
    } finally {
      sqlite.close();
    }
  });
});

async function openTestDatabase() {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "gradebook-test-"));
  createdDirectories.push(directory);

  return bootstrapDatabase({
    databasePath: path.join(directory, "gradebook-test.sqlite"),
    migrationsFolder: path.resolve(process.cwd(), "drizzle"),
  });
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
