import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { Class, SchoolYear, Student } from "../shared/ipc";
import { personDisplayName } from "../shared/person-name";
import { getClassById } from "./classes";
import "./components/common/BackLink.css";
import { ErrorDisplay } from "./components/common/ErrorDisplay";
import { listClassesForStudent } from "./enrolments";
import { describeError, type DisplayError } from "./errors";
import { classPath, parseRouteId, studentClassReportPath, studentPath } from "./paths";
import { getSchoolYear } from "./school-years";
import "./StudentClassDataPage.css";
import { getStudent } from "./students";

export function StudentClassDataPage() {
  const { studentId: studentIdParam, classId: classIdParam } = useParams();
  const studentId = parseRouteId(studentIdParam);
  const classId = parseRouteId(classIdParam);
  const [student, setStudent] = useState<Student | null>(null);
  const [schoolYear, setSchoolYear] = useState<SchoolYear | null>(null);
  const [schoolClass, setSchoolClass] = useState<Class | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<DisplayError | null>(null);

  const loadPage = useCallback(async () => {
    if (!studentId || !classId) {
      setError("That student class data page was not found.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [loadedStudent, loadedClass] = await Promise.all([
        getStudent({ id: studentId }),
        getClassById({ id: classId }),
      ]);
      const [year, enrolledClasses] = await Promise.all([
        getSchoolYear({ id: loadedClass.schoolYearId }),
        listClassesForStudent({ id: loadedStudent.id }),
      ]);
      const enrolled = enrolledClasses.some((item) => item.id === loadedClass.id);

      if (!enrolled) {
        throw new Error("That student is not enrolled in this class.");
      }

      setStudent(loadedStudent);
      setSchoolYear(year);
      setSchoolClass(loadedClass);
    } catch (caught) {
      setStudent(null);
      setSchoolYear(null);
      setSchoolClass(null);
      setError(describeError(caught, "That student class data page was not found."));
    } finally {
      setLoading(false);
    }
  }, [classId, studentId]);

  useEffect(() => {
    void loadPage();
  }, [loadPage]);

  const classHref =
    schoolClass && schoolYear ? classPath(schoolYear.id, schoolClass.id) : "/";
  const studentHref = studentId ? studentPath(studentId) : "/";
  const reportHref =
    studentId && classId ? studentClassReportPath(studentId, classId) : studentHref;

  return (
    <>
      <p className="eyebrow">Student data</p>
      <h1>{student ? personDisplayName(student) : "Student"}</h1>
      {schoolClass && schoolYear ? (
        <p className="lede">
          {schoolClass.displayName} · {schoolYear.name}
        </p>
      ) : null}

      {loading ? (
        <p className="muted" aria-live="polite">
          Loading student data…
        </p>
      ) : null}

      <ErrorDisplay error={error} />

      {!loading && !error ? (
        <p className="student-class-data-placeholder muted">
          Analytics for this student in this class will appear here.
        </p>
      ) : null}

      <p className="back-link">
        <Link to={classHref}>Back to class</Link>
        {" · "}
        <Link to={studentHref}>Back to student</Link>
        {" · "}
        <Link to={reportHref}>Individual report</Link>
      </p>
    </>
  );
}
