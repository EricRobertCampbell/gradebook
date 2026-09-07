import {
  DEVELOPMENT_API_EXPORT_PATH,
  DEVELOPMENT_API_IMPORT_PATH,
} from "../shared/development-api";
import {
  databaseExportResultSchema,
  databaseImportResultSchema,
  type DatabaseExportResult,
  type DatabaseImportResult,
} from "../shared/ipc";
import { requestDevelopmentApi } from "./development-request";

export async function exportGradebook(): Promise<DatabaseExportResult> {
  if (hasPreloadTransferApi() && window.gradebook) {
    return window.gradebook.database.export();
  }

  const contents = await downloadDevelopmentExport();
  saveBlob(contents, "gradebook.sqlite");
  return databaseExportResultSchema.parse({ exported: true, cancelled: false });
}

export async function importGradebook(file?: File): Promise<DatabaseImportResult> {
  if (hasPreloadTransferApi() && window.gradebook) {
    return window.gradebook.database.import();
  }

  if (!file) {
    throw new Error("A SQLite file is required.");
  }

  return databaseImportResultSchema.parse(
    await requestDevelopmentApi(
      DEVELOPMENT_API_IMPORT_PATH,
      {
        method: "POST",
        headers: { "Content-Type": "application/vnd.sqlite3" },
        body: await file.arrayBuffer(),
      },
      "The gradebook could not be imported.",
    ),
  );
}

function hasPreloadTransferApi(): boolean {
  return typeof window.gradebook?.database.export === "function";
}

async function downloadDevelopmentExport(): Promise<Blob> {
  if (!import.meta.env.DEV) {
    throw new Error("The gradebook preload API is not available.");
  }

  const response = await fetch(DEVELOPMENT_API_EXPORT_PATH);

  if (!response.ok) {
    throw new Error("The gradebook could not be saved.");
  }

  return response.blob();
}

function saveBlob(contents: Blob, fileName: string): void {
  const url = URL.createObjectURL(contents);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
