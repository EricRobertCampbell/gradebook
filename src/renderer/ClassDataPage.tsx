import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { Class, SchoolYear } from "../shared/ipc";
import { getClassById } from "./classes";
import "./ClassDataPage.css";
import "./components/common/BackLink.css";
import { ErrorDisplay } from "./components/common/ErrorDisplay";
import { describeError, type DisplayError } from "./errors";
import { classPath, parseRouteId } from "./paths";
import { getSchoolYear } from "./school-years";

export function ClassDataPage() {
  const classId = parseRouteId(useParams().classId);
  const [schoolYear, setSchoolYear] = useState<SchoolYear | null>(null);
  const [schoolClass, setSchoolClass] = useState<Class | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<DisplayError | null>(null);
  const classHref =
    schoolClass && schoolYear ? classPath(schoolYear.id, schoolClass.id) : "/";

  const loadClass = useCallback(async () => {
    if (!classId) {
      setError("That class was not found.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const loadedClass = await getClassById({ id: classId });
      const year = await getSchoolYear({ id: loadedClass.schoolYearId });
      setSchoolYear(year);
      setSchoolClass(loadedClass);
    } catch (caught) {
      setSchoolYear(null);
      setSchoolClass(null);
      setError(describeError(caught, "That class was not found."));
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    void loadClass();
  }, [loadClass]);

  return (
    <>
      <p className="eyebrow">Class data</p>
      <h1>{schoolClass?.displayName ?? "Class"}</h1>
      {schoolYear ? <p className="lede">{schoolYear.name}</p> : null}

      {loading ? (
        <p className="muted" aria-live="polite">
          Loading class…
        </p>
      ) : null}

      <ErrorDisplay error={error} />

      {!loading && !error ? (
        <p className="class-data-placeholder muted">Analytics for this class will appear here.</p>
      ) : null}

      <p className="back-link">
        <Link to={classHref}>Back to class</Link>
      </p>
    </>
  );
}
