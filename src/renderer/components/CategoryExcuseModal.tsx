import { useState } from "react";
import type { ClassGradebook, GradeCategory, GradeSubcategory, Student } from "../../shared/ipc";
import { personDisplayName, personDistinctFullName } from "../../shared/person-name";
import { describeError, type DisplayError } from "../errors";
import { setAllExcuses, setExcuse } from "../grading";
import "./CategoryExcuseModal.css";
import { ErrorDisplay } from "./common/ErrorDisplay";
import { Modal } from "./common/Modal";

export function CategoryExcuseModal({
  gradebook,
  category,
  subcategory,
  onClose,
  onChanged,
  onError,
}: {
  gradebook: ClassGradebook;
  category: GradeCategory;
  subcategory: GradeSubcategory | null;
  onClose: () => void;
  onChanged: () => Promise<void>;
  onError: (error: DisplayError | null) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<DisplayError | null>(null);
  const targetName = subcategory?.name ?? category.name;
  const students = gradebook.students.map((row) => row.student);
  const labels = displayLabels(students);

  async function saveStudent(studentId: number, excused: boolean): Promise<void> {
    await saveChange(() =>
      setExcuse({ ...targetInput(category, subcategory), studentId, excused }),
    );
  }

  async function saveAll(excused: boolean): Promise<void> {
    await saveChange(() => setAllExcuses({ ...targetInput(category, subcategory), excused }));
  }

  async function saveChange(write: () => Promise<unknown>): Promise<void> {
    setSaving(true);
    reportError(null);

    try {
      try {
        await write();
      } catch (caught) {
        reportError(describeError(caught, "The excuse could not be saved."));
        return;
      }

      try {
        await onChanged();
      } catch (caught) {
        reportError(
          describeError(
            caught,
            "The excuse was saved, but the class could not be reloaded. Reload the class to see it.",
          ),
        );
      }
    } finally {
      setSaving(false);
    }
  }

  function reportError(next: DisplayError | null): void {
    setError(next);
    onError(next);
  }

  return (
    <Modal title={`Excuse students for ${targetName}`} open onClose={onClose}>
      <ErrorDisplay error={error} />
      {students.length === 0 ? (
        <p className="muted">No students are enrolled in this class.</p>
      ) : (
        <ul className="excuse-student-list">
          {gradebook.students.map((row) => {
            const ownExcused = ownExcuse(row, category.id, subcategory?.id ?? null);
            const coveredByCategory = subcategory !== null && categoryExcuse(row, category.id);

            return (
              <li key={row.student.id}>
                <label className="excuse-student">
                  <input
                    type="checkbox"
                    checked={ownExcused}
                    disabled={saving}
                    onChange={(event) => void saveStudent(row.student.id, event.target.checked)}
                  />
                  <span>{labels.get(row.student.id) ?? personDisplayName(row.student)}</span>
                </label>
                {coveredByCategory ? (
                  <p className="excuse-parent muted">Excused by {category.name}</p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
      <div className="modal-actions">
        <button
          type="button"
          className="action-button"
          disabled={saving}
          onClick={() => void saveAll(true)}
        >
          Excuse all
        </button>
        <button
          type="button"
          className="action-button secondary"
          disabled={saving}
          onClick={() => void saveAll(false)}
        >
          Clear all
        </button>
      </div>
    </Modal>
  );
}

function targetInput(category: GradeCategory, subcategory: GradeSubcategory | null) {
  if (subcategory) {
    return { subcategoryId: subcategory.id };
  }

  return { categoryId: category.id };
}

function displayLabels(students: Array<Student>): Map<number, string> {
  const counts = new Map<string, number>();

  for (const student of students) {
    const name = personDisplayName(student);
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }

  return new Map(
    students.map((student) => {
      const name = personDisplayName(student);
      const fullName = personDistinctFullName(student);
      const shared = (counts.get(name) ?? 0) > 1;

      return [student.id, shared && fullName ? `${name} (${fullName})` : name];
    }),
  );
}

function categoryExcuse(row: ClassGradebook["students"][number], categoryId: number): boolean {
  return row.categories.find((category) => category.categoryId === categoryId)?.excused ?? false;
}

function ownExcuse(
  row: ClassGradebook["students"][number],
  categoryId: number,
  subcategoryId: number | null,
): boolean {
  const category = row.categories.find((item) => item.categoryId === categoryId);

  if (subcategoryId === null) {
    return category?.excused ?? false;
  }

  return (
    category?.subcategories.find((item) => item.subcategoryId === subcategoryId)?.excused ?? false
  );
}
