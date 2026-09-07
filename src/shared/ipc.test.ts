import { describe, expect, it } from "vitest";
import { DATABASE_STATUS_SUCCESS_MESSAGE } from "./constants";
import {
  databaseStatusSchema,
  ipcChannels,
  ipcContracts,
  schoolYearNameInputSchema,
  schoolYearNameSchema,
} from "./ipc";

describe("database status contract", () => {
  it("accepts a successful status payload", () => {
    const status = databaseStatusSchema.parse({
      connected: true,
      message: DATABASE_STATUS_SUCCESS_MESSAGE,
    });

    expect(status).toEqual({
      connected: true,
      message: DATABASE_STATUS_SUCCESS_MESSAGE,
    });
  });

  it("rejects an incomplete status payload", () => {
    expect(() => databaseStatusSchema.parse({ connected: true })).toThrow();
  });

  it("binds the getStatus channel to the shared input and output schemas", () => {
    const contract = ipcContracts[ipcChannels.databaseGetStatus];

    expect(contract.input.parse(undefined)).toBeUndefined();
    expect(contract.output.parse({ connected: false, message: "Unavailable" })).toEqual({
      connected: false,
      message: "Unavailable",
    });
    expect(
      ipcContracts[ipcChannels.databaseExport].output.parse({
        exported: true,
        cancelled: false,
        path: "/tmp/gradebook.sqlite",
      }),
    ).toEqual({
      exported: true,
      cancelled: false,
      path: "/tmp/gradebook.sqlite",
    });
    expect(
      ipcContracts[ipcChannels.databaseImport].output.parse({
        imported: false,
        cancelled: true,
      }),
    ).toEqual({
      imported: false,
      cancelled: true,
    });
  });
});

describe("school year contract", () => {
  it("trims names and rejects empty or reserved values", () => {
    expect(schoolYearNameSchema.parse("  2024-2025  ")).toBe("2024-2025");
    expect(() => schoolYearNameSchema.parse("")).toThrow();
    expect(() => schoolYearNameSchema.parse("settings")).toThrow();
    expect(() => schoolYearNameSchema.parse("students")).toThrow();
    expect(() => schoolYearNameSchema.parse("database")).toThrow();
    expect(schoolYearNameInputSchema.parse({ name: " Year 7 " })).toEqual({ name: "Year 7" });
  });

  it("binds the school year channels to the shared input and output schemas", () => {
    expect(ipcContracts[ipcChannels.schoolYearList].input.parse(undefined)).toBeUndefined();
    expect(
      ipcContracts[ipcChannels.schoolYearCreate].output.parse({ id: 1, name: "2024-2025" }),
    ).toEqual({
      id: 1,
      name: "2024-2025",
    });
    expect(ipcContracts[ipcChannels.schoolYearDelete].output.parse({ deleted: true })).toEqual({
      deleted: true,
    });
  });
});

describe("class contract", () => {
  it("binds the class channels to the shared input and output schemas", () => {
    expect(
      ipcContracts[ipcChannels.classCreate].input.parse({
        schoolYearName: " 2024-2025 ",
        displayName: " Science ",
        internalName: " sci-9 ",
        subject: " Biology ",
        section: " 9A ",
        notes: " Lab ",
      }),
    ).toEqual({
      schoolYearName: "2024-2025",
      displayName: "Science",
      internalName: "sci-9",
      subject: "Biology",
      section: "9A",
      notes: "Lab",
    });
    expect(
      ipcContracts[ipcChannels.classCreate].input.parse({
        schoolYearName: "2024-2025",
        displayName: "Science",
        internalName: "sci-9",
        subject: "",
        section: "  ",
        notes: "  Laboratory course  ",
      }),
    ).toEqual({
      schoolYearName: "2024-2025",
      displayName: "Science",
      internalName: "sci-9",
      subject: "",
      section: "",
      notes: "Laboratory course",
    });
    expect(() =>
      ipcContracts[ipcChannels.classCreate].input.parse({
        schoolYearName: "2024-2025",
        displayName: "Science",
        internalName: "sci-9",
        subject: "Biology",
        section: "9A",
        notes: "",
      }),
    ).toThrow();
    expect(
      ipcContracts[ipcChannels.classList].output.parse([
        {
          id: 1,
          displayName: "Science",
          internalName: "sci-9",
          subject: "Biology",
          section: "9A",
          notes: "",
          schoolYearId: 4,
        },
      ]),
    ).toEqual([
      {
        id: 1,
        displayName: "Science",
        internalName: "sci-9",
        subject: "Biology",
        section: "9A",
        notes: "",
        schoolYearId: 4,
      },
    ]);
    expect(
      ipcContracts[ipcChannels.classList].output.parse([
        {
          id: 2,
          displayName: "History",
          internalName: "his-9",
          subject: "",
          section: "",
          notes: "",
          schoolYearId: 4,
        },
      ]),
    ).toEqual([
      {
        id: 2,
        displayName: "History",
        internalName: "his-9",
        subject: "",
        section: "",
        notes: "",
        schoolYearId: 4,
      },
    ]);
    expect(ipcContracts[ipcChannels.classDelete].output.parse({ deleted: true })).toEqual({
      deleted: true,
    });
  });
});

describe("student and parent contracts", () => {
  it("trims student fields and rejects an invalid email", () => {
    expect(
      ipcContracts[ipcChannels.studentCreate].input.parse({
        firstName: " Ada ",
        lastName: " Lovelace ",
        preferredName: " A. ",
        notes: " Notes ",
        email: " ada@school.test ",
      }),
    ).toEqual({
      firstName: "Ada",
      lastName: "Lovelace",
      preferredName: "A.",
      notes: "Notes",
      email: "ada@school.test",
    });
    expect(() =>
      ipcContracts[ipcChannels.studentCreate].input.parse({
        firstName: "Ada",
        lastName: "Lovelace",
        preferredName: "",
        notes: "",
        email: "not-an-email",
      }),
    ).toThrow();
  });

  it("binds parent and enrolment channels to the shared schemas", () => {
    expect(
      ipcContracts[ipcChannels.parentCreateForStudent].input.parse({
        studentId: 2,
        firstName: " Annabella ",
        lastName: " Byron ",
        preferredName: "",
        notes: "",
        emailAddress1: "",
        emailAddress2: " byron@home.test ",
      }),
    ).toEqual({
      studentId: 2,
      firstName: "Annabella",
      lastName: "Byron",
      preferredName: "",
      notes: "",
      emailAddress1: "",
      emailAddress2: "byron@home.test",
    });
    expect(
      ipcContracts[ipcChannels.classStudentAdd].input.parse({
        schoolYearName: "2024-2025",
        internalName: "sci-9",
        studentId: 3,
      }),
    ).toEqual({
      schoolYearName: "2024-2025",
      internalName: "sci-9",
      studentId: 3,
    });
    expect(ipcContracts[ipcChannels.studentDelete].output.parse({ deleted: true })).toEqual({
      deleted: true,
    });
  });
});

describe("grading contracts", () => {
  it("requires a percent or raw change on an adjustment", () => {
    expect(
      ipcContracts[ipcChannels.adjustmentCreate].input.parse({
        assessmentId: 1,
        percentChange: 5,
        rawChange: null,
        description: " Bonus ",
        notes: "  ",
      }),
    ).toEqual({
      assessmentId: 1,
      percentChange: 5,
      rawChange: null,
      description: "Bonus",
      notes: "",
    });
    expect(() =>
      ipcContracts[ipcChannels.adjustmentCreate].input.parse({
        assessmentId: 1,
        percentChange: null,
        rawChange: null,
        description: "Bonus",
        notes: "",
      }),
    ).toThrow();
  });

  it("binds the gradebook channel to the shared output schema", () => {
    expect(
      ipcContracts[ipcChannels.gradingGetGradebook].output.parse({
        categories: [],
        students: [],
      }),
    ).toEqual({
      categories: [],
      students: [],
    });
  });
});
