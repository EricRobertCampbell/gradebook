import { useState, type FormEvent } from "react";
import type {
  Adjustment,
  Assessment,
  AssessmentStatus,
  GradeWork,
  StudentWorkGrade,
} from "../../shared/ipc";
import { describeError, type DisplayError } from "../errors";
import { numberInputValue, parseOptionalNumber, parseRequiredNumber } from "../form-numbers";
import {
  createAdjustment,
  deleteAdjustment,
  updateAdjustment,
  upsertAssessment,
} from "../grading";
import "./common/ActionButton.css";
import { ConfirmDeleteModal } from "./common/ConfirmDeleteModal";
import { ErrorDisplay } from "./common/ErrorDisplay";
import "./common/Field.css";
import { PencilIcon } from "./common/icons/PencilIcon";
import { TrashIcon } from "./common/icons/TrashIcon";
import "./common/icons/icon-button.css";
import { Modal } from "./common/Modal";
import "./common/RecordList.css";
import "./GradeAssessmentModal.css";

export type AssessmentEditor = {
  studentId: number;
  studentName: string;
  work: GradeWork;
  workGrade: StudentWorkGrade;
};

type GradeAssessmentModalProps = {
  editor: AssessmentEditor;
  onClose: () => void;
  onChanged: () => Promise<void>;
};

type AssessmentFields = {
  score: string;
  date: string;
  weight: string;
  notes: string;
  status: AssessmentStatus;
};

type AdjustmentFields = {
  percentChange: string;
  rawChange: string;
  description: string;
  notes: string;
};

export function GradeAssessmentModal({ editor, onClose, onChanged }: GradeAssessmentModalProps) {
  const [error, setError] = useState<DisplayError | null>(null);
  const [assessmentFields, setAssessmentFields] = useState<AssessmentFields>(() =>
    fieldsFromAssessment(editor.work, editor.workGrade.assessment),
  );
  const [adjustmentFields, setAdjustmentFields] = useState<AdjustmentFields>(emptyAdjustmentFields());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [savingAssessment, setSavingAssessment] = useState(false);
  const [savingAdjustment, setSavingAdjustment] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Adjustment | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function saveAssessmentRecord(): Promise<Assessment> {
    const score =
      assessmentFields.status === "exempt"
        ? (parseOptionalNumber(assessmentFields.score) ?? 0)
        : parseRequiredNumber(assessmentFields.score, "Enter a mark.");

    return upsertAssessment({
      workId: editor.work.id,
      studentId: editor.studentId,
      score,
      date: assessmentFields.date,
      weight: parseRequiredNumber(assessmentFields.weight, "A weight is required."),
      notes: assessmentFields.notes,
      status: assessmentFields.status,
    });
  }

  async function onSaveAssessment(event: FormEvent): Promise<void> {
    event.preventDefault();
    setSavingAssessment(true);
    setError(null);

    try {
      await saveAssessmentRecord();
      await onChanged();
    } catch (caught) {
      setError(describeError(caught, "The assessment could not be saved."));
    } finally {
      setSavingAssessment(false);
    }
  }

  async function onSaveAdjustment(event: FormEvent): Promise<void> {
    event.preventDefault();
    setSavingAdjustment(true);
    setError(null);

    try {
      const current = editor.workGrade.assessment ?? (await saveAssessmentRecord());
      const payload = {
        percentChange: parseOptionalNumber(adjustmentFields.percentChange),
        rawChange: parseOptionalNumber(adjustmentFields.rawChange),
        description: adjustmentFields.description,
        notes: adjustmentFields.notes,
      };

      if (editingId !== null) {
        await updateAdjustment({ id: editingId, ...payload });
      } else {
        await createAdjustment({ assessmentId: current.id, ...payload });
      }

      setAdjustmentFields(emptyAdjustmentFields());
      setEditingId(null);
      await onChanged();
    } catch (caught) {
      setError(describeError(caught, "The adjustment could not be saved."));
    } finally {
      setSavingAdjustment(false);
    }
  }

  async function onConfirmDelete(): Promise<void> {
    if (!pendingDelete) {
      return;
    }

    setDeleting(true);

    try {
      await deleteAdjustment({ id: pendingDelete.id });
      setPendingDelete(null);
      if (editingId === pendingDelete.id) {
        setEditingId(null);
        setAdjustmentFields(emptyAdjustmentFields());
      }
      await onChanged();
    } catch (caught) {
      setError(describeError(caught, "The adjustment could not be deleted."));
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  const busy = savingAssessment || savingAdjustment;

  return (
    <>
      <Modal
        title={`Edit assessment · ${editor.work.name}`}
        open
        onClose={onClose}
        className="grade-assessment-modal"
      >
        <p className="grade-assessment-student">{editor.studentName}</p>
        <ErrorDisplay error={error} />
        <form className="fields" onSubmit={(event) => void onSaveAssessment(event)}>
          <label className="field">
            <span className="field-label">Score</span>
            <span className="grade-assessment-score">
              <input
                type="text"
                inputMode="decimal"
                value={assessmentFields.score}
                onChange={(event) =>
                  setAssessmentFields({ ...assessmentFields, score: event.target.value })
                }
                disabled={busy || assessmentFields.status === "exempt"}
                required={assessmentFields.status !== "exempt"}
              />
              <span className="grade-assessment-maximum">/{editor.work.maximumScore}</span>
            </span>
          </label>
          <label className="field">
            <span className="field-label">Date</span>
            <input
              type="date"
              value={assessmentFields.date}
              onChange={(event) =>
                setAssessmentFields({ ...assessmentFields, date: event.target.value })
              }
              disabled={busy}
              required
            />
          </label>
          <label className="field">
            <span className="field-label">Weight (%)</span>
            <input
              type="number"
              step="any"
              value={assessmentFields.weight}
              onChange={(event) =>
                setAssessmentFields({ ...assessmentFields, weight: event.target.value })
              }
              disabled={busy}
              required
            />
          </label>
          <label className="field">
            <span className="field-label">Status</span>
            <select
              value={assessmentFields.status}
              disabled={busy}
              onChange={(event) => {
                const status = event.target.value;
                if (isAssessmentStatus(status)) {
                  setAssessmentFields({ ...assessmentFields, status });
                }
              }}
            >
              <option value="counted">Counted</option>
              <option value="exempt">Exempt</option>
            </select>
          </label>
          <label className="field">
            <span className="field-label">Notes</span>
            <textarea
              value={assessmentFields.notes}
              onChange={(event) =>
                setAssessmentFields({ ...assessmentFields, notes: event.target.value })
              }
              disabled={busy}
            />
          </label>
          <div className="modal-actions">
            <button type="submit" className="action-button" disabled={busy}>
              {savingAssessment ? "Saving…" : "Save assessment"}
            </button>
          </div>
        </form>

        <h3 className="grade-assessment-heading">Adjustments</h3>
        {editor.workGrade.adjustments.length === 0 ? (
          <p className="muted">No adjustments yet.</p>
        ) : (
          <ul className="grade-adjustment-list">
            {editor.workGrade.adjustments.map((adjustment) => (
              <li key={adjustment.id} className="record-item">
                <div className="grade-adjustment-label">
                  <strong>{adjustment.description}</strong>
                  <span className="record-button-meta">{adjustmentSummary(adjustment)}</span>
                </div>
                <button
                  type="button"
                  className="icon-button"
                  aria-label={`Edit ${adjustment.description}`}
                  onClick={() => {
                    setEditingId(adjustment.id);
                    setAdjustmentFields({
                      percentChange: numberInputValue(adjustment.percentChange),
                      rawChange: numberInputValue(adjustment.rawChange),
                      description: adjustment.description,
                      notes: adjustment.notes,
                    });
                  }}
                >
                  <PencilIcon />
                </button>
                <button
                  type="button"
                  className="icon-button icon-button--danger"
                  aria-label={`Delete ${adjustment.description}`}
                  onClick={() => setPendingDelete(adjustment)}
                >
                  <TrashIcon />
                </button>
              </li>
            ))}
          </ul>
        )}
        <form className="fields" onSubmit={(event) => void onSaveAdjustment(event)}>
          <label className="field">
            <span className="field-label">Description</span>
            <input
              type="text"
              value={adjustmentFields.description}
              onChange={(event) =>
                setAdjustmentFields({ ...adjustmentFields, description: event.target.value })
              }
              autoComplete="off"
              disabled={busy}
              required
            />
          </label>
          <label className="field">
            <span className="field-label">Percent change</span>
            <input
              type="number"
              step="any"
              value={adjustmentFields.percentChange}
              onChange={(event) =>
                setAdjustmentFields({ ...adjustmentFields, percentChange: event.target.value })
              }
              disabled={busy}
            />
          </label>
          <label className="field">
            <span className="field-label">Raw change</span>
            <input
              type="number"
              step="any"
              value={adjustmentFields.rawChange}
              onChange={(event) =>
                setAdjustmentFields({ ...adjustmentFields, rawChange: event.target.value })
              }
              disabled={busy}
            />
          </label>
          <label className="field">
            <span className="field-label">Notes</span>
            <textarea
              value={adjustmentFields.notes}
              onChange={(event) =>
                setAdjustmentFields({ ...adjustmentFields, notes: event.target.value })
              }
              disabled={busy}
            />
          </label>
          <div className="modal-actions">
            {editingId !== null ? (
              <button
                type="button"
                className="action-button action-button--secondary"
                onClick={() => {
                  setEditingId(null);
                  setAdjustmentFields(emptyAdjustmentFields());
                }}
              >
                Cancel edit
              </button>
            ) : null}
            <button type="button" className="action-button action-button--secondary" onClick={onClose}>
              Close
            </button>
            <button type="submit" className="action-button" disabled={busy}>
              {savingAdjustment ? "Saving…" : editingId !== null ? "Save adjustment" : "Add adjustment"}
            </button>
          </div>
        </form>
      </Modal>
      <ConfirmDeleteModal
        title="Delete adjustment"
        open={pendingDelete !== null}
        subjectName={pendingDelete?.description ?? ""}
        prompt={`This will delete the adjustment. Type ${pendingDelete?.description ?? "the description"} to confirm.`}
        deleting={deleting}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => void onConfirmDelete()}
      />
    </>
  );
}

function fieldsFromAssessment(work: GradeWork, assessment: Assessment | null): AssessmentFields {
  return {
    score: numberInputValue(assessment?.score),
    date: assessment?.date ?? todayIsoDate(),
    weight: String(assessment?.weight ?? work.weight),
    notes: assessment?.notes ?? "",
    status: assessment?.status ?? "counted",
  };
}

function emptyAdjustmentFields(): AdjustmentFields {
  return { percentChange: "", rawChange: "", description: "", notes: "" };
}

function isAssessmentStatus(value: string): value is AssessmentStatus {
  return value === "counted" || value === "exempt";
}

function adjustmentSummary(adjustment: Adjustment): string {
  const parts: Array<string> = [];

  if (adjustment.rawChange !== null) {
    parts.push(`Raw ${formatSigned(adjustment.rawChange)}`);
  }

  if (adjustment.percentChange !== null) {
    parts.push(`Percent ${formatSigned(adjustment.percentChange)}`);
  }

  if (adjustment.notes) {
    parts.push(adjustment.notes);
  }

  return parts.join(" · ");
}

function formatSigned(value: number): string {
  if (value > 0) {
    return `+${value}`;
  }

  return String(value);
}

function todayIsoDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}
