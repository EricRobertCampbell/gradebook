export async function requestDevelopmentApi(
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

  throw new Error(describeHttpError(response.status, apiError, fallback));
}

function describeHttpError(status: number, apiError: string | undefined, fallback: string): string {
  if (status === 404) {
    return "The gradebook service was not found. Stop any other Gradebook process and run npm run dev again.";
  }

  if (apiError && apiError !== "Not found.") {
    return apiError;
  }

  return fallback;
}
