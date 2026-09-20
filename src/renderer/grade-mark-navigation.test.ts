import { describe, expect, it } from "vitest";
import {
  gradeMarkDirectionFromKey,
  nextGradeMarkPosition,
  type GradeMarkPosition,
} from "./grade-mark-navigation";

const current: GradeMarkPosition = { studentId: 2, workId: 20 };
const studentIds = [1, 2, 3];
const workIds = [10, 20, 30];

describe("gradeMarkDirectionFromKey", () => {
  it("treats Enter and ArrowDown as moving to the next student", () => {
    expect(gradeMarkDirectionFromKey("Enter")).toBe("down");
    expect(gradeMarkDirectionFromKey("ArrowDown")).toBe("down");
  });

  it("maps the remaining arrow keys", () => {
    expect(gradeMarkDirectionFromKey("ArrowUp")).toBe("up");
    expect(gradeMarkDirectionFromKey("ArrowLeft")).toBe("left");
    expect(gradeMarkDirectionFromKey("ArrowRight")).toBe("right");
  });

  it("ignores unrelated keys", () => {
    expect(gradeMarkDirectionFromKey("Tab")).toBeNull();
  });
});

describe("nextGradeMarkPosition", () => {
  it("moves down to the next student in the same work", () => {
    expect(nextGradeMarkPosition(current, studentIds, workIds, "down")).toEqual({
      studentId: 3,
      workId: 20,
    });
  });

  it("moves up to the previous student in the same work", () => {
    expect(nextGradeMarkPosition(current, studentIds, workIds, "up")).toEqual({
      studentId: 1,
      workId: 20,
    });
  });

  it("moves right to the next work for the same student", () => {
    expect(nextGradeMarkPosition(current, studentIds, workIds, "right")).toEqual({
      studentId: 2,
      workId: 30,
    });
  });

  it("moves left to the previous work for the same student", () => {
    expect(nextGradeMarkPosition(current, studentIds, workIds, "left")).toEqual({
      studentId: 2,
      workId: 10,
    });
  });

  it("stops at the edges of the mark grid", () => {
    expect(
      nextGradeMarkPosition({ studentId: 3, workId: 20 }, studentIds, workIds, "down"),
    ).toBeNull();
    expect(
      nextGradeMarkPosition({ studentId: 1, workId: 20 }, studentIds, workIds, "up"),
    ).toBeNull();
    expect(
      nextGradeMarkPosition({ studentId: 2, workId: 30 }, studentIds, workIds, "right"),
    ).toBeNull();
    expect(
      nextGradeMarkPosition({ studentId: 2, workId: 10 }, studentIds, workIds, "left"),
    ).toBeNull();
  });

  it("returns null when the current cell is not in the visible grid", () => {
    expect(
      nextGradeMarkPosition({ studentId: 9, workId: 20 }, studentIds, workIds, "down"),
    ).toBeNull();
    expect(
      nextGradeMarkPosition({ studentId: 2, workId: 99 }, studentIds, workIds, "right"),
    ).toBeNull();
  });
});
