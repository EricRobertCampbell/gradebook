import type { KeyboardEvent } from "react";

export type GradeMarkPosition = {
  studentId: number;
  workId: number;
};

export type GradeMarkDirection = "up" | "down" | "left" | "right";

export function handleGradeMarkKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
  if (
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey ||
    event.nativeEvent.isComposing
  ) {
    return;
  }

  const direction = gradeMarkDirectionFromKey(event.key);

  if (direction === null) {
    return;
  }

  const input = event.currentTarget;
  const table = input.closest("table");
  const studentId = Number(input.dataset.studentId);
  const workId = Number(input.dataset.workId);

  if (!table || !Number.isInteger(studentId) || !Number.isInteger(workId)) {
    if (event.key === "Enter") {
      event.preventDefault();
      input.blur();
    }

    return;
  }

  const grid = readGradeMarkGrid(table, input.dataset.studentId);
  const next =
    grid === null
      ? null
      : nextGradeMarkPosition({ studentId, workId }, grid.studentIds, grid.workIds, direction);

  if (next === null) {
    if (event.key === "Enter") {
      event.preventDefault();
      input.blur();
    }

    return;
  }

  event.preventDefault();
  queueMicrotask(() => {
    focusGradeMarkInput(table, next);
  });
}

export function gradeMarkDirectionFromKey(key: string): GradeMarkDirection | null {
  if (key === "Enter" || key === "ArrowDown") {
    return "down";
  }

  if (key === "ArrowUp") {
    return "up";
  }

  if (key === "ArrowLeft") {
    return "left";
  }

  if (key === "ArrowRight") {
    return "right";
  }

  return null;
}

export function nextGradeMarkPosition(
  current: GradeMarkPosition,
  studentIds: Array<number>,
  workIds: Array<number>,
  direction: GradeMarkDirection,
): GradeMarkPosition | null {
  const studentIndex = studentIds.indexOf(current.studentId);
  const workIndex = workIds.indexOf(current.workId);

  if (studentIndex < 0 || workIndex < 0) {
    return null;
  }

  if (direction === "down") {
    const nextStudentId = studentIds[studentIndex + 1];
    return nextStudentId === undefined
      ? null
      : { studentId: nextStudentId, workId: current.workId };
  }

  if (direction === "up") {
    const previousStudentId = studentIds[studentIndex - 1];
    return previousStudentId === undefined
      ? null
      : { studentId: previousStudentId, workId: current.workId };
  }

  if (direction === "right") {
    const nextWorkId = workIds[workIndex + 1];
    return nextWorkId === undefined ? null : { studentId: current.studentId, workId: nextWorkId };
  }

  const previousWorkId = workIds[workIndex - 1];
  return previousWorkId === undefined
    ? null
    : { studentId: current.studentId, workId: previousWorkId };
}

function readGradeMarkGrid(
  table: Element,
  currentStudentId: string | undefined,
): { studentIds: Array<number>; workIds: Array<number> } | null {
  const inputs = Array.from(table.querySelectorAll<HTMLInputElement>("input.grade-score-input"));
  const studentIds: Array<number> = [];

  for (const node of inputs) {
    const studentId = Number(node.dataset.studentId);

    if (Number.isInteger(studentId) && !studentIds.includes(studentId)) {
      studentIds.push(studentId);
    }
  }

  const workIds = inputs
    .filter((node) => node.dataset.studentId === currentStudentId)
    .map((node) => Number(node.dataset.workId))
    .filter((workId) => Number.isInteger(workId));

  if (studentIds.length === 0 || workIds.length === 0) {
    return null;
  }

  return { studentIds, workIds };
}

function focusGradeMarkInput(table: Element, position: GradeMarkPosition): void {
  const target = table.querySelector<HTMLInputElement>(
    `input.grade-score-input[data-student-id="${String(position.studentId)}"][data-work-id="${String(position.workId)}"]`,
  );

  if (!target) {
    return;
  }

  target.focus();
  target.select();
}
