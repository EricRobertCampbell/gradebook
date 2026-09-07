import { describe, expect, it } from "vitest";
import { z } from "zod";
import { describeError, extractErrorDetail } from "./errors";

describe("describeError", () => {
  it("keeps the context when there is no further detail", () => {
    expect(describeError(undefined, "The classes could not be loaded.")).toEqual({
      context: "The classes could not be loaded.",
    });
  });

  it("adds a readable Zod detail instead of the raw issue JSON", () => {
    const schema = z.object({
      subject: z.string().trim().min(1, "A subject is required."),
      section: z.string().trim().min(1, "A section is required."),
    });
    const result = schema.safeParse({ subject: "", section: "" });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }

    expect(describeError(result.error, "The classes could not be loaded.")).toEqual({
      context: "The classes could not be loaded.",
      detail: "A subject is required. A section is required.",
    });
  });

  it("reads Zod issue messages from an Error that only has the JSON dump", () => {
    const dumped = new Error(
      JSON.stringify([
        {
          origin: "string",
          code: "too_small",
          minimum: 1,
          inclusive: true,
          path: [0, "subject"],
          message: "A subject is required.",
        },
      ]),
    );

    expect(extractErrorDetail(dumped)).toBe("A subject is required.");
  });
});
