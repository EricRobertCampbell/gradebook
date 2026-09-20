import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { findClassWork } from "../shared/grade-distribution";
import type { Class, ClassGradebook, SchoolYear, Student, Work } from "../shared/ipc";
import { personDisplayName } from "../shared/person-name";
import { getClassById } from "./classes";
import "./components/common/BackLink.css";
import { ErrorDisplay } from "./components/common/ErrorDisplay";
import { SelectField } from "./components/common/SelectField";
import { WorkDistributionPanel } from "./components/WorkDistributionPanel";
import { describeError, type DisplayError } from "./errors";
import { getClassGradebook } from "./grading";
import { classDataPath, classPath, parseRouteId } from "./paths";
import { getSchoolYear } from "./school-years";
import "./WorkDataPage.css";

export function WorkDataPage() {
  const classId = parseRouteId(useParams().classId);
  const workId = parseRouteId(useParams().workId);
  const [schoolYear, setSchoolYear] = useState<SchoolYear | null>(null);
  const [schoolClass, setSchoolClass] = useState<Class | null>(null);
  const [gradebook, setGradebook] = useState<ClassGradebook | null>(null);
  const [work, setWork] = useState<Work | null>(null);
  const [studentId, setStudentId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<DisplayError | null>(null);
  const classHref = schoolClass && schoolYear ? classPath(schoolYear.id, schoolClass.id) : "/";
  const classDataHref = classId ? classDataPath(classId) : "/";

  const loadWork = useCallback(async () => {
    if (!classId || !workId) {
      setError("That work was not found.");
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
      const loadedWork = findClassWork(loadedGradebook.categories, workId);

      if (loadedWork === null) {
        throw new Error("That work was not found.");
      }

      setSchoolYear(year);
      setSchoolClass(loadedClass);
      setGradebook(loadedGradebook);
      setWork(loadedWork);
    } catch (caught) {
      setSchoolYear(null);
      setSchoolClass(null);
      setGradebook(null);
      setWork(null);
      setStudentId(null);
      setError(describeError(caught, "That work was not found."));
    } finally {
      setLoading(false);
    }
  }, [classId, workId]);

  useEffect(() => {
    void loadWork();
  }, [loadWork]);

  return (
    <div className="work-data-page">
      <p className="eyebrow">Work data</p>
      <h1>{work?.name ?? "Work"}</h1>
      {schoolClass && schoolYear ? (
        <p className="lede">
          {schoolClass.displayName} · {schoolYear.name}
        </p>
      ) : null}

      {loading ? (
        <p className="muted" aria-live="polite">
          Loading work…
        </p>
      ) : null}

      <ErrorDisplay error={error} />

      {!loading && !error && work && gradebook ? (
        <>
          <SelectField
            label="Student"
            value={studentId ?? ""}
            disabled={gradebook.students.length === 0}
            onChange={(event) => setStudentId(parseSelectedStudentId(event.target.value))}
          >
            {gradebook.students.length === 0 ? (
              <option value="">No students in this class</option>
            ) : (
              <option value="">None</option>
            )}
            {gradebook.students.map((row) => (
              <option key={row.student.id} value={row.student.id}>
                {personDisplayName(row.student)}
              </option>
            ))}
          </SelectField>
          <WorkDistributionPanel
            work={work}
            gradebook={gradebook}
            student={selectedStudent(gradebook, studentId) ?? undefined}
          />
        </>
      ) : null}

      <p className="back-link">
        <Link to={classHref}>Back to class</Link>
        {" · "}
        <Link to={classDataHref}>Class data</Link>
      </p>
    </div>
  );
}

function selectedStudent(gradebook: ClassGradebook, studentId: number | null): Student | null {
  if (studentId === null) {
    return null;
  }

  return gradebook.students.find((row) => row.student.id === studentId)?.student ?? null;
}

function parseSelectedStudentId(value: string): number | null {
  return parseRouteId(value) ?? null;
}
