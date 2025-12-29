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
      // Updated thresholds after Sprint 3 complete (Issue #82)
      // Achieved: Lines 67.35%, Statements 49.85%, Branches 41.96%, Functions 45.08%
      // Progress: Lines increased from 57% to 67.35% (+10.35%)
      // Tests: 1096 passing (151 new tests created across 3 sprints)
      // See: https://github.com/TavaresBugs/journal-nextjs/issues/82
      thresholds: {
        statements: 49,
        branches: 41,
        functions: 44,
        lines: 67,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
