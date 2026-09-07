import {
  createAdjustment,
  deleteAdjustment,
  deleteAssessment,
  updateAdjustment,
  upsertAssessment,
} from "./database/assessments";
import { getClassGradebook } from "./database/gradebook";
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
  updateCategory,
  updateSubcategory,
  updateWork,
} from "./database/grading-structure";
import type { GradebookDatabase } from "./database/status";
import type { GradingDevelopmentApiHandlers } from "./grading-development-api";

export function gradingApiHandlers(
  getDb: () => GradebookDatabase,
): GradingDevelopmentApiHandlers {
  return {
    getGradingStructure: (input) => getGradingStructure(getDb(), input),
    getClassGradebook: (input) => getClassGradebook(getDb(), input),
    createCategory: (input) => createCategory(getDb(), input),
    updateCategory: (input) => updateCategory(getDb(), input),
    deleteCategory: (input) => deleteCategory(getDb(), input),
    copyCategory: (input) => copyCategory(getDb(), input),
    createSubcategory: (input) => createSubcategory(getDb(), input),
    updateSubcategory: (input) => updateSubcategory(getDb(), input),
    deleteSubcategory: (input) => deleteSubcategory(getDb(), input),
    copySubcategory: (input) => copySubcategory(getDb(), input),
    createWork: (input) => createWork(getDb(), input),
    updateWork: (input) => updateWork(getDb(), input),
    deleteWork: (input) => deleteWork(getDb(), input),
    copyWork: (input) => copyWork(getDb(), input),
    upsertAssessment: (input) => upsertAssessment(getDb(), input),
    deleteAssessment: (input) => deleteAssessment(getDb(), input),
    createAdjustment: (input) => createAdjustment(getDb(), input),
    updateAdjustment: (input) => updateAdjustment(getDb(), input),
    deleteAdjustment: (input) => deleteAdjustment(getDb(), input),
  };
}
