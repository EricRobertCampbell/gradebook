import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { Student, StudentFields } from "../shared/ipc";
import { personDisplayName, personFullName } from "../shared/person-name";
import "./components/common/ActionButton.css";
import "./components/common/BackLink.css";
import { ConfirmDeleteModal } from "./components/common/ConfirmDeleteModal";
import { ErrorDisplay } from "./components/common/ErrorDisplay";
import {
  emptyStudentFields,
  StudentDetailsFields,
  studentFieldsFrom,
} from "./components/StudentDetailsFields";
import { describeError, type DisplayError } from "./errors";
import { parseRouteId, studentPath } from "./paths";
import { deleteStudent, getStudent, updateStudent } from "./students";
import "./StudentSettingsPage.css";

export function StudentSettingsPage() {
  const navigate = useNavigate();
  const studentId = parseRouteId(useParams().studentId);
  const [student, setStudent] = useState<Student | null>(null);
  const [values, setValues] = useState<StudentFields>(emptyStudentFields());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<DisplayError | null>(null);
  const [pendingDelete, setPendingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadStudent = useCallback(async () => {
    if (!studentId) {
      setError("That student was not found.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const loaded = await getStudent({ id: studentId });
      setStudent(loaded);
      setValues(studentFieldsFrom(loaded));
    } catch (caught) {
      setStudent(null);
      setError(describeError(caught, "That student was not found."));
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    void loadStudent();
  }, [loadStudent]);

  async function onSave(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (!studentId) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const updated = await updateStudent({ id: studentId, ...values });
      setStudent(updated);
      setValues(studentFieldsFrom(updated));
    } catch (caught) {
      setError(describeError(caught, "The student could not be updated."));
    } finally {
      setSaving(false);
    }
  }

  async function onConfirmDelete(): Promise<void> {
    if (!studentId) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      await deleteStudent({ id: studentId });
      navigate("/");
    } catch (caught) {
      setError(describeError(caught, "The student could not be deleted."));
      setPendingDelete(false);
    } finally {
      setDeleting(false);
    }
  }

  const busyMessage = saving
    ? "Saving student…"
    : deleting
      ? "Deleting student…"
      : loading
        ? "Loading student…"
        : null;
  const studentHref = studentId ? studentPath(studentId) : "/";

  return (
    <>
      <p className="eyebrow">Student settings</p>
      <h1>{student ? personDisplayName(student) : "Student"}</h1>
      <p className="lede">Edit this student’s details, or delete them from the gradebook.</p>

      {busyMessage ? (
        <p className="muted" aria-live="polite">
          {busyMessage}
        </p>
      ) : null}

      <ErrorDisplay error={error} />

      {!loading && student ? (
        <form className="student-settings-form" onSubmit={(event) => void onSave(event)}>
          <StudentDetailsFields values={values} onChange={setValues} disabled={saving || deleting} />
          <button type="submit" className="action-button" disabled={saving || deleting}>
            {saving ? "Saving…" : "Save changes"}
          </button>
        </form>
      ) : null}

      {!loading && student ? (
        <section className="settings-danger">
          <h2 className="settings-danger-heading">Delete student</h2>
          <p className="muted">
            This permanently deletes {personDisplayName(student)} and their marks in every class.
          </p>
          <button
            type="button"
            className="action-button action-button--danger"
            disabled={saving || deleting}
            onClick={() => setPendingDelete(true)}
          >
            Delete student
          </button>
        </section>
      ) : null}

      <ConfirmDeleteModal
        title="Delete student"
        open={pendingDelete}
        subjectName={student ? personFullName(student) : ""}
        prompt={`This will permanently delete ${student ? personDisplayName(student) : "this student"}. Type their first and last name to confirm.`}
        deleting={deleting}
        onClose={() => {
          if (!deleting) {
            setPendingDelete(false);
          }
        }}
        onConfirm={() => void onConfirmDelete()}
      />

      <p className="back-link">
        <Link to={studentHref}>Back to student</Link>
      </p>
    </>
  );
}
