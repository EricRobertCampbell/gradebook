import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { Class, ClassGradebook, SchoolYear } from "../shared/ipc";
import { getClassById } from "./classes";
import "./ClassPage.css";
import { ClassGradeTable } from "./components/ClassGradeTable";
import "./components/common/BackLink.css";
import { ErrorDisplay } from "./components/common/ErrorDisplay";
import { GearIcon } from "./components/common/icons/GearIcon";
import { GraphIcon } from "./components/common/icons/GraphIcon";
import "./components/common/icons/icon-button.css";
import { describeError, type DisplayError } from "./errors";
import { getClassGradebook } from "./grading";
import { classDataPath, classSettingsPath, parseRouteId, schoolYearPath } from "./paths";
import { getSchoolYear } from "./school-years";

export function ClassPage() {
  const { schoolYearId: schoolYearIdParam, classId: classIdParam } = useParams();
  const schoolYearId = parseRouteId(schoolYearIdParam);
  const classId = parseRouteId(classIdParam);
  const [schoolYear, setSchoolYear] = useState<SchoolYear | null>(null);
  const [schoolClass, setSchoolClass] = useState<Class | null>(null);
  const [gradebook, setGradebook] = useState<ClassGradebook | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<DisplayError | null>(null);
  const settingsPath =
    schoolYearId && classId ? classSettingsPath(schoolYearId, classId) : "";
  const dataPath = classId ? classDataPath(classId) : "";

  const loadClass = useCallback(async () => {
    if (!schoolYearId || !classId) {
      setError("That class was not found.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [year, loadedClass] = await Promise.all([
        getSchoolYear({ id: schoolYearId }),
        getClassById({ id: classId }),
      ]);

      if (loadedClass.schoolYearId !== year.id) {
        throw new Error("That class was not found.");
      }

      const loadedGradebook = await getClassGradebook({
        schoolYearName: year.name,
        internalName: loadedClass.internalName,
      });
      setSchoolYear(year);
      setSchoolClass(loadedClass);
      setGradebook(loadedGradebook);
    } catch (caught) {
      setSchoolYear(null);
      setSchoolClass(null);
      setGradebook(null);
      setError(describeError(caught, "That class was not found."));
    } finally {
      setLoading(false);
    }
  }, [classId, schoolYearId]);

  useEffect(() => {
    void loadClass();
  }, [loadClass]);

  async function reloadGradebook(): Promise<void> {
    if (!schoolYear || !schoolClass) {
      return;
    }

    const loadedGradebook = await getClassGradebook({
      schoolYearName: schoolYear.name,
      internalName: schoolClass.internalName,
    });
    setGradebook(loadedGradebook);
  }

  return (
    <>
      <div className="class-heading">
        <div>
          <p className="eyebrow">Class</p>
          <h1>{schoolClass?.displayName ?? "Class"}</h1>
        </div>
        {dataPath || settingsPath ? (
          <div className="class-heading-actions">
            {dataPath ? (
              <Link to={dataPath} className="icon-button" aria-label="Class data">
                <GraphIcon />
              </Link>
            ) : null}
            {settingsPath ? (
              <Link to={settingsPath} className="icon-button" aria-label="Class settings">
                <GearIcon />
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>

      {loading ? (
        <p className="muted" aria-live="polite">
          Loading class…
        </p>
      ) : null}

      <ErrorDisplay error={error} />

      <h2 className="class-section-heading">Grades</h2>
      {!loading && gradebook && gradebook.students.length === 0 ? (
        <p className="muted">No students in this class yet. Add them from class settings.</p>
      ) : null}
      {!loading && gradebook && gradebook.students.length > 0 && gradebook.categories.length === 0 ? (
        <p className="muted">Set up categories and work from class settings to record marks.</p>
      ) : null}
      {gradebook && schoolClass && gradebook.students.length > 0 ? (
        <ClassGradeTable
          gradebook={gradebook}
          classId={schoolClass.id}
          onChanged={reloadGradebook}
        />
      ) : null}

      <p className="back-link">
        <Link to={schoolYearId ? schoolYearPath(schoolYearId) : "/"}>Back to school year</Link>
      </p>
    </>
  );
}
