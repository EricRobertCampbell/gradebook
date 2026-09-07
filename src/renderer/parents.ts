import { parentPath, studentParentPath, studentParentsPath } from "../shared/development-api";
import {
  deleteResultSchema,
  parentCreateInputSchema,
  parentDeleteInputSchema,
  parentListSchema,
  parentSchema,
  parentUpdateInputSchema,
  studentIdInputSchema,
  type DeleteResult,
  type Parent,
  type ParentCreateInput,
  type ParentDeleteInput,
  type ParentUpdateInput,
  type StudentIdInput,
} from "../shared/ipc";
import { requestDevelopmentApi } from "./development-request";

export async function listParentsForStudent(input: StudentIdInput): Promise<Array<Parent>> {
  const lookup = parseStudentId(input);

  if (hasPreloadParentsApi() && window.gradebook) {
    return window.gradebook.parents.listForStudent(lookup);
  }

  return parentListSchema.parse(
    await requestDevelopmentApi(
      studentParentsPath(lookup.id),
      undefined,
      "The parents could not be loaded.",
    ),
  );
}

export async function createParentForStudent(input: ParentCreateInput): Promise<Parent> {
  const parsed = parseCreate(input);

  if (hasPreloadParentsApi() && window.gradebook) {
    return window.gradebook.parents.createForStudent(parsed);
  }

  return parentSchema.parse(
    await requestDevelopmentApi(
      studentParentsPath(parsed.studentId),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parentFields(parsed)),
      },
      "The parent could not be created.",
    ),
  );
}

export async function updateParent(input: ParentUpdateInput): Promise<Parent> {
  const parsed = parseUpdate(input);

  if (hasPreloadParentsApi() && window.gradebook) {
    return window.gradebook.parents.update(parsed);
  }

  return parentSchema.parse(
    await requestDevelopmentApi(
      parentPath(parsed.id),
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parentFields(parsed)),
      },
      "The parent could not be updated.",
    ),
  );
}

export async function deleteParentForStudent(input: ParentDeleteInput): Promise<DeleteResult> {
  const parsed = parseDelete(input);

  if (hasPreloadParentsApi() && window.gradebook) {
    return window.gradebook.parents.delete(parsed);
  }

  return deleteResultSchema.parse(
    await requestDevelopmentApi(
      studentParentPath(parsed.studentId, parsed.id),
      { method: "DELETE" },
      "The parent could not be deleted.",
    ),
  );
}

function hasPreloadParentsApi(): boolean {
  return typeof window.gradebook?.parents?.listForStudent === "function";
}

function parseStudentId(input: StudentIdInput): StudentIdInput {
  const result = studentIdInputSchema.safeParse(input);

  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "That student was not found.");
  }

  return result.data;
}

function parseCreate(input: ParentCreateInput): ParentCreateInput {
  const result = parentCreateInputSchema.safeParse(input);

  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "The parent could not be created.");
  }

  return result.data;
}

function parseUpdate(input: ParentUpdateInput): ParentUpdateInput {
  const result = parentUpdateInputSchema.safeParse(input);

  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "The parent could not be updated.");
  }

  return result.data;
}

function parseDelete(input: ParentDeleteInput): ParentDeleteInput {
  const result = parentDeleteInputSchema.safeParse(input);

  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "That parent was not found.");
  }

  return result.data;
}

function parentFields(input: ParentCreateInput | ParentUpdateInput) {
  return {
    firstName: input.firstName,
    lastName: input.lastName,
    preferredName: input.preferredName,
    notes: input.notes,
    emailAddress1: input.emailAddress1,
    emailAddress2: input.emailAddress2,
  };
}
