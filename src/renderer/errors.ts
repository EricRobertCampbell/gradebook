import { ZodError } from "zod";

export type DescribedError = {
  context: string;
  detail?: string;
};

export type DisplayError = string | DescribedError;

export function describeError(error: unknown, context: string): DescribedError {
  const detail = extractErrorDetail(error);

  if (!detail || detail === context) {
    return { context };
  }

  return { context, detail };
}

export function extractErrorDetail(error: unknown): string | undefined {
  if (error instanceof ZodError) {
    return uniqueIssueMessages(error.issues);
  }

  if (!(error instanceof Error) || !error.message) {
    return undefined;
  }

  return messagesFromZodJson(error.message) ?? error.message;
}

function uniqueIssueMessages(issues: Array<{ message: string }>): string | undefined {
  const messages = [...new Set(issues.map((issue) => issue.message).filter(Boolean))];
  return messages.length > 0 ? messages.join(" ") : undefined;
}

function messagesFromZodJson(message: string): string | undefined {
  const trimmed = message.trim();

  if (!trimmed.startsWith("[")) {
    return undefined;
  }

  try {
    const parsed: unknown = JSON.parse(trimmed);

    if (!Array.isArray(parsed) || parsed.length === 0) {
      return undefined;
    }

    const issues = parsed.filter(
      (issue): issue is { message: string } =>
        typeof issue === "object" &&
        issue !== null &&
        "message" in issue &&
        typeof issue.message === "string",
    );

    if (issues.length !== parsed.length) {
      return undefined;
    }

    return uniqueIssueMessages(issues);
  } catch {
    return undefined;
  }
}
