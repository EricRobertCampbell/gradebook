import type { ClassGradebook } from "./ipc";

export function courseGoalMark(gradebook: ClassGradebook, studentId: number): number | null {
  return gradebook.students.find((row) => row.student.id === studentId)?.courseGoalMark ?? null;
}

export function categoryGoalMark(
  gradebook: ClassGradebook,
  studentId: number,
  categoryId: number,
): number | null {
  const row = gradebook.students.find((item) => item.student.id === studentId);
  return row?.categories.find((category) => category.categoryId === categoryId)?.goalMark ?? null;
}

export function subcategoryGoalMark(
  gradebook: ClassGradebook,
  studentId: number,
  subcategoryId: number,
): number | null {
  const row = gradebook.students.find((item) => item.student.id === studentId);

  if (!row) {
    return null;
  }

  for (const category of row.categories) {
    const subcategory = category.subcategories.find((item) => item.subcategoryId === subcategoryId);

    if (subcategory) {
      return subcategory.goalMark;
    }
  }

  return null;
}

export function workGoalMark(
  gradebook: ClassGradebook,
  studentId: number,
  workId: number,
): number | null {
  const row = gradebook.students.find((item) => item.student.id === studentId);

  if (!row) {
    return null;
  }

  for (const category of row.categories) {
    const categoryWork = category.works.find((work) => work.workId === workId);

    if (categoryWork) {
      return categoryWork.goalMark;
    }

    for (const subcategory of category.subcategories) {
      const work = subcategory.works.find((item) => item.workId === workId);

      if (work) {
        return work.goalMark;
      }
    }
  }

  return null;
}
