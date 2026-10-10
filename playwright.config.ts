import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests", testMatch: "**/*.spec.ts", fullyParallel: false, workers: 1,
  retries: 0, reporter: "list", timeout: 30_000,
  use: { browserName: "chromium", baseURL: "http://127.0.0.1:5187", viewport: { width: 1280, height: 900 } },
  webServer: { command: "npm run dev -- --host 127.0.0.1 --port 5187 --strictPort", url: "http://127.0.0.1:5187/loading-harness.html", reuseExistingServer: false, timeout: 60_000 },
});
