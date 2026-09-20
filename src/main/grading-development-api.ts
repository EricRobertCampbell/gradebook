import {
  adjustmentSchema,
  assessmentSchema,
  categorySchema,
  classGradebookSchema,
  classGradingStructureSchema,
  deleteResultSchema,
  reorderResultSchema,
  subcategorySchema,
  workSchema,
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
  type CategoryReorderInput,
  type CategoryReorderChildrenInput,
  type SubcategoryReorderWorksInput,
  type ReorderResult,
} from "../shared/ipc";
import {
  DEVELOPMENT_API_ADJUSTMENTS_PATH,
  DEVELOPMENT_API_ASSESSMENTS_PATH,
  DEVELOPMENT_API_CATEGORIES_PATH,
  DEVELOPMENT_API_SUBCATEGORIES_PATH,
  DEVELOPMENT_API_WORKS_PATH,
} from "../shared/development-api";
import { unknownRecord } from "../shared/unknown-record";
import type { DevelopmentApiResponse } from "./development-api";

export type GradingDevelopmentApiHandlers = {
  getGradingStructure: (input: ClassLookupInput) => Promise<ClassGradingStructure>;
  getClassGradebook: (input: ClassLookupInput) => Promise<ClassGradebook>;
  createCategory: (input: CategoryCreateInput) => Promise<Category>;
  updateCategory: (input: CategoryUpdateInput) => Promise<Category>;
  deleteCategory: (input: RecordIdInput) => Promise<DeleteResult>;
  copyCategory: (input: RecordIdInput) => Promise<Category>;
  createSubcategory: (input: SubcategoryCreateInput) => Promise<Subcategory>;
  updateSubcategory: (input: SubcategoryUpdateInput) => Promise<Subcategory>;
  deleteSubcategory: (input: RecordIdInput) => Promise<DeleteResult>;
  copySubcategory: (input: RecordIdInput) => Promise<Subcategory>;
  createWork: (input: WorkCreateInput) => Promise<Work>;
  updateWork: (input: WorkUpdateInput) => Promise<Work>;
  deleteWork: (input: RecordIdInput) => Promise<DeleteResult>;
  copyWork: (input: RecordIdInput) => Promise<Work>;
  reorderCategories: (input: CategoryReorderInput) => Promise<ReorderResult>;
  reorderCategoryChildren: (input: CategoryReorderChildrenInput) => Promise<ReorderResult>;
  reorderSubcategoryWorks: (input: SubcategoryReorderWorksInput) => Promise<ReorderResult>;
  upsertAssessment: (input: AssessmentUpsertInput) => Promise<Assessment>;
  deleteAssessment: (input: AssessmentLookupInput) => Promise<DeleteResult>;
  createAdjustment: (input: AdjustmentCreateInput) => Promise<Adjustment>;
  updateAdjustment: (input: AdjustmentUpdateInput) => Promise<Adjustment>;
  deleteAdjustment: (input: RecordIdInput) => Promise<DeleteResult>;
};

export async function handleGradingDevelopmentApiRequest(
  options: GradingDevelopmentApiHandlers & {
    method: string;
    pathname: string;
    body?: unknown;
    classLookup?: ClassLookupInput;
    classRest?: Array<string>;
  },
): Promise<DevelopmentApiResponse | undefined> {
  if (options.classLookup && options.classRest) {
    const classResult = await handleClassGradingRoute({
      ...options,
      classLookup: options.classLookup,
      classRest: options.classRest,
    });
    if (classResult) {
      return classResult;
    }
  }

  return handleRecordGradingRoute(options);
}

async function handleClassGradingRoute(
  options: GradingDevelopmentApiHandlers & {
    method: string;
    body?: unknown;
    classLookup: ClassLookupInput;
    classRest: Array<string>;
  },
): Promise<DevelopmentApiResponse | undefined> {
  const { classLookup, classRest, method } = options;

  if (classRest.length === 1 && classRest[0] === "grading-structure" && method === "GET") {
    return {
      statusCode: 200,
      body: classGradingStructureSchema.parse(await options.getGradingStructure(classLookup)),
    };
  }

  if (classRest.length === 1 && classRest[0] === "gradebook" && method === "GET") {
    return {
      statusCode: 200,
      body: classGradebookSchema.parse(await options.getClassGradebook(classLookup)),
    };
  }

  if (classRest.length === 2 && classRest[0] === "categories" && classRest[1] === "order") {
    if (method === "PUT") {
      const record = unknownRecord(options.body, "The category order is required.");
      const orderedIds = record.orderedIds;
      if (!Array.isArray(orderedIds) || orderedIds.some((id) => typeof id !== "number")) {
        throw new Error("The category order is required.");
      }

      return {
        statusCode: 200,
        body: reorderResultSchema.parse(
          await options.reorderCategories({
            ...classLookup,
            orderedIds,
          }),
        ),
      };
    }
  }

  if (classRest.length === 1 && classRest[0] === "categories") {
    if (method === "POST") {
      return {
        statusCode: 201,
        body: categorySchema.parse(
          await options.createCategory({
            ...classLookup,
            ...readCategoryFields(options.body),
          }),
        ),
      };
    }
  }

  return undefined;
}

async function handleRecordGradingRoute(
  options: GradingDevelopmentApiHandlers & {
    method: string;
    pathname: string;
    body?: unknown;
  },
): Promise<DevelopmentApiResponse | undefined> {
  const categoryApi = idPath(options.pathname, DEVELOPMENT_API_CATEGORIES_PATH);
  if (categoryApi && categoryApi.rest.length === 0) {
    if (options.method === "PATCH") {
      return {
        statusCode: 200,
        body: categorySchema.parse(
          await options.updateCategory({
            id: categoryApi.id,
            ...readCategoryFields(options.body),
          }),
        ),
      };
    }

    if (options.method === "DELETE") {
      return {
        statusCode: 200,
        body: deleteResultSchema.parse(await options.deleteCategory({ id: categoryApi.id })),
      };
    }
  }

  if (categoryApi && categoryApi.rest.length === 1 && categoryApi.rest[0] === "copy") {
    if (options.method === "POST") {
      return {
        statusCode: 201,
        body: categorySchema.parse(await options.copyCategory({ id: categoryApi.id })),
      };
    }
  }

  if (
    categoryApi &&
    categoryApi.rest.length === 2 &&
    categoryApi.rest[0] === "children" &&
    categoryApi.rest[1] === "order" &&
    options.method === "PUT"
  ) {
    const record = unknownRecord(options.body, "The item order is required.");
    const items = record.items;
    if (!Array.isArray(items)) {
      throw new Error("The item order is required.");
    }

    return {
      statusCode: 200,
      body: reorderResultSchema.parse(
        await options.reorderCategoryChildren({
          categoryId: categoryApi.id,
          items: items.map((item) => {
            const entry = unknownRecord(item, "The item order is required.");
            if (
              (entry.kind !== "subcategory" && entry.kind !== "work") ||
              typeof entry.id !== "number"
            ) {
              throw new Error("The item order is required.");
            }

            return { kind: entry.kind, id: entry.id };
          }),
        }),
      ),
    };
  }

  if (categoryApi && categoryApi.rest.length === 1 && categoryApi.rest[0] === "subcategories") {
    if (options.method === "POST") {
      return {
        statusCode: 201,
        body: subcategorySchema.parse(
          await options.createSubcategory({
            categoryId: categoryApi.id,
            ...readSubcategoryFields(options.body),
          }),
        ),
      };
    }
  }

  if (categoryApi && categoryApi.rest.length === 1 && categoryApi.rest[0] === "works") {
    if (options.method === "POST") {
      return {
        statusCode: 201,
        body: workSchema.parse(
          await options.createWork({
            categoryId: categoryApi.id,
            ...readWorkFields(options.body),
          }),
        ),
      };
    }
  }

  const subcategoryApi = idPath(options.pathname, DEVELOPMENT_API_SUBCATEGORIES_PATH);
  if (subcategoryApi && subcategoryApi.rest.length === 0) {
    if (options.method === "PATCH") {
      return {
        statusCode: 200,
        body: subcategorySchema.parse(
          await options.updateSubcategory({
            id: subcategoryApi.id,
            ...readSubcategoryFields(options.body),
          }),
        ),
      };
    }

    if (options.method === "DELETE") {
      return {
        statusCode: 200,
        body: deleteResultSchema.parse(await options.deleteSubcategory({ id: subcategoryApi.id })),
      };
    }
  }

  if (subcategoryApi && subcategoryApi.rest.length === 1 && subcategoryApi.rest[0] === "copy") {
    if (options.method === "POST") {
      return {
        statusCode: 201,
        body: subcategorySchema.parse(await options.copySubcategory({ id: subcategoryApi.id })),
      };
    }
  }

  if (
    subcategoryApi &&
    subcategoryApi.rest.length === 2 &&
    subcategoryApi.rest[0] === "works" &&
    subcategoryApi.rest[1] === "order" &&
    options.method === "PUT"
  ) {
    const record = unknownRecord(options.body, "The work order is required.");
    const orderedIds = record.orderedIds;
    if (!Array.isArray(orderedIds) || orderedIds.some((id) => typeof id !== "number")) {
      throw new Error("The work order is required.");
    }

    return {
      statusCode: 200,
      body: reorderResultSchema.parse(
        await options.reorderSubcategoryWorks({
          subcategoryId: subcategoryApi.id,
          orderedIds,
        }),
      ),
    };
  }

  if (subcategoryApi && subcategoryApi.rest.length === 1 && subcategoryApi.rest[0] === "works") {
    if (options.method === "POST") {
      return {
        statusCode: 201,
        body: workSchema.parse(
          await options.createWork({
            subcategoryId: subcategoryApi.id,
            ...readWorkFields(options.body),
          }),
        ),
      };
    }
  }

  const workApi = idPath(options.pathname, DEVELOPMENT_API_WORKS_PATH);
  if (workApi && workApi.rest.length === 0) {
    if (options.method === "PATCH") {
      return {
        statusCode: 200,
        body: workSchema.parse(
          await options.updateWork({
            id: workApi.id,
            ...readWorkFields(options.body),
          }),
        ),
      };
    }

    if (options.method === "DELETE") {
      return {
        statusCode: 200,
        body: deleteResultSchema.parse(await options.deleteWork({ id: workApi.id })),
      };
    }
  }

  if (workApi && workApi.rest.length === 1 && workApi.rest[0] === "copy") {
    if (options.method === "POST") {
      return {
        statusCode: 201,
        body: workSchema.parse(await options.copyWork({ id: workApi.id })),
      };
    }
  }

  if (
    workApi &&
    workApi.rest.length === 3 &&
    workApi.rest[0] === "students" &&
    workApi.rest[1] &&
    workApi.rest[2] === "assessment"
  ) {
    const lookup = {
      workId: workApi.id,
      studentId: readPositiveInt(workApi.rest[1], "That student was not found."),
    };

    if (options.method === "PUT") {
      return {
        statusCode: 200,
        body: assessmentSchema.parse(
          await options.upsertAssessment({
            ...lookup,
            ...readAssessmentFields(options.body),
          }),
        ),
      };
    }

    if (options.method === "DELETE") {
      return {
        statusCode: 200,
        body: deleteResultSchema.parse(await options.deleteAssessment(lookup)),
      };
    }
  }

  const assessmentApi = idPath(options.pathname, DEVELOPMENT_API_ASSESSMENTS_PATH);
  if (assessmentApi && assessmentApi.rest.length === 1 && assessmentApi.rest[0] === "adjustments") {
    if (options.method === "POST") {
      return {
        statusCode: 201,
        body: adjustmentSchema.parse(
          await options.createAdjustment({
            assessmentId: assessmentApi.id,
            ...readAdjustmentFields(options.body),
          }),
        ),
      };
    }
  }

  const adjustmentApi = idPath(options.pathname, DEVELOPMENT_API_ADJUSTMENTS_PATH);
  if (adjustmentApi && adjustmentApi.rest.length === 0) {
    if (options.method === "PATCH") {
      return {
        statusCode: 200,
        body: adjustmentSchema.parse(
          await options.updateAdjustment({
            id: adjustmentApi.id,
            ...readAdjustmentFields(options.body),
          }),
        ),
      };
    }

    if (options.method === "DELETE") {
      return {
        statusCode: 200,
        body: deleteResultSchema.parse(await options.deleteAdjustment({ id: adjustmentApi.id })),
      };
    }
  }

  return undefined;
}

function idPath(pathname: string, prefix: string): { id: number; rest: Array<string> } | undefined {
  const root = `${prefix}/`;

  if (!pathname.startsWith(root)) {
    return undefined;
  }

  const parts = pathname.slice(root.length).split("/").filter(Boolean).map(decodeURIComponent);
  const idPart = parts[0];

  if (!idPart) {
    return undefined;
  }

  return {
    id: readPositiveInt(idPart, "That record was not found."),
    rest: parts.slice(1),
  };
}

function readCategoryFields(body: unknown): { name: string; notes: string; weight: number } {
  const record = requireObject(body, "A name is required.");
  return {
    name: readStringField(record, "name", "A name is required."),
    notes: readOptionalStringField(record, "notes"),
    weight: readNumberField(record, "weight", "A weight is required."),
  };
}

function readSubcategoryFields(body: unknown): {
  name: string;
  weight: number;
} {
  const record = requireObject(body, "A name is required.");
  return {
    name: readStringField(record, "name", "A name is required."),
    weight: readNumberField(record, "weight", "A weight is required."),
  };
}

function readWorkFields(body: unknown): {
  name: string;
  notes: string;
  date?: string | null;
  maximumScore: number;
  weight: number;
} {
  const record = requireObject(body, "A name is required.");
  const fields: {
    name: string;
    notes: string;
    date?: string | null;
    maximumScore: number;
    weight: number;
  } = {
    name: readStringField(record, "name", "A name is required."),
    notes: readOptionalStringField(record, "notes"),
    maximumScore: readNumberField(record, "maximumScore", "A maximum score is required."),
    weight: readNumberField(record, "weight", "A weight is required."),
  };

  if ("date" in record && record.date !== undefined) {
    if (record.date === null) {
      fields.date = null;
    } else {
      fields.date = readStringField(record, "date", "Enter a date as YYYY-MM-DD.");
    }
  }

  return fields;
}

function readAssessmentFields(body: unknown): {
  score: number;
  date?: string;
  weight?: number;
  notes?: string;
  status?: "counted" | "exempt" | "nhi";
} {
  const record = requireObject(body, "A score is required.");
  const fields: {
    score: number;
    date?: string;
    weight?: number;
    notes?: string;
    status?: "counted" | "exempt" | "nhi";
  } = {
    score: readNumberField(record, "score", "A score is required."),
  };

  if ("date" in record && record.date !== undefined) {
    fields.date = readStringField(record, "date", "Enter a date as YYYY-MM-DD.");
  }

  if ("weight" in record && record.weight !== undefined) {
    fields.weight = readNumberField(record, "weight", "A weight is required.");
  }

  if ("notes" in record && record.notes !== undefined) {
    fields.notes = readStringField(record, "notes", "Notes must be text.");
  }

  if ("status" in record && record.status !== undefined) {
    const status = readStringField(record, "status", "A status is required.");
    if (status !== "counted" && status !== "exempt" && status !== "nhi") {
      throw new Error("A status must be counted, exempt, or nhi.");
    }
    fields.status = status;
  }

  return fields;
}

function readAdjustmentFields(body: unknown): {
  percentChange: number | null;
  rawChange: number | null;
  description: string;
  notes: string;
} {
  const record = requireObject(body, "A description is required.");
  return {
    percentChange: readNullableNumberField(record, "percentChange"),
    rawChange: readNullableNumberField(record, "rawChange"),
    description: readStringField(record, "description", "A description is required."),
    notes: readOptionalStringField(record, "notes"),
  };
}

function requireObject(body: unknown, message: string): Record<string, unknown> {
  return unknownRecord(body, message);
}

function readStringField(body: Record<string, unknown>, key: string, message: string): string {
  const value = body[key];

  if (typeof value !== "string") {
    throw new Error(message);
  }

  return value;
}

function readOptionalStringField(body: Record<string, unknown>, key: string): string {
  if (!(key in body)) {
    return "";
  }

  const value = body[key];

  if (typeof value !== "string") {
    throw new Error(`${key} must be text.`);
  }

  return value;
}

function readNumberField(body: Record<string, unknown>, key: string, message: string): number {
  const value = body[key];

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(message);
  }

  return value;
}

function readNullableNumberField(body: Record<string, unknown>, key: string): number | null {
  if (!(key in body) || body[key] === null) {
    return null;
  }

  const value = body[key];

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${key} must be a number.`);
  }

  return value;
}

function readPositiveInt(value: string, message: string): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(message);
  }

  return parsed;
}
