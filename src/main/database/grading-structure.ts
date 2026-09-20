import { and, asc, eq, inArray, or } from "drizzle-orm";
import {
  categoryCreateInputSchema,
  categoryReorderChildrenInputSchema,
  categoryReorderInputSchema,
  categoryUpdateInputSchema,
  classLookupInputSchema,
  recordIdInputSchema,
  subcategoryCreateInputSchema,
  subcategoryReorderWorksInputSchema,
  subcategoryUpdateInputSchema,
  workCreateInputSchema,
  workUpdateInputSchema,
  type Category,
  type CategoryCreateInput,
  type CategoryReorderChildrenInput,
  type CategoryReorderInput,
  type CategoryUpdateInput,
  type ClassGradingStructure,
  type ClassLookupInput,
  type DeleteResult,
  type GradeCategory,
  type RecordIdInput,
  type ReorderResult,
  type Subcategory,
  type SubcategoryCreateInput,
  type SubcategoryReorderWorksInput,
  type SubcategoryUpdateInput,
  type Work,
  type WorkCreateInput,
  type WorkUpdateInput,
} from "../../shared/ipc";
import { uniqueCopyName } from "../../shared/copy-name";
import { nextSortOrder, sameIdSet, sortCategoryChildren } from "../../shared/grading-order";
import { getClass } from "./classes";
import { categories, classStudents, subcategories, works } from "./schema";
import type { GradebookDatabase } from "./status";

export async function getGradingStructure(
  db: GradebookDatabase,
  input: ClassLookupInput,
): Promise<ClassGradingStructure> {
  const schoolClass = await getClass(db, parseLookupInput(input));
  return loadGradingStructure(db, schoolClass.id);
}

export async function loadGradingStructure(
  db: GradebookDatabase,
  classId: number,
): Promise<ClassGradingStructure> {
  const categoryRows = await db
    .select()
    .from(categories)
    .where(eq(categories.classId, classId))
    .orderBy(asc(categories.sortOrder), asc(categories.id));
  const categoryIds = categoryRows.map((row) => row.id);
  const subcategoryRows =
    categoryIds.length === 0
      ? []
      : await db
          .select()
          .from(subcategories)
          .where(inArray(subcategories.categoryId, categoryIds))
          .orderBy(asc(subcategories.sortOrder), asc(subcategories.id));
  const subcategoryIds = subcategoryRows.map((row) => row.id);
  const workFilters = [
    ...(categoryIds.length > 0 ? [inArray(works.categoryId, categoryIds)] : []),
    ...(subcategoryIds.length > 0 ? [inArray(works.subcategoryId, subcategoryIds)] : []),
  ];
  const workRows =
    workFilters.length === 0
      ? []
      : await db
          .select()
          .from(works)
          .where(or(...workFilters))
          .orderBy(asc(works.sortOrder), asc(works.id));

  return {
    categories: categoryRows.map((category) => ({
      ...category,
      works: workRows.filter((work) => work.categoryId === category.id),
      subcategories: subcategoryRows
        .filter((subcategory) => subcategory.categoryId === category.id)
        .map((subcategory) => ({
          ...subcategory,
          works: workRows.filter((work) => work.subcategoryId === subcategory.id),
        })),
    })),
  };
}

export async function createCategory(
  db: GradebookDatabase,
  input: CategoryCreateInput,
): Promise<Category> {
  const parsed = parseCategoryCreate(input);
  const schoolClass = await getClass(db, {
    schoolYearName: parsed.schoolYearName,
    internalName: parsed.internalName,
  });
  const created = await db
    .insert(categories)
    .values({
      classId: schoolClass.id,
      name: parsed.name,
      notes: parsed.notes,
      weight: parsed.weight,
      sortOrder: await nextCategorySortOrder(db, schoolClass.id),
    })
    .returning();
  const category = created[0];

  if (!category) {
    throw new Error("The category could not be created.");
  }

  return category;
}

export async function updateCategory(
  db: GradebookDatabase,
  input: CategoryUpdateInput,
): Promise<Category> {
  const parsed = parseCategoryUpdate(input);
  await requireCategory(db, parsed.id);
  const updated = await db
    .update(categories)
    .set({
      name: parsed.name,
      notes: parsed.notes,
      weight: parsed.weight,
    })
    .where(eq(categories.id, parsed.id))
    .returning();
  const category = updated[0];

  if (!category) {
    throw new Error("The category could not be updated.");
  }

  return category;
}

export async function deleteCategory(
  db: GradebookDatabase,
  input: RecordIdInput,
): Promise<DeleteResult> {
  const categoryId = parseRecordId(input, "That category was not found.").id;
  const deleted = await db.delete(categories).where(eq(categories.id, categoryId)).returning();

  if (!deleted[0]) {
    throw new Error("That category was not found.");
  }

  return { deleted: true };
}

export async function createSubcategory(
  db: GradebookDatabase,
  input: SubcategoryCreateInput,
): Promise<Subcategory> {
  const parsed = parseSubcategoryCreate(input);
  await requireCategory(db, parsed.categoryId);
  const created = await db
    .insert(subcategories)
    .values({
      categoryId: parsed.categoryId,
      name: parsed.name,
      weight: parsed.weight,
      sortOrder: await nextCategoryChildSortOrder(db, parsed.categoryId),
    })
    .returning();
  const subcategory = created[0];

  if (!subcategory) {
    throw new Error("The sub-category could not be created.");
  }

  return subcategory;
}

export async function updateSubcategory(
  db: GradebookDatabase,
  input: SubcategoryUpdateInput,
): Promise<Subcategory> {
  const parsed = parseSubcategoryUpdate(input);
  await requireSubcategory(db, parsed.id);
  const updated = await db
    .update(subcategories)
    .set({
      name: parsed.name,
      weight: parsed.weight,
    })
    .where(eq(subcategories.id, parsed.id))
    .returning();
  const subcategory = updated[0];

  if (!subcategory) {
    throw new Error("The sub-category could not be updated.");
  }

  return subcategory;
}

export async function deleteSubcategory(
  db: GradebookDatabase,
  input: RecordIdInput,
): Promise<DeleteResult> {
  const subcategoryId = parseRecordId(input, "That sub-category was not found.").id;
  const deleted = await db
    .delete(subcategories)
    .where(eq(subcategories.id, subcategoryId))
    .returning();

  if (!deleted[0]) {
    throw new Error("That sub-category was not found.");
  }

  return { deleted: true };
}

export async function createWork(db: GradebookDatabase, input: WorkCreateInput): Promise<Work> {
  const parsed = parseWorkCreate(input);
  await requireWorkParent(db, parsed);
  const created = await db
    .insert(works)
    .values({
      categoryId: parsed.categoryId ?? null,
      subcategoryId: parsed.subcategoryId ?? null,
      name: parsed.name,
      notes: parsed.notes,
      date: parsed.date ? parsed.date : null,
      maximumScore: parsed.maximumScore,
      weight: parsed.weight,
      sortOrder: await nextWorkSortOrder(db, parsed),
    })
    .returning();
  const work = created[0];

  if (!work) {
    throw new Error("The work could not be created.");
  }

  return parseStoredWork(work);
}

export async function updateWork(db: GradebookDatabase, input: WorkUpdateInput): Promise<Work> {
  const parsed = parseWorkUpdate(input);
  await requireWork(db, parsed.id);
  const updated = await db
    .update(works)
    .set({
      name: parsed.name,
      notes: parsed.notes,
      date: parsed.date ? parsed.date : null,
      maximumScore: parsed.maximumScore,
      weight: parsed.weight,
    })
    .where(eq(works.id, parsed.id))
    .returning();
  const work = updated[0];

  if (!work) {
    throw new Error("The work could not be updated.");
  }

  return parseStoredWork(work);
}

export async function deleteWork(
  db: GradebookDatabase,
  input: RecordIdInput,
): Promise<DeleteResult> {
  const workId = parseRecordId(input, "That work was not found.").id;
  const deleted = await db.delete(works).where(eq(works.id, workId)).returning();

  if (!deleted[0]) {
    throw new Error("That work was not found.");
  }

  return { deleted: true };
}

export async function copyCategory(db: GradebookDatabase, input: RecordIdInput): Promise<Category> {
  const category = await requireCategory(
    db,
    parseRecordId(input, "That category was not found.").id,
  );
  const siblingNames = (
    await db
      .select({ name: categories.name })
      .from(categories)
      .where(eq(categories.classId, category.classId))
  ).map((row) => row.name);
  const created = await db
    .insert(categories)
    .values({
      classId: category.classId,
      name: uniqueCopyName(category.name, siblingNames),
      notes: category.notes,
      weight: category.weight,
      sortOrder: await nextCategorySortOrder(db, category.classId),
    })
    .returning();
  const copy = created[0];

  if (!copy) {
    throw new Error("The category could not be copied.");
  }

  const sourceSubcategories = await db
    .select()
    .from(subcategories)
    .where(eq(subcategories.categoryId, category.id))
    .orderBy(asc(subcategories.sortOrder), asc(subcategories.id));

  for (const subcategory of sourceSubcategories) {
    await duplicateSubcategory(db, subcategory, copy.id, subcategory.name);
  }

  const sourceWorks = await db
    .select()
    .from(works)
    .where(eq(works.categoryId, category.id))
    .orderBy(asc(works.sortOrder), asc(works.id));

  for (const work of sourceWorks) {
    await db.insert(works).values({
      categoryId: copy.id,
      subcategoryId: null,
      name: work.name,
      notes: work.notes,
      date: work.date,
      maximumScore: work.maximumScore,
      weight: work.weight,
      sortOrder: work.sortOrder,
    });
  }

  return copy;
}

export async function copySubcategory(
  db: GradebookDatabase,
  input: RecordIdInput,
): Promise<Subcategory> {
  const subcategory = await requireSubcategory(
    db,
    parseRecordId(input, "That sub-category was not found.").id,
  );
  const siblingNames = (
    await db
      .select({ name: subcategories.name })
      .from(subcategories)
      .where(eq(subcategories.categoryId, subcategory.categoryId))
  ).map((row) => row.name);

  return duplicateSubcategory(
    db,
    subcategory,
    subcategory.categoryId,
    uniqueCopyName(subcategory.name, siblingNames),
  );
}

export async function copyWork(db: GradebookDatabase, input: RecordIdInput): Promise<Work> {
  const work = await requireWork(db, parseRecordId(input, "That work was not found.").id);
  const siblingFilter =
    work.categoryId != null
      ? eq(works.categoryId, work.categoryId)
      : eq(works.subcategoryId, work.subcategoryId ?? 0);
  const siblingNames = (await db.select({ name: works.name }).from(works).where(siblingFilter)).map(
    (row) => row.name,
  );
  const created = await db
    .insert(works)
    .values({
      categoryId: work.categoryId,
      subcategoryId: work.subcategoryId,
      name: uniqueCopyName(work.name, siblingNames),
      notes: work.notes,
      date: work.date,
      maximumScore: work.maximumScore,
      weight: work.weight,
      sortOrder: await nextWorkSortOrder(db, work),
    })
    .returning();
  const copy = created[0];

  if (!copy) {
    throw new Error("The work could not be copied.");
  }

  return parseStoredWork(copy);
}

export async function reorderCategories(
  db: GradebookDatabase,
  input: CategoryReorderInput,
): Promise<ReorderResult> {
  const parsed = parseCategoryReorder(input);
  const schoolClass = await getClass(db, {
    schoolYearName: parsed.schoolYearName,
    internalName: parsed.internalName,
  });
  const currentIds = (
    await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.classId, schoolClass.id))
  ).map((row) => row.id);

  if (!sameIdSet(currentIds, parsed.orderedIds)) {
    throw new Error("Those categories could not be reordered.");
  }

  for (const [index, id] of parsed.orderedIds.entries()) {
    await db.update(categories).set({ sortOrder: index }).where(eq(categories.id, id));
  }

  return { reordered: true };
}

export async function reorderCategoryChildren(
  db: GradebookDatabase,
  input: CategoryReorderChildrenInput,
): Promise<ReorderResult> {
  const parsed = parseCategoryReorderChildren(input);
  await requireCategory(db, parsed.categoryId);
  const subcategoryRows = await db
    .select({ id: subcategories.id, sortOrder: subcategories.sortOrder })
    .from(subcategories)
    .where(eq(subcategories.categoryId, parsed.categoryId));
  const workRows = await db
    .select({ id: works.id, sortOrder: works.sortOrder })
    .from(works)
    .where(eq(works.categoryId, parsed.categoryId));
  const current = sortCategoryChildren(subcategoryRows, workRows).map((child) => ({
    kind: child.kind,
    id: child.item.id,
  }));

  if (!sameCategoryChildren(current, parsed.items)) {
    throw new Error("Those items could not be reordered.");
  }

  for (const [index, item] of parsed.items.entries()) {
    if (item.kind === "subcategory") {
      await db.update(subcategories).set({ sortOrder: index }).where(eq(subcategories.id, item.id));
    } else {
      await db.update(works).set({ sortOrder: index }).where(eq(works.id, item.id));
    }
  }

  return { reordered: true };
}

export async function reorderSubcategoryWorks(
  db: GradebookDatabase,
  input: SubcategoryReorderWorksInput,
): Promise<ReorderResult> {
  const parsed = parseSubcategoryReorderWorks(input);
  await requireSubcategory(db, parsed.subcategoryId);
  const currentIds = (
    await db
      .select({ id: works.id })
      .from(works)
      .where(eq(works.subcategoryId, parsed.subcategoryId))
  ).map((row) => row.id);

  if (!sameIdSet(currentIds, parsed.orderedIds)) {
    throw new Error("Those pieces of work could not be reordered.");
  }

  for (const [index, id] of parsed.orderedIds.entries()) {
    await db.update(works).set({ sortOrder: index }).where(eq(works.id, id));
  }

  return { reordered: true };
}

export async function requireCategory(
  db: GradebookDatabase,
  categoryId: number,
): Promise<Category> {
  const rows = await db.select().from(categories).where(eq(categories.id, categoryId)).limit(1);
  const category = rows[0];

  if (!category) {
    throw new Error("That category was not found.");
  }

  return category;
}

export async function requireSubcategory(
  db: GradebookDatabase,
  subcategoryId: number,
): Promise<Subcategory> {
  const rows = await db
    .select()
    .from(subcategories)
    .where(eq(subcategories.id, subcategoryId))
    .limit(1);
  const subcategory = rows[0];

  if (!subcategory) {
    throw new Error("That sub-category was not found.");
  }

  return subcategory;
}

export async function requireWork(db: GradebookDatabase, workId: number): Promise<Work> {
  const rows = await db.select().from(works).where(eq(works.id, workId)).limit(1);
  const work = rows[0];

  if (!work) {
    throw new Error("That work was not found.");
  }

  return parseStoredWork(work);
}

export async function requireWorkInClass(
  db: GradebookDatabase,
  workId: number,
  studentId: number,
): Promise<{ work: Work; classId: number }> {
  const work = await requireWork(db, workId);
  const category = await categoryForWork(db, work);
  const enrolment = await db
    .select()
    .from(classStudents)
    .where(and(eq(classStudents.classId, category.classId), eq(classStudents.studentId, studentId)))
    .limit(1);

  if (!enrolment[0]) {
    throw new Error("That student is not in this class.");
  }

  return { work, classId: category.classId };
}

export function flattenWorks(structure: ClassGradingStructure): Array<Work> {
  return structure.categories.flatMap((category: GradeCategory) => [
    ...category.works,
    ...category.subcategories.flatMap((subcategory) => subcategory.works),
  ]);
}

async function duplicateSubcategory(
  db: GradebookDatabase,
  source: Subcategory,
  categoryId: number,
  name: string,
): Promise<Subcategory> {
  const created = await db
    .insert(subcategories)
    .values({
      categoryId,
      name,
      weight: source.weight,
      sortOrder:
        categoryId === source.categoryId
          ? await nextCategoryChildSortOrder(db, categoryId)
          : source.sortOrder,
    })
    .returning();
  const subcategory = created[0];

  if (!subcategory) {
    throw new Error("The sub-category could not be copied.");
  }

  const sourceWorks = await db
    .select()
    .from(works)
    .where(eq(works.subcategoryId, source.id))
    .orderBy(asc(works.sortOrder), asc(works.id));

  for (const work of sourceWorks) {
    await db.insert(works).values({
      categoryId: null,
      subcategoryId: subcategory.id,
      name: work.name,
      notes: work.notes,
      date: work.date,
      maximumScore: work.maximumScore,
      weight: work.weight,
      sortOrder: work.sortOrder,
    });
  }

  return subcategory;
}

async function nextCategorySortOrder(db: GradebookDatabase, classId: number): Promise<number> {
  const rows = await db
    .select({ sortOrder: categories.sortOrder })
    .from(categories)
    .where(eq(categories.classId, classId));
  return nextSortOrder(rows.map((row) => row.sortOrder));
}

async function nextCategoryChildSortOrder(
  db: GradebookDatabase,
  categoryId: number,
): Promise<number> {
  const subcategoryRows = await db
    .select({ sortOrder: subcategories.sortOrder })
    .from(subcategories)
    .where(eq(subcategories.categoryId, categoryId));
  const workRows = await db
    .select({ sortOrder: works.sortOrder })
    .from(works)
    .where(eq(works.categoryId, categoryId));
  return nextSortOrder([
    ...subcategoryRows.map((row) => row.sortOrder),
    ...workRows.map((row) => row.sortOrder),
  ]);
}

async function nextWorkSortOrder(
  db: GradebookDatabase,
  work: { categoryId?: number | null; subcategoryId?: number | null },
): Promise<number> {
  if (work.categoryId != null) {
    return nextCategoryChildSortOrder(db, work.categoryId);
  }

  if (work.subcategoryId == null) {
    return 0;
  }

  const rows = await db
    .select({ sortOrder: works.sortOrder })
    .from(works)
    .where(eq(works.subcategoryId, work.subcategoryId));
  return nextSortOrder(rows.map((row) => row.sortOrder));
}

function sameCategoryChildren(
  left: Array<{ kind: "subcategory" | "work"; id: number }>,
  right: Array<{ kind: "subcategory" | "work"; id: number }>,
): boolean {
  if (left.length !== right.length) {
    return false;
  }

  const remaining = [...right];

  for (const item of left) {
    const index = remaining.findIndex(
      (candidate) => candidate.kind === item.kind && candidate.id === item.id,
    );

    if (index < 0) {
      return false;
    }

    remaining.splice(index, 1);
  }

  return remaining.length === 0;
}

function parseCategoryReorder(input: CategoryReorderInput): CategoryReorderInput {
  const result = categoryReorderInputSchema.safeParse(input);

  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "Those categories could not be reordered.");
  }

  return result.data;
}

function parseCategoryReorderChildren(
  input: CategoryReorderChildrenInput,
): CategoryReorderChildrenInput {
  const result = categoryReorderChildrenInputSchema.safeParse(input);

  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "Those items could not be reordered.");
  }

  return result.data;
}

function parseSubcategoryReorderWorks(
  input: SubcategoryReorderWorksInput,
): SubcategoryReorderWorksInput {
  const result = subcategoryReorderWorksInputSchema.safeParse(input);

  if (!result.success) {
    throw new Error(
      result.error.issues[0]?.message ?? "Those pieces of work could not be reordered.",
    );
  }

  return result.data;
}

function parseLookupInput(input: ClassLookupInput): ClassLookupInput {
  const result = classLookupInputSchema.safeParse(input);

  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "That class was not found.");
  }

  return result.data;
}

function parseRecordId(input: RecordIdInput, fallback: string): RecordIdInput {
  const result = recordIdInputSchema.safeParse(input);

  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? fallback);
  }

  return result.data;
}

function parseCategoryCreate(input: CategoryCreateInput): CategoryCreateInput {
  const result = categoryCreateInputSchema.safeParse(input);

  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "The category could not be created.");
  }

  return result.data;
}

function parseCategoryUpdate(input: CategoryUpdateInput): CategoryUpdateInput {
  const result = categoryUpdateInputSchema.safeParse(input);

  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "The category could not be updated.");
  }

  return result.data;
}

function parseSubcategoryCreate(input: SubcategoryCreateInput): SubcategoryCreateInput {
  const result = subcategoryCreateInputSchema.safeParse(input);

  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "The sub-category could not be created.");
  }

  return result.data;
}

function parseSubcategoryUpdate(input: SubcategoryUpdateInput): SubcategoryUpdateInput {
  const result = subcategoryUpdateInputSchema.safeParse(input);

  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "The sub-category could not be updated.");
  }

  return result.data;
}

async function requireWorkParent(db: GradebookDatabase, input: WorkCreateInput): Promise<void> {
  if (input.categoryId != null && input.subcategoryId == null) {
    await requireCategory(db, input.categoryId);
    return;
  }

  if (input.subcategoryId != null && input.categoryId == null) {
    await requireSubcategory(db, input.subcategoryId);
    return;
  }

  throw new Error("Work must belong to a category or a sub-category, but not both.");
}

async function categoryForWork(db: GradebookDatabase, work: Work): Promise<Category> {
  if (work.categoryId != null) {
    return requireCategory(db, work.categoryId);
  }

  if (work.subcategoryId == null) {
    throw new Error("Work must belong to a category or a sub-category, but not both.");
  }

  const subcategory = await requireSubcategory(db, work.subcategoryId);
  return requireCategory(db, subcategory.categoryId);
}

function parseStoredWork(row: typeof works.$inferSelect): Work {
  if ((row.categoryId == null) === (row.subcategoryId == null)) {
    throw new Error("Work must belong to a category or a sub-category, but not both.");
  }

  return row;
}

function parseWorkCreate(input: WorkCreateInput): WorkCreateInput {
  const result = workCreateInputSchema.safeParse(input);

  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "The work could not be created.");
  }

  return result.data;
}

function parseWorkUpdate(input: WorkUpdateInput): WorkUpdateInput {
  const result = workUpdateInputSchema.safeParse(input);

  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "The work could not be updated.");
  }

  return result.data;
}
