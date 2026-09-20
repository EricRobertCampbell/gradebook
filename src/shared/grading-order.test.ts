import { describe, expect, it } from "vitest";
import {
  categoryChildTokens,
  moveItem,
  nextSortOrder,
  parseCategoryChildToken,
  sameIdSet,
  sortCategoryChildren,
} from "./grading-order";

describe("nextSortOrder", () => {
  it("starts at zero when there are no siblings", () => {
    expect(nextSortOrder([])).toBe(0);
  });

  it("uses one more than the current maximum", () => {
    expect(nextSortOrder([0, 2, 1])).toBe(3);
  });
});

describe("moveItem", () => {
  it("moves an item to a new index", () => {
    expect(moveItem(["a", "b", "c"], 0, 2)).toEqual(["b", "c", "a"]);
    expect(moveItem(["a", "b", "c"], 2, 0)).toEqual(["c", "a", "b"]);
  });

  it("leaves the list unchanged for invalid indexes", () => {
    expect(moveItem(["a", "b"], 0, 0)).toEqual(["a", "b"]);
    expect(moveItem(["a", "b"], -1, 1)).toEqual(["a", "b"]);
    expect(moveItem(["a", "b"], 0, 2)).toEqual(["a", "b"]);
  });
});

describe("sameIdSet", () => {
  it("accepts a permutation of the same ids", () => {
    expect(sameIdSet([1, 2, 3], [3, 1, 2])).toBe(true);
    expect(sameIdSet([1, 2], [1, 2, 3])).toBe(false);
    expect(sameIdSet([1, 1], [1, 2])).toBe(false);
  });
});

describe("sortCategoryChildren", () => {
  it("interleaves sub-categories and work by sort order", () => {
    const sorted = sortCategoryChildren(
      [
        { id: 2, sortOrder: 2, name: "Quizzes" },
        { id: 1, sortOrder: 0, name: "Daily" },
      ],
      [{ id: 9, sortOrder: 1, name: "Unit test" }],
    );

    expect(sorted).toEqual([
      { kind: "subcategory", item: { id: 1, sortOrder: 0, name: "Daily" } },
      { kind: "work", item: { id: 9, sortOrder: 1, name: "Unit test" } },
      { kind: "subcategory", item: { id: 2, sortOrder: 2, name: "Quizzes" } },
    ]);
  });
});

describe("category child tokens", () => {
  it("encodes mixed children in sort order", () => {
    expect(categoryChildTokens([{ id: 1, sortOrder: 1 }], [{ id: 9, sortOrder: 0 }])).toEqual([
      "work:9",
      "subcategory:1",
    ]);
  });

  it("parses a valid token and rejects a malformed one", () => {
    expect(parseCategoryChildToken("work:9")).toEqual({ kind: "work", id: 9 });
    expect(() => parseCategoryChildToken("category:1")).toThrow(
      "Those items could not be reordered.",
    );
  });
});
