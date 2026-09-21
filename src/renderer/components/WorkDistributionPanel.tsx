import {
  countableMarksForWork,
  workDistribution,
  type WorkMark,
} from "../../shared/grade-distribution";
import type { ClassGradebook, Student, Work } from "../../shared/ipc";
import { distributionSummary } from "../work-distribution-tooltip";
import { WorkDistributionChart } from "./WorkDistributionChart";
import "./WorkDistributionPanel.css";

export function WorkDistributionPanel({
  work,
  gradebook,
  student,
}: {
  work: Work;
  gradebook: ClassGradebook;
  student?: Student;
}) {
  return (
    <GradeDistributionPanel
      title={work.name}
      emptyMessage="No countable marks for this work yet. Enter grades in the class table."
      marks={countableMarksForWork(gradebook, work.id)}
      student={student}
    />
  );
}

export function GradeDistributionPanel({
  title,
  emptyMessage,
  marks,
  student,
}: {
  title: string;
  emptyMessage: string;
  marks: Array<WorkMark>;
  student?: Student;
}) {
  const distribution = workDistribution(marks);

  return (
    <section className="work-distribution">
      <h2>{title}</h2>
      {distribution.sampleSize === 0 ? (
        <p className="muted">{emptyMessage}</p>
      ) : (
        <>
          <p className="muted">{distributionSummary(distribution)}</p>
          <div className="work-distribution-chart-card">
            <WorkDistributionChart
              distribution={distribution}
              highlightedStudentId={student?.id}
              goalMark={student?.goalMark}
            />
          </div>
        </>
      )}
    </section>
  );
}
