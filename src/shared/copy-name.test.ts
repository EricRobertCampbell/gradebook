import { describe, expect, it } from "vitest";
import { uniqueCopyName } from "./copy-name";

describe("uniqueCopyName", () => {
  it("prefixes the original name", () => {
    expect(uniqueCopyName("Homework", ["Homework"])).toBe("Copy of Homework");
  });

  it("adds a numeric suffix when the copy name is already taken", () => {
    expect(uniqueCopyName("Homework", ["Homework", "Copy of Homework"])).toBe("Copy of Homework (1)");
    expect(uniqueCopyName("Homework", ["Copy of Homework", "Copy of Homework (1)"])).toBe(
      "Copy of Homework (2)",
    );
  });
});
