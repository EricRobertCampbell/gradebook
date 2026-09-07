import path from "node:path";
import { describe, expect, it } from "vitest";
import { bootstrapDatabase } from "./client";
import {
  createParentForStudent,
  deleteParentForStudent,
  listParentsForStudent,
  updateParent,
} from "./parents";
import { studentParents } from "./schema";
import { createStudent } from "./students";

describe("parents", () => {
  it("creates, lists, updates, and unlinks parents for a student", async () => {
    const { db, sqlite } = await bootstrapDatabase({
      databasePath: ":memory:",
      migrationsFolder: path.resolve(process.cwd(), "drizzle"),
    });

    try {
      const ada = await createStudent(db, {
        firstName: "Ada",
        lastName: "Lovelace",
        preferredName: "",
        notes: "",
        email: "",
      });
      const charles = await createStudent(db, {
        firstName: "Charles",
        lastName: "Babbage",
        preferredName: "",
        notes: "",
        email: "",
      });

      const parent = await createParentForStudent(db, {
        studentId: ada.id,
        firstName: "  Annabella  ",
        lastName: "  Byron  ",
        preferredName: "  Anna  ",
        notes: "  Guardian  ",
        emailAddress1: "  anna@home.test  ",
        emailAddress2: "",
      });
      expect(parent).toEqual({
        id: parent.id,
        firstName: "Annabella",
        lastName: "Byron",
        preferredName: "Anna",
        notes: "Guardian",
        emailAddress1: "anna@home.test",
        emailAddress2: "",
      });

      await expect(listParentsForStudent(db, { id: ada.id })).resolves.toEqual([parent]);
      await expect(listParentsForStudent(db, { id: charles.id })).resolves.toEqual([]);

      const updated = await updateParent(db, {
        id: parent.id,
        firstName: "Annabella",
        lastName: "Byron",
        preferredName: "Lady Byron",
        notes: "",
        emailAddress1: "anna@home.test",
        emailAddress2: "byron@home.test",
      });
      expect(updated.preferredName).toBe("Lady Byron");
      expect(updated.emailAddress2).toBe("byron@home.test");

      await expect(
        deleteParentForStudent(db, { id: parent.id, studentId: ada.id }),
      ).resolves.toEqual({ deleted: true });
      await expect(listParentsForStudent(db, { id: ada.id })).resolves.toEqual([]);
    } finally {
      sqlite.close();
    }
  });

  it("keeps a shared parent when unlinked from only one student", async () => {
    const { db, sqlite } = await bootstrapDatabase({
      databasePath: ":memory:",
      migrationsFolder: path.resolve(process.cwd(), "drizzle"),
    });

    try {
      const ada = await createStudent(db, {
        firstName: "Ada",
        lastName: "Lovelace",
        preferredName: "",
        notes: "",
        email: "",
      });
      const sibling = await createStudent(db, {
        firstName: "Annabella",
        lastName: "Lovelace",
        preferredName: "",
        notes: "",
        email: "",
      });
      const parent = await createParentForStudent(db, {
        studentId: ada.id,
        firstName: "Lord",
        lastName: "Byron",
        preferredName: "",
        notes: "",
        emailAddress1: "",
        emailAddress2: "",
      });

      await db.insert(studentParents).values({ studentId: sibling.id, parentId: parent.id });

      await deleteParentForStudent(db, { id: parent.id, studentId: ada.id });
      await expect(listParentsForStudent(db, { id: ada.id })).resolves.toEqual([]);
      await expect(listParentsForStudent(db, { id: sibling.id })).resolves.toEqual([
        expect.objectContaining({ id: parent.id, lastName: "Byron" }),
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
      const student = await createStudent(db, {
        firstName: "Ada",
        lastName: "Lovelace",
        preferredName: "",
        notes: "",
        email: "",
      });

      await expect(
        createParentForStudent(db, {
          studentId: student.id,
          firstName: "   ",
          lastName: "Byron",
          preferredName: "",
          notes: "",
          emailAddress1: "",
          emailAddress2: "",
        }),
      ).rejects.toThrow("A first name is required.");
      await expect(
        createParentForStudent(db, {
          studentId: student.id,
          firstName: "Annabella",
          lastName: "Byron",
          preferredName: "",
          notes: "",
          emailAddress1: "not-an-email",
          emailAddress2: "",
        }),
      ).rejects.toThrow("Enter a valid email address.");
    } finally {
      sqlite.close();
    }
  });
});

