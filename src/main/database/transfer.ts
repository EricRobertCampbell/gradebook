import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { bootstrapDatabase, type InitialisedDatabase } from "./client";

const SQLITE_HEADER = "SQLite format 3";

export async function exportDatabaseToFile(
  sqlite: Database.Database,
  destinationPath: string,
): Promise<void> {
  const destination = resolveExportPath(destinationPath);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  removeDatabaseFiles(destination);
  await sqlite.backup(destination);
}

export async function exportDatabaseToBytes(sqlite: Database.Database): Promise<Uint8Array> {
  const destination = temporaryDatabasePath("export");

  try {
    await exportDatabaseToFile(sqlite, destination);
    return new Uint8Array(fs.readFileSync(destination));
  } finally {
    removeDatabaseFiles(destination);
  }
}

export async function importDatabaseFromFile(options: {
  sourcePath: string;
  livePath: string;
  migrationsFolder: string;
  current: InitialisedDatabase;
  adopt: (database: InitialisedDatabase) => void;
  bootstrap?: typeof bootstrapDatabase;
}): Promise<void> {
  const sourcePath = path.resolve(options.sourcePath);
  const livePath = path.resolve(options.livePath);
  assertImportableGradebook(sourcePath);

  if (livePath === ":memory:") {
    throw new Error("The in-memory database cannot be replaced from a file.");
  }

  if (sourcePath === livePath) {
    throw new Error("Choose a different file from the live database.");
  }

  const bootstrap = options.bootstrap ?? bootstrapDatabase;
  const safetyPath = `${livePath}.pre-import`;
  await options.current.sqlite.backup(safetyPath);
  options.current.sqlite.close();

  try {
    replaceLiveDatabaseFile(sourcePath, livePath);
    const imported = await bootstrap({
      databasePath: livePath,
      migrationsFolder: options.migrationsFolder,
    });
    options.adopt(imported);
    removeDatabaseFiles(safetyPath);
  } catch (error) {
    const restored = await restoreLiveDatabase({
      safetyPath,
      livePath,
      migrationsFolder: options.migrationsFolder,
      bootstrap,
    });
    options.adopt(restored);
    throw new Error(describeImportFailure(error), { cause: error });
  }
}

export async function importDatabaseFromBytes(options: {
  contents: Uint8Array;
  livePath: string;
  migrationsFolder: string;
  current: InitialisedDatabase;
  adopt: (database: InitialisedDatabase) => void;
  bootstrap?: typeof bootstrapDatabase;
}): Promise<void> {
  const sourcePath = temporaryDatabasePath("import");
  fs.writeFileSync(sourcePath, Buffer.from(options.contents));

  try {
    await importDatabaseFromFile({
      sourcePath,
      livePath: options.livePath,
      migrationsFolder: options.migrationsFolder,
      current: options.current,
      adopt: options.adopt,
      bootstrap: options.bootstrap,
    });
  } finally {
    removeDatabaseFiles(sourcePath);
  }
}

export function assertImportableGradebook(filePath: string): void {
  if (!fs.existsSync(filePath)) {
    throw new Error("That SQLite file was not found.");
  }

  const header = Buffer.alloc(SQLITE_HEADER.length);
  const file = fs.openSync(filePath, "r");

  try {
    fs.readSync(file, header, 0, header.length, 0);
  } finally {
    fs.closeSync(file);
  }

  if (header.toString("utf8") !== SQLITE_HEADER) {
    throw new Error("That file is not a SQLite database.");
  }

  const sqlite = new Database(filePath, { fileMustExist: true, readonly: true });

  try {
    const names = new Set(
      sqliteTableNames(sqlite.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all()),
    );

    if (
      !names.has("app_metadata") &&
      !names.has("school_years") &&
      !names.has("__drizzle_migrations")
    ) {
      throw new Error("That SQLite file is not a Gradebook database.");
    }
  } finally {
    sqlite.close();
  }
}

function sqliteTableNames(rows: unknown): Array<string> {
  if (!Array.isArray(rows)) {
    throw new Error("The database tables could not be read.");
  }

  return rows.map((row) => {
    if (typeof row !== "object" || row === null || !("name" in row) || typeof row.name !== "string") {
      throw new Error("The database tables could not be read.");
    }

    return row.name;
  });
}

function resolveExportPath(destinationPath: string): string {
  if (!destinationPath || destinationPath === ":memory:") {
    throw new Error("A file path is required to save the gradebook.");
  }

  if (path.extname(destinationPath)) {
    return path.resolve(destinationPath);
  }

  return `${path.resolve(destinationPath)}.sqlite`;
}

function replaceLiveDatabaseFile(sourcePath: string, livePath: string): void {
  fs.mkdirSync(path.dirname(livePath), { recursive: true });
  removeDatabaseFiles(livePath);
  fs.copyFileSync(sourcePath, livePath);
}

async function restoreLiveDatabase(options: {
  safetyPath: string;
  livePath: string;
  migrationsFolder: string;
  bootstrap: typeof bootstrapDatabase;
}): Promise<InitialisedDatabase> {
  if (!fs.existsSync(options.safetyPath)) {
    throw new Error("The gradebook could not be imported, and the previous database was not found.");
  }

  replaceLiveDatabaseFile(options.safetyPath, options.livePath);
  const restored = await options.bootstrap({
    databasePath: options.livePath,
    migrationsFolder: options.migrationsFolder,
  });
  removeDatabaseFiles(options.safetyPath);
  return restored;
}

function describeImportFailure(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  if (message.startsWith("The gradebook could not be imported")) {
    return message;
  }

  return `The gradebook could not be imported. The previous database was restored. ${message}`;
}

function temporaryDatabasePath(label: string): string {
  return path.join(os.tmpdir(), `gradebook-${label}-${process.pid}-${Date.now()}.sqlite`);
}

function removeDatabaseFiles(databasePath: string): void {
  for (const filePath of [databasePath, `${databasePath}-wal`, `${databasePath}-shm`]) {
    fs.rmSync(filePath, { force: true });
  }
}
