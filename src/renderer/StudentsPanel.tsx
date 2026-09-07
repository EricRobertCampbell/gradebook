import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import type { Student, StudentFields } from "../shared/ipc";
import { personDisplayName, personFullName } from "../shared/person-name";
import "./components/common/ActionButton.css";
import { ErrorDisplay } from "./components/common/ErrorDisplay";
import { Modal } from "./components/common/Modal";
import "./components/common/RecordList.css";
import {
  emptyStudentFields,
  StudentDetailsFields,
} from "./components/StudentDetailsFields";
import { describeError, type DisplayError } from "./errors";
import { studentPath } from "./paths";
import { createStudent, listStudents } from "./students";
import "./StudentsPanel.css";

export function StudentsPanel() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Array<Student>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<DisplayError | null>(null);
  const [formError, setFormError] = useState<DisplayError | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [fields, setFields] = useState<StudentFields>(emptyStudentFields());

  const loadStudents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setStudents(await listStudents());
    } catch (caught) {
      setError(describeError(caught, "The students could not be loaded."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStudents();
  }, [loadStudents]);

  function openAddModal(): void {
    setFields(emptyStudentFields());
    setFormError(null);
    setFormOpen(true);
  }

  function closeFormModal(): void {
    if (saving) {
      return;
    }

    setFormOpen(false);
    setFormError(null);
    setFields(emptyStudentFields());
  }

  async function onSubmitStudent(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSaving(true);
    setFormError(null);

    try {
      await createStudent(fields);
      setFormOpen(false);
      setFormError(null);
      setFields(emptyStudentFields());
      await loadStudents();
    } catch (caught) {
      setFormError(describeError(caught, "The student could not be created."));
    } finally {
      setSaving(false);
    }
  }

  const busyMessage = saving ? "Adding student…" : loading ? "Loading students…" : null;

  return (
    <>
      <p className="lede">Choose a student to open their page, or add a new one.</p>

      {busyMessage ? (
        <p className="muted" aria-live="polite">
          {busyMessage}
        </p>
      ) : null}

      <ErrorDisplay error={error} />

      {!loading && students.length === 0 ? <p className="muted">No students yet.</p> : null}

      {students.length > 0 ? (
        <ul className="record-list">
          {students.map((student) => (
            <li key={student.id} className="record-item">
              <button
                type="button"
                className="record-button"
                onClick={() => navigate(studentPath(student.id))}
              >
                {personDisplayName(student)}
                {student.preferredName ? (
                  <span className="record-button-meta">{personFullName(student)}</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <button type="button" className="action-button record-add-button" onClick={openAddModal}>
        Add student
      </button>

      <Modal title="Add student" open={formOpen} onClose={closeFormModal}>
        <form className="student-form" onSubmit={(event) => void onSubmitStudent(event)}>
          <ErrorDisplay error={formError} />
          <StudentDetailsFields values={fields} onChange={setFields} disabled={saving} />
          <div className="modal-actions">
            <button
              type="button"
              className="action-button action-button--secondary"
              onClick={closeFormModal}
            >
              Cancel
            </button>
            <button type="submit" className="action-button" disabled={saving}>
              {saving ? "Adding…" : "Create student"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
