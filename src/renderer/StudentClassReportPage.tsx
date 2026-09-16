import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { assessmentStatusCode, formatGradePercent, formatWeightPercent } from "../shared/grades";
import type {
  Adjustment,
  Class,
  ClassGradebook,
  GradeCategory,
  GradeSubcategory,
  GradeWork,
  SchoolYear,
  Student,
  StudentGradeRow,
  StudentWorkGrade,
} from "../shared/ipc";
import { personDisplayName, personFullName } from "../shared/person-name";
import { getClassById } from "./classes";
import "./components/common/ActionButton.css";
import "./components/common/BackLink.css";
import { ErrorDisplay } from "./components/common/ErrorDisplay";
import { GraphIcon } from "./components/common/icons/GraphIcon";
import "./components/common/icons/icon-button.css";
import { describeError, type DisplayError } from "./errors";
import { numberInputValue } from "./form-numbers";
import { getClassGradebook } from "./grading";
import { classPath, parseRouteId, studentClassDataPath, studentPath } from "./paths";
import { getSchoolYear } from "./school-years";
import "./StudentClassReportPage.css";
import { getStudent } from "./students";

export function StudentClassReportPage() {
  const { studentId: studentIdParam, classId: classIdParam } = useParams();
  const studentId = parseRouteId(studentIdParam);
  const classId = parseRouteId(classIdParam);
  const [student, setStudent] = useState<Student | null>(null);
  const [schoolYear, setSchoolYear] = useState<SchoolYear | null>(null);
  const [schoolClass, setSchoolClass] = useState<Class | null>(null);
  const [row, setRow] = useState<StudentGradeRow | null>(null);
  const [categories, setCategories] = useState<ClassGradebook["categories"]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<DisplayError | null>(null);

  const loadReport = useCallback(async () => {
    if (!studentId || !classId) {
      setError("That individual report was not found.");
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
      const year = await getSchoolYear({ id: loadedClass.schoolYearId });
      const gradebook = await getClassGradebook({
        schoolYearName: year.name,
        internalName: loadedClass.internalName,
      });
      const studentRow = gradebook.students.find((item) => item.student.id === loadedStudent.id);

      if (!studentRow) {
        throw new Error("That student is not enrolled in this class.");
      }

      setStudent(loadedStudent);
      setSchoolYear(year);
      setSchoolClass(loadedClass);
      setRow(studentRow);
      setCategories(gradebook.categories);
    } catch (caught) {
      setStudent(null);
      setSchoolYear(null);
      setSchoolClass(null);
      setRow(null);
      setCategories([]);
      setError(describeError(caught, "That individual report was not found."));
    } finally {
      setLoading(false);
    }
  }, [classId, studentId]);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  const classHref =
    schoolClass && schoolYear ? classPath(schoolYear.id, schoolClass.id) : "/";
  const studentHref = studentId ? studentPath(studentId) : "/";
  const dataHref =
    studentId && classId ? studentClassDataPath(studentId, classId) : studentHref;

  return (
    <>
      <div className="individual-report-heading">
        <div>
          <p className="eyebrow">Individual report</p>
          <h1>{student ? personDisplayName(student) : "Student"}</h1>
          {student && personFullName(student) !== personDisplayName(student) ? (
            <p className="individual-report-fullname">{personFullName(student)}</p>
          ) : null}
          {schoolClass && schoolYear ? (
            <p className="lede">
              {schoolClass.displayName} · {schoolYear.name}
            </p>
          ) : null}
        </div>
        {row ? (
          <div className="individual-report-actions no-print">
            <Link to={dataHref} className="icon-button" aria-label="Student class data">
              <GraphIcon />
            </Link>
            <button
              type="button"
              className="action-button action-button--secondary"
              onClick={() => window.print()}
            >
              Print report
            </button>
          </div>
        ) : null}
      </div>

      {loading ? (
        <p className="muted" aria-live="polite">
          Loading report…
        </p>
      ) : null}

      <ErrorDisplay error={error} />

      {row ? <IndividualReportTable categories={categories} row={row} /> : null}

      <p className="back-link no-print">
        <Link to={classHref}>Back to class</Link>
        {" · "}
        <Link to={studentHref}>Back to student</Link>
      </p>
    </>
  );
}

function IndividualReportTable({
  categories,
  row,
}: {
  categories: Array<GradeCategory>;
  row: StudentGradeRow;
}) {
  return (
    <div className="individual-report-table-wrap">
      <table className="individual-report-table">
        <thead>
          <tr>
            <th scope="col">Assessment</th>
            <th scope="col">Weight</th>
            <th scope="col">Score</th>
            <th scope="col">Maximum</th>
            <th scope="col">Percent</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category, categoryIndex) => {
            const categoryGrade = row.categories[categoryIndex];

            return (
              <CategoryReportRows
                key={category.id}
                category={category}
                percent={categoryGrade?.percent ?? null}
                subcategoryGrades={categoryGrade?.subcategories ?? []}
                workGrades={categoryGrade?.works ?? []}
              />
            );
          })}
          <tr className="individual-report-total">
            <th scope="row">Course</th>
            <td />
            <td />
            <td />
            <td>{formatGradePercent(row.coursePercent)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function CategoryReportRows({
  category,
  percent,
  subcategoryGrades,
  workGrades,
}: {
  category: GradeCategory;
  percent: number | null;
  subcategoryGrades: StudentGradeRow["categories"][number]["subcategories"];
  workGrades: Array<StudentWorkGrade>;
}) {
  return (
    <>
      <tr className="individual-report-category">
        <th scope="row">
          <span>{category.name}</span>
          {category.notes ? <span className="individual-report-note">{category.notes}</span> : null}
        </th>
        <td>{formatWeightPercent(category.weight)}</td>
        <td />
        <td />
        <td>{formatGradePercent(percent)}</td>
      </tr>
      {category.works.map((work, workIndex) => {
        const workGrade = workGrades[workIndex] ?? {
          workId: work.id,
          assessment: null,
          adjustments: [],
          percent: null,
        };

        return <WorkReportRow key={work.id} work={work} workGrade={workGrade} />;
      })}
      {category.subcategories.map((subcategory, subcategoryIndex) => {
        const subcategoryGrade = subcategoryGrades[subcategoryIndex];

        return (
          <SubcategoryReportRows
            key={subcategory.id}
            subcategory={subcategory}
            percent={subcategoryGrade?.percent ?? null}
            workGrades={subcategoryGrade?.works ?? []}
          />
        );
      })}
    </>
  );
}

function SubcategoryReportRows({
  subcategory,
  percent,
  workGrades,
}: {
  subcategory: GradeSubcategory;
  percent: number | null;
  workGrades: Array<StudentWorkGrade>;
}) {
  return (
    <>
      <tr className="individual-report-subcategory">
        <th scope="row">{subcategory.name}</th>
        <td>{formatWeightPercent(subcategory.weight)}</td>
        <td />
        <td />
        <td>{formatGradePercent(percent)}</td>
      </tr>
      {subcategory.works.map((work, workIndex) => {
        const workGrade = workGrades[workIndex] ?? {
          workId: work.id,
          assessment: null,
          adjustments: [],
          percent: null,
        };

        return <WorkReportRow key={work.id} work={work} workGrade={workGrade} />;
      })}
    </>
  );
}

function WorkReportRow({
  work,
  workGrade,
}: {
  work: GradeWork;
  workGrade: StudentWorkGrade;
}) {
  const statusCode = workGrade.assessment
    ? assessmentStatusCode(workGrade.assessment.status)
    : null;
  const details = workDetails(work, workGrade);
  const statusClassName = statusCode
    ? `individual-report-work individual-report-work--${workGrade.assessment?.status}`
    : "individual-report-work";

  return (
    <tr className={statusClassName}>
      <th scope="row">
        <span>{work.name}</span>
        {details.length > 0 ? (
          <span className="individual-report-note">{details.join(" · ")}</span>
        ) : null}
      </th>
      <td>{formatWeightPercent(work.weight)}</td>
      <td>{reportScore(workGrade)}</td>
      <td>{numberInputValue(work.maximumScore)}</td>
      <td>{statusCode ?? formatGradePercent(workGrade.percent)}</td>
    </tr>
  );
}

function workDetails(work: GradeWork, workGrade: StudentWorkGrade): Array<string> {
  const details: Array<string> = [];

  if (work.notes) {
    details.push(work.notes);
  }

  if (workGrade.assessment?.notes) {
    details.push(workGrade.assessment.notes);
  }

  for (const adjustment of workGrade.adjustments) {
    details.push(adjustmentDetail(adjustment));
  }

  return details;
}

function adjustmentDetail(adjustment: Adjustment): string {
  const parts: Array<string> = [adjustment.description];

  if (adjustment.rawChange !== null) {
    parts.push(`raw ${formatSigned(adjustment.rawChange)}`);
  }

  if (adjustment.percentChange !== null) {
    parts.push(`percent ${formatSigned(adjustment.percentChange)}`);
  }

  if (adjustment.notes) {
    parts.push(adjustment.notes);
  }

  return parts.join(" · ");
}

function reportScore(workGrade: StudentWorkGrade): string {
  const assessment = workGrade.assessment;

  if (!assessment) {
    return "—";
  }

  return assessmentStatusCode(assessment.status) ?? numberInputValue(assessment.score);
}

function formatSigned(value: number): string {
  if (value > 0) {
    return `+${value}`;
  }

  return String(value);
}
