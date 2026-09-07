import { DEVELOPMENT_API_STATUS_PATH } from "../shared/development-api";
import { databaseStatusSchema, type DatabaseStatus } from "../shared/ipc";

export function hasPreloadDatabaseApi(): boolean {
  return typeof window.gradebook?.database.getStatus === "function";
}

export async function requestDatabaseStatus(): Promise<DatabaseStatus> {
  const preloadApi = window.gradebook;

  if (preloadApi) {
    return preloadApi.database.getStatus();
  }

  if (!import.meta.env.DEV) {
    throw new Error("The gradebook preload API is not available.");
  }

  const response = await fetch(DEVELOPMENT_API_STATUS_PATH);

  if (!response.ok) {
    throw new Error("The development database API is not reachable. Keep npm run dev running.");
  }

  return databaseStatusSchema.parse(await response.json());
}
