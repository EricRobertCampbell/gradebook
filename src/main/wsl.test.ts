import { describe, expect, it } from "vitest";
import { isRunningOnWsl } from "./wsl";

describe("isRunningOnWsl", () => {
  it("reports a boolean without throwing", () => {
    expect(typeof isRunningOnWsl()).toBe("boolean");
  });
});
