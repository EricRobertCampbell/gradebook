import {
  countableMarksForWork,
  workDistribution,
  type WorkMark,
} from "../../shared/grade-distribution";
import type { ClassGradebook, Work } from "../../shared/ipc";
import { distributionSummary } from "../work-distribution-tooltip";
import { WorkDistributionChart } from "./WorkDistributionChart";
import "./WorkDistributionPanel.css";

export function WorkDistributionPanel({
  work,
  gradebook,
  highlightedStudentId,
  goalMark,
}: {
  work: Work;
  gradebook: ClassGradebook;
  highlightedStudentId?: number;
  goalMark?: number | null;
}) {
  return (
    <GradeDistributionPanel
      title={work.name}
      emptyMessage="No countable marks for this work yet. Enter grades in the class table."
      marks={countableMarksForWork(gradebook, work.id)}
      highlightedStudentId={highlightedStudentId}
      goalMark={goalMark}
    />
  );
}

export function GradeDistributionPanel({
  title,
  emptyMessage,
  marks,
  highlightedStudentId,
  goalMark,
}: {
  title: string;
  emptyMessage: string;
  marks: Array<WorkMark>;
  highlightedStudentId?: number;
  goalMark?: number | null;
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
              highlightedStudentId={highlightedStudentId}
              goalMark={goalMark}
            />
          </div>
        </>
      )}
    </section>
  );
}
