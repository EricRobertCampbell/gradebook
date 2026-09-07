import {
  classByIdPath,
  schoolYearClassPath,
  schoolYearClassesPath,
} from "../shared/development-api";
import {
  classCreateInputSchema,
  classDeleteResultSchema,
  classListSchema,
  classLookupInputSchema,
  classSchema,
  classUpdateInputSchema,
  recordIdInputSchema,
  type Class,
  type ClassCreateInput,
  type ClassDeleteResult,
  type ClassLookupInput,
  type ClassUpdateInput,
  type RecordIdInput,
} from "../shared/ipc";

export async function listClasses(schoolYearName: string): Promise<Array<Class>> {
  if (hasPreloadClassesApi() && window.gradebook) {
    return window.gradebook.classes.list({ schoolYearName });
  }

  return classListSchema.parse(
    await requestDevelopmentApi(
      schoolYearClassesPath(schoolYearName),
      undefined,
      "The classes could not be loaded.",
    ),
  );
}

export async function getClassById(input: RecordIdInput): Promise<Class> {
  const parsed = parseRecordId(input);

  if (hasPreloadClassGetByIdApi() && window.gradebook) {
    return window.gradebook.classes.getById(parsed);
  }

  return classSchema.parse(
    await requestDevelopmentApi(classByIdPath(parsed.id), undefined, "That class was not found."),
  );
}

export async function getClass(input: ClassLookupInput): Promise<Class> {
  const lookup = parseLookup(input);

  if (hasPreloadClassesApi() && window.gradebook) {
    return window.gradebook.classes.get(lookup);
  }

  return classSchema.parse(
    await requestDevelopmentApi(
      schoolYearClassPath(lookup.schoolYearName, lookup.internalName),
      undefined,
      "That class was not found.",
    ),
  );
}

export async function createClass(input: ClassCreateInput): Promise<Class> {
  const parsed = parseCreate(input);

  if (hasPreloadClassesApi() && window.gradebook) {
    return window.gradebook.classes.create(parsed);
  }

  return classSchema.parse(
    await requestDevelopmentApi(
      schoolYearClassesPath(parsed.schoolYearName),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(classFields(parsed)),
      },
      "The class could not be created.",
    ),
  );
}

export async function updateClass(input: ClassUpdateInput): Promise<Class> {
  const parsed = parseUpdate(input);

  if (hasPreloadClassesApi() && window.gradebook) {
    return window.gradebook.classes.update(parsed);
  }

  return classSchema.parse(
    await requestDevelopmentApi(
      schoolYearClassPath(parsed.schoolYearName, parsed.currentInternalName),
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(classFields(parsed)),
      },
      "The class could not be updated.",
    ),
  );
}

export async function deleteClass(input: ClassLookupInput): Promise<ClassDeleteResult> {
  const lookup = parseLookup(input);

  if (hasPreloadClassesApi() && window.gradebook) {
    return window.gradebook.classes.delete(lookup);
  }

  return classDeleteResultSchema.parse(
    await requestDevelopmentApi(
      schoolYearClassPath(lookup.schoolYearName, lookup.internalName),
      { method: "DELETE" },
      "The class could not be deleted.",
    ),
  );
}

function hasPreloadClassesApi(): boolean {
  return typeof window.gradebook?.classes?.list === "function";
}

function hasPreloadClassGetByIdApi(): boolean {
  return typeof window.gradebook?.classes?.getById === "function";
}

function parseRecordId(input: RecordIdInput): RecordIdInput {
  const result = recordIdInputSchema.safeParse(input);

  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "That class was not found.");
  }

  return result.data;
}

function parseLookup(input: ClassLookupInput): ClassLookupInput {
  const result = classLookupInputSchema.safeParse(input);

  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "That class was not found.");
  }

  return result.data;
}

function parseCreate(input: ClassCreateInput): ClassCreateInput {
  const result = classCreateInputSchema.safeParse(input);

  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "The class could not be created.");
  }

  return result.data;
}

function parseUpdate(input: ClassUpdateInput): ClassUpdateInput {
  const result = classUpdateInputSchema.safeParse(input);

  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "The class could not be updated.");
  }

  return result.data;
}

function classFields(input: ClassCreateInput | ClassUpdateInput) {
  return {
    displayName: input.displayName,
    internalName: input.internalName,
    subject: input.subject,
    section: input.section,
    notes: input.notes,
  };
}

async function requestDevelopmentApi(
  path: string,
  init: RequestInit | undefined,
  fallback: string,
): Promise<unknown> {
  if (!import.meta.env.DEV) {
    throw new Error("The gradebook preload API is not available.");
  }

  const response = await fetch(path, init);

  if (!response.ok) {
    await readFailedResponse(response, fallback);
  }

  return response.json();
}

async function readFailedResponse(response: Response, fallback: string): Promise<never> {
  let apiError: string | undefined;

  try {
    const body: unknown = await response.json();

    if (
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof body.error === "string"
    ) {
      apiError = body.error;
    }
  } catch {
    // Use the fallback when the error payload is not JSON.
  }

  throw new Error(describeClassHttpError(response.status, apiError, fallback));
}

function describeClassHttpError(
  status: number,
  apiError: string | undefined,
  fallback: string,
): string {
  if (status === 404) {
    return "The class service was not found. Stop any other Gradebook process and run npm run dev again.";
  }

  if (apiError && apiError !== "Not found.") {
    return apiError;
  }

  return fallback;
}
