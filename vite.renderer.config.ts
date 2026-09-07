import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { gradebookDevelopmentApiPlugin } from "./src/main/vite-development-api";
import { DEVELOPMENT_API_PORT } from "./src/shared/development-api";

export default defineConfig({
  plugins: [react(), gradebookDevelopmentApiPlugin()],
  server: {
    proxy: {
      "/api": {
        target: `http://127.0.0.1:${DEVELOPMENT_API_PORT}`,
      },
    },
  },
});
