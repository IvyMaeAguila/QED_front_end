import { defineConfig } from "@playwright/test";

// Diagnostic only: this tests the retained dist, NOT a fresh current-source build.
export default defineConfig({
  testDir: "./tests", testMatch: "**/query-pilot-acceptance.spec.ts",
  workers: 1, retries: 0, timeout: 30_000,
  outputDir: "test-results/retained-build",
  reporter: [["list"], ["json", { outputFile: "test-results/retained-build-results.json" }]],
  use: { browserName: "chromium", baseURL: "http://127.0.0.1:5193", screenshot: "only-on-failure", trace: "off", video: "off" },
  webServer: {
    command: `node --input-type=module -e "import { serveBuild } from './scripts/startup-harness.mjs'; await serveBuild(5193);"`,
    url: "http://127.0.0.1:5193", reuseExistingServer: false,
  },
});
