import { describe, expect, it } from "vitest";
import { personDisplayName, personFullName } from "./person-name";

describe("person names", () => {
  it("uses the preferred name when one is set", () => {
    const person = { firstName: "Ada", lastName: "Lovelace", preferredName: "Ada" };

    expect(personDisplayName(person)).toBe("Ada");
    expect(personFullName(person)).toBe("Ada Lovelace");
  });

  it("falls back to the first and last name", () => {
    const person = { firstName: "Charles", lastName: "Babbage", preferredName: "" };

    expect(personDisplayName(person)).toBe("Charles Babbage");
    expect(personFullName(person)).toBe("Charles Babbage");
  });
});
