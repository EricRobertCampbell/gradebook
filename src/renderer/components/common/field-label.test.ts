import { describe, expect, it } from "vitest";
import { requiredFieldLabel } from "./field-label";

describe("requiredFieldLabel", () => {
  it("appends an asterisk to required labels", () => {
    expect(requiredFieldLabel("Internal name", true)).toBe("Internal name*");
  });

  it("leaves optional labels unchanged", () => {
    expect(requiredFieldLabel("Subject", false)).toBe("Subject");
  });
});
