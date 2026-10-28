import { defineConfig } from '@playwright/test';
import existing from './playwright.config';
export default defineConfig({ ...existing,
  testMatch: ['**/section-assignment.spec.ts', '**/admin-remaining-year-acceptance.spec.ts', '**/student-form-loading.spec.ts'],
  webServer: { ...existing.webServer, env: { QED_VITE_CACHE_DIR: 'node_modules/.vite-playwright', QED_ACCEPTANCE_STATIC: '1' } },
  reporter: [['list'], ['json', { outputFile: 'test-results/section-assignment-results.json' }]],
});
