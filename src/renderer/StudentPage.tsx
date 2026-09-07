import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { EnrolledClass, Parent, ParentFields, Student } from "../shared/ipc";
import { personDisplayName, personFullName } from "../shared/person-name";
import "./components/common/ActionButton.css";
import "./components/common/BackLink.css";
import { ConfirmDeleteModal } from "./components/common/ConfirmDeleteModal";
import { ErrorDisplay } from "./components/common/ErrorDisplay";
import { DocumentIcon } from "./components/common/icons/DocumentIcon";
import { GearIcon } from "./components/common/icons/GearIcon";
import { GraphIcon } from "./components/common/icons/GraphIcon";
import { PencilIcon } from "./components/common/icons/PencilIcon";
import { TrashIcon } from "./components/common/icons/TrashIcon";
import "./components/common/icons/icon-button.css";
import { Modal } from "./components/common/Modal";
import "./components/common/RecordList.css";
import {
  emptyParentFields,
  ParentDetailsFields,
  parentFieldsFrom,
} from "./components/ParentDetailsFields";
import { describeError, type DisplayError } from "./errors";
import { listClassesForStudent } from "./enrolments";
import {
  createParentForStudent,
  deleteParentForStudent,
  listParentsForStudent,
  updateParent,
} from "./parents";
import { classPath, studentClassDataPath, studentClassReportPath, studentSettingsPath } from "./paths";
import { getStudent } from "./students";
import "./StudentPage.css";

export function StudentPage() {
  const navigate = useNavigate();
  const studentId = parseStudentRouteId(useParams().studentId);
  const [student, setStudent] = useState<Student | null>(null);
  const [classes, setClasses] = useState<Array<EnrolledClass>>([]);
  const [parents, setParents] = useState<Array<Parent>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<DisplayError | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<DisplayError | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Parent | null>(null);
  const [fields, setFields] = useState<ParentFields>(emptyParentFields());
  const [pendingDelete, setPendingDelete] = useState<Parent | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadStudent = useCallback(async () => {
    if (studentId === null) {
      setError("That student was not found.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [loadedStudent, loadedClasses, loadedParents] = await Promise.all([
        getStudent({ id: studentId }),
        listClassesForStudent({ id: studentId }),
        listParentsForStudent({ id: studentId }),
      ]);
      setStudent(loadedStudent);
      setClasses(loadedClasses);
      setParents(loadedParents);
    } catch (caught) {
      setStudent(null);
      setClasses([]);
      setParents([]);
      setError(describeError(caught, "That student was not found."));
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    void loadStudent();
  }, [loadStudent]);

  function openAddModal(): void {
    setEditing(null);
    setFields(emptyParentFields());
    setFormError(null);
    setFormOpen(true);
  }

  function openEditModal(parent: Parent): void {
    setEditing(parent);
    setFields(parentFieldsFrom(parent));
    setFormError(null);
    setFormOpen(true);
  }

  function closeFormModal(): void {
    if (saving) {
      return;
    }

    setFormOpen(false);
    setEditing(null);
    setFormError(null);
    setFields(emptyParentFields());
  }

  async function onSubmitParent(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (studentId === null) {
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      if (editing) {
        await updateParent({ id: editing.id, ...fields });
      } else {
        await createParentForStudent({ studentId, ...fields });
      }

      setFormOpen(false);
      setEditing(null);
      setFormError(null);
      setFields(emptyParentFields());
      await loadStudent();
    } catch (caught) {
      setFormError(
        describeError(caught, editing ? "The parent could not be updated." : "The parent could not be created."),
      );
    } finally {
      setSaving(false);
    }
  }

  function closeDeleteModal(): void {
    if (deleting) {
      return;
    }

    setPendingDelete(null);
  }

  async function onConfirmDelete(): Promise<void> {
    if (!pendingDelete || studentId === null) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      await deleteParentForStudent({ id: pendingDelete.id, studentId });
      setPendingDelete(null);
      await loadStudent();
    } catch (caught) {
      setError(describeError(caught, "The parent could not be deleted."));
    } finally {
      setDeleting(false);
    }
  }

  const busyMessage = saving
    ? editing
      ? "Updating parent…"
      : "Adding parent…"
    : deleting
      ? "Deleting parent…"
      : loading
        ? "Loading student…"
        : null;

  return (
    <>
      <div className="student-heading">
        <div>
          <p className="eyebrow">Student</p>
          <h1>{student ? personDisplayName(student) : "Student"}</h1>
        </div>
        {studentId !== null ? (
          <Link
            to={studentSettingsPath(studentId)}
            className="icon-button"
            aria-label="Student settings"
          >
            <GearIcon />
          </Link>
        ) : null}
      </div>

      {busyMessage ? (
        <p className="muted" aria-live="polite">
          {busyMessage}
        </p>
      ) : null}

      <ErrorDisplay error={error} />

      {student ? (
        <dl className="student-details">
          {student.preferredName ? (
            <>
              <dt>Full name</dt>
              <dd>{personFullName(student)}</dd>
            </>
          ) : null}
          {student.email ? (
            <>
              <dt>Email</dt>
              <dd>{student.email}</dd>
            </>
          ) : null}
          {student.notes ? (
            <>
              <dt>Notes</dt>
              <dd>{student.notes}</dd>
            </>
          ) : null}
        </dl>
      ) : null}

      <h2 className="student-section-heading">Classes</h2>
      {!loading && classes.length === 0 ? <p className="muted">No classes yet.</p> : null}
      {classes.length > 0 ? (
        <ul className="record-list">
          {classes.map((schoolClass) => (
            <li key={schoolClass.id} className="record-item">
              <button
                type="button"
                className="record-button"
                onClick={() =>
                  navigate(classPath(schoolClass.schoolYearId, schoolClass.id))
                }
              >
                {schoolClass.displayName}
                <span className="record-button-meta">
                  {schoolClass.schoolYearName} · {schoolClass.internalName}
                </span>
              </button>
              {studentId !== null ? (
                <>
                  <Link
                    to={studentClassDataPath(studentId, schoolClass.id)}
                    className="icon-button"
                    aria-label={`Student data for ${schoolClass.displayName}`}
                  >
                    <GraphIcon />
                  </Link>
                  <Link
                    to={studentClassReportPath(studentId, schoolClass.id)}
                    className="icon-button"
                    aria-label={`Individual report for ${schoolClass.displayName}`}
                  >
                    <DocumentIcon />
                  </Link>
                </>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      <h2 className="student-section-heading">Parents</h2>
      {!loading && parents.length === 0 ? <p className="muted">No parents yet.</p> : null}
      {parents.length > 0 ? (
        <ul className="record-list">
          {parents.map((parent) => (
            <li key={parent.id} className="record-item">
              <div className="student-parent-card">
                <strong>{personDisplayName(parent)}</strong>
                {parent.preferredName ? (
                  <span className="record-button-meta">{personFullName(parent)}</span>
                ) : null}
                {parentEmails(parent) ? (
                  <span className="record-button-meta">{parentEmails(parent)}</span>
                ) : null}
              </div>
              <button
                type="button"
                className="icon-button"
                aria-label={`Edit ${personDisplayName(parent)}`}
                disabled={saving || deleting}
                onClick={() => openEditModal(parent)}
              >
                <PencilIcon />
              </button>
              <button
                type="button"
                className="icon-button icon-button--danger"
                aria-label={`Delete ${personDisplayName(parent)}`}
                disabled={saving || deleting}
                onClick={() => setPendingDelete(parent)}
              >
                <TrashIcon />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <button type="button" className="action-button record-add-button" onClick={openAddModal}>
        Add parent
      </button>

      <Modal title={editing ? "Update parent" : "Add parent"} open={formOpen} onClose={closeFormModal}>
        <form className="parent-form" onSubmit={(event) => void onSubmitParent(event)}>
          <ErrorDisplay error={formError} />
          <ParentDetailsFields values={fields} onChange={setFields} disabled={saving} />
          <div className="modal-actions">
            <button
              type="button"
              className="action-button action-button--secondary"
              onClick={closeFormModal}
            >
              Cancel
            </button>
            <button type="submit" className="action-button" disabled={saving}>
              {saving ? (editing ? "Saving…" : "Adding…") : editing ? "Save parent" : "Create parent"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDeleteModal
        title="Delete parent"
        open={pendingDelete !== null}
        subjectName={pendingDelete ? personFullName(pendingDelete) : ""}
        prompt={`This will remove ${pendingDelete ? personDisplayName(pendingDelete) : "this parent"} from this student. Type their first and last name to confirm.`}
        deleting={deleting}
        onClose={closeDeleteModal}
        onConfirm={() => void onConfirmDelete()}
      />

      <p className="back-link">
        <Link to="/">Back to gradebook</Link>
      </p>
    </>
  );
}

function parseStudentRouteId(rawId: string | undefined): number | null {
  const studentId = Number(rawId);

  if (!Number.isInteger(studentId) || studentId <= 0) {
    return null;
  }

  return studentId;
}

function parentEmails(parent: Parent): string {
  return [parent.emailAddress1, parent.emailAddress2].filter(Boolean).join(" · ");
}
