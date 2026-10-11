import { defineConfig } from "@playwright/test";
import existing from "./playwright.config";

export default defineConfig({
  ...existing,
  testMatch: [
    "**/query-pilot-acceptance.spec.ts", "**/query-pilot-blockers.spec.ts",
    "**/query-pilot.spec.ts", "**/directory-loading.spec.ts",
    "**/bootstrap-loading.spec.ts", "**/role-bundles.spec.ts",
    "**/bundle-budget.spec.ts", "**/user-details-loading.spec.ts",
  ],
  reporter: [["list"], ["json", { outputFile: "test-results/acceptance-results.json" }]],
  use: { ...existing.use, screenshot: "only-on-failure", trace: "off", video: "off" },
});
