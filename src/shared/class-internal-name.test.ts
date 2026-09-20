import { describe, expect, it } from "vitest";
import { classInternalNameFromDisplayName, nextClassInternalName } from "./class-internal-name";

describe("classInternalNameFromDisplayName", () => {
  it("lowercases the display name and collapses spaces", () => {
    expect(classInternalNameFromDisplayName("  Math  30-1 ")).toBe("math 30-1");
  });

  it("replaces characters that internal names cannot contain", () => {
    expect(classInternalNameFromDisplayName("Math/Sci #1")).toBe("math sci 1");
  });
});

describe("nextClassInternalName", () => {
  it("fills the internal name from the display name while they stay linked", () => {
    expect(nextClassInternalName("Math", "", "")).toBe("math");
    expect(nextClassInternalName("Math 30-1", "Math", "math")).toBe("math 30-1");
  });

  it("keeps a manually overwritten internal name", () => {
    expect(nextClassInternalName("Mathematics 30-1", "Math 30-1", "m30-1")).toBe("m30-1");
  });
});
