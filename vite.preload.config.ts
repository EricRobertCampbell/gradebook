import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.message.includes("@__PURE__") || warning.message.includes("annotation")) {
          return;
        }

        warn(warning);
      },
    },
  },
});
