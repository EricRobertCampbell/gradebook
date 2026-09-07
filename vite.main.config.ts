import { defineConfig } from "vite";

function ignoreZodPureComments(
  warning: { message: string },
  warn: (warning: { message: string }) => void,
): void {
  if (warning.message.includes("@__PURE__") || warning.message.includes("annotation")) {
    return;
  }

  warn(warning);
}

export default defineConfig({
  build: {
    rollupOptions: {
      external: ["better-sqlite3"],
      onwarn: ignoreZodPureComments,
    },
  },
});
