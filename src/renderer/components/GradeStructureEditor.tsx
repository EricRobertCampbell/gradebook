import { useState, type FormEvent } from "react";
import type { GradeCategory, GradeSubcategory, GradeWork } from "../../shared/ipc";
import { describeError, type DisplayError } from "../errors";
import { parseRequiredNumber } from "../form-numbers";
import { updateCategory, updateSubcategory, updateWork } from "../grading";
import "./common/ActionButton.css";
import { ErrorDisplay } from "./common/ErrorDisplay";
import "./common/Field.css";
import { Modal } from "./common/Modal";

export type GradeStructureEditorTarget =
  | { kind: "category"; category: GradeCategory }
  | { kind: "subcategory"; subcategory: GradeSubcategory }
  | { kind: "work"; work: GradeWork };

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
        {target.kind === "work" ? (
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
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
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

  return {
    name: target.work.name,
    notes: target.work.notes,
    weight: String(target.work.weight),
    maximumScore: String(target.work.maximumScore),
  };
}

function showsNotes(target: GradeStructureEditorTarget): boolean {
  return target.kind === "category" || target.kind === "work";
}

function editorTitle(target: GradeStructureEditorTarget): string {
  if (target.kind === "subcategory") {
    return "Edit sub-category";
  }

  if (target.kind === "work") {
    return "Edit work";
  }

  return "Edit category";
}

async function saveTarget(target: GradeStructureEditorTarget, fields: EditorFields): Promise<void> {
  const name = fields.name;
  const weight = parseRequiredNumber(fields.weight, "A weight is required.");

  if (target.kind === "category") {
    await updateCategory({
      id: target.category.id,
      name,
      notes: fields.notes,
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

  await updateWork({
    id: target.work.id,
    name,
    notes: fields.notes,
    maximumScore: parseRequiredNumber(fields.maximumScore, "A maximum score is required."),
    weight,
  });
}
