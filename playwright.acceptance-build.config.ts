import { defineConfig } from "@playwright/test";

// Run after npm run build. Source-import/hook harness tests use the main
// acceptance config; these workflows exercise the actual production artifact.
export default defineConfig({
  testDir: "./tests",
  testMatch: [
    "**/query-pilot-acceptance.spec.ts", "**/directory-loading.spec.ts",
    "**/user-details-loading.spec.ts", "**/role-bundles.spec.ts",
    "**/bundle-budget.spec.ts",
  ],
  workers: 1, retries: 0, timeout: 30_000,
  projects: [{ name: "fresh-production" }],
  outputDir: "test-results/fresh-build",
  reporter: [["list"], ["json", { outputFile: "test-results/fresh-build-results.json" }]],
  use: { browserName: "chromium", baseURL: "http://127.0.0.1:5193", screenshot: "only-on-failure", trace: "off", video: "off" },
  webServer: {
    command: `node --input-type=module -e "import { serveBuild } from './scripts/startup-harness.mjs'; await serveBuild(5193);"`,
    url: "http://127.0.0.1:5193", reuseExistingServer: false,
  },
});
