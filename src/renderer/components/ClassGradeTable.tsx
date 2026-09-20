import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import {
  assessmentCountsTowardAverage,
  assessmentStatusCode,
  formatGradePercent,
  formatWeightPercent,
  markInputErrorMessage,
  mean,
  parseSpecialMark,
} from "../../shared/grades";
import {
  categoryChildToken,
  categoryChildTokens,
  parseCategoryChildToken,
  sortCategoryChildren,
} from "../../shared/grading-order";
import type {
  Adjustment,
  ClassGradebook,
  GradeCategory,
  GradeSubcategory,
  GradeWork,
  StudentGradeRow,
  StudentWorkGrade,
} from "../../shared/ipc";
import { personDisplayName } from "../../shared/person-name";
import { describeError, type DisplayError } from "../errors";
import { numberInputValue, parseRequiredNumber } from "../form-numbers";
import { handleGradeMarkKeyDown } from "../grade-mark-navigation";
import {
  deleteAssessment,
  reorderCategories,
  reorderCategoryChildren,
  reorderSubcategoryWorks,
  upsertAssessment,
} from "../grading";
import {
  classWorkDataPath,
  studentClassDataPath,
  studentClassReportPath,
  studentPath,
} from "../paths";
import { sortableListProps } from "../sortable";
import "./ClassGradeTable.css";
import { ErrorDisplay } from "./common/ErrorDisplay";
import { ChevronIcon } from "./common/icons/ChevronIcon";
import { DocumentIcon } from "./common/icons/DocumentIcon";
import { GraphIcon } from "./common/icons/GraphIcon";
import { PencilIcon } from "./common/icons/PencilIcon";
import { PlusIcon } from "./common/icons/PlusIcon";
import { GradeAssessmentModal, type AssessmentEditor } from "./GradeAssessmentModal";
import { GradeStructureEditor, type GradeStructureEditorTarget } from "./GradeStructureEditor";

type ClassGradeTableProps = {
  gradebook: ClassGradebook;
  classId: number;
  schoolYearName: string;
  classInternalName: string;
  onChanged: () => Promise<void>;
};

export function ClassGradeTable({
  gradebook,
  classId,
  schoolYearName,
  classInternalName,
  onChanged,
}: ClassGradeTableProps) {
  const [tableError, setTableError] = useState<DisplayError | null>(null);
  const [assessmentEditor, setAssessmentEditor] = useState<AssessmentEditor | null>(null);
  const [structureEditor, setStructureEditor] = useState<GradeStructureEditorTarget | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<ReadonlySet<number>>(
    () => new Set(),
  );
  const [collapsedSubcategories, setCollapsedSubcategories] = useState<ReadonlySet<number>>(
    () => new Set(),
  );
  const showSubcategoryRow = gradebook.categories.some(
    (category) => !categoryIsCollapsed(category, collapsedCategories),
  );
  const showWorkRow = gradebook.categories.some(
    (category) =>
      !categoryIsCollapsed(category, collapsedCategories) &&
      category.subcategories.some(
        (subcategory) => !subcategoryIsCollapsed(subcategory, collapsedSubcategories),
      ),
  );
  const headerRows = 1 + (showSubcategoryRow ? 1 : 0) + (showWorkRow ? 1 : 0);

  async function persistCategoryOrder(orderedIds: Array<number>): Promise<void> {
    setTableError(null);
    try {
      await reorderCategories({
        schoolYearName,
        internalName: classInternalName,
        orderedIds,
      });
      await onChanged();
    } catch (caught) {
      setTableError(describeError(caught, "Those categories could not be reordered."));
    }
  }

  async function persistCategoryChildren(categoryId: number, tokens: Array<string>): Promise<void> {
    setTableError(null);
    try {
      await reorderCategoryChildren({
        categoryId,
        items: tokens.map(parseCategoryChildToken),
      });
      await onChanged();
    } catch (caught) {
      setTableError(describeError(caught, "Those items could not be reordered."));
    }
  }

  async function persistSubcategoryWorks(
    subcategoryId: number,
    orderedIds: Array<number>,
  ): Promise<void> {
    setTableError(null);
    try {
      await reorderSubcategoryWorks({ subcategoryId, orderedIds });
      await onChanged();
    } catch (caught) {
      setTableError(describeError(caught, "Those pieces of work could not be reordered."));
    }
  }

  return (
    <div className="grade-table-wrap">
      <ErrorDisplay error={tableError} />
      <div className="grade-table-toolbar">
        <button
          type="button"
          className="grade-table-add-button"
          onClick={() =>
            setStructureEditor({
              kind: "create-category",
              schoolYearName,
              internalName: classInternalName,
            })
          }
        >
          <PlusIcon />
          Add category
        </button>
      </div>
      {gradebook.categories.length === 0 ? (
        <p className="muted">No categories yet. Add a category to start recording marks.</p>
      ) : null}
      <div className="grade-table-scroll">
        <table className="grade-table">
          <thead>
            <tr>
              <th className="grade-table-student" rowSpan={headerRows}>
                Student
              </th>
              {gradebook.categories.map((category) => {
                const collapsed = categoryIsCollapsed(category, collapsedCategories);
                const canCollapse = canCollapseCategory(category);

                return (
                  <th
                    key={category.id}
                    className={collapsed ? "grade-table-header-bottom" : undefined}
                    colSpan={categoryColumnCount(
                      category,
                      collapsedCategories,
                      collapsedSubcategories,
                    )}
                    rowSpan={collapsed ? headerRows : undefined}
                    {...sortableListProps(
                      "categories",
                      String(category.id),
                      gradebook.categories.map((item) => String(item.id)),
                      (tokens) => void persistCategoryOrder(tokens.map((id) => Number(id))),
                    )}
                  >
                    <HeaderLabel
                      name={category.name}
                      description={category.notes}
                      weight={category.weight}
                      onEdit={() => setStructureEditor({ kind: "category", category })}
                      editLabel={`Edit ${category.name}`}
                      onAdd={() =>
                        setStructureEditor({
                          kind: "create-subcategory",
                          categoryId: category.id,
                        })
                      }
                      addLabel={`Add sub-category to ${category.name}`}
                      onAddWork={() =>
                        setStructureEditor({
                          kind: "create-work",
                          categoryId: category.id,
                        })
                      }
                      addWorkLabel={`Add work to ${category.name}`}
                      collapsed={collapsed}
                      onToggleCollapse={
                        canCollapse
                          ? () =>
                              setCollapsedCategories((current) =>
                                toggleCollapsed(current, category.id),
                              )
                          : undefined
                      }
                      collapseLabel={
                        canCollapse
                          ? collapsed
                            ? `Expand ${category.name}`
                            : `Collapse ${category.name}`
                          : undefined
                      }
                    />
                  </th>
                );
              })}
              <th className="grade-table-total" rowSpan={headerRows}>
                Course
              </th>
            </tr>
            {showSubcategoryRow ? (
              <tr>
                {gradebook.categories.map((category) =>
                  categoryIsCollapsed(category, collapsedCategories) ? null : (
                    <CategorySubheaders
                      key={category.id}
                      classId={classId}
                      category={category}
                      collapsedSubcategories={collapsedSubcategories}
                      subcategoryRowSpan={showWorkRow ? 2 : 1}
                      onToggleSubcategory={(subcategoryId) =>
                        setCollapsedSubcategories((current) =>
                          toggleCollapsed(current, subcategoryId),
                        )
                      }
                      onEditSubcategory={(subcategory) =>
                        setStructureEditor({ kind: "subcategory", subcategory })
                      }
                      onAddWork={(subcategory) =>
                        setStructureEditor({
                          kind: "create-work",
                          subcategoryId: subcategory.id,
                        })
                      }
                      onEditWork={(work) => setStructureEditor({ kind: "work", work })}
                      onReorderChildren={(tokens) =>
                        void persistCategoryChildren(category.id, tokens)
                      }
                    />
                  ),
                )}
              </tr>
            ) : null}
            {showWorkRow ? (
              <tr>
                {gradebook.categories.flatMap((category) => {
                  if (categoryIsCollapsed(category, collapsedCategories)) {
                    return [];
                  }

                  return sortCategoryChildren(category.subcategories, category.works).flatMap(
                    (child) => {
                      if (child.kind === "work") {
                        return [];
                      }

                      const subcategory = child.item;
                      if (subcategoryIsCollapsed(subcategory, collapsedSubcategories)) {
                        return [];
                      }

                      return [
                        ...subcategory.works.map((work) => (
                          <th
                            key={work.id}
                            className="grade-table-work"
                            colSpan={2}
                            {...sortableListProps(
                              `subcategory-works-${subcategory.id}`,
                              String(work.id),
                              subcategory.works.map((item) => String(item.id)),
                              (tokens) =>
                                void persistSubcategoryWorks(
                                  subcategory.id,
                                  tokens.map((id) => Number(id)),
                                ),
                            )}
                          >
                            <HeaderLabel
                              name={work.name}
                              description={work.notes}
                              detail={workHeaderDetail(work)}
                              weight={work.weight}
                              onEdit={() => setStructureEditor({ kind: "work", work })}
                              editLabel={`Edit ${work.name}`}
                              dataHref={classWorkDataPath(classId, work.id)}
                              dataLabel={`Data for ${work.name}`}
                            />
                          </th>
                        )),
                        <th key={`sub-${subcategory.id}`} className="grade-table-summary">
                          %
                        </th>,
                      ];
                    },
                  );
                })}
              </tr>
            ) : null}
          </thead>
          <tbody>
            <AverageRow
              gradebook={gradebook}
              collapsedCategories={collapsedCategories}
              collapsedSubcategories={collapsedSubcategories}
            />
            {gradebook.students.map((row) => (
              <GradeRow
                key={row.student.id}
                gradebook={gradebook}
                classId={classId}
                row={row}
                collapsedCategories={collapsedCategories}
                collapsedSubcategories={collapsedSubcategories}
                onChanged={onChanged}
                onError={setTableError}
                onOpenAssessment={(work, workGrade) =>
                  setAssessmentEditor({
                    studentId: row.student.id,
                    studentName: personDisplayName(row.student),
                    work,
                    workGrade,
                  })
                }
              />
            ))}
          </tbody>
        </table>
      </div>
      {assessmentEditor ? (
        <GradeAssessmentModal
          editor={latestEditor(gradebook, assessmentEditor)}
          onClose={() => setAssessmentEditor(null)}
          onChanged={onChanged}
        />
      ) : null}
      {structureEditor ? (
        <GradeStructureEditor
          target={structureEditor}
          onClose={() => setStructureEditor(null)}
          onChanged={onChanged}
        />
      ) : null}
    </div>
  );
}

function CategorySubheaders({
  classId,
  category,
  collapsedSubcategories,
  subcategoryRowSpan,
  onToggleSubcategory,
  onEditSubcategory,
  onAddWork,
  onEditWork,
  onReorderChildren,
}: {
  classId: number;
  category: GradeCategory;
  collapsedSubcategories: ReadonlySet<number>;
  subcategoryRowSpan: number;
  onToggleSubcategory: (subcategoryId: number) => void;
  onEditSubcategory: (subcategory: GradeSubcategory) => void;
  onAddWork: (subcategory: GradeSubcategory) => void;
  onEditWork: (work: GradeWork) => void;
  onReorderChildren: (tokens: Array<string>) => void;
}) {
  const childTokens = categoryChildTokens(category.subcategories, category.works);

  return (
    <>
      {sortCategoryChildren(category.subcategories, category.works).map((child) => {
        if (child.kind === "work") {
          const work = child.item;
          return (
            <th
              key={`category-work-${work.id}`}
              className="grade-table-work grade-table-header-bottom"
              colSpan={2}
              rowSpan={subcategoryRowSpan}
              {...sortableListProps(
                `category-children-${category.id}`,
                categoryChildToken("work", work.id),
                childTokens,
                onReorderChildren,
              )}
            >
              <HeaderLabel
                name={work.name}
                description={work.notes}
                detail={workHeaderDetail(work)}
                weight={work.weight}
                onEdit={() => onEditWork(work)}
                editLabel={`Edit ${work.name}`}
                dataHref={classWorkDataPath(classId, work.id)}
                dataLabel={`Data for ${work.name}`}
              />
            </th>
          );
        }

        const subcategory = child.item;
        const collapsed = subcategoryIsCollapsed(subcategory, collapsedSubcategories);
        const canCollapse = canCollapseSubcategory(subcategory);

        return (
          <th
            key={subcategory.id}
            className={collapsed ? "grade-table-header-bottom" : undefined}
            colSpan={collapsed ? 1 : subcategory.works.length * 2 + 1}
            rowSpan={collapsed ? subcategoryRowSpan : undefined}
            {...sortableListProps(
              `category-children-${category.id}`,
              categoryChildToken("subcategory", subcategory.id),
              childTokens,
              onReorderChildren,
            )}
          >
            <HeaderLabel
              name={subcategory.name}
              weight={subcategory.weight}
              onEdit={() => onEditSubcategory(subcategory)}
              editLabel={`Edit ${subcategory.name}`}
              onAdd={() => onAddWork(subcategory)}
              addLabel={`Add work to ${subcategory.name}`}
              collapsed={collapsed}
              onToggleCollapse={canCollapse ? () => onToggleSubcategory(subcategory.id) : undefined}
              collapseLabel={
                canCollapse
                  ? collapsed
                    ? `Expand ${subcategory.name}`
                    : `Collapse ${subcategory.name}`
                  : undefined
              }
            />
          </th>
        );
      })}
      <th className="grade-table-summary" rowSpan={subcategoryRowSpan}>
        Unit
      </th>
    </>
  );
}

function HeaderLabel({
  name,
  description,
  detail,
  weight,
  onEdit,
  editLabel,
  dataHref,
  dataLabel,
  onAdd,
  addLabel,
  onAddWork,
  addWorkLabel,
  collapsed,
  onToggleCollapse,
  collapseLabel,
}: {
  name: string;
  description?: string;
  detail?: string;
  weight: number;
  onEdit: () => void;
  editLabel: string;
  dataHref?: string;
  dataLabel?: string;
  onAdd?: () => void;
  addLabel?: string;
  onAddWork?: () => void;
  addWorkLabel?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  collapseLabel?: string;
}) {
  return (
    <div className="grade-header">
      <div className="grade-header-title">
        {onToggleCollapse && collapseLabel ? (
          <button
            type="button"
            className="grade-header-edit"
            aria-label={collapseLabel}
            aria-expanded={!collapsed}
            onClick={onToggleCollapse}
          >
            <ChevronIcon direction={collapsed ? "right" : "left"} />
          </button>
        ) : null}
        <span>{name}</span>
        <button type="button" className="grade-header-edit" aria-label={editLabel} onClick={onEdit}>
          <PencilIcon />
        </button>
        {dataHref && dataLabel ? (
          <Link to={dataHref} className="grade-header-edit" aria-label={dataLabel}>
            <GraphIcon />
          </Link>
        ) : null}
        {onAdd && addLabel ? (
          <button type="button" className="grade-header-edit" aria-label={addLabel} onClick={onAdd}>
            <PlusIcon />
          </button>
        ) : null}
        {onAddWork && addWorkLabel ? (
          <button
            type="button"
            className="grade-header-edit"
            aria-label={addWorkLabel}
            onClick={onAddWork}
          >
            <PlusIcon />
          </button>
        ) : null}
      </div>
      {description ? <span className="grade-header-detail">{description}</span> : null}
      {detail ? <span className="grade-header-detail">{detail}</span> : null}
      <span className="grade-header-weight">{formatWeightPercent(weight)}</span>
    </div>
  );
}

function AverageRow({
  gradebook,
  collapsedCategories,
  collapsedSubcategories,
}: {
  gradebook: ClassGradebook;
  collapsedCategories: ReadonlySet<number>;
  collapsedSubcategories: ReadonlySet<number>;
}) {
  const averages = classAverages(gradebook);

  return (
    <tr className="grade-table-average">
      <th className="grade-table-student" scope="row">
        Class average
      </th>
      {gradebook.categories.map((category, categoryIndex) => {
        const categoryAverage = averages.categories[categoryIndex];

        if (categoryIsCollapsed(category, collapsedCategories)) {
          return (
            <td key={category.id} className="grade-table-summary">
              {formatGradePercent(categoryAverage?.percent ?? null)}
            </td>
          );
        }

        return (
          <AverageCategoryCells
            key={category.id}
            category={category}
            categoryAverage={categoryAverage}
            collapsedSubcategories={collapsedSubcategories}
          />
        );
      })}
      <td className="grade-table-total">{formatGradePercent(averages.course)}</td>
    </tr>
  );
}

function AverageCategoryCells({
  category,
  categoryAverage,
  collapsedSubcategories,
}: {
  category: GradeCategory;
  categoryAverage: ClassAverages["categories"][number] | undefined;
  collapsedSubcategories: ReadonlySet<number>;
}) {
  return (
    <>
      {sortCategoryChildren(category.subcategories, category.works).map((child) => {
        if (child.kind === "work") {
          const workIndex = category.works.findIndex((work) => work.id === child.item.id);
          const workAverage = categoryAverage?.works[workIndex];
          return (
            <AverageWorkCells
              key={child.item.id}
              workName={child.item.name}
              percent={workAverage?.percent ?? null}
            />
          );
        }

        const subcategory = child.item;
        const subcategoryIndex = category.subcategories.findIndex(
          (item) => item.id === subcategory.id,
        );
        const subcategoryAverage = categoryAverage?.subcategories[subcategoryIndex];

        if (subcategoryIsCollapsed(subcategory, collapsedSubcategories)) {
          return (
            <td key={subcategory.id} className="grade-table-summary">
              {formatGradePercent(subcategoryAverage?.percent ?? null)}
            </td>
          );
        }

        return (
          <AverageSubcategoryCells
            key={subcategory.id}
            subcategory={subcategory}
            subcategoryAverage={subcategoryAverage}
          />
        );
      })}
      <td className="grade-table-summary">
        {formatGradePercent(categoryAverage?.percent ?? null)}
      </td>
    </>
  );
}

function AverageSubcategoryCells({
  subcategory,
  subcategoryAverage,
}: {
  subcategory: GradeSubcategory;
  subcategoryAverage: ClassAverages["categories"][number]["subcategories"][number] | undefined;
}) {
  return (
    <>
      {subcategory.works.map((work, workIndex) => {
        const workAverage = subcategoryAverage?.works[workIndex];

        return (
          <AverageWorkCells
            key={work.id}
            workName={work.name}
            percent={workAverage?.percent ?? null}
          />
        );
      })}
      <td className="grade-table-summary">
        {formatGradePercent(subcategoryAverage?.percent ?? null)}
      </td>
    </>
  );
}

function AverageWorkCells({ workName, percent }: { workName: string; percent: number | null }) {
  return (
    <>
      <td className="grade-cell" />
      <td className="grade-cell">
        <span className="grade-percent" aria-label={`${workName} class average percent`}>
          {formatGradePercent(percent)}
        </span>
      </td>
    </>
  );
}

function GradeRow({
  gradebook,
  classId,
  row,
  collapsedCategories,
  collapsedSubcategories,
  onChanged,
  onError,
  onOpenAssessment,
}: {
  gradebook: ClassGradebook;
  classId: number;
  row: StudentGradeRow;
  collapsedCategories: ReadonlySet<number>;
  collapsedSubcategories: ReadonlySet<number>;
  onChanged: () => Promise<void>;
  onError: (error: DisplayError | null) => void;
  onOpenAssessment: (work: GradeWork, workGrade: StudentWorkGrade) => void;
}) {
  return (
    <tr>
      <th className="grade-table-student" scope="row">
        <span className="grade-table-student-name">
          <Link to={studentPath(row.student.id)}>{personDisplayName(row.student)}</Link>
          <Link
            to={studentClassDataPath(row.student.id, classId)}
            className="grade-table-report"
            aria-label={`Student data for ${personDisplayName(row.student)}`}
          >
            <GraphIcon />
          </Link>
          <Link
            to={studentClassReportPath(row.student.id, classId)}
            className="grade-table-report"
            aria-label={`Individual report for ${personDisplayName(row.student)}`}
          >
            <DocumentIcon />
          </Link>
        </span>
      </th>
      {gradebook.categories.map((category, categoryIndex) => {
        const categoryGrade = row.categories[categoryIndex];

        return (
          <CategoryCells
            key={category.id}
            category={category}
            categoryPercent={categoryGrade?.percent ?? null}
            subcategoryGrades={categoryGrade?.subcategories ?? []}
            workGrades={categoryGrade?.works ?? []}
            collapsed={categoryIsCollapsed(category, collapsedCategories)}
            collapsedSubcategories={collapsedSubcategories}
            studentId={row.student.id}
            onChanged={onChanged}
            onError={onError}
            onOpenAssessment={onOpenAssessment}
          />
        );
      })}
      <td className="grade-table-total">{formatGradePercent(row.coursePercent)}</td>
    </tr>
  );
}

function CategoryCells({
  category,
  categoryPercent,
  subcategoryGrades,
  workGrades,
  collapsed,
  collapsedSubcategories,
  studentId,
  onChanged,
  onError,
  onOpenAssessment,
}: {
  category: GradeCategory;
  categoryPercent: number | null;
  subcategoryGrades: StudentGradeRow["categories"][number]["subcategories"];
  workGrades: Array<StudentWorkGrade>;
  collapsed: boolean;
  collapsedSubcategories: ReadonlySet<number>;
  studentId: number;
  onChanged: () => Promise<void>;
  onError: (error: DisplayError | null) => void;
  onOpenAssessment: (work: GradeWork, workGrade: StudentWorkGrade) => void;
}) {
  if (collapsed) {
    return <td className="grade-table-summary">{formatGradePercent(categoryPercent)}</td>;
  }

  return (
    <>
      {sortCategoryChildren(category.subcategories, category.works).map((child) => {
        if (child.kind === "work") {
          const workIndex = category.works.findIndex((work) => work.id === child.item.id);
          const work = child.item;
          const workGrade = workGrades[workIndex] ?? {
            workId: work.id,
            assessment: null,
            adjustments: [],
            percent: null,
          };

          return (
            <MarkCells
              key={work.id}
              work={work}
              workGrade={workGrade}
              studentId={studentId}
              onChanged={onChanged}
              onError={onError}
              onOpenAssessment={() => onOpenAssessment(work, workGrade)}
            />
          );
        }

        const subcategory = child.item;
        const subcategoryIndex = category.subcategories.findIndex(
          (item) => item.id === subcategory.id,
        );
        const subcategoryGrade = subcategoryGrades[subcategoryIndex];

        return (
          <SubcategoryCells
            key={subcategory.id}
            subcategory={subcategory}
            subcategoryPercent={subcategoryGrade?.percent ?? null}
            workGrades={subcategoryGrade?.works ?? []}
            collapsed={subcategoryIsCollapsed(subcategory, collapsedSubcategories)}
            studentId={studentId}
            onChanged={onChanged}
            onError={onError}
            onOpenAssessment={onOpenAssessment}
          />
        );
      })}
      <td className="grade-table-summary">{formatGradePercent(categoryPercent)}</td>
    </>
  );
}

function SubcategoryCells({
  subcategory,
  subcategoryPercent,
  workGrades,
  collapsed,
  studentId,
  onChanged,
  onError,
  onOpenAssessment,
}: {
  subcategory: GradeSubcategory;
  subcategoryPercent: number | null;
  workGrades: Array<StudentWorkGrade>;
  collapsed: boolean;
  studentId: number;
  onChanged: () => Promise<void>;
  onError: (error: DisplayError | null) => void;
  onOpenAssessment: (work: GradeWork, workGrade: StudentWorkGrade) => void;
}) {
  if (collapsed) {
    return <td className="grade-table-summary">{formatGradePercent(subcategoryPercent)}</td>;
  }

  return (
    <>
      {subcategory.works.map((work, workIndex) => {
        const workGrade = workGrades[workIndex] ?? {
          workId: work.id,
          assessment: null,
          adjustments: [],
          percent: null,
        };

        return (
          <MarkCells
            key={work.id}
            work={work}
            workGrade={workGrade}
            studentId={studentId}
            onChanged={onChanged}
            onError={onError}
            onOpenAssessment={() => onOpenAssessment(work, workGrade)}
          />
        );
      })}
      <td className="grade-table-summary">{formatGradePercent(subcategoryPercent)}</td>
    </>
  );
}

function MarkCells({
  work,
  workGrade,
  studentId,
  onChanged,
  onError,
  onOpenAssessment,
}: {
  work: GradeWork;
  workGrade: StudentWorkGrade;
  studentId: number;
  onChanged: () => Promise<void>;
  onError: (error: DisplayError | null) => void;
  onOpenAssessment: () => void;
}) {
  const savedMark = markInputValue(workGrade.assessment);
  const [draft, setDraft] = useState(savedMark);
  const [saving, setSaving] = useState(false);
  const statusCode = workGrade.assessment
    ? assessmentStatusCode(workGrade.assessment.status)
    : null;
  const cellClassName = statusCode
    ? `grade-cell grade-cell--${workGrade.assessment?.status}`
    : "grade-cell";

  useEffect(() => {
    setDraft(savedMark);
  }, [savedMark]);

  async function saveScore(): Promise<void> {
    const trimmed = draft.trim();
    const current = workGrade.assessment;

    if (trimmed === "" && !current) {
      return;
    }

    if (trimmed === "" && current) {
      setSaving(true);
      onError(null);
      try {
        await deleteAssessment({ workId: work.id, studentId });
        await onChanged();
      } catch (caught) {
        onError(describeError(caught, "The mark could not be cleared."));
      } finally {
        setSaving(false);
      }
      return;
    }

    const specialStatus = parseSpecialMark(trimmed);

    if (specialStatus) {
      if (current?.status === specialStatus) {
        return;
      }

      setSaving(true);
      onError(null);

      try {
        await upsertAssessment({
          workId: work.id,
          studentId,
          score: specialStatus === "nhi" ? 0 : (current?.score ?? 0),
          status: specialStatus,
        });
        await onChanged();
      } catch (caught) {
        onError(describeError(caught, "The mark could not be saved."));
      } finally {
        setSaving(false);
      }
      return;
    }

    let score: number;

    try {
      score = parseRequiredNumber(trimmed, markInputErrorMessage());
    } catch (caught) {
      onError(describeError(caught, markInputErrorMessage()));
      return;
    }

    if (score === current?.score && current.status === "counted") {
      return;
    }

    setSaving(true);
    onError(null);

    try {
      await upsertAssessment({
        workId: work.id,
        studentId,
        score,
        status: "counted",
      });
      await onChanged();
    } catch (caught) {
      onError(describeError(caught, "The mark could not be saved."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <td className={cellClassName}>
        <div className="grade-score">
          <input
            className="grade-score-input"
            type="text"
            inputMode="decimal"
            value={draft}
            aria-label={`${work.name} mark`}
            data-student-id={studentId}
            data-work-id={work.id}
            disabled={saving}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={() => void saveScore()}
            onKeyDown={handleGradeMarkKeyDown}
          />
          <button
            type="button"
            className="grade-score-edit"
            aria-label={`Edit ${work.name} assessment`}
            disabled={saving}
            onClick={onOpenAssessment}
          >
            <PencilIcon />
          </button>
        </div>
      </td>
      <td className={cellClassName}>
        <span className="grade-percent">
          {statusCode ?? formatGradePercent(workGrade.percent)}
          {workGrade.adjustments.length > 0 ? (
            <AdjustmentMarker workName={work.name} adjustments={workGrade.adjustments} />
          ) : null}
        </span>
      </td>
    </>
  );
}

function AdjustmentMarker({
  workName,
  adjustments,
}: {
  workName: string;
  adjustments: Array<Adjustment>;
}) {
  const tooltipId = useId();
  const markRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  function show(): void {
    const rect = markRef.current?.getBoundingClientRect();

    if (rect) {
      setCoords({ top: rect.bottom + 6, left: Math.max(8, rect.left - 8) });
    }

    setOpen(true);
  }

  return (
    <>
      <button
        ref={markRef}
        type="button"
        className="grade-adjusted-mark"
        aria-label={`Adjustments for ${workName}`}
        aria-describedby={open ? tooltipId : undefined}
        onMouseEnter={show}
        onMouseLeave={() => setOpen(false)}
        onFocus={show}
        onBlur={() => setOpen(false)}
      >
        *
      </button>
      {open
        ? createPortal(
            <div
              id={tooltipId}
              role="tooltip"
              className="grade-adjusted-tooltip"
              style={{ top: coords.top, left: coords.left }}
            >
              <ul>
                {adjustments.map((adjustment) => (
                  <li key={adjustment.id}>
                    <strong>{adjustment.description}</strong>
                    <span>{adjustmentTooltipDetail(adjustment)}</span>
                  </li>
                ))}
              </ul>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

type ClassAverages = ReturnType<typeof classAverages>;

function classAverages(gradebook: ClassGradebook) {
  const rows = gradebook.students;

  return {
    course: mean(rows.map((row) => row.coursePercent)),
    categories: gradebook.categories.map((category, categoryIndex) => ({
      percent: mean(rows.map((row) => row.categories[categoryIndex]?.percent ?? null)),
      works: category.works.map((_work, workIndex) => ({
        percent: mean(
          rows.map((row) => {
            const workGrade = row.categories[categoryIndex]?.works[workIndex];

            return workGrade?.assessment &&
              assessmentCountsTowardAverage(workGrade.assessment.status)
              ? workGrade.percent
              : null;
          }),
        ),
      })),
      subcategories: category.subcategories.map((subcategory, subcategoryIndex) => ({
        percent: mean(
          rows.map(
            (row) =>
              row.categories[categoryIndex]?.subcategories[subcategoryIndex]?.percent ?? null,
          ),
        ),
        works: subcategory.works.map((_work, workIndex) => {
          const workGrades = rows.map(
            (row) =>
              row.categories[categoryIndex]?.subcategories[subcategoryIndex]?.works[workIndex],
          );

          return {
            percent: mean(
              workGrades.map((workGrade) =>
                workGrade?.assessment && assessmentCountsTowardAverage(workGrade.assessment.status)
                  ? workGrade.percent
                  : null,
              ),
            ),
          };
        }),
      })),
    })),
  };
}

function markInputValue(assessment: StudentWorkGrade["assessment"]): string {
  if (!assessment) {
    return "";
  }

  return assessmentStatusCode(assessment.status) ?? numberInputValue(assessment.score);
}

function latestEditor(gradebook: ClassGradebook, editor: AssessmentEditor): AssessmentEditor {
  const row = gradebook.students.find((item) => item.student.id === editor.studentId);

  if (!row) {
    return editor;
  }

  for (const category of row.categories) {
    const categoryWork = category.works.find((item) => item.workId === editor.work.id);

    if (categoryWork) {
      return { ...editor, workGrade: categoryWork };
    }

    for (const subcategory of category.subcategories) {
      const workGrade = subcategory.works.find((item) => item.workId === editor.work.id);

      if (workGrade) {
        return { ...editor, workGrade };
      }
    }
  }

  return editor;
}

function workHeaderDetail(work: GradeWork): string {
  if (work.date) {
    return `${work.date} · /${work.maximumScore}`;
  }

  return `/${work.maximumScore}`;
}

function canCollapseCategory(category: GradeCategory): boolean {
  return category.subcategories.length + category.works.length > 1;
}

function canCollapseSubcategory(subcategory: GradeSubcategory): boolean {
  return subcategory.works.length > 1;
}

function categoryIsCollapsed(
  category: GradeCategory,
  collapsedCategories: ReadonlySet<number>,
): boolean {
  return canCollapseCategory(category) && collapsedCategories.has(category.id);
}

function subcategoryIsCollapsed(
  subcategory: GradeSubcategory,
  collapsedSubcategories: ReadonlySet<number>,
): boolean {
  return canCollapseSubcategory(subcategory) && collapsedSubcategories.has(subcategory.id);
}

function categoryColumnCount(
  category: GradeCategory,
  collapsedCategories: ReadonlySet<number>,
  collapsedSubcategories: ReadonlySet<number>,
): number {
  if (categoryIsCollapsed(category, collapsedCategories)) {
    return 1;
  }

  return (
    category.subcategories.reduce((sum, subcategory) => {
      if (subcategoryIsCollapsed(subcategory, collapsedSubcategories)) {
        return sum + 1;
      }

      return sum + subcategory.works.length * 2 + 1;
    }, 0) +
    category.works.length * 2 +
    1
  );
}

function toggleCollapsed(current: ReadonlySet<number>, id: number): ReadonlySet<number> {
  const next = new Set(current);

  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }

  return next;
}

function adjustmentTooltipDetail(adjustment: Adjustment): string {
  const parts: Array<string> = [];

  if (adjustment.rawChange !== null) {
    parts.push(`Raw ${formatSigned(adjustment.rawChange)}`);
  }

  if (adjustment.percentChange !== null) {
    parts.push(`Percent ${formatSigned(adjustment.percentChange)}`);
  }

  if (adjustment.notes) {
    parts.push(adjustment.notes);
  }

  return parts.join(" · ");
}

function formatSigned(value: number): string {
  if (value > 0) {
    return `+${value}`;
  }

  return String(value);
}
