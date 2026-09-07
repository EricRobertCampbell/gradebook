import { BrowserWindow, dialog, type OpenDialogOptions } from "electron";

export async function chooseExportDestination(): Promise<string | undefined> {
  const window = parentWindow();
  const options = {
    title: "Save gradebook",
    defaultPath: "gradebook.sqlite",
    filters: [{ name: "SQLite database", extensions: ["sqlite", "db"] }],
  };
  const result = window
    ? await dialog.showSaveDialog(window, options)
    : await dialog.showSaveDialog(options);

  if (result.canceled || !result.filePath) {
    return undefined;
  }

  return result.filePath;
}

export async function chooseImportSource(): Promise<string | undefined> {
  const window = parentWindow();
  const options: OpenDialogOptions = {
    title: "Import gradebook",
    properties: ["openFile"],
    filters: [{ name: "SQLite database", extensions: ["sqlite", "db"] }],
  };
  const result = window
    ? await dialog.showOpenDialog(window, options)
    : await dialog.showOpenDialog(options);

  if (result.canceled || !result.filePaths[0]) {
    return undefined;
  }

  return result.filePaths[0];
}

function parentWindow(): BrowserWindow | undefined {
  return BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0];
}
