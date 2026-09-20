import { useState } from "react";
import {
  countableMarksForCategory,
  countableMarksForSubcategory,
  countableMarksForWork,
  listCategoryScopes,
  type CategoryScopeOption,
} from "../../shared/grade-distribution";
import type { ClassGradebook, GradeCategory, GradeWork, Student } from "../../shared/ipc";
import { parseRouteId } from "../paths";
import { SelectField } from "./common/SelectField";
import "./StudentCategoryDataSection.css";
import { GradeDistributionPanel, WorkDistributionPanel } from "./WorkDistributionPanel";

export function StudentCategoryDataSection({
  category,
  gradebook,
  student,
}: {
  category: GradeCategory;
  gradebook: ClassGradebook;
  student: Student;
}) {
  const scopes = listCategoryScopes(category);
  const [scope, setScope] = useState<CategoryScopeOption | null>(() =>
    defaultScope(category, gradebook, student.id),
  );
  const [subcategoryWorkId, setSubcategoryWorkId] = useState<number | null>(() =>
    defaultSubcategoryWorkId(
      category,
      gradebook,
      defaultScope(category, gradebook, student.id),
      student.id,
    ),
  );
  const selectedWork = workForScope(category, scope, subcategoryWorkId);
  const subcategory =
    scope?.kind === "subcategory"
      ? (category.subcategories.find((item) => item.id === scope.id) ?? null)
      : null;

  return (
    <section className="student-category-data">
      <GradeDistributionPanel
        title={category.name}
        emptyMessage="No countable marks for this category yet. Enter grades in the class table."
        marks={countableMarksForCategory(gradebook, category.id)}
        student={student}
      />

      {scopes.length === 0 ? (
        <p className="muted">No work or sub-categories in this category yet.</p>
      ) : (
        <div className="student-category-scope">
          <SelectField
            label="Work or sub-category"
            value={scopeKey(scope)}
            onChange={(event) => {
              const nextScope = parseScopeKey(event.target.value, scopes);
              setScope(nextScope);
              setSubcategoryWorkId(
                defaultSubcategoryWorkId(category, gradebook, nextScope, student.id),
              );
            }}
          >
            {scopes.map((option) => (
              <option key={scopeKey(option)} value={scopeKey(option)}>
                {option.label}
              </option>
            ))}
          </SelectField>

          {subcategory ? (
            <div className="student-subcategory-data">
              <GradeDistributionPanel
                title={subcategory.name}
                emptyMessage="No countable marks for this sub-category yet. Enter grades in the class table."
                marks={countableMarksForSubcategory(gradebook, category.id, subcategory.id)}
                student={student}
              />
              <div className="student-subcategory-work">
                <SelectField
                  label="Work"
                  value={subcategoryWorkId ?? ""}
                  disabled={subcategory.works.length === 0}
                  onChange={(event) =>
                    setSubcategoryWorkId(parseRouteId(event.target.value) ?? null)
                  }
                >
                  {subcategory.works.length === 0 ? (
                    <option value="">No work in this sub-category</option>
                  ) : null}
                  {subcategory.works.map((work) => (
                    <option key={work.id} value={work.id}>
                      {work.name}
                    </option>
                  ))}
                </SelectField>
                {selectedWork ? (
                  <WorkDistributionPanel
                    work={selectedWork}
                    gradebook={gradebook}
                    student={student}
                  />
                ) : null}
              </div>
            </div>
          ) : selectedWork ? (
            <WorkDistributionPanel work={selectedWork} gradebook={gradebook} student={student} />
          ) : null}
        </div>
      )}
    </section>
  );
}

function defaultScope(
  category: GradeCategory,
  gradebook: ClassGradebook,
  studentId: number,
): CategoryScopeOption | null {
  const scopes = listCategoryScopes(category);
  const withStudentMark = scopes.find((scope) =>
    scopeHasStudentMark(category, gradebook, scope, studentId),
  );
  const withMarks = scopes.find((scope) => scopeHasMarks(category, gradebook, scope));
  return withStudentMark ?? withMarks ?? scopes[0] ?? null;
}

function defaultSubcategoryWorkId(
  category: GradeCategory,
  gradebook: ClassGradebook,
  scope: CategoryScopeOption | null,
  studentId: number,
): number | null {
  if (scope?.kind !== "subcategory") {
    return null;
  }

  const subcategory = category.subcategories.find((item) => item.id === scope.id);
  return firstWorkId(subcategory?.works ?? [], gradebook, studentId);
}

function scopeHasMarks(
  category: GradeCategory,
  gradebook: ClassGradebook,
  scope: CategoryScopeOption,
): boolean {
  if (scope.kind === "work") {
    return countableMarksForWork(gradebook, scope.id).length > 0;
  }

  const subcategory = category.subcategories.find((item) => item.id === scope.id);
  return (subcategory?.works ?? []).some(
    (work) => countableMarksForWork(gradebook, work.id).length > 0,
  );
}

function scopeHasStudentMark(
  category: GradeCategory,
  gradebook: ClassGradebook,
  scope: CategoryScopeOption,
  studentId: number,
): boolean {
  if (scope.kind === "work") {
    return countableMarksForWork(gradebook, scope.id).some((mark) => mark.studentId === studentId);
  }

  const subcategory = category.subcategories.find((item) => item.id === scope.id);
  return (subcategory?.works ?? []).some((work) =>
    countableMarksForWork(gradebook, work.id).some((mark) => mark.studentId === studentId),
  );
}

function firstWorkId(
  works: Array<GradeWork>,
  gradebook: ClassGradebook,
  studentId: number,
): number | null {
  const studentWork = works.find((work) =>
    countableMarksForWork(gradebook, work.id).some((mark) => mark.studentId === studentId),
  );
  const withMarks = works.find((work) => countableMarksForWork(gradebook, work.id).length > 0);
  return studentWork?.id ?? withMarks?.id ?? works[0]?.id ?? null;
}

function workForScope(
  category: GradeCategory,
  scope: CategoryScopeOption | null,
  subcategoryWorkId: number | null,
): GradeWork | null {
  if (scope === null) {
    return null;
  }

  if (scope.kind === "work") {
    return category.works.find((work) => work.id === scope.id) ?? null;
  }

  if (subcategoryWorkId === null) {
    return null;
  }

  const subcategory = category.subcategories.find((item) => item.id === scope.id);
  return subcategory?.works.find((work) => work.id === subcategoryWorkId) ?? null;
}

function scopeKey(scope: CategoryScopeOption | null): string {
  if (scope === null) {
    return "";
  }

  return `${scope.kind}:${scope.id}`;
}

function parseScopeKey(
  value: string,
  scopes: Array<CategoryScopeOption>,
): CategoryScopeOption | null {
  return scopes.find((scope) => scopeKey(scope) === value) ?? null;
}
