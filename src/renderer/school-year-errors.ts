export function describeSchoolYearHttpError(
  status: number,
  apiError: string | undefined,
  fallback: string,
): string {
  if (status === 404) {
    return "The school year service was not found. Stop any other Gradebook process and run npm run dev again.";
  }

  if (apiError && apiError !== "Not found.") {
    return apiError;
  }

  return fallback;
}
