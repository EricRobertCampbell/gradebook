import {
  adjustmentPath,
  assessmentAdjustmentsPath,
  categoryCopyPath,
  categoryPath,
  categorySubcategoriesPath,
  classCategoriesPath,
  classGradebookPath,
  classGradingStructurePath,
  subcategoryCopyPath,
  subcategoryPath,
  subcategoryWorksPath,
  workCopyPath,
  workPath,
  workStudentAssessmentPath,
} from "../shared/development-api";
import {
  adjustmentCreateInputSchema,
  adjustmentSchema,
  adjustmentUpdateInputSchema,
  assessmentLookupInputSchema,
  assessmentSchema,
  assessmentUpsertInputSchema,
  categoryCreateInputSchema,
  categorySchema,
  categoryUpdateInputSchema,
  classGradebookSchema,
  classGradingStructureSchema,
  classLookupInputSchema,
  deleteResultSchema,
  recordIdInputSchema,
  subcategoryCreateInputSchema,
  subcategorySchema,
  subcategoryUpdateInputSchema,
  workCreateInputSchema,
  workSchema,
  workUpdateInputSchema,
  type Adjustment,
  type AdjustmentCreateInput,
  type AdjustmentUpdateInput,
  type Assessment,
  type AssessmentLookupInput,
  type AssessmentUpsertInput,
  type Category,
  type CategoryCreateInput,
  type CategoryUpdateInput,
  type ClassGradebook,
  type ClassGradingStructure,
  type ClassLookupInput,
  type DeleteResult,
  type RecordIdInput,
  type Subcategory,
  type SubcategoryCreateInput,
  type SubcategoryUpdateInput,
  type Work,
  type WorkCreateInput,
  type WorkUpdateInput,
} from "../shared/ipc";
import { requestDevelopmentApi } from "./development-request";

export async function getGradingStructure(
  input: ClassLookupInput,
): Promise<ClassGradingStructure> {
  const lookup = parseLookup(input);

  if (hasPreloadGradingApi() && window.gradebook) {
    return window.gradebook.grading.getStructure(lookup);
  }

  return classGradingStructureSchema.parse(
    await requestDevelopmentApi(
      classGradingStructurePath(lookup.schoolYearName, lookup.internalName),
      undefined,
      "The assessment setup could not be loaded.",
    ),
  );
}

export async function getClassGradebook(input: ClassLookupInput): Promise<ClassGradebook> {
  const lookup = parseLookup(input);

  if (hasPreloadGradingApi() && window.gradebook) {
    return window.gradebook.grading.getGradebook(lookup);
  }

  return classGradebookSchema.parse(
    await requestDevelopmentApi(
      classGradebookPath(lookup.schoolYearName, lookup.internalName),
      undefined,
      "The gradebook could not be loaded.",
    ),
  );
}

export async function createCategory(input: CategoryCreateInput): Promise<Category> {
  const parsed = parseWith(categoryCreateInputSchema, input, "The category could not be created.");

  if (hasPreloadGradingApi() && window.gradebook) {
    return window.gradebook.categories.create(parsed);
  }

  return categorySchema.parse(
    await requestDevelopmentApi(
      classCategoriesPath(parsed.schoolYearName, parsed.internalName),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: parsed.name,
          notes: parsed.notes,
          weight: parsed.weight,
        }),
      },
      "The category could not be created.",
    ),
  );
}

export async function updateCategory(input: CategoryUpdateInput): Promise<Category> {
  const parsed = parseWith(categoryUpdateInputSchema, input, "The category could not be updated.");

  if (hasPreloadGradingApi() && window.gradebook) {
    return window.gradebook.categories.update(parsed);
  }

  return categorySchema.parse(
    await requestDevelopmentApi(
      categoryPath(parsed.id),
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: parsed.name,
          notes: parsed.notes,
          weight: parsed.weight,
        }),
      },
      "The category could not be updated.",
    ),
  );
}

export async function deleteCategory(input: RecordIdInput): Promise<DeleteResult> {
  const parsed = parseWith(recordIdInputSchema, input, "That category was not found.");

  if (hasPreloadGradingApi() && window.gradebook) {
    return window.gradebook.categories.delete(parsed);
  }

  return deleteResultSchema.parse(
    await requestDevelopmentApi(
      categoryPath(parsed.id),
      { method: "DELETE" },
      "The category could not be deleted.",
    ),
  );
}

export async function copyCategory(input: RecordIdInput): Promise<Category> {
  const parsed = parseWith(recordIdInputSchema, input, "That category was not found.");

  if (hasPreloadGradingApi() && window.gradebook) {
    return window.gradebook.categories.copy(parsed);
  }

  return categorySchema.parse(
    await requestDevelopmentApi(
      categoryCopyPath(parsed.id),
      { method: "POST" },
      "The category could not be copied.",
    ),
  );
}

export async function createSubcategory(input: SubcategoryCreateInput): Promise<Subcategory> {
  const parsed = parseWith(
    subcategoryCreateInputSchema,
    input,
    "The sub-category could not be created.",
  );

  if (hasPreloadGradingApi() && window.gradebook) {
    return window.gradebook.subcategories.create(parsed);
  }

  return subcategorySchema.parse(
    await requestDevelopmentApi(
      categorySubcategoriesPath(parsed.categoryId),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: parsed.name,
          weight: parsed.weight,
        }),
      },
      "The sub-category could not be created.",
    ),
  );
}

export async function updateSubcategory(input: SubcategoryUpdateInput): Promise<Subcategory> {
  const parsed = parseWith(
    subcategoryUpdateInputSchema,
    input,
    "The sub-category could not be updated.",
  );

  if (hasPreloadGradingApi() && window.gradebook) {
    return window.gradebook.subcategories.update(parsed);
  }

  return subcategorySchema.parse(
    await requestDevelopmentApi(
      subcategoryPath(parsed.id),
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: parsed.name,
          weight: parsed.weight,
        }),
      },
      "The sub-category could not be updated.",
    ),
  );
}

export async function deleteSubcategory(input: RecordIdInput): Promise<DeleteResult> {
  const parsed = parseWith(recordIdInputSchema, input, "That sub-category was not found.");

  if (hasPreloadGradingApi() && window.gradebook) {
    return window.gradebook.subcategories.delete(parsed);
  }

  return deleteResultSchema.parse(
    await requestDevelopmentApi(
      subcategoryPath(parsed.id),
      { method: "DELETE" },
      "The sub-category could not be deleted.",
    ),
  );
}

export async function copySubcategory(input: RecordIdInput): Promise<Subcategory> {
  const parsed = parseWith(recordIdInputSchema, input, "That sub-category was not found.");

  if (hasPreloadGradingApi() && window.gradebook) {
    return window.gradebook.subcategories.copy(parsed);
  }

  return subcategorySchema.parse(
    await requestDevelopmentApi(
      subcategoryCopyPath(parsed.id),
      { method: "POST" },
      "The sub-category could not be copied.",
    ),
  );
}

export async function createWork(input: WorkCreateInput): Promise<Work> {
  const parsed = parseWith(workCreateInputSchema, input, "The work could not be created.");

  if (hasPreloadGradingApi() && window.gradebook) {
    return window.gradebook.works.create(parsed);
  }

  return workSchema.parse(
    await requestDevelopmentApi(
      subcategoryWorksPath(parsed.subcategoryId),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: parsed.name,
          notes: parsed.notes,
          maximumScore: parsed.maximumScore,
          weight: parsed.weight,
        }),
      },
      "The work could not be created.",
    ),
  );
}

export async function updateWork(input: WorkUpdateInput): Promise<Work> {
  const parsed = parseWith(workUpdateInputSchema, input, "The work could not be updated.");

  if (hasPreloadGradingApi() && window.gradebook) {
    return window.gradebook.works.update(parsed);
  }

  return workSchema.parse(
    await requestDevelopmentApi(
      workPath(parsed.id),
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: parsed.name,
          notes: parsed.notes,
          maximumScore: parsed.maximumScore,
          weight: parsed.weight,
        }),
      },
      "The work could not be updated.",
    ),
  );
}

export async function deleteWork(input: RecordIdInput): Promise<DeleteResult> {
  const parsed = parseWith(recordIdInputSchema, input, "That work was not found.");

  if (hasPreloadGradingApi() && window.gradebook) {
    return window.gradebook.works.delete(parsed);
  }

  return deleteResultSchema.parse(
    await requestDevelopmentApi(workPath(parsed.id), { method: "DELETE" }, "The work could not be deleted."),
  );
}

export async function copyWork(input: RecordIdInput): Promise<Work> {
  const parsed = parseWith(recordIdInputSchema, input, "That work was not found.");

  if (hasPreloadGradingApi() && window.gradebook) {
    return window.gradebook.works.copy(parsed);
  }

  return workSchema.parse(
    await requestDevelopmentApi(
      workCopyPath(parsed.id),
      { method: "POST" },
      "The work could not be copied.",
    ),
  );
}

export async function upsertAssessment(input: AssessmentUpsertInput): Promise<Assessment> {
  const parsed = parseWith(
    assessmentUpsertInputSchema,
    input,
    "The assessment could not be saved.",
  );

  if (hasPreloadGradingApi() && window.gradebook) {
    return window.gradebook.assessments.upsert(parsed);
  }

  return assessmentSchema.parse(
    await requestDevelopmentApi(
      workStudentAssessmentPath(parsed.workId, parsed.studentId),
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score: parsed.score,
          date: parsed.date,
          weight: parsed.weight,
          notes: parsed.notes,
          status: parsed.status,
        }),
      },
      "The assessment could not be saved.",
    ),
  );
}

export async function deleteAssessment(input: AssessmentLookupInput): Promise<DeleteResult> {
  const parsed = parseWith(
    assessmentLookupInputSchema,
    input,
    "That assessment was not found.",
  );

  if (hasPreloadGradingApi() && window.gradebook) {
    return window.gradebook.assessments.delete(parsed);
  }

  return deleteResultSchema.parse(
    await requestDevelopmentApi(
      workStudentAssessmentPath(parsed.workId, parsed.studentId),
      { method: "DELETE" },
      "The assessment could not be deleted.",
    ),
  );
}

export async function createAdjustment(input: AdjustmentCreateInput): Promise<Adjustment> {
  const parsed = parseWith(
    adjustmentCreateInputSchema,
    input,
    "The adjustment could not be created.",
  );

  if (hasPreloadGradingApi() && window.gradebook) {
    return window.gradebook.adjustments.create(parsed);
  }

  return adjustmentSchema.parse(
    await requestDevelopmentApi(
      assessmentAdjustmentsPath(parsed.assessmentId),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          percentChange: parsed.percentChange,
          rawChange: parsed.rawChange,
          description: parsed.description,
          notes: parsed.notes,
        }),
      },
      "The adjustment could not be created.",
    ),
  );
}

export async function updateAdjustment(input: AdjustmentUpdateInput): Promise<Adjustment> {
  const parsed = parseWith(
    adjustmentUpdateInputSchema,
    input,
    "The adjustment could not be updated.",
  );

  if (hasPreloadGradingApi() && window.gradebook) {
    return window.gradebook.adjustments.update(parsed);
  }

  return adjustmentSchema.parse(
    await requestDevelopmentApi(
      adjustmentPath(parsed.id),
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          percentChange: parsed.percentChange,
          rawChange: parsed.rawChange,
          description: parsed.description,
          notes: parsed.notes,
        }),
      },
      "The adjustment could not be updated.",
    ),
  );
}

export async function deleteAdjustment(input: RecordIdInput): Promise<DeleteResult> {
  const parsed = parseWith(recordIdInputSchema, input, "That adjustment was not found.");

  if (hasPreloadGradingApi() && window.gradebook) {
    return window.gradebook.adjustments.delete(parsed);
  }

  return deleteResultSchema.parse(
    await requestDevelopmentApi(
      adjustmentPath(parsed.id),
      { method: "DELETE" },
      "The adjustment could not be deleted.",
    ),
  );
}

function hasPreloadGradingApi(): boolean {
  return typeof window.gradebook?.grading?.getGradebook === "function";
}

function parseLookup(input: ClassLookupInput): ClassLookupInput {
  return parseWith(classLookupInputSchema, input, "That class was not found.");
}

function parseWith<T>(
  schema: { safeParse: (input: unknown) => { success: true; data: T } | { success: false; error: { issues: Array<{ message: string }> } } },
  input: unknown,
  fallback: string,
): T {
  const result = schema.safeParse(input);

  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? fallback);
  }

  return result.data;
}
