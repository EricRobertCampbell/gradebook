import { describe, expect, it } from "vitest";
import {
  HOME_VISIT_STORAGE_KEY,
  readHomeVisited,
  shouldOpenOnlySchoolYear,
  writeHomeVisited,
} from "./home-visit";

describe("shouldOpenOnlySchoolYear", () => {
  it("opens the year on the first visit when there is exactly one", () => {
    expect(shouldOpenOnlySchoolYear(1, false)).toBe(true);
  });

  it("stays on the homepage when there are no years", () => {
    expect(shouldOpenOnlySchoolYear(0, false)).toBe(false);
  });

  it("stays on the homepage when there are several years", () => {
    expect(shouldOpenOnlySchoolYear(2, false)).toBe(false);
  });

  it("does not open again after the homepage has already been visited", () => {
    expect(shouldOpenOnlySchoolYear(1, true)).toBe(false);
  });
});

describe("home visit storage", () => {
  it("records and reads the first homepage visit", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem(key: string): string | null {
        return values.get(key) ?? null;
      },
      setItem(key: string, value: string): void {
        values.set(key, value);
      },
    };

    expect(readHomeVisited(storage)).toBe(false);
    writeHomeVisited(storage);
    expect(values.get(HOME_VISIT_STORAGE_KEY)).toBe("1");
    expect(readHomeVisited(storage)).toBe(true);
  });
});
