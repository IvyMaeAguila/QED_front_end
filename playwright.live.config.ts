import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/live', workers: 1, retries: 0, timeout: 240_000,
  expect: { timeout: 30_000 }, reporter: 'list',
  use: { baseURL: 'http://localhost:5173', browserName: 'chromium', actionTimeout: 30_000, navigationTimeout: 30_000, viewport: { width: 1280, height: 1000 } },
  webServer: [
    { command: 'node ../thesis_qed/scripts/testing/live-gradebook.js server', url: 'http://localhost:7411/__test/health', timeout: 60_000, reuseExistingServer: false },
    { command: 'npm run dev -- --host localhost --port 5173 --strictPort', url: 'http://localhost:5173/loading-harness.html', env: { VITE_API_BASE_URL: 'http://localhost:7411' }, timeout: 120_000, reuseExistingServer: false },
  ],
});
