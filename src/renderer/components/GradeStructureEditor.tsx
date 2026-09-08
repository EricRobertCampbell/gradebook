import { useState, type FormEvent } from "react";
import type { GradeCategory, GradeSubcategory, GradeWork } from "../../shared/ipc";
import { describeError, type DisplayError } from "../errors";
import { parseRequiredNumber } from "../form-numbers";
import {
  createCategory,
  createSubcategory,
  createWork,
  updateCategory,
  updateSubcategory,
  updateWork,
} from "../grading";
import "./common/ActionButton.css";
import { ErrorDisplay } from "./common/ErrorDisplay";
import "./common/Field.css";
import { Modal } from "./common/Modal";

export type GradeStructureEditorTarget =
  | { kind: "category"; category: GradeCategory }
  | { kind: "subcategory"; subcategory: GradeSubcategory }
  | { kind: "work"; work: GradeWork }
  | { kind: "create-category"; schoolYearName: string; internalName: string }
  | { kind: "create-subcategory"; categoryId: number }
  | { kind: "create-work"; subcategoryId: number };

type GradeStructureEditorProps = {
  target: GradeStructureEditorTarget;
  onClose: () => void;
  onChanged: () => Promise<void>;
};

type EditorFields = {
  name: string;
  notes: string;
  weight: string;
  maximumScore: string;
};

export function GradeStructureEditor({ target, onClose, onChanged }: GradeStructureEditorProps) {
  const [fields, setFields] = useState<EditorFields>(() => fieldsForTarget(target));
  const [error, setError] = useState<DisplayError | null>(null);
  const [saving, setSaving] = useState(false);
  const creating = isCreateTarget(target);

  async function onSave(event: FormEvent): Promise<void> {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await saveTarget(target, fields);
      await onChanged();
      onClose();
    } catch (caught) {
      setError(describeError(caught, "Those details could not be saved."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={editorTitle(target)} open onClose={onClose}>
      <ErrorDisplay error={error} />
      <form className="fields" onSubmit={(event) => void onSave(event)}>
        <label className="field">
          <span className="field-label">Name</span>
          <input
            type="text"
            value={fields.name}
            onChange={(event) => setFields({ ...fields, name: event.target.value })}
            autoComplete="off"
            disabled={saving}
            required
          />
        </label>
        {showsNotes(target) ? (
          <label className="field">
            <span className="field-label">Notes</span>
            <textarea
              value={fields.notes}
              onChange={(event) => setFields({ ...fields, notes: event.target.value })}
              disabled={saving}
            />
          </label>
        ) : null}
        {showsMaximumScore(target) ? (
          <label className="field">
            <span className="field-label">Maximum score</span>
            <input
              type="number"
              step="any"
              value={fields.maximumScore}
              onChange={(event) => setFields({ ...fields, maximumScore: event.target.value })}
              disabled={saving}
              required
            />
          </label>
        ) : null}
        <label className="field">
          <span className="field-label">Weight (%)</span>
          <input
            type="number"
            step="any"
            value={fields.weight}
            onChange={(event) => setFields({ ...fields, weight: event.target.value })}
            disabled={saving}
            required
          />
        </label>
        <div className="modal-actions">
          <button type="button" className="action-button action-button--secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="action-button" disabled={saving}>
            {saving ? (creating ? "Adding…" : "Saving…") : creating ? "Add" : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function emptyFields(): EditorFields {
  return { name: "", notes: "", weight: "1", maximumScore: "" };
}

function fieldsForTarget(target: GradeStructureEditorTarget): EditorFields {
  if (target.kind === "category") {
    return {
      name: target.category.name,
      notes: target.category.notes,
      weight: String(target.category.weight),
      maximumScore: "",
    };
  }

  if (target.kind === "subcategory") {
    return {
      name: target.subcategory.name,
      notes: "",
      weight: String(target.subcategory.weight),
      maximumScore: "",
    };
  }

  if (target.kind === "work") {
    return {
      name: target.work.name,
      notes: target.work.notes,
      weight: String(target.work.weight),
      maximumScore: String(target.work.maximumScore),
    };
  }

  return emptyFields();
}

function isCreateTarget(target: GradeStructureEditorTarget): boolean {
  return (
    target.kind === "create-category" ||
    target.kind === "create-subcategory" ||
    target.kind === "create-work"
  );
}

function showsNotes(target: GradeStructureEditorTarget): boolean {
  return (
    target.kind === "category" ||
    target.kind === "create-category" ||
    target.kind === "work" ||
    target.kind === "create-work"
  );
}

function showsMaximumScore(target: GradeStructureEditorTarget): boolean {
  return target.kind === "work" || target.kind === "create-work";
}

function editorTitle(target: GradeStructureEditorTarget): string {
  switch (target.kind) {
    case "create-category":
      return "Add category";
    case "create-subcategory":
      return "Add sub-category";
    case "create-work":
      return "Add work";
    case "subcategory":
      return "Edit sub-category";
    case "work":
      return "Edit work";
    default:
      return "Edit category";
  }
}

async function saveTarget(target: GradeStructureEditorTarget, fields: EditorFields): Promise<void> {
  const name = fields.name;
  const weight = parseRequiredNumber(fields.weight, "A weight is required.");

  if (target.kind === "create-category") {
    await createCategory({
      schoolYearName: target.schoolYearName,
      internalName: target.internalName,
      name,
      notes: fields.notes,
      weight,
    });
    return;
  }

  if (target.kind === "category") {
    await updateCategory({
      id: target.category.id,
      name,
      notes: fields.notes,
      weight,
    });
    return;
  }

  if (target.kind === "create-subcategory") {
    await createSubcategory({
      categoryId: target.categoryId,
      name,
      weight,
    });
    return;
  }

  if (target.kind === "subcategory") {
    await updateSubcategory({
      id: target.subcategory.id,
      name,
      weight,
    });
    return;
  }

  const maximumScore = parseRequiredNumber(fields.maximumScore, "A maximum score is required.");

  if (target.kind === "create-work") {
    await createWork({
      subcategoryId: target.subcategoryId,
      name,
      notes: fields.notes,
      maximumScore,
      weight,
    });
    return;
  }

  await updateWork({
    id: target.work.id,
    name,
    notes: fields.notes,
    maximumScore,
    weight,
  });
}
