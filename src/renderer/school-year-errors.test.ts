import { describe, expect, it } from "vitest";
import { describeSchoolYearHttpError } from "./school-year-errors";

describe("describeSchoolYearHttpError", () => {
  it("explains a missing school year API", () => {
    expect(describeSchoolYearHttpError(404, "Not found.", "fallback")).toContain(
      "school year service was not found",
    );
  });

  it("uses the API error message for other failures", () => {
    expect(describeSchoolYearHttpError(400, "A school year name is required.", "fallback")).toBe(
      "A school year name is required.",
    );
  });

  it("falls back when the API does not provide a useful message", () => {
    expect(describeSchoolYearHttpError(500, undefined, "The school year could not be created.")).toBe(
      "The school year could not be created.",
    );
  });
});
