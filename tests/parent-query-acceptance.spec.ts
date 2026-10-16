import { test, expect, type Page } from '@playwright/test';
import { mockDirectory } from './fixtures/directory';
import { waitForDataRoute } from './fixtures/routeReady';
import { waitForQueryReader } from './fixtures/queryLifecycle';
import { requestLedger } from './fixtures/requestLedger';

// Deterministic mocked HTTP/auth. No live account, cookies or student records.
async function fixture(page: Page) {
  const base = await mockDirectory(page, 'PARENT', false); base();
  const state = { status: 200, calls: 0, hold: false };
  let release = () => {};
  const ledger = requestLedger(page, path => path === '/api/linkedChildren/');
  await page.route('**/api/linkedChildren/', async route => {
    ledger.intercept(route.request()); state.calls++;
    if (state.hold) await new Promise<void>(resolve => { release = resolve; });
    await route.fulfill({ status: state.status, json: state.status === 200 ? { success: true, students: [{ id: 1, student_number: 'S101', first_name: 'Synthetic', last_name: 'Child', grade_level: 'Grade 1', section_name: 'Maroon', adviser_name: 'Teacher One' }] } : { success: false, message: 'Synthetic directory failure' } });
  });
  return { state, ledger, release: () => release() };
}
test('Parent dashboard loading then linked child resolves once', async ({ page }) => {
  const f = await fixture(page); f.state.hold = true;
  await page.goto('/parent'); await waitForDataRoute(page);
  await expect(page.locator('[data-sk-phase="revealed"]').first()).toBeVisible();
  await expect.poll(() => f.state.calls).toBeGreaterThan(0); f.release();
  await expect(page.getByRole('button', { name: 'View Synthetic Child', exact: true })).toBeVisible();
  await f.ledger.successfulBatch();
});
test('Parent dashboard and enrolled children share fresh list without duplicate GET', async ({ page }) => {
  const f = await fixture(page); await page.goto('/parent'); await waitForDataRoute(page);
  await expect(page.getByRole('button', { name: 'View Synthetic Child', exact: true })).toBeVisible();
  await f.ledger.successfulBatch(); const before = f.state.calls;
  await page.getByRole('link', { name: 'Enrolled Children', exact: true }).click(); await waitForDataRoute(page);
  await expect(page.getByRole('heading', { name: 'Enrolled Children', exact: true })).toBeVisible();
  await waitForQueryReader(page, 'PARENT', ['children', 'list'], true); expect(f.state.calls).toBe(before);
});
for (const status of [500, 403]) test(`Parent dashboard ${status} hides records and explicit Retry recovers`, async ({ page }) => {
  const f = await fixture(page); f.state.status = status;
  await page.goto('/parent'); await waitForDataRoute(page);
  await expect(page.getByRole('alert').first()).toContainText('Synthetic directory failure');
  await expect(page.getByRole('button', { name: 'View Synthetic Child', exact: true })).toHaveCount(0);
  f.state.status = 200; await page.getByRole('button', { name: 'Retry', exact: true }).first().click();
  await expect(page.getByRole('button', { name: 'View Synthetic Child', exact: true })).toBeVisible();
  await waitForQueryReader(page, 'PARENT', ['children', 'list'], true);
  expect(f.ledger.snapshot().filter(e => e.terminal === 'finished' && e.status === status)).toHaveLength(1);
  expect(f.ledger.snapshot().filter(e => e.terminal === 'finished' && e.status === 200)).toHaveLength(1);
});
test('Parent dashboard 401 expires the authenticated session', async ({ page }) => {
  const f = await fixture(page); f.state.status = 401;
  await page.goto('/parent'); await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole('button', { name: 'View Synthetic Child', exact: true })).toHaveCount(0);
});
