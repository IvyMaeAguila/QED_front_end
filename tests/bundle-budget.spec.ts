import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
// @ts-expect-error Build tooling is an ESM Node script.
import { inspectBuild, checkRegistry, budget } from '../scripts/check-bundle-budget.mjs';
test('production entry and eager dependency closure stay within the fixed plus 10% budget', () => {
  const result = inspectBuild();
  expect(result.entry.gzipBytes).toBeLessThanOrEqual(budget.entryGzipBytes);
  expect(result.entryEagerClosure.gzipBytes).toBeLessThanOrEqual(budget.entryEagerClosureGzipBytes);
  expect(result.roles.ADMIN.eagerDownloadBeyondPublic.gzipBytes).toBeLessThanOrEqual(budget.adminEagerDownloadGzipBytes);
});
test('registry guard rejects an eager page import and accepts the restored metadata', () => {
  expect(() => checkRegistry('import { TeacherLayout } from "../../features/profiles/teacher/pages/TeacherLayout";')).toThrow('eager imports are forbidden');
  expect(() => checkRegistry()).not.toThrow();
});

test('source acceptance freezes file watching while normal development keeps HMR', () => {
  // Vite's config loader must not install hooks in Playwright's TS/ESM worker.
  const result = execFileSync(process.execPath, ['--input-type=module'], {
    encoding: 'utf8', input: `
      import { resolveConfig } from 'vite';
      delete process.env.QED_ACCEPTANCE_STATIC;
      const development = await resolveConfig({}, 'serve');
      process.env.QED_ACCEPTANCE_STATIC = '1';
      const acceptance = await resolveConfig({}, 'serve');
      console.log(JSON.stringify({ development: development.server.watch, acceptance: acceptance.server.watch }));
    `,
  });
  const config = JSON.parse(result);
  expect(config.development).not.toBeNull();
  expect(config.acceptance).toBeNull();
});
