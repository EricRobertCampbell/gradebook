import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { countableMarksForWork, findClassWork, listClassWorks } from "../shared/grade-distribution";
import type { Class, ClassGradebook, SchoolYear, Work } from "../shared/ipc";
import { getClassById } from "./classes";
import "./ClassDataPage.css";
import "./components/common/BackLink.css";
import { ErrorDisplay } from "./components/common/ErrorDisplay";
import { SelectField } from "./components/common/SelectField";
import { WorkDistributionPanel } from "./components/WorkDistributionPanel";
import { describeError, type DisplayError } from "./errors";
import { getClassGradebook } from "./grading";
import { classPath, parseRouteId } from "./paths";
import { getSchoolYear } from "./school-years";

export function ClassDataPage() {
  const classId = parseRouteId(useParams().classId);
  const [schoolYear, setSchoolYear] = useState<SchoolYear | null>(null);
  const [schoolClass, setSchoolClass] = useState<Class | null>(null);
  const [gradebook, setGradebook] = useState<ClassGradebook | null>(null);
  const [workId, setWorkId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<DisplayError | null>(null);
  const classHref = schoolClass && schoolYear ? classPath(schoolYear.id, schoolClass.id) : "/";

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
      const loadedGradebook = await getClassGradebook({
        schoolYearName: year.name,
        internalName: loadedClass.internalName,
      });
      const works = listClassWorks(loadedGradebook.categories);
      const firstWorkWithMarks =
        works.find((work) => countableMarksForWork(loadedGradebook, work.id).length > 0) ??
        works[0];

      setSchoolYear(year);
      setSchoolClass(loadedClass);
      setGradebook(loadedGradebook);
      setWorkId(firstWorkWithMarks?.id ?? null);
    } catch (caught) {
      setSchoolYear(null);
      setSchoolClass(null);
      setGradebook(null);
      setWorkId(null);
      setError(describeError(caught, "That class was not found."));
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    void loadClass();
  }, [loadClass]);

  const works = gradebook ? listClassWorks(gradebook.categories) : [];
  const work = selectedWork(gradebook, workId);

  return (
    <div className="class-data-page">
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
        <section className="class-data-distribution">
          <h2>Work distribution</h2>

          <SelectField
            label="Work"
            value={workId ?? ""}
            disabled={works.length === 0}
            onChange={(event) => setWorkId(parseSelectedWorkId(event.target.value))}
          >
            {works.length === 0 ? <option value="">No work in this class</option> : null}
            {works.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </SelectField>

          {works.length === 0 ? (
            <p className="muted">
              Add assessments from class settings before a distribution can be shown.
            </p>
          ) : work && gradebook ? (
            <WorkDistributionPanel work={work} gradebook={gradebook} />
          ) : null}
        </section>
      ) : null}

      <p className="back-link">
        <Link to={classHref}>Back to class</Link>
      </p>
    </div>
  );
}

function selectedWork(gradebook: ClassGradebook | null, workId: number | null): Work | null {
  if (gradebook === null || workId === null) {
    return null;
  }

  return findClassWork(gradebook.categories, workId);
}

function parseSelectedWorkId(value: string): number | null {
  if (value === "") {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}
