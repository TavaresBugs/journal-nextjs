import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/__tests__/setup.ts"],
    include: ["src/**/*.{test,spec}.{js,ts,jsx,tsx}"],
    exclude: ["node_modules", "dist", ".next"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "src/test/", "**/*.d.ts", "**/*.config.*", "**/types/**"],
      // Temporary thresholds adjusted to current coverage (Issue #82)
      // Target: 70% for all metrics except branches (55%)
      // See: https://github.com/TavaresBugs/journal-nextjs/issues/82
      thresholds: {
        statements: 41,
        branches: 34,
        functions: 37,
        lines: 57,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
