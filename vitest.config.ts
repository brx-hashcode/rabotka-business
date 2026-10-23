import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "#": fileURLToPath(new URL("./src", import.meta.url)),
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    // Pure helpers run in node; opt a file into the DOM with
    // `// @vitest-environment jsdom` at its top.
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
    passWithNoTests: true,
  },
});
