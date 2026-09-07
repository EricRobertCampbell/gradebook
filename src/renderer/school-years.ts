import { DEVELOPMENT_API_SCHOOL_YEARS_PATH, yearByIdPath } from "../shared/development-api";
import {
  recordIdInputSchema,
  schoolYearDeleteResultSchema,
  schoolYearListSchema,
  schoolYearNameSchema,
  schoolYearSchema,
  type RecordIdInput,
  type SchoolYear,
  type SchoolYearDeleteResult,
} from "../shared/ipc";
import { describeSchoolYearHttpError } from "./school-year-errors";

function parseSchoolYearId(input: RecordIdInput): RecordIdInput {
  const result = recordIdInputSchema.safeParse(input);

  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "That school year was not found.");
  }

  return result.data;
}

function parseSchoolYearName(name: string): string {
  const result = schoolYearNameSchema.safeParse(name);

  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "A school year name is required.");
  }

  return result.data;
}

function hasPreloadSchoolYearsApi(): boolean {
  return typeof window.gradebook?.schoolYears?.list === "function";
}

function hasPreloadSchoolYearGetApi(): boolean {
  return typeof window.gradebook?.schoolYears?.get === "function";
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

  throw new Error(describeSchoolYearHttpError(response.status, apiError, fallback));
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

export async function getSchoolYear(input: RecordIdInput): Promise<SchoolYear> {
  const parsed = parseSchoolYearId(input);

  if (hasPreloadSchoolYearGetApi() && window.gradebook) {
    return window.gradebook.schoolYears.get(parsed);
  }

  return schoolYearSchema.parse(
    await requestDevelopmentApi(
      yearByIdPath(parsed.id),
      undefined,
      "That school year was not found.",
    ),
  );
}

export async function listSchoolYears(): Promise<Array<SchoolYear>> {
  if (hasPreloadSchoolYearsApi() && window.gradebook) {
    return window.gradebook.schoolYears.list();
  }

  return schoolYearListSchema.parse(
    await requestDevelopmentApi(
      DEVELOPMENT_API_SCHOOL_YEARS_PATH,
      undefined,
      "The development school year API is not reachable. Keep npm run dev running.",
    ),
  );
}

export async function createSchoolYear(name: string): Promise<SchoolYear> {
  const parsedName = parseSchoolYearName(name);

  if (hasPreloadSchoolYearsApi() && window.gradebook) {
    return window.gradebook.schoolYears.create({ name: parsedName });
  }

  return schoolYearSchema.parse(
    await requestDevelopmentApi(
      DEVELOPMENT_API_SCHOOL_YEARS_PATH,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: parsedName }),
      },
      "The school year could not be created.",
    ),
  );
}

export async function deleteSchoolYear(name: string): Promise<SchoolYearDeleteResult> {
  if (hasPreloadSchoolYearsApi() && window.gradebook) {
    return window.gradebook.schoolYears.delete({ name });
  }

  return schoolYearDeleteResultSchema.parse(
    await requestDevelopmentApi(
      `${DEVELOPMENT_API_SCHOOL_YEARS_PATH}/${encodeURIComponent(name)}`,
      { method: "DELETE" },
      "The school year could not be deleted.",
    ),
  );
}
