import http from "node:http";
import path from "node:path";
import { app, BrowserWindow, Menu } from "electron";
import started from "electron-squirrel-startup";
import { bootstrapDatabase } from "./database/client";
import { chooseExportDestination, chooseImportSource } from "./database/dialogs";
import {
  resolveDatabasePath,
  resolveMigrationsFolder,
  resolveRuntimeEnvironment,
} from "./database/paths";
import {
  getDatabaseRuntime,
  getRuntimeDatabase,
  replaceRuntimeDatabase,
  setDatabaseRuntime,
} from "./database/runtime";
import {
  exportDatabaseToBytes,
  exportDatabaseToFile,
  importDatabaseFromBytes,
  importDatabaseFromFile,
} from "./database/transfer";
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
import {
  createSchoolYear,
  deleteSchoolYear,
  getSchoolYearById,
  listSchoolYears,
} from "./database/school-years";
import { getDatabaseStatus } from "./database/status";
import {
  createStudent,
  deleteStudent,
  getStudent,
  listStudents,
  updateStudent,
} from "./database/students";
import { startDevelopmentApi } from "./development-api";
import { gradingApiHandlers } from "./grading-api-handlers";
import { ipcChannels, registerIpcHandler } from "./ipc/register";
import { openWindowsBrowser } from "./open-windows-browser";
import { configureWslDisplay } from "./wsl";

if (started) {
  app.quit();
}

const runningOnWsl = configureWslDisplay();

if (runningOnWsl) {
  app.commandLine.appendSwitch("ozone-platform-hint", "wayland");
  app.commandLine.appendSwitch("enable-features", "WaylandWindowDecorations");
}

if (!app.isPackaged) {
  app.setName("gradebook-dev");
}

let developmentApi: http.Server | undefined;

function registerDatabaseIpc(): void {
  registerIpcHandler(ipcChannels.databaseGetStatus, async () => {
    return getDatabaseStatus(getRuntimeDatabase());
  });
  registerIpcHandler(ipcChannels.databaseExport, async () => {
    const destination = await chooseExportDestination();

    if (!destination) {
      return { exported: false, cancelled: true };
    }

    await exportDatabaseToFile(getDatabaseRuntime().database.sqlite, destination);
    return { exported: true, cancelled: false, path: destination };
  });
  registerIpcHandler(ipcChannels.databaseImport, async () => {
    const source = await chooseImportSource();

    if (!source) {
      return { imported: false, cancelled: true };
    }

    const runtime = getDatabaseRuntime();
    await importDatabaseFromFile({
      sourcePath: source,
      livePath: runtime.databasePath,
      migrationsFolder: runtime.migrationsFolder,
      current: runtime.database,
      adopt: replaceRuntimeDatabase,
    });
    return { imported: true, cancelled: false, path: source };
  });
  registerIpcHandler(ipcChannels.schoolYearList, async () => {
    return listSchoolYears(getRuntimeDatabase());
  });
  registerIpcHandler(ipcChannels.schoolYearGet, async (input) => {
    return getSchoolYearById(getRuntimeDatabase(), input);
  });
  registerIpcHandler(ipcChannels.schoolYearCreate, async ({ name }) => {
    return createSchoolYear(getRuntimeDatabase(), name);
  });
  registerIpcHandler(ipcChannels.schoolYearDelete, async ({ name }) => {
    return deleteSchoolYear(getRuntimeDatabase(), name);
  });
  registerIpcHandler(ipcChannels.classList, async ({ schoolYearName }) => {
    return listClasses(getRuntimeDatabase(), schoolYearName);
  });
  registerIpcHandler(ipcChannels.classGet, async (input) => {
    return getClass(getRuntimeDatabase(), input);
  });
  registerIpcHandler(ipcChannels.classGetById, async (input) => {
    return getClassById(getRuntimeDatabase(), input);
  });
  registerIpcHandler(ipcChannels.classCreate, async (input) => {
    return createClass(getRuntimeDatabase(), input);
  });
  registerIpcHandler(ipcChannels.classUpdate, async (input) => {
    return updateClass(getRuntimeDatabase(), input);
  });
  registerIpcHandler(ipcChannels.classDelete, async (input) => {
    return deleteClass(getRuntimeDatabase(), input);
  });
  registerIpcHandler(ipcChannels.studentList, async () => {
    return listStudents(getRuntimeDatabase());
  });
  registerIpcHandler(ipcChannels.studentGet, async (input) => {
    return getStudent(getRuntimeDatabase(), input);
  });
  registerIpcHandler(ipcChannels.studentCreate, async (input) => {
    return createStudent(getRuntimeDatabase(), input);
  });
  registerIpcHandler(ipcChannels.studentUpdate, async (input) => {
    return updateStudent(getRuntimeDatabase(), input);
  });
  registerIpcHandler(ipcChannels.studentDelete, async (input) => {
    return deleteStudent(getRuntimeDatabase(), input);
  });
  registerIpcHandler(ipcChannels.studentClassList, async (input) => {
    return listClassesForStudent(getRuntimeDatabase(), input);
  });
  registerIpcHandler(ipcChannels.parentListForStudent, async (input) => {
    return listParentsForStudent(getRuntimeDatabase(), input);
  });
  registerIpcHandler(ipcChannels.parentCreateForStudent, async (input) => {
    return createParentForStudent(getRuntimeDatabase(), input);
  });
  registerIpcHandler(ipcChannels.parentUpdate, async (input) => {
    return updateParent(getRuntimeDatabase(), input);
  });
  registerIpcHandler(ipcChannels.parentDelete, async (input) => {
    return deleteParentForStudent(getRuntimeDatabase(), input);
  });
  registerIpcHandler(ipcChannels.classStudentList, async (input) => {
    return listStudentsForClass(getRuntimeDatabase(), input);
  });
  registerIpcHandler(ipcChannels.classStudentAdd, async (input) => {
    return addStudentToClass(getRuntimeDatabase(), input);
  });
  registerIpcHandler(ipcChannels.classStudentRemove, async (input) => {
    return removeStudentFromClass(getRuntimeDatabase(), input);
  });

  const grading = gradingApiHandlers(getRuntimeDatabase);
  registerIpcHandler(ipcChannels.gradingGetStructure, grading.getGradingStructure);
  registerIpcHandler(ipcChannels.gradingGetGradebook, grading.getClassGradebook);
  registerIpcHandler(ipcChannels.categoryCreate, grading.createCategory);
  registerIpcHandler(ipcChannels.categoryUpdate, grading.updateCategory);
  registerIpcHandler(ipcChannels.categoryDelete, grading.deleteCategory);
  registerIpcHandler(ipcChannels.categoryCopy, grading.copyCategory);
  registerIpcHandler(ipcChannels.subcategoryCreate, grading.createSubcategory);
  registerIpcHandler(ipcChannels.subcategoryUpdate, grading.updateSubcategory);
  registerIpcHandler(ipcChannels.subcategoryDelete, grading.deleteSubcategory);
  registerIpcHandler(ipcChannels.subcategoryCopy, grading.copySubcategory);
  registerIpcHandler(ipcChannels.workCreate, grading.createWork);
  registerIpcHandler(ipcChannels.workUpdate, grading.updateWork);
  registerIpcHandler(ipcChannels.workDelete, grading.deleteWork);
  registerIpcHandler(ipcChannels.workCopy, grading.copyWork);
  registerIpcHandler(ipcChannels.assessmentUpsert, grading.upsertAssessment);
  registerIpcHandler(ipcChannels.assessmentDelete, grading.deleteAssessment);
  registerIpcHandler(ipcChannels.adjustmentCreate, grading.createAdjustment);
  registerIpcHandler(ipcChannels.adjustmentUpdate, grading.updateAdjustment);
  registerIpcHandler(ipcChannels.adjustmentDelete, grading.deleteAdjustment);
}

function resolveProjectRoot(): string {
  return app.isPackaged ? app.getAppPath() : process.cwd();
}

async function prepareDatabase(): Promise<void> {
  const projectRoot = resolveProjectRoot();
  const environment = resolveRuntimeEnvironment(app.isPackaged);
  const databasePath = resolveDatabasePath({
    environment,
    projectRoot,
    userDataPath: app.getPath("userData"),
  });
  const migrationsFolder = resolveMigrationsFolder({
    isPackaged: app.isPackaged,
    projectRoot,
    resourcesPath: process.resourcesPath,
  });

  const database = await bootstrapDatabase({ databasePath, migrationsFolder });
  setDatabaseRuntime({ database, databasePath, migrationsFolder });
}

function revealWindow(mainWindow: BrowserWindow): void {
  if (mainWindow.isDestroyed() || mainWindow.isVisible()) {
    return;
  }

  mainWindow.show();
  mainWindow.focus();
}

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 960,
    height: 680,
    minWidth: 640,
    minHeight: 480,
    title: "Local Gradebook",
    icon: resolveAppIconPath(),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  mainWindow.once("ready-to-show", () => {
    revealWindow(mainWindow);
  });
  mainWindow.webContents.once("did-finish-load", () => {
    revealWindow(mainWindow);
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    void mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    void mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }
}

function resolveAppIconPath(): string {
  const fileName = process.platform === "win32" ? "icon.ico" : "icon.png";

  if (app.isPackaged) {
    return path.join(process.resourcesPath, "images", fileName);
  }

  return path.join(resolveProjectRoot(), "images", fileName);
}

void app.whenReady().then(async () => {
  if (process.platform === "linux") {
    Menu.setApplicationMenu(null);
  }

  registerDatabaseIpc();

  try {
    await prepareDatabase();
  } catch (error) {
    console.error(
      "Failed to initialise the SQLite database.",
      error instanceof Error ? error : new Error(String(error)),
    );
  }

  if (!app.isPackaged) {
    developmentApi = startDevelopmentApi({
      getStatus: () => getDatabaseStatus(getRuntimeDatabase()),
      exportDatabase: () => exportDatabaseToBytes(getDatabaseRuntime().database.sqlite),
      importDatabase: async (contents) => {
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
      getSchoolYear: (input) => getSchoolYearById(getRuntimeDatabase(), input),
      createSchoolYear: (name) => createSchoolYear(getRuntimeDatabase(), name),
      deleteSchoolYear: (name) => deleteSchoolYear(getRuntimeDatabase(), name),
      listClasses: (schoolYearName) => listClasses(getRuntimeDatabase(), schoolYearName),
      getClass: (input) => getClass(getRuntimeDatabase(), input),
      getClassById: (input) => getClassById(getRuntimeDatabase(), input),
      createClass: (input) => createClass(getRuntimeDatabase(), input),
      updateClass: (input) => updateClass(getRuntimeDatabase(), input),
      deleteClass: (input) => deleteClass(getRuntimeDatabase(), input),
      listStudents: () => listStudents(getRuntimeDatabase()),
      getStudent: (input) => getStudent(getRuntimeDatabase(), input),
      createStudent: (input) => createStudent(getRuntimeDatabase(), input),
      updateStudent: (input) => updateStudent(getRuntimeDatabase(), input),
      deleteStudent: (input) => deleteStudent(getRuntimeDatabase(), input),
      listClassesForStudent: (input) => listClassesForStudent(getRuntimeDatabase(), input),
      listParentsForStudent: (input) => listParentsForStudent(getRuntimeDatabase(), input),
      createParentForStudent: (input) => createParentForStudent(getRuntimeDatabase(), input),
      updateParent: (input) => updateParent(getRuntimeDatabase(), input),
      deleteParentForStudent: (input) => deleteParentForStudent(getRuntimeDatabase(), input),
      listStudentsForClass: (input) => listStudentsForClass(getRuntimeDatabase(), input),
      addStudentToClass: (input) => addStudentToClass(getRuntimeDatabase(), input),
      removeStudentFromClass: (input) => removeStudentFromClass(getRuntimeDatabase(), input),
      ...gradingApiHandlers(getRuntimeDatabase),
    });
  }

  if (runningOnWsl && !app.isPackaged) {
    const developmentUrl = MAIN_WINDOW_VITE_DEV_SERVER_URL ?? "http://localhost:5173/";
    const opened = openWindowsBrowser(developmentUrl);
    console.log(
      opened
        ? `WSL: opened the development UI in your Windows browser at ${developmentUrl}`
        : `WSL: open ${developmentUrl} in your Windows browser. Keep this process running.`,
    );
  } else {
    createWindow();
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0 && !(runningOnWsl && !app.isPackaged)) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (runningOnWsl && !app.isPackaged) {
    return;
  }

  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  developmentApi?.close();

  try {
    getDatabaseRuntime().database.sqlite.close();
  } catch {
    // The database was never opened.
  }
});
