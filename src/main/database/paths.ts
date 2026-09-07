import path from "node:path";

export type DatabaseEnvironment = "development" | "production" | "test";

export type DatabasePathOptions = {
  environment: DatabaseEnvironment;
  projectRoot: string;
  userDataPath: string;
  testDatabasePath?: string;
};

export function resolveDatabasePath(options: DatabasePathOptions): string {
  if (options.environment === "test") {
    return options.testDatabasePath ?? ":memory:";
  }

  if (options.environment === "development") {
    return path.join(options.projectRoot, ".data", "gradebook-dev.sqlite");
  }

  return path.join(options.userDataPath, "gradebook.sqlite");
}

export type MigrationsFolderOptions = {
  isPackaged: boolean;
  projectRoot: string;
  resourcesPath: string;
};

export function resolveMigrationsFolder(options: MigrationsFolderOptions): string {
  if (options.isPackaged) {
    return path.join(options.resourcesPath, "drizzle");
  }

  return path.join(options.projectRoot, "drizzle");
}

export function resolveRuntimeEnvironment(
  isPackaged: boolean,
): Exclude<DatabaseEnvironment, "test"> {
  return isPackaged ? "production" : "development";
}
