import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { Class, ClassFields, SchoolYear } from "../shared/ipc";
import "./SchoolYearPage.css";
import { createClass, listClasses, listSubjects } from "./classes";
import { ClassDetailsFields, emptyClassFields } from "./components/ClassDetailsFields";
import "./components/common/ActionButton.css";
import "./components/common/BackLink.css";
import { ErrorDisplay } from "./components/common/ErrorDisplay";
import { GearIcon } from "./components/common/icons/GearIcon";
import "./components/common/icons/icon-button.css";
import { Modal } from "./components/common/Modal";
import { describeError, type DisplayError } from "./errors";
import { classPath, parseRouteId, schoolYearSettingsPath } from "./paths";
import { getSchoolYear } from "./school-years";

export function SchoolYearPage() {
  const navigate = useNavigate();
  const { schoolYearId: schoolYearIdParam } = useParams();
  const schoolYearId = parseRouteId(schoolYearIdParam);
  const [schoolYear, setSchoolYear] = useState<SchoolYear | null>(null);
  const [classes, setClasses] = useState<Array<Class>>([]);
  const [subjects, setSubjects] = useState<Array<string>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<DisplayError | null>(null);
  const [addError, setAddError] = useState<DisplayError | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newClass, setNewClass] = useState<ClassFields>(emptyClassFields());

  const loadClasses = useCallback(async () => {
    if (!schoolYearId) {
      setSchoolYear(null);
      setError("That school year was not found.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const year = await getSchoolYear({ id: schoolYearId });
      setSchoolYear(year);
      const [listedClasses, listedSubjects] = await Promise.all([
        listClasses(year.name),
        listSubjects(),
      ]);
      setClasses(listedClasses);
      setSubjects(listedSubjects);
    } catch (caught) {
      setSchoolYear(null);
      setClasses([]);
      setSubjects([]);
      setError(describeError(caught, "The classes could not be loaded."));
    } finally {
      setLoading(false);
    }
  }, [schoolYearId]);

  useEffect(() => {
    void loadClasses();
  }, [loadClasses]);

  async function onAddClass(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSaving(true);
    setAddError(null);

    try {
      if (!schoolYear) {
        throw new Error("That school year was not found.");
      }

      await createClass({
        schoolYearName: schoolYear.name,
        ...newClass,
      });
      setAddOpen(false);
      setNewClass(emptyClassFields());
      await loadClasses();
    } catch (caught) {
      setAddError(describeError(caught, "The class could not be created."));
    } finally {
      setSaving(false);
    }
  }

  function closeAddModal(): void {
    if (saving) {
      return;
    }

    setAddOpen(false);
    setAddError(null);
    setNewClass(emptyClassFields());
  }

  if (!schoolYearId) {
    return <ErrorDisplay error="That school year was not found." />;
  }

  const busyMessage = saving ? "Adding class…" : loading ? "Loading classes…" : null;
  const settingsPath = schoolYearSettingsPath(schoolYearId);

  return (
    <>
      <div className="year-heading">
        <div>
          <p className="eyebrow">School year</p>
          <h1>{schoolYear?.name ?? "School year"}</h1>
        </div>
        <Link to={settingsPath} className="icon-button" aria-label="School year settings">
          <GearIcon />
        </Link>
      </div>
      <p className="lede">Choose a class to open it, or add a new one.</p>

      {busyMessage ? (
        <p className="muted" aria-live="polite">
          {busyMessage}
        </p>
      ) : null}

      <ErrorDisplay error={error} />

      {!loading && classes.length === 0 ? <p className="muted">No classes yet.</p> : null}

      {classes.length > 0 ? (
        <ul className="class-list">
          {classes.map((schoolClass) => (
            <li key={schoolClass.id} className="class-item">
              <button
                type="button"
                className="class-button"
                onClick={() => navigate(classPath(schoolYearId, schoolClass.id))}
              >
                {schoolClass.displayName}
                <span className="class-button-meta">{schoolClass.internalName}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <button
        type="button"
        className="action-button class-add-button"
        disabled={!schoolYear || saving}
        onClick={() => {
          setAddOpen(true);
          setAddError(null);
        }}
      >
        Add class
      </button>

      <Modal title="Add class" open={addOpen} onClose={closeAddModal}>
        <form className="class-add-form" onSubmit={(event) => void onAddClass(event)}>
          <ErrorDisplay error={addError} />
          <ClassDetailsFields
            values={newClass}
            subjects={subjects}
            onChange={setNewClass}
            disabled={saving}
          />
          <div className="modal-actions">
            <button
              type="button"
              className="action-button action-button--secondary"
              onClick={closeAddModal}
            >
              Cancel
            </button>
            <button type="submit" className="action-button" disabled={saving}>
              {saving ? "Adding…" : "Create class"}
            </button>
          </div>
        </form>
      </Modal>

      <p className="back-link">
        <Link to="/">Back to gradebook</Link>
      </p>
    </>
  );
}
