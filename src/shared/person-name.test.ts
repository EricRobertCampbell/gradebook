import { describe, expect, it } from "vitest";
import { personDisplayName, personDistinctFullName, personFullName } from "./person-name";

describe("person names", () => {
  it("uses the preferred name when one is set", () => {
    const person = { firstName: "Zara", lastName: "Teststudent", preferredName: "Zed" };

    expect(personDisplayName(person)).toBe("Zed");
    expect(personFullName(person)).toBe("Zara Teststudent");
    expect(personDistinctFullName(person)).toBe("Zara Teststudent");
  });

  it("falls back to the first name, not the full name", () => {
    const person = { firstName: "Charles", lastName: "Babbage", preferredName: "" };

    expect(personDisplayName(person)).toBe("Charles");
    expect(personFullName(person)).toBe("Charles Babbage");
    expect(personDistinctFullName(person)).toBe("Charles Babbage");
  });
});
