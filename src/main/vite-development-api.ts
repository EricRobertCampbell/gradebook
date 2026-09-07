import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";
import { DEVELOPMENT_API_IMPORT_PATH } from "../shared/development-api";
import { bootstrapDatabase } from "./database/client";
import {
  createClass,
  deleteClass,
  getClass,
  getClassById,
  listClasses,
  updateClass,
} from "./database/classes";
import {
  addStudentToClass,
  listClassesForStudent,
  listStudentsForClass,
  removeStudentFromClass,
} from "./database/enrolments";
import {
  createParentForStudent,
  deleteParentForStudent,
  listParentsForStudent,
  updateParent,
} from "./database/parents";
import { resolveDatabasePath, resolveMigrationsFolder } from "./database/paths";
import {
  createSchoolYear,
  deleteSchoolYear,
  getSchoolYearById,
  listSchoolYears,
} from "./database/school-years";
import {
  getDatabaseRuntime,
  getRuntimeDatabase,
  replaceRuntimeDatabase,
  setDatabaseRuntime,
} from "./database/runtime";
import { getDatabaseStatus } from "./database/status";
import {
  createStudent,
  deleteStudent,
  getStudent,
  listStudents,
  updateStudent,
} from "./database/students";
import { exportDatabaseToBytes, importDatabaseFromBytes } from "./database/transfer";
import { handleDevelopmentApiRequest } from "./development-api";
import { gradingApiHandlers } from "./grading-api-handlers";

function readBody(request: IncomingMessage, pathname: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Array<Buffer> = [];

    request.on("data", (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    request.on("end", () => {
      if (chunks.length === 0) {
        resolve(undefined);
        return;
      }

      const raw = Buffer.concat(chunks);

      if (pathname === DEVELOPMENT_API_IMPORT_PATH) {
        resolve(new Uint8Array(raw));
        return;
      }

      const text = raw.toString("utf8").trim();

      if (!text) {
        resolve(undefined);
        return;
      }

      try {
        const parsed: unknown = JSON.parse(text);
        resolve(parsed);
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", reject);
  });
}

function sendResult(
  response: ServerResponse,
  statusCode: number,
  body: unknown,
  contentType?: string,
  fileName?: string,
): void {
  if (body instanceof Uint8Array) {
    response.statusCode = statusCode;
    response.setHeader("Content-Type", contentType ?? "application/octet-stream");
    response.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileName ?? "gradebook.sqlite"}"`,
    );
    response.end(Buffer.from(body));
    return;
  }

  response.statusCode = statusCode;
  response.setHeader("Content-Type", contentType ?? "application/json");
  response.end(body === null ? undefined : JSON.stringify(body));
}

export function gradebookDevelopmentApiPlugin(): Plugin {
  return {
    name: "gradebook-development-api",
    apply: "serve",
    async configureServer(server) {
      const projectRoot = process.cwd();
      const databasePath = resolveDatabasePath({
        environment: "development",
        projectRoot,
        userDataPath: projectRoot,
      });
      const migrationsFolder = resolveMigrationsFolder({
        isPackaged: false,
        projectRoot,
        resourcesPath: projectRoot,
      });
      const initialised = await bootstrapDatabase({
        databasePath,
        migrationsFolder,
      }).catch((error: unknown) => {
        console.error("The Vite development API could not open SQLite.", error);
        return undefined;
      });

      if (!initialised) {
        return;
      }

      setDatabaseRuntime({
        database: initialised,
        databasePath,
        migrationsFolder,
      });

      const handlers = {
        getStatus: () => getDatabaseStatus(getRuntimeDatabase()),
        exportDatabase: () => exportDatabaseToBytes(getDatabaseRuntime().database.sqlite),
        importDatabase: async (contents: Uint8Array) => {
          const runtime = getDatabaseRuntime();
          await importDatabaseFromBytes({
            contents,
            livePath: runtime.databasePath,
            migrationsFolder: runtime.migrationsFolder,
            current: runtime.database,
            adopt: replaceRuntimeDatabase,
          });
          return { imported: true, cancelled: false };
        },
        listSchoolYears: () => listSchoolYears(getRuntimeDatabase()),
        getSchoolYear: (input: Parameters<typeof getSchoolYearById>[1]) =>
          getSchoolYearById(getRuntimeDatabase(), input),
        createSchoolYear: (name: string) => createSchoolYear(getRuntimeDatabase(), name),
        deleteSchoolYear: (name: string) => deleteSchoolYear(getRuntimeDatabase(), name),
        listClasses: (schoolYearName: string) => listClasses(getRuntimeDatabase(), schoolYearName),
        getClass: (input: Parameters<typeof getClass>[1]) => getClass(getRuntimeDatabase(), input),
        getClassById: (input: Parameters<typeof getClassById>[1]) =>
          getClassById(getRuntimeDatabase(), input),
        createClass: (input: Parameters<typeof createClass>[1]) =>
          createClass(getRuntimeDatabase(), input),
        updateClass: (input: Parameters<typeof updateClass>[1]) =>
          updateClass(getRuntimeDatabase(), input),
        deleteClass: (input: Parameters<typeof deleteClass>[1]) =>
          deleteClass(getRuntimeDatabase(), input),
        listStudents: () => listStudents(getRuntimeDatabase()),
        getStudent: (input: Parameters<typeof getStudent>[1]) =>
          getStudent(getRuntimeDatabase(), input),
        createStudent: (input: Parameters<typeof createStudent>[1]) =>
          createStudent(getRuntimeDatabase(), input),
        updateStudent: (input: Parameters<typeof updateStudent>[1]) =>
          updateStudent(getRuntimeDatabase(), input),
        deleteStudent: (input: Parameters<typeof deleteStudent>[1]) =>
          deleteStudent(getRuntimeDatabase(), input),
        listClassesForStudent: (input: Parameters<typeof listClassesForStudent>[1]) =>
          listClassesForStudent(getRuntimeDatabase(), input),
        listParentsForStudent: (input: Parameters<typeof listParentsForStudent>[1]) =>
          listParentsForStudent(getRuntimeDatabase(), input),
        createParentForStudent: (input: Parameters<typeof createParentForStudent>[1]) =>
          createParentForStudent(getRuntimeDatabase(), input),
        updateParent: (input: Parameters<typeof updateParent>[1]) =>
          updateParent(getRuntimeDatabase(), input),
        deleteParentForStudent: (input: Parameters<typeof deleteParentForStudent>[1]) =>
          deleteParentForStudent(getRuntimeDatabase(), input),
        listStudentsForClass: (input: Parameters<typeof listStudentsForClass>[1]) =>
          listStudentsForClass(getRuntimeDatabase(), input),
        addStudentToClass: (input: Parameters<typeof addStudentToClass>[1]) =>
          addStudentToClass(getRuntimeDatabase(), input),
        removeStudentFromClass: (input: Parameters<typeof removeStudentFromClass>[1]) =>
          removeStudentFromClass(getRuntimeDatabase(), input),
        ...gradingApiHandlers(getRuntimeDatabase),
      };

      server.middlewares.use((request, response, next) => {
        const pathname = new URL(request.url ?? "/", "http://127.0.0.1").pathname;

        if (!pathname.startsWith("/api/")) {
          next();
          return;
        }

        void (async () => {
          const method = request.method ?? "GET";
          const body =
            method === "GET" || method === "HEAD" || method === "OPTIONS"
              ? undefined
              : await readBody(request, pathname);
          return handleDevelopmentApiRequest({
            method,
            pathname,
            body,
            ...handlers,
          });
        })()
          .then((result) => {
            sendResult(response, result.statusCode, result.body, result.contentType, result.fileName);
          })
          .catch((error: unknown) => {
            sendResult(response, 400, {
              error: error instanceof Error ? error.message : "The request failed.",
            });
          });
      });
    },
  };
}
