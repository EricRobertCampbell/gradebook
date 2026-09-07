import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { resolveDatabasePath, resolveMigrationsFolder, resolveRuntimeEnvironment } from "./paths";

describe("database path isolation", () => {
  const projectRoot = "/tmp/gradebook-source";
  const userDataPath = path.join(os.homedir(), "AppData", "Roaming", "Gradebook");

  it("keeps development, production, and test databases on distinct paths", () => {
    const development = resolveDatabasePath({
      environment: "development",
      projectRoot,
      userDataPath,
    });
    const production = resolveDatabasePath({
      environment: "production",
      projectRoot,
      userDataPath,
    });
    const test = resolveDatabasePath({
      environment: "test",
      projectRoot,
      userDataPath,
      testDatabasePath: path.join(os.tmpdir(), "gradebook-test.sqlite"),
    });

    expect(development).toBe(path.join(projectRoot, ".data", "gradebook-dev.sqlite"));
    expect(production).toBe(path.join(userDataPath, "gradebook.sqlite"));
    expect(new Set([development, production, test]).size).toBe(3);
    expect(production).not.toContain(projectRoot);
  });

  it("defaults test databases to an in-memory SQLite instance", () => {
    expect(
      resolveDatabasePath({
        environment: "development",
        projectRoot,
        userDataPath,
      }),
    ).not.toBe(":memory:");
    expect(
      resolveDatabasePath({
        environment: "test",
        projectRoot,
        userDataPath,
      }),
    ).toBe(":memory:");
  });

  it("reads packaged migrations from Electron resources and source migrations from the repo", () => {
    expect(
      resolveMigrationsFolder({
        isPackaged: true,
        projectRoot,
        resourcesPath: "/opt/Gradebook/resources",
      }),
    ).toBe(path.join("/opt/Gradebook/resources", "drizzle"));
    expect(
      resolveMigrationsFolder({
        isPackaged: false,
        projectRoot,
        resourcesPath: "/opt/Gradebook/resources",
      }),
    ).toBe(path.join(projectRoot, "drizzle"));
  });

  it("maps packaged builds to the production environment", () => {
    expect(resolveRuntimeEnvironment(false)).toBe("development");
    expect(resolveRuntimeEnvironment(true)).toBe("production");
  });
});
