import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  categoryChildToken,
  categoryChildTokens,
  parseCategoryChildToken,
  sortCategoryChildren,
} from "../../shared/grading-order";
import type { GradeCategory, GradeSubcategory, GradeWork } from "../../shared/ipc";
import { describeError, type DisplayError } from "../errors";
import { parseRequiredNumber } from "../form-numbers";
import {
  copyCategory,
  copySubcategory,
  copyWork,
  createCategory,
  createSubcategory,
  createWork,
  deleteCategory,
  deleteSubcategory,
  deleteWork,
  getGradingStructure,
  reorderCategories,
  reorderCategoryChildren,
  reorderSubcategoryWorks,
  updateCategory,
  updateSubcategory,
  updateWork,
} from "../grading";
import { sortableListProps } from "../sortable";
import "./ClassAssessmentSetup.css";
import "./common/ActionButton.css";
import "./common/Field.css";
import { TextArea } from "./common/TextArea";
import { TextField } from "./common/TextField";
import { ConfirmDeleteModal } from "./common/ConfirmDeleteModal";
import { ErrorDisplay } from "./common/ErrorDisplay";
import { CopyIcon } from "./common/icons/CopyIcon";
import { PencilIcon } from "./common/icons/PencilIcon";
import { TrashIcon } from "./common/icons/TrashIcon";
import "./common/icons/icon-button.css";
import { Modal } from "./common/Modal";
import "./common/RecordList.css";

type ClassAssessmentSetupProps = {
  schoolYearName: string;
  classInternalName: string;
};

type Editor =
  | { kind: "create-category" }
  | { kind: "edit-category"; category: GradeCategory }
  | { kind: "create-subcategory"; categoryId: number }
  | { kind: "edit-subcategory"; subcategory: GradeSubcategory }
  | { kind: "create-work"; categoryId: number }
  | { kind: "create-work"; subcategoryId: number }
  | { kind: "edit-work"; work: GradeWork };

type PendingDelete =
  | { kind: "category"; item: GradeCategory }
  | { kind: "subcategory"; item: GradeSubcategory }
  | { kind: "work"; item: GradeWork };

type EditorFields = {
  name: string;
  notes: string;
  date: string;
  weight: string;
  maximumScore: string;
};

export function ClassAssessmentSetup({
  schoolYearName,
  classInternalName,
}: ClassAssessmentSetupProps) {
  const [categories, setCategories] = useState<Array<GradeCategory>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<DisplayError | null>(null);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [fields, setFields] = useState<EditorFields>(emptyFields());
  const [editorError, setEditorError] = useState<DisplayError | null>(null);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [copying, setCopying] = useState(false);

  const loadStructure = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const structure = await getGradingStructure({
        schoolYearName,
        internalName: classInternalName,
      });
      setCategories(structure.categories);
    } catch (caught) {
      setCategories([]);
      setError(describeError(caught, "The assessment setup could not be loaded."));
    } finally {
      setLoading(false);
    }
  }, [classInternalName, schoolYearName]);

  useEffect(() => {
    void loadStructure();
  }, [loadStructure]);

  function openEditor(next: Editor): void {
    setEditor(next);
    setEditorError(null);
    setFields(fieldsForEditor(next));
  }

  function closeEditor(): void {
    setEditor(null);
    setEditorError(null);
    setFields(emptyFields());
  }

  async function onSaveEditor(event: FormEvent): Promise<void> {
    event.preventDefault();

    if (!editor) {
      return;
    }

    setSaving(true);
    setEditorError(null);

    try {
      await saveEditor(editor, fields, schoolYearName, classInternalName);
      closeEditor();
      await loadStructure();
    } catch (caught) {
      setEditorError(describeError(caught, "Those details could not be saved."));
    } finally {
      setSaving(false);
    }
  }

  async function onCopy(kind: PendingDelete["kind"], id: number): Promise<void> {
    setCopying(true);
    setError(null);

    try {
      await copyItem(kind, id);
      await loadStructure();
    } catch (caught) {
      setError(describeError(caught, "That item could not be copied."));
    } finally {
      setCopying(false);
    }
  }

  async function onReorderCategories(orderedIds: Array<number>): Promise<void> {
    setError(null);

    try {
      await reorderCategories({
        schoolYearName,
        internalName: classInternalName,
        orderedIds,
      });
      await loadStructure();
    } catch (caught) {
      setError(describeError(caught, "Those categories could not be reordered."));
    }
  }

  async function onReorderCategoryChildren(
    categoryId: number,
    tokens: Array<string>,
  ): Promise<void> {
    setError(null);

    try {
      await reorderCategoryChildren({
        categoryId,
        items: tokens.map(parseCategoryChildToken),
      });
      await loadStructure();
    } catch (caught) {
      setError(describeError(caught, "Those items could not be reordered."));
    }
  }

  async function onReorderSubcategoryWorks(
    subcategoryId: number,
    orderedIds: Array<number>,
  ): Promise<void> {
    setError(null);

    try {
      await reorderSubcategoryWorks({ subcategoryId, orderedIds });
      await loadStructure();
    } catch (caught) {
      setError(describeError(caught, "Those pieces of work could not be reordered."));
    }
  }

  async function onConfirmDelete(): Promise<void> {
    if (!pendingDelete) {
      return;
    }

    setDeleting(true);

    try {
      await deletePending(pendingDelete);
      setPendingDelete(null);
      await loadStructure();
    } catch (caught) {
      setError(describeError(caught, "That item could not be deleted."));
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section className="class-assessment-setup">
      <h2 className="class-settings-heading">Assessments</h2>
      <p className="lede">
        Set up categories (units), sub-categories, and work. Weights are used for the class grade
        table.
      </p>

      {loading ? (
        <p className="muted" aria-live="polite">
          Loading assessments…
        </p>
      ) : null}

      {copying ? (
        <p className="muted" aria-live="polite">
          Copying…
        </p>
      ) : null}

      <ErrorDisplay error={error} />

      {!loading && categories.length === 0 ? (
        <p className="muted">No categories yet. Add a unit to start organising marks.</p>
      ) : null}

      <ul className="grading-tree">
        {categories.map((category) => (
          <li
            key={category.id}
            className="grading-tree-group"
            {...sortableListProps(
              "categories",
              String(category.id),
              categories.map((item) => String(item.id)),
              (orderedIds) => void onReorderCategories(orderedIds.map((id) => Number(id))),
            )}
          >
            <div className="record-item">
              <div className="grading-tree-label">
                <strong>{category.name}</strong>
                <span className="record-button-meta">
                  Weight {category.weight}
                  {category.notes ? ` · ${category.notes}` : ""}
                </span>
              </div>
              <button
                type="button"
                className="icon-button"
                aria-label={`Edit ${category.name}`}
                disabled={copying || saving || deleting}
                onClick={() => openEditor({ kind: "edit-category", category })}
              >
                <PencilIcon />
              </button>
              <button
                type="button"
                className="icon-button"
                aria-label={`Copy ${category.name}`}
                disabled={copying || saving || deleting}
                onClick={() => void onCopy("category", category.id)}
              >
                <CopyIcon />
              </button>
              <button
                type="button"
                className="icon-button icon-button--danger"
                aria-label={`Delete ${category.name}`}
                disabled={copying || saving || deleting}
                onClick={() => setPendingDelete({ kind: "category", item: category })}
              >
                <TrashIcon />
              </button>
            </div>
            <ul className="grading-tree grading-tree--nested">
              {sortCategoryChildren(category.subcategories, category.works).map((child) => {
                if (child.kind === "work") {
                  return (
                    <WorkSetupRow
                      key={`work-${child.item.id}`}
                      work={child.item}
                      disabled={copying || saving || deleting}
                      sortable={sortableListProps(
                        `category-children-${category.id}`,
                        categoryChildToken("work", child.item.id),
                        categoryChildTokens(category.subcategories, category.works),
                        (tokens) => void onReorderCategoryChildren(category.id, tokens),
                      )}
                      onEdit={() => openEditor({ kind: "edit-work", work: child.item })}
                      onCopy={() => void onCopy("work", child.item.id)}
                      onDelete={() => setPendingDelete({ kind: "work", item: child.item })}
                    />
                  );
                }

                const subcategory = child.item;
                return (
                  <li
                    key={`subcategory-${subcategory.id}`}
                    className="grading-tree-group"
                    {...sortableListProps(
                      `category-children-${category.id}`,
                      categoryChildToken("subcategory", subcategory.id),
                      categoryChildTokens(category.subcategories, category.works),
                      (tokens) => void onReorderCategoryChildren(category.id, tokens),
                    )}
                  >
                    <div className="record-item">
                      <div className="grading-tree-label">
                        <strong>{subcategory.name}</strong>
                        <span className="record-button-meta">Weight {subcategory.weight}</span>
                      </div>
                      <button
                        type="button"
                        className="icon-button"
                        aria-label={`Edit ${subcategory.name}`}
                        disabled={copying || saving || deleting}
                        onClick={() => openEditor({ kind: "edit-subcategory", subcategory })}
                      >
                        <PencilIcon />
                      </button>
                      <button
                        type="button"
                        className="icon-button"
                        aria-label={`Copy ${subcategory.name}`}
                        disabled={copying || saving || deleting}
                        onClick={() => void onCopy("subcategory", subcategory.id)}
                      >
                        <CopyIcon />
                      </button>
                      <button
                        type="button"
                        className="icon-button icon-button--danger"
                        aria-label={`Delete ${subcategory.name}`}
                        disabled={copying || saving || deleting}
                        onClick={() => setPendingDelete({ kind: "subcategory", item: subcategory })}
                      >
                        <TrashIcon />
                      </button>
                    </div>
                    <ul className="grading-tree grading-tree--nested">
                      {subcategory.works.map((work) => (
                        <WorkSetupRow
                          key={work.id}
                          work={work}
                          disabled={copying || saving || deleting}
                          sortable={sortableListProps(
                            `subcategory-works-${subcategory.id}`,
                            String(work.id),
                            subcategory.works.map((item) => String(item.id)),
                            (orderedIds) =>
                              void onReorderSubcategoryWorks(
                                subcategory.id,
                                orderedIds.map((id) => Number(id)),
                              ),
                          )}
                          onEdit={() => openEditor({ kind: "edit-work", work })}
                          onCopy={() => void onCopy("work", work.id)}
                          onDelete={() => setPendingDelete({ kind: "work", item: work })}
                        />
                      ))}
                    </ul>
                    <button
                      type="button"
                      className="action-button action-button--secondary grading-tree-add"
                      onClick={() =>
                        openEditor({ kind: "create-work", subcategoryId: subcategory.id })
                      }
                    >
                      Add work
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="grading-tree-add-row">
              <button
                type="button"
                className="action-button action-button--secondary grading-tree-add"
                onClick={() => openEditor({ kind: "create-work", categoryId: category.id })}
              >
                Add work
              </button>
              <button
                type="button"
                className="action-button action-button--secondary grading-tree-add"
                onClick={() => openEditor({ kind: "create-subcategory", categoryId: category.id })}
              >
                Add sub-category
              </button>
            </div>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className="action-button record-add-button"
        onClick={() => openEditor({ kind: "create-category" })}
      >
        Add category
      </button>

      <Modal title={editorTitle(editor)} open={editor !== null} onClose={closeEditor}>
        <ErrorDisplay error={editorError} />
        <form className="fields" onSubmit={(event) => void onSaveEditor(event)}>
          <TextField
            label="Name"
            required
            type="text"
            value={fields.name}
            onChange={(event) => setFields({ ...fields, name: event.target.value })}
            autoComplete="off"
            disabled={saving}
          />
          {showsNotes(editor) ? (
            <TextArea
              label="Notes"
              value={fields.notes}
              onChange={(event) => setFields({ ...fields, notes: event.target.value })}
              disabled={saving}
            />
          ) : null}
          {showsMaximumScore(editor) ? (
            <TextField
              label="Maximum score"
              required
              type="number"
              step="any"
              value={fields.maximumScore}
              onChange={(event) => setFields({ ...fields, maximumScore: event.target.value })}
              disabled={saving}
            />
          ) : null}
          {showsMaximumScore(editor) ? (
            <TextField
              label="Date (YYYY-MM-DD)"
              type="text"
              placeholder="YYYY-MM-DD"
              autoComplete="off"
              spellCheck={false}
              value={fields.date}
              onChange={(event) => setFields({ ...fields, date: event.target.value })}
              disabled={saving}
            />
          ) : null}
          <TextField
            label="Weight"
            required
            type="number"
            step="any"
            value={fields.weight}
            onChange={(event) => setFields({ ...fields, weight: event.target.value })}
            disabled={saving}
          />
          <div className="modal-actions">
            <button
              type="button"
              className="action-button action-button--secondary"
              onClick={closeEditor}
            >
              Cancel
            </button>
            <button type="submit" className="action-button" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDeleteModal
        title={deleteTitle(pendingDelete)}
        open={pendingDelete !== null}
        subjectName={pendingDelete?.item.name ?? ""}
        prompt={deletePrompt(pendingDelete)}
        deleting={deleting}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => void onConfirmDelete()}
      />
    </section>
  );
}

function WorkSetupRow({
  work,
  disabled,
  sortable,
  onEdit,
  onCopy,
  onDelete,
}: {
  work: GradeWork;
  disabled: boolean;
  sortable?: ReturnType<typeof sortableListProps>;
  onEdit: () => void;
  onCopy: () => void;
  onDelete: () => void;
}) {
  return (
    <li className="record-item" {...sortable}>
      <div className="grading-tree-label">
        <strong>{work.name}</strong>
        <span className="record-button-meta">
          Maximum {work.maximumScore} · Weight {work.weight}
          {work.date ? ` · ${work.date}` : ""}
          {work.notes ? ` · ${work.notes}` : ""}
        </span>
      </div>
      <button
        type="button"
        className="icon-button"
        aria-label={`Edit ${work.name}`}
        disabled={disabled}
        onClick={onEdit}
      >
        <PencilIcon />
      </button>
      <button
        type="button"
        className="icon-button"
        aria-label={`Copy ${work.name}`}
        disabled={disabled}
        onClick={onCopy}
      >
        <CopyIcon />
      </button>
      <button
        type="button"
        className="icon-button icon-button--danger"
        aria-label={`Delete ${work.name}`}
        disabled={disabled}
        onClick={onDelete}
      >
        <TrashIcon />
      </button>
    </li>
  );
}

function emptyFields(): EditorFields {
  return { name: "", notes: "", date: "", weight: "1", maximumScore: "" };
}

function fieldsForEditor(editor: Editor): EditorFields {
  if (editor.kind === "edit-category") {
    return {
      name: editor.category.name,
      notes: editor.category.notes,
      date: "",
      weight: String(editor.category.weight),
      maximumScore: "",
    };
  }

  if (editor.kind === "edit-subcategory") {
    return {
      name: editor.subcategory.name,
      notes: "",
      date: "",
      weight: String(editor.subcategory.weight),
      maximumScore: "",
    };
  }

  if (editor.kind === "edit-work") {
    return {
      name: editor.work.name,
      notes: editor.work.notes,
      date: editor.work.date ?? "",
      weight: String(editor.work.weight),
      maximumScore: String(editor.work.maximumScore),
    };
  }

  if (editor.kind === "create-work") {
    return {
      name: "",
      notes: "",
      date: "",
      weight: "1",
      maximumScore: "",
    };
  }

  return emptyFields();
}

function showsNotes(editor: Editor | null): boolean {
  return (
    editor?.kind === "create-category" ||
    editor?.kind === "edit-category" ||
    editor?.kind === "create-work" ||
    editor?.kind === "edit-work"
  );
}

function showsMaximumScore(editor: Editor | null): boolean {
  return editor?.kind === "create-work" || editor?.kind === "edit-work";
}

function editorTitle(editor: Editor | null): string {
  switch (editor?.kind) {
    case "create-category":
      return "Add category";
    case "edit-category":
      return "Edit category";
    case "create-subcategory":
      return "Add sub-category";
    case "edit-subcategory":
      return "Edit sub-category";
    case "create-work":
      return "Add work";
    case "edit-work":
      return "Edit work";
    default:
      return "Assessment";
  }
}

function deleteTitle(pending: PendingDelete | null): string {
  if (pending?.kind === "subcategory") {
    return "Delete sub-category";
  }

  if (pending?.kind === "work") {
    return "Delete work";
  }

  return "Delete category";
}

function deletePrompt(pending: PendingDelete | null): string {
  const name = pending?.item.name ?? "this item";

  if (pending?.kind === "category") {
    return `This will delete ${name} and every sub-category, work, and mark under it. Type the category name to confirm.`;
  }

  if (pending?.kind === "subcategory") {
    return `This will delete ${name} and every piece of work and mark under it. Type the sub-category name to confirm.`;
  }

  return `This will delete ${name} and every mark for it. Type the work name to confirm.`;
}

async function saveEditor(
  editor: Editor,
  fields: EditorFields,
  schoolYearName: string,
  classInternalName: string,
): Promise<void> {
  const name = fields.name;
  const weight = parseRequiredNumber(fields.weight, "A weight is required.");

  if (editor.kind === "create-category") {
    await createCategory({
      schoolYearName,
      internalName: classInternalName,
      name,
      notes: fields.notes,
      weight,
    });
    return;
  }

  if (editor.kind === "edit-category") {
    await updateCategory({
      id: editor.category.id,
      name,
      notes: fields.notes,
      weight,
    });
    return;
  }

  if (editor.kind === "create-subcategory") {
    await createSubcategory({
      categoryId: editor.categoryId,
      name,
      weight,
    });
    return;
  }

  if (editor.kind === "edit-subcategory") {
    await updateSubcategory({
      id: editor.subcategory.id,
      name,
      weight,
    });
    return;
  }

  const maximumScore = parseRequiredNumber(fields.maximumScore, "A maximum score is required.");

  if (editor.kind === "create-work") {
    await createWork({
      ...("categoryId" in editor
        ? { categoryId: editor.categoryId }
        : { subcategoryId: editor.subcategoryId }),
      name,
      notes: fields.notes,
      date: fields.date,
      maximumScore,
      weight,
    });
    return;
  }

  await updateWork({
    id: editor.work.id,
    name,
    notes: fields.notes,
    date: fields.date,
    maximumScore,
    weight,
  });
}

async function copyItem(kind: PendingDelete["kind"], id: number): Promise<void> {
  if (kind === "category") {
    await copyCategory({ id });
    return;
  }

  if (kind === "subcategory") {
    await copySubcategory({ id });
    return;
  }

  await copyWork({ id });
}

async function deletePending(pending: PendingDelete): Promise<void> {
  if (pending.kind === "category") {
    await deleteCategory({ id: pending.item.id });
    return;
  }

  if (pending.kind === "subcategory") {
    await deleteSubcategory({ id: pending.item.id });
    return;
  }

  await deleteWork({ id: pending.item.id });
}
