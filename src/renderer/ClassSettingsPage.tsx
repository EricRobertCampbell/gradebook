import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { Class, ClassFields, SchoolYear, Student } from "../shared/ipc";
import { personDisplayName, personFullName } from "../shared/person-name";
import "./ClassSettingsPage.css";
import { deleteClass, getClassById, updateClass } from "./classes";
import { ClassAssessmentSetup } from "./components/ClassAssessmentSetup";
import { ClassDetailsFields, emptyClassFields } from "./components/ClassDetailsFields";
import "./components/common/ActionButton.css";
import "./components/common/BackLink.css";
import { ConfirmDeleteModal } from "./components/common/ConfirmDeleteModal";
import { ErrorDisplay } from "./components/common/ErrorDisplay";
import { TrashIcon } from "./components/common/icons/TrashIcon";
import "./components/common/icons/icon-button.css";
import { Modal } from "./components/common/Modal";
import "./components/common/RecordList.css";
import { addStudentToClass, listStudentsForClass, removeStudentFromClass } from "./enrolments";
import { describeError, type DisplayError } from "./errors";
import { classPath, parseRouteId, schoolYearPath, studentPath } from "./paths";
import { getSchoolYear } from "./school-years";
import { listStudents } from "./students";

export function ClassSettingsPage() {
  const navigate = useNavigate();
  const { schoolYearId: schoolYearIdParam, classId: classIdParam } = useParams();
  const schoolYearId = parseRouteId(schoolYearIdParam);
  const classId = parseRouteId(classIdParam);
  const [schoolYear, setSchoolYear] = useState<SchoolYear | null>(null);
  const [schoolClass, setSchoolClass] = useState<Class | null>(null);
  const [values, setValues] = useState<ClassFields>(emptyClassFields());
  const [enrolled, setEnrolled] = useState<Array<Student>>([]);
  const [allStudents, setAllStudents] = useState<Array<Student>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<DisplayError | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addError, setAddError] = useState<DisplayError | null>(null);
  const [adding, setAdding] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<Student | null>(null);
  const [removing, setRemoving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const yearName = schoolYear?.name ?? "";
  const currentInternalName = schoolClass?.internalName ?? "";
  const classHref = schoolYearId && classId ? classPath(schoolYearId, classId) : "";

  const loadClass = useCallback(async () => {
    if (!schoolYearId || !classId) {
      setError("That class was not found.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [year, loaded] = await Promise.all([
        getSchoolYear({ id: schoolYearId }),
        getClassById({ id: classId }),
      ]);

      if (loaded.schoolYearId !== year.id) {
        throw new Error("That class was not found.");
      }

      const [loadedEnrolled, loadedStudents] = await Promise.all([
        listStudentsForClass({ schoolYearName: year.name, internalName: loaded.internalName }),
        listStudents(),
      ]);
      setSchoolYear(year);
      setSchoolClass(loaded);
      setValues({
        displayName: loaded.displayName,
        internalName: loaded.internalName,
        subject: loaded.subject,
        section: loaded.section,
        notes: loaded.notes,
      });
      setEnrolled(loadedEnrolled);
      setAllStudents(loadedStudents);
    } catch (caught) {
      setSchoolYear(null);
      setSchoolClass(null);
      setEnrolled([]);
      setAllStudents([]);
      setError(describeError(caught, "That class was not found."));
    } finally {
      setLoading(false);
    }
  }, [classId, schoolYearId]);

  useEffect(() => {
    void loadClass();
  }, [loadClass]);

  const availableStudents = allStudents.filter(
    (student) => !enrolled.some((enrolledStudent) => enrolledStudent.id === student.id),
  );

  async function refreshStudents(): Promise<void> {
    if (!yearName || !currentInternalName) {
      return;
    }

    const [loadedEnrolled, loadedStudents] = await Promise.all([
      listStudentsForClass({ schoolYearName: yearName, internalName: currentInternalName }),
      listStudents(),
    ]);
    setEnrolled(loadedEnrolled);
    setAllStudents(loadedStudents);
  }

  async function onSave(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const updated = await updateClass({
        schoolYearName: yearName,
        currentInternalName,
        ...values,
      });
      setSchoolClass(updated);
    } catch (caught) {
      setError(describeError(caught, "The class could not be updated."));
    } finally {
      setSaving(false);
    }
  }

  function closeAddModal(): void {
    if (adding) {
      return;
    }

    setAddOpen(false);
    setAddError(null);
  }

  async function onAddStudent(student: Student): Promise<void> {
    setAdding(true);
    setAddError(null);

    try {
      await addStudentToClass({
        schoolYearName: yearName,
        internalName: currentInternalName,
        studentId: student.id,
      });
      await refreshStudents();
    } catch (caught) {
      setAddError(describeError(caught, "The student could not be added to this class."));
    } finally {
      setAdding(false);
    }
  }

  function closeRemoveModal(): void {
    if (removing) {
      return;
    }

    setPendingRemove(null);
  }

  async function onConfirmRemove(): Promise<void> {
    if (!pendingRemove) {
      return;
    }

    setRemoving(true);
    setError(null);

    try {
      await removeStudentFromClass({
        schoolYearName: yearName,
        internalName: currentInternalName,
        studentId: pendingRemove.id,
      });
      setPendingRemove(null);
      await refreshStudents();
    } catch (caught) {
      setError(describeError(caught, "The student could not be removed from this class."));
    } finally {
      setRemoving(false);
    }
  }

  async function onConfirmDelete(): Promise<void> {
    if (!schoolYear || !schoolClass || !schoolYearId) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      await deleteClass({
        schoolYearName: schoolYear.name,
        internalName: schoolClass.internalName,
      });
      navigate(schoolYearPath(schoolYearId));
    } catch (caught) {
      setError(describeError(caught, "The class could not be deleted."));
      setPendingDelete(false);
    } finally {
      setDeleting(false);
    }
  }

  const busyMessage = saving
    ? "Saving class…"
    : adding
      ? "Adding student…"
      : removing
        ? "Removing student…"
        : deleting
          ? "Deleting class…"
          : loading
            ? "Loading class…"
            : null;

  return (
    <>
      <p className="eyebrow">Class settings</p>
      <h1>{values.displayName || currentInternalName}</h1>
      <p className="lede">
        Edit the class details, set up assessments, manage students, and save your changes.
      </p>

      {busyMessage ? (
        <p className="muted" aria-live="polite">
          {busyMessage}
        </p>
      ) : null}

      <ErrorDisplay error={error} />

      {!loading && schoolClass ? (
        <form className="class-settings-form" onSubmit={(event) => void onSave(event)}>
          <ClassDetailsFields values={values} onChange={setValues} disabled={saving} />
          <button type="submit" className="action-button" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </button>
        </form>
      ) : null}

      {!loading && schoolYear && schoolClass ? (
        <ClassAssessmentSetup schoolYearName={yearName} classInternalName={currentInternalName} />
      ) : null}

      <h2 className="class-settings-heading">Students</h2>
      {!loading && enrolled.length === 0 ? <p className="muted">No students in this class yet.</p> : null}
      {enrolled.length > 0 ? (
        <ul className="record-list">
          {enrolled.map((student) => (
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
              <button
                type="button"
                className="icon-button icon-button--danger"
                aria-label={`Remove ${personDisplayName(student)} from this class`}
                disabled={adding || removing || saving}
                onClick={() => setPendingRemove(student)}
              >
                <TrashIcon />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <button
        type="button"
        className="action-button record-add-button"
        onClick={() => {
          setAddOpen(true);
          setAddError(null);
        }}
      >
        Add student
      </button>

      <Modal title="Add student to class" open={addOpen} onClose={closeAddModal}>
        <ErrorDisplay error={addError} />
        {availableStudents.length === 0 ? (
          <p className="muted">
            {allStudents.length === 0
              ? "Add students from the Students tab first."
              : "Every student is already in this class."}
          </p>
        ) : (
          <ul className="record-list class-add-student-list">
            {availableStudents.map((student) => (
              <li key={student.id} className="record-item">
                <button
                  type="button"
                  className="record-button"
                  disabled={adding}
                  onClick={() => void onAddStudent(student)}
                >
                  {personDisplayName(student)}
                  {student.preferredName ? (
                    <span className="record-button-meta">{personFullName(student)}</span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="modal-actions">
          <button type="button" className="action-button action-button--secondary" onClick={closeAddModal}>
            Close
          </button>
        </div>
      </Modal>

      <ConfirmDeleteModal
        title="Remove student"
        open={pendingRemove !== null}
        subjectName={pendingRemove ? personFullName(pendingRemove) : ""}
        prompt={`This will remove ${pendingRemove ? personDisplayName(pendingRemove) : "this student"} from the class, but will not delete the student. Type their first and last name to confirm.`}
        confirmLabel="Remove"
        busyLabel="Removing…"
        deleting={removing}
        onClose={closeRemoveModal}
        onConfirm={() => void onConfirmRemove()}
      />

      {!loading && schoolClass ? (
        <section className="settings-danger">
          <h2 className="class-settings-heading">Delete class</h2>
          <p className="muted">
            This permanently deletes {schoolClass.displayName} and all of its assessments and marks.
          </p>
          <button
            type="button"
            className="action-button action-button--danger"
            disabled={saving || adding || removing || deleting}
            onClick={() => setPendingDelete(true)}
          >
            Delete class
          </button>
        </section>
      ) : null}

      <ConfirmDeleteModal
        title="Delete class"
        open={pendingDelete}
        subjectName={schoolClass?.displayName ?? ""}
        prompt={`This will permanently delete ${schoolClass?.displayName ?? "this class"}. Type the class display name to confirm.`}
        deleting={deleting}
        onClose={() => {
          if (!deleting) {
            setPendingDelete(false);
          }
        }}
        onConfirm={() => void onConfirmDelete()}
      />

      <p className="back-link">
        <Link to={classHref || "/"}>Back to class</Link>
      </p>
    </>
  );
}
