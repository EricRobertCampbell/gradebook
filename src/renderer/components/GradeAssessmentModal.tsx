import { useEffect, useRef, useState, type FormEvent } from "react";
import { editorExemptChecked, editorNhiChecked, nhiClearsExistingMark } from "../../shared/grades";
import type { Adjustment, Assessment, GradeWork, StudentWorkGrade } from "../../shared/ipc";
import { assessmentScoreIsRequired, planAssessmentSave } from "../assessment-save";
import { describeError, type DisplayError } from "../errors";
import { numberInputValue, parseOptionalNumber, parseRequiredNumber } from "../form-numbers";
import {
  clearAssessmentMark,
  createAdjustment,
  deleteAdjustment,
  updateAdjustment,
  upsertAssessment,
} from "../grading";
import "./common/ActionButton.css";
import { ConfirmDeleteModal } from "./common/ConfirmDeleteModal";
import { ErrorDisplay } from "./common/ErrorDisplay";
import "./common/Field.css";
import { TextArea } from "./common/TextArea";
import { TextField } from "./common/TextField";
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
  exempt: boolean;
  nhi: boolean;
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
  const [adjustmentFields, setAdjustmentFields] =
    useState<AdjustmentFields>(emptyAdjustmentFields());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [savingAssessment, setSavingAssessment] = useState(false);
  const [savingAdjustment, setSavingAdjustment] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Adjustment | null>(null);
  const [pendingNhi, setPendingNhi] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const cancelNhiRef = useRef<HTMLButtonElement>(null);
  const nhiInputRef = useRef<HTMLInputElement>(null);
  const returnFocusToNhi = useRef(false);

  useEffect(() => {
    if (pendingNhi) {
      cancelNhiRef.current?.focus();
      return;
    }

    if (!returnFocusToNhi.current) {
      return;
    }

    returnFocusToNhi.current = false;
    nhiInputRef.current?.focus();
  }, [pendingNhi]);

  async function saveAssessmentRecord(): Promise<Assessment | null> {
    const weight = parseRequiredNumber(assessmentFields.weight, "A weight is required.");
    const payload = {
      workId: editor.work.id,
      studentId: editor.studentId,
      date: assessmentFields.date,
      weight,
      notes: assessmentFields.notes,
    };
    const plan = planAssessmentSave({
      exempt: assessmentFields.exempt,
      nhi: assessmentFields.nhi,
      score: assessmentFields.score,
      notes: assessmentFields.notes,
      hasAssessment: editor.workGrade.assessment !== null,
    });

    if (plan.kind === "clear") {
      try {
        await clearAssessmentMark(payload);
      } catch (caught) {
        throw clearMarkFailure(caught);
      }

      return null;
    }

    return upsertAssessment({
      ...payload,
      score: plan.score,
      status: plan.status,
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
      setError(describeSaveError(caught, "The assessment could not be saved."));
    } finally {
      setSavingAssessment(false);
    }
  }

  async function onSaveAdjustment(event: FormEvent): Promise<void> {
    event.preventDefault();
    setSavingAdjustment(true);
    setError(null);

    try {
      const saved = editor.workGrade.assessment ?? (await saveAssessmentRecord());
      if (!saved) {
        throw new Error("Enter a mark.");
      }
      const current = saved;
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
      setError(describeSaveError(caught, "The adjustment could not be saved."));
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

  function onExemptChange(checked: boolean): void {
    setAssessmentFields({
      ...assessmentFields,
      ...editorExemptChecked(assessmentFields, checked),
    });
  }

  function onNhiChange(checked: boolean): void {
    if (checked) {
      const savedScore = editor.workGrade.assessment?.score ?? null;

      if (nhiClearsExistingMark(savedScore, assessmentFields.score)) {
        returnFocusToNhi.current = true;
        setPendingNhi(true);
        return;
      }
    }

    setAssessmentFields({
      ...assessmentFields,
      ...editorNhiChecked(assessmentFields, checked),
    });
  }

  function confirmNhi(): void {
    setAssessmentFields({
      ...assessmentFields,
      ...editorNhiChecked(assessmentFields, true),
    });
    setPendingNhi(false);
  }

  return (
    <>
      <Modal
        title={pendingNhi ? "Clear score" : `Edit assessment · ${editor.work.name}`}
        open
        onClose={pendingNhi ? () => setPendingNhi(false) : onClose}
        className="grade-assessment-modal"
      >
        {pendingNhi ? (
          <>
            <p className="modal-copy">Marking this assessment NHI will clear the score.</p>
            <div className="modal-actions">
              <button
                ref={cancelNhiRef}
                type="button"
                className="action-button action-button--secondary"
                onClick={() => setPendingNhi(false)}
              >
                Cancel
              </button>
              <button type="button" className="action-button" onClick={confirmNhi}>
                Clear score
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="grade-assessment-student">{editor.studentName}</p>
            <ErrorDisplay error={error} />
            <form className="fields" onSubmit={(event) => void onSaveAssessment(event)}>
              <TextField
                label="Score"
                required={assessmentScoreIsRequired({
                  exempt: assessmentFields.exempt,
                  nhi: assessmentFields.nhi,
                  score: assessmentFields.score,
                  notes: assessmentFields.notes,
                  hasAssessment: editor.workGrade.assessment !== null,
                })}
                type="text"
                inputMode="decimal"
                value={assessmentFields.score}
                onChange={(event) =>
                  setAssessmentFields({ ...assessmentFields, score: event.target.value })
                }
                disabled={busy || assessmentFields.nhi}
                suffix={
                  <span className="grade-assessment-maximum">/{editor.work.maximumScore}</span>
                }
              />
              <TextField
                label="Date (YYYY-MM-DD)"
                required
                type="text"
                placeholder="YYYY-MM-DD"
                autoComplete="off"
                spellCheck={false}
                value={assessmentFields.date}
                onChange={(event) =>
                  setAssessmentFields({ ...assessmentFields, date: event.target.value })
                }
                disabled={busy}
              />
              <TextField
                label="Weight (%)"
                required
                type="number"
                step="any"
                value={assessmentFields.weight}
                onChange={(event) =>
                  setAssessmentFields({ ...assessmentFields, weight: event.target.value })
                }
                disabled={busy}
              />
              <fieldset className="grade-assessment-flags" disabled={busy}>
                <legend className="visually-hidden">Mark status</legend>
                <label className="grade-assessment-flag">
                  <input
                    type="checkbox"
                    checked={assessmentFields.exempt}
                    onChange={(event) => onExemptChange(event.target.checked)}
                  />
                  Exempt
                </label>
                <label className="grade-assessment-flag">
                  <input
                    ref={nhiInputRef}
                    type="checkbox"
                    checked={assessmentFields.nhi}
                    onChange={(event) => onNhiChange(event.target.checked)}
                  />
                  NHI
                </label>
              </fieldset>
              <TextArea
                label="Notes"
                value={assessmentFields.notes}
                onChange={(event) =>
                  setAssessmentFields({ ...assessmentFields, notes: event.target.value })
                }
                disabled={busy}
              />
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
              <TextField
                label="Description"
                required
                type="text"
                value={adjustmentFields.description}
                onChange={(event) =>
                  setAdjustmentFields({ ...adjustmentFields, description: event.target.value })
                }
                autoComplete="off"
                disabled={busy}
              />
              <TextField
                label="Percent change"
                type="number"
                step="any"
                value={adjustmentFields.percentChange}
                onChange={(event) =>
                  setAdjustmentFields({ ...adjustmentFields, percentChange: event.target.value })
                }
                disabled={busy}
              />
              <TextField
                label="Raw change"
                type="number"
                step="any"
                value={adjustmentFields.rawChange}
                onChange={(event) =>
                  setAdjustmentFields({ ...adjustmentFields, rawChange: event.target.value })
                }
                disabled={busy}
              />
              <TextArea
                label="Notes"
                value={adjustmentFields.notes}
                onChange={(event) =>
                  setAdjustmentFields({ ...adjustmentFields, notes: event.target.value })
                }
                disabled={busy}
              />
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
                <button
                  type="button"
                  className="action-button action-button--secondary"
                  onClick={onClose}
                >
                  Close
                </button>
                <button type="submit" className="action-button" disabled={busy}>
                  {savingAdjustment
                    ? "Saving…"
                    : editingId !== null
                      ? "Save adjustment"
                      : "Add adjustment"}
                </button>
              </div>
            </form>
          </>
        )}
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

function describeSaveError(caught: unknown, fallback: string) {
  if (isClearMarkFailure(caught)) {
    return describeError(
      caught.clearMarkCause,
      "The mark could not be cleared. Refresh the gradebook and try again.",
    );
  }

  return describeError(caught, fallback);
}

function isClearMarkFailure(error: unknown): error is Error & { clearMarkCause: unknown } {
  return error instanceof Error && "clearMarkCause" in error;
}

function clearMarkFailure(cause: unknown): Error & { clearMarkCause: unknown } {
  return Object.assign(new Error("The mark could not be cleared."), {
    clearMarkCause: cause,
  });
}

function fieldsFromAssessment(work: GradeWork, assessment: Assessment | null): AssessmentFields {
  const status = assessment?.status ?? "counted";

  return {
    score: status === "nhi" || status === "unmarked" ? "" : numberInputValue(assessment?.score),
    date: assessment?.date ?? todayIsoDate(),
    weight: String(assessment?.weight ?? work.weight),
    notes: assessment?.notes ?? "",
    exempt: status === "exempt",
    nhi: status === "nhi",
  };
}

function emptyAdjustmentFields(): AdjustmentFields {
  return { percentChange: "", rawChange: "", description: "", notes: "" };
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
