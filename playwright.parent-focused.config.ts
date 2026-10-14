import { defineConfig } from '@playwright/test';
import base from './playwright.config';
export default defineConfig({ ...base,
  testMatch: ['**/parent-*.spec.ts','**/courseware-loading.spec.ts','**/pet-quiz-loading.spec.ts'],
  webServer: { ...base.webServer, env: { QED_ACCEPTANCE_STATIC: '1' } },
  reporter: [['list']],
});
