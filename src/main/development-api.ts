import http from "node:http";
import {
  classDeleteResultSchema,
  classListSchema,
  classSchema,
  classSubjectListSchema,
  databaseImportResultSchema,
  databaseStatusSchema,
  deleteResultSchema,
  enrolledClassListSchema,
  parentListSchema,
  parentSchema,
  schoolYearDeleteResultSchema,
  schoolYearListSchema,
  schoolYearSchema,
  studentListSchema,
  studentSchema,
  type Class,
  type ClassCreateInput,
  type ClassDeleteResult,
  type ClassLookupInput,
  type RecordIdInput,
  type ClassStudentInput,
  type ClassUpdateInput,
  type DatabaseImportResult,
  type DatabaseStatus,
  type DeleteResult,
  type EnrolledClass,
  type Parent,
  type ParentCreateInput,
  type ParentDeleteInput,
  type ParentFields,
  type ParentUpdateInput,
  type SchoolYear,
  type SchoolYearDeleteResult,
  type Student,
  type StudentCreateInput,
  type StudentFields,
  type StudentIdInput,
  type StudentUpdateInput,
} from "../shared/ipc";
import { unknownRecord } from "../shared/unknown-record";
import {
  DEVELOPMENT_API_EXPORT_PATH,
  DEVELOPMENT_API_IMPORT_PATH,
  DEVELOPMENT_API_PARENTS_PATH,
  DEVELOPMENT_API_PORT,
  DEVELOPMENT_API_CLASSES_PATH,
  DEVELOPMENT_API_SCHOOL_YEARS_PATH,
  DEVELOPMENT_API_STATUS_PATH,
  DEVELOPMENT_API_STUDENTS_PATH,
  DEVELOPMENT_API_SUBJECTS_PATH,
  DEVELOPMENT_API_YEARS_PATH,
} from "../shared/development-api";
import {
  handleGradingDevelopmentApiRequest,
  type GradingDevelopmentApiHandlers,
} from "./grading-development-api";

export type DevelopmentApiResponse = {
  statusCode: number;
  body: unknown;
  contentType?: string;
  fileName?: string;
};

export type DevelopmentApiHandlers = {
  getStatus: () => Promise<DatabaseStatus>;
  exportDatabase: () => Promise<Uint8Array>;
  importDatabase: (contents: Uint8Array) => Promise<DatabaseImportResult>;
  listSchoolYears: () => Promise<Array<SchoolYear>>;
  getSchoolYear: (input: RecordIdInput) => Promise<SchoolYear>;
  createSchoolYear: (name: string) => Promise<SchoolYear>;
  deleteSchoolYear: (name: string) => Promise<SchoolYearDeleteResult>;
  listClasses: (schoolYearName: string) => Promise<Array<Class>>;
  listSubjects: () => Promise<Array<string>>;
  getClass: (input: ClassLookupInput) => Promise<Class>;
  getClassById: (input: RecordIdInput) => Promise<Class>;
  createClass: (input: ClassCreateInput) => Promise<Class>;
  updateClass: (input: ClassUpdateInput) => Promise<Class>;
  deleteClass: (input: ClassLookupInput) => Promise<ClassDeleteResult>;
  listStudents: () => Promise<Array<Student>>;
  getStudent: (input: StudentIdInput) => Promise<Student>;
  createStudent: (input: StudentCreateInput) => Promise<Student>;
  updateStudent: (input: StudentUpdateInput) => Promise<Student>;
  deleteStudent: (input: StudentIdInput) => Promise<DeleteResult>;
  listClassesForStudent: (input: StudentIdInput) => Promise<Array<EnrolledClass>>;
  listParentsForStudent: (input: StudentIdInput) => Promise<Array<Parent>>;
  createParentForStudent: (input: ParentCreateInput) => Promise<Parent>;
  updateParent: (input: ParentUpdateInput) => Promise<Parent>;
  deleteParentForStudent: (input: ParentDeleteInput) => Promise<DeleteResult>;
  listStudentsForClass: (input: ClassLookupInput) => Promise<Array<Student>>;
  addStudentToClass: (input: ClassStudentInput) => Promise<Student>;
  removeStudentFromClass: (input: ClassStudentInput) => Promise<DeleteResult>;
} & GradingDevelopmentApiHandlers;

function decodePathSegment(segment: string): string {
  return decodeURIComponent(segment);
}

function schoolYearApiPath(
  pathname: string,
): { yearName: string; rest: Array<string> } | undefined {
  const prefix = `${DEVELOPMENT_API_SCHOOL_YEARS_PATH}/`;

  if (!pathname.startsWith(prefix)) {
    return undefined;
  }

  const parts = pathname.slice(prefix.length).split("/").filter(Boolean).map(decodePathSegment);

  if (parts.length === 0 || parts[0] === undefined) {
    return undefined;
  }

  return { yearName: parts[0], rest: parts.slice(1) };
}

function readJsonName(body: unknown): string {
  if (
    typeof body === "object" &&
    body !== null &&
    "name" in body &&
    typeof body.name === "string"
  ) {
    return body.name;
  }

  throw new Error("A school year name is required.");
}

function readClassFields(body: unknown): {
  displayName: string;
  internalName: string;
  subject: string;
  section: string;
  notes: string;
} {
  if (typeof body !== "object" || body === null) {
    throw new Error("A class display name is required.");
  }

  const displayName = "displayName" in body ? body.displayName : undefined;
  const internalName = "internalName" in body ? body.internalName : undefined;
  const subject = "subject" in body ? body.subject : "";
  const section = "section" in body ? body.section : "";
  const notes = "notes" in body ? body.notes : "";

  if (typeof displayName !== "string") {
    throw new Error("A class display name is required.");
  }

  if (typeof internalName !== "string") {
    throw new Error("An internal class name is required.");
  }

  if (typeof subject !== "string") {
    throw new Error("Class subject must be text.");
  }

  if (typeof section !== "string") {
    throw new Error("Class section must be text.");
  }

  if (typeof notes !== "string") {
    throw new Error("Class notes must be text.");
  }

  return { displayName, internalName, subject, section, notes };
}

function readClassCreateBody(schoolYearName: string, body: unknown): ClassCreateInput {
  return { schoolYearName, ...readClassFields(body) };
}

function studentApiPath(pathname: string): { studentId: number; rest: Array<string> } | undefined {
  const prefix = `${DEVELOPMENT_API_STUDENTS_PATH}/`;

  if (!pathname.startsWith(prefix)) {
    return undefined;
  }

  const parts = pathname.slice(prefix.length).split("/").filter(Boolean).map(decodePathSegment);
  const studentId = parts[0];

  if (!studentId) {
    return undefined;
  }

  return {
    studentId: readPositiveInt(studentId, "That student was not found."),
    rest: parts.slice(1),
  };
}

function parentApiPath(pathname: string): { parentId: number } | undefined {
  const prefix = `${DEVELOPMENT_API_PARENTS_PATH}/`;

  if (!pathname.startsWith(prefix)) {
    return undefined;
  }

  const parts = pathname.slice(prefix.length).split("/").filter(Boolean).map(decodePathSegment);
  const parentId = parts[0];

  if (!parentId || parts.length !== 1) {
    return undefined;
  }

  return { parentId: readPositiveInt(parentId, "That parent was not found.") };
}

function recordIdApiPath(
  pathname: string,
  prefix: string,
): { id: number; rest: Array<string> } | undefined {
  const root = `${prefix}/`;

  if (!pathname.startsWith(root)) {
    return undefined;
  }

  const parts = pathname.slice(root.length).split("/").filter(Boolean).map(decodePathSegment);
  const idPart = parts[0];

  if (!idPart) {
    return undefined;
  }

  return {
    id: readPositiveInt(idPart, "That record was not found."),
    rest: parts.slice(1),
  };
}

function readPositiveInt(value: string, message: string): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(message);
  }

  return parsed;
}

function readImportBytes(body: unknown): Uint8Array {
  if (body instanceof Uint8Array) {
    return body;
  }

  throw new Error("A SQLite file is required.");
}

function readStudentId(body: unknown): number {
  if (typeof body === "object" && body !== null && "studentId" in body) {
    const studentId = body.studentId;

    if (typeof studentId === "number" && Number.isInteger(studentId) && studentId > 0) {
      return studentId;
    }
  }

  throw new Error("A student is required.");
}

function readStudentFields(body: unknown): StudentFields {
  const record = unknownRecord(body, "A first name is required.");

  return {
    firstName: readStringField(record, "firstName", "A first name is required."),
    lastName: readStringField(record, "lastName", "A last name is required."),
    preferredName: readOptionalStringField(record, "preferredName"),
    notes: readOptionalStringField(record, "notes"),
    email: readOptionalStringField(record, "email"),
  };
}

function readParentFields(body: unknown): ParentFields {
  const record = unknownRecord(body, "A first name is required.");

  return {
    firstName: readStringField(record, "firstName", "A first name is required."),
    lastName: readStringField(record, "lastName", "A last name is required."),
    preferredName: readOptionalStringField(record, "preferredName"),
    notes: readOptionalStringField(record, "notes"),
    emailAddress1: readOptionalStringField(record, "emailAddress1"),
    emailAddress2: readOptionalStringField(record, "emailAddress2"),
  };
}

function readStringField(body: Record<string, unknown>, key: string, message: string): string {
  const value = body[key];

  if (typeof value !== "string") {
    throw new Error(message);
  }

  return value;
}

function readOptionalStringField(body: Record<string, unknown>, key: string): string {
  if (!(key in body)) {
    return "";
  }

  const value = body[key];

  if (typeof value !== "string") {
    throw new Error(`${key} must be text.`);
  }

  return value;
}

export async function handleDevelopmentApiRequest(
  options: DevelopmentApiHandlers & {
    method: string;
    pathname: string;
    body?: unknown;
  },
): Promise<DevelopmentApiResponse> {
  if (options.method === "OPTIONS") {
    return { statusCode: 204, body: null };
  }

  if (options.method === "GET" && options.pathname === DEVELOPMENT_API_STATUS_PATH) {
    return {
      statusCode: 200,
      body: databaseStatusSchema.parse(await options.getStatus()),
    };
  }

  if (options.method === "GET" && options.pathname === DEVELOPMENT_API_EXPORT_PATH) {
    return {
      statusCode: 200,
      body: await options.exportDatabase(),
      contentType: "application/vnd.sqlite3",
      fileName: "gradebook.sqlite",
    };
  }

  if (options.method === "POST" && options.pathname === DEVELOPMENT_API_IMPORT_PATH) {
    return {
      statusCode: 200,
      body: databaseImportResultSchema.parse(
        await options.importDatabase(readImportBytes(options.body)),
      ),
    };
  }

  if (options.method === "GET" && options.pathname === DEVELOPMENT_API_SUBJECTS_PATH) {
    return {
      statusCode: 200,
      body: classSubjectListSchema.parse(await options.listSubjects()),
    };
  }

  if (options.method === "GET" && options.pathname === DEVELOPMENT_API_SCHOOL_YEARS_PATH) {
    return {
      statusCode: 200,
      body: schoolYearListSchema.parse(await options.listSchoolYears()),
    };
  }

  if (options.method === "POST" && options.pathname === DEVELOPMENT_API_SCHOOL_YEARS_PATH) {
    return {
      statusCode: 201,
      body: schoolYearSchema.parse(await options.createSchoolYear(readJsonName(options.body))),
    };
  }

  const yearPath = schoolYearApiPath(options.pathname);

  if (yearPath && yearPath.rest.length === 0 && options.method === "DELETE") {
    return {
      statusCode: 200,
      body: schoolYearDeleteResultSchema.parse(await options.deleteSchoolYear(yearPath.yearName)),
    };
  }

  if (yearPath && yearPath.rest.length === 1 && yearPath.rest[0] === "classes") {
    if (options.method === "GET") {
      return {
        statusCode: 200,
        body: classListSchema.parse(await options.listClasses(yearPath.yearName)),
      };
    }

    if (options.method === "POST") {
      return {
        statusCode: 201,
        body: classSchema.parse(
          await options.createClass(readClassCreateBody(yearPath.yearName, options.body)),
        ),
      };
    }
  }

  if (
    yearPath &&
    yearPath.rest.length === 2 &&
    yearPath.rest[0] === "classes" &&
    yearPath.rest[1]
  ) {
    const lookup = { schoolYearName: yearPath.yearName, internalName: yearPath.rest[1] };

    if (options.method === "GET") {
      return {
        statusCode: 200,
        body: classSchema.parse(await options.getClass(lookup)),
      };
    }

    if (options.method === "PATCH") {
      return {
        statusCode: 200,
        body: classSchema.parse(
          await options.updateClass({
            ...readClassFields(options.body),
            schoolYearName: lookup.schoolYearName,
            currentInternalName: lookup.internalName,
          }),
        ),
      };
    }

    if (options.method === "DELETE") {
      return {
        statusCode: 200,
        body: classDeleteResultSchema.parse(await options.deleteClass(lookup)),
      };
    }
  }

  if (
    yearPath &&
    yearPath.rest.length === 3 &&
    yearPath.rest[0] === "classes" &&
    yearPath.rest[1] &&
    yearPath.rest[2] === "students"
  ) {
    const lookup = { schoolYearName: yearPath.yearName, internalName: yearPath.rest[1] };

    if (options.method === "GET") {
      return {
        statusCode: 200,
        body: studentListSchema.parse(await options.listStudentsForClass(lookup)),
      };
    }

    if (options.method === "POST") {
      return {
        statusCode: 201,
        body: studentSchema.parse(
          await options.addStudentToClass({
            ...lookup,
            studentId: readStudentId(options.body),
          }),
        ),
      };
    }
  }

  if (
    yearPath &&
    yearPath.rest.length === 4 &&
    yearPath.rest[0] === "classes" &&
    yearPath.rest[1] &&
    yearPath.rest[2] === "students" &&
    yearPath.rest[3]
  ) {
    const lookup = {
      schoolYearName: yearPath.yearName,
      internalName: yearPath.rest[1],
      studentId: readPositiveInt(yearPath.rest[3], "That student was not found."),
    };

    if (options.method === "DELETE") {
      return {
        statusCode: 200,
        body: deleteResultSchema.parse(await options.removeStudentFromClass(lookup)),
      };
    }
  }

  if (options.pathname === DEVELOPMENT_API_STUDENTS_PATH) {
    if (options.method === "GET") {
      return {
        statusCode: 200,
        body: studentListSchema.parse(await options.listStudents()),
      };
    }

    if (options.method === "POST") {
      return {
        statusCode: 201,
        body: studentSchema.parse(await options.createStudent(readStudentFields(options.body))),
      };
    }
  }

  const studentApi = studentApiPath(options.pathname);

  if (studentApi && studentApi.rest.length === 0) {
    const lookup = { id: studentApi.studentId };

    if (options.method === "GET") {
      return {
        statusCode: 200,
        body: studentSchema.parse(await options.getStudent(lookup)),
      };
    }

    if (options.method === "PATCH") {
      return {
        statusCode: 200,
        body: studentSchema.parse(
          await options.updateStudent({
            id: studentApi.studentId,
            ...readStudentFields(options.body),
          }),
        ),
      };
    }

    if (options.method === "DELETE") {
      return {
        statusCode: 200,
        body: deleteResultSchema.parse(await options.deleteStudent(lookup)),
      };
    }
  }

  if (studentApi && studentApi.rest.length === 1 && studentApi.rest[0] === "classes") {
    if (options.method === "GET") {
      return {
        statusCode: 200,
        body: enrolledClassListSchema.parse(
          await options.listClassesForStudent({ id: studentApi.studentId }),
        ),
      };
    }
  }

  if (studentApi && studentApi.rest.length === 1 && studentApi.rest[0] === "parents") {
    if (options.method === "GET") {
      return {
        statusCode: 200,
        body: parentListSchema.parse(
          await options.listParentsForStudent({ id: studentApi.studentId }),
        ),
      };
    }

    if (options.method === "POST") {
      return {
        statusCode: 201,
        body: parentSchema.parse(
          await options.createParentForStudent({
            studentId: studentApi.studentId,
            ...readParentFields(options.body),
          }),
        ),
      };
    }
  }

  if (
    studentApi &&
    studentApi.rest.length === 2 &&
    studentApi.rest[0] === "parents" &&
    studentApi.rest[1]
  ) {
    if (options.method === "DELETE") {
      return {
        statusCode: 200,
        body: deleteResultSchema.parse(
          await options.deleteParentForStudent({
            id: readPositiveInt(studentApi.rest[1], "That parent was not found."),
            studentId: studentApi.studentId,
          }),
        ),
      };
    }
  }

  const parentApi = parentApiPath(options.pathname);

  if (parentApi && options.method === "PATCH") {
    return {
      statusCode: 200,
      body: parentSchema.parse(
        await options.updateParent({
          id: parentApi.parentId,
          ...readParentFields(options.body),
        }),
      ),
    };
  }

  const yearById = recordIdApiPath(options.pathname, DEVELOPMENT_API_YEARS_PATH);
  if (yearById && yearById.rest.length === 0 && options.method === "GET") {
    return {
      statusCode: 200,
      body: schoolYearSchema.parse(await options.getSchoolYear({ id: yearById.id })),
    };
  }

  const classById = recordIdApiPath(options.pathname, DEVELOPMENT_API_CLASSES_PATH);
  if (classById && classById.rest.length === 0 && options.method === "GET") {
    return {
      statusCode: 200,
      body: classSchema.parse(await options.getClassById({ id: classById.id })),
    };
  }

  const gradingResult = await handleGradingDevelopmentApiRequest({
    ...options,
    classLookup:
      yearPath && yearPath.rest[0] === "classes" && yearPath.rest[1]
        ? { schoolYearName: yearPath.yearName, internalName: yearPath.rest[1] }
        : undefined,
    classRest:
      yearPath && yearPath.rest[0] === "classes" && yearPath.rest[1]
        ? yearPath.rest.slice(2)
        : undefined,
  });

  if (gradingResult) {
    return gradingResult;
  }

  return { statusCode: 404, body: { error: "Not found." } };
}

async function readRequestBody(request: http.IncomingMessage, pathname: string): Promise<unknown> {
  const chunks: Array<Buffer> = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) {
    return undefined;
  }

  const raw = Buffer.concat(chunks);

  if (pathname === DEVELOPMENT_API_IMPORT_PATH) {
    return new Uint8Array(raw);
  }

  const text = raw.toString("utf8").trim();

  if (!text) {
    return undefined;
  }

  const parsed: unknown = JSON.parse(text);
  return parsed;
}

function writeDevelopmentApiResponse(
  request: http.IncomingMessage,
  response: http.ServerResponse,
  result: DevelopmentApiResponse,
): void {
  const origin = request.headers.origin ?? "http://localhost:5173";
  const headers: http.OutgoingHttpHeaders = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (result.body instanceof Uint8Array) {
    headers["Content-Type"] = result.contentType ?? "application/octet-stream";
    headers["Content-Disposition"] =
      `attachment; filename="${result.fileName ?? "gradebook.sqlite"}"`;
    response.writeHead(result.statusCode, headers);
    response.end(Buffer.from(result.body));
    return;
  }

  headers["Content-Type"] = result.contentType ?? "application/json";
  response.writeHead(result.statusCode, headers);
  response.end(result.body === null ? undefined : JSON.stringify(result.body));
}

export function startDevelopmentApi(handlers: DevelopmentApiHandlers): http.Server {
  const server = http.createServer((request, response) => {
    const pathname = new URL(request.url ?? "/", "http://127.0.0.1").pathname;

    void readRequestBody(request, pathname)
      .then((body) =>
        handleDevelopmentApiRequest({
          method: request.method ?? "GET",
          pathname,
          body,
          ...handlers,
        }),
      )
      .then((result) => {
        writeDevelopmentApiResponse(request, response, result);
      })
      .catch((error: unknown) => {
        response.writeHead(400, { "Content-Type": "application/json" });
        response.end(
          JSON.stringify({
            error: error instanceof Error ? error.message : "The request failed.",
          }),
        );
      });
  });

  server.on("error", (error: NodeJS.ErrnoException) => {
    if (error.code === "EADDRINUSE") {
      console.error(
        `Development API port ${DEVELOPMENT_API_PORT} is already in use. Stop the other Gradebook process and run npm run dev again.`,
      );
      return;
    }

    console.error("The development API failed to start.", error);
  });

  server.listen(DEVELOPMENT_API_PORT, "127.0.0.1", () => {
    console.log(`Development API listening on http://127.0.0.1:${DEVELOPMENT_API_PORT}`);
  });
  return server;
}
