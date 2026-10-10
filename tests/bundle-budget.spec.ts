import { test, expect } from '@playwright/test';
// @ts-expect-error Build tooling is an ESM Node script.
import { inspectBuild, checkRegistry, budget } from '../scripts/check-bundle-budget.mjs';
test('production entry and eager dependency closure stay within the fixed plus 10% budget', () => {
  const result = inspectBuild();
  expect(result.entry.gzipBytes).toBeLessThanOrEqual(budget.entryGzipBytes);
  expect(result.entryEagerClosure.gzipBytes).toBeLessThanOrEqual(budget.entryEagerClosureGzipBytes);
});
test('registry guard rejects an eager page import and accepts the restored metadata', () => {
  expect(() => checkRegistry('import { TeacherLayout } from "../../features/profiles/teacher/pages/TeacherLayout";')).toThrow('eager imports are forbidden');
  expect(() => checkRegistry()).not.toThrow();
});
