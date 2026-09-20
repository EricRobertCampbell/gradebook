export const HOME_VISIT_STORAGE_KEY = "gradebook:home-visited";

export function shouldOpenOnlySchoolYear(yearCount: number, homeAlreadyVisited: boolean): boolean {
  return !homeAlreadyVisited && yearCount === 1;
}

export function readHomeVisited(storage: Pick<Storage, "getItem">): boolean {
  return storage.getItem(HOME_VISIT_STORAGE_KEY) === "1";
}

export function writeHomeVisited(storage: Pick<Storage, "setItem">): void {
  storage.setItem(HOME_VISIT_STORAGE_KEY, "1");
}
