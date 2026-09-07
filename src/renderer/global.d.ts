import type { GradebookApi } from "../shared/preload-api";

declare global {
  interface Window {
    gradebook?: GradebookApi;
  }
}

export {};
