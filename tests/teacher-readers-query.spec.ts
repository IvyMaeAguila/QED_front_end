import { test, expect, type Page } from "@playwright/test";
import { mockTeacher } from "./fixtures/teacher";
import { requestLedger } from "./fixtures/requestLedger";
const consoleErrors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const errors: string[] = []; consoleErrors.set(page, errors);
  page.on('console', m => { if (m.type() === 'error' && /Cannot update a component|React has detected|Invalid hook/.test(m.text())) errors.push(m.text()); });
  page.on('pageerror', e => errors.push(e.message));
});
test.afterEach(async ({ page }) => { expect(consoleErrors.get(page)).toEqual([]); });
async function fixture(page: Page) {
  const release = await mockTeacher(page, false); release();
  const ledger = requestLedger(page, p => p.startsWith('/api/mySubjects/'));
  const status = { subjects: 200, roster: 200 };
  let releaseRoster: (() => void) | undefined, gate: Promise<void> | undefined, marker = "Account 1";
  await page.route('**/api/mySubjects/**', async route => {
    ledger.intercept(route.request());
    const path = new URL(route.request().url()).pathname;
    const roster = path.endsWith('/students'), code = roster ? status.roster : status.subjects, name = marker;
    if (roster) await gate;
    await route.fulfill({ status: code, json: code === 200 ? { data: roster ? { subject_name: `${name} ${path}`, grade_level: 'Grade 1', section_name: 'Maroon', students: [] } : [{ subject_section_id: 1, subject_id: 1, subject_name: name, grade_level: 'Grade 1', section_name: 'Maroon' }] } : { message: 'Synthetic failure' } });
  });
  await page.goto('/tests/teacher-readers-query.html'); await expect(page.getByTestId('auth')).toHaveText('TEACHER:1');
  return { ledger, status, hold: () => { gate = new Promise(r => { releaseRoster = r; }); }, release: () => { releaseRoster?.(); gate = undefined; }, marker: (v: string) => { marker = v; } };
}
const start = (page: Page) => page.getByRole('button', { name: 'Toggle preview', exact: true }).click();
const loaded = async (page: Page, marker = 'Account 1') => {
  await expect(page.getByTestId('subjects-data').first()).toContainText(marker); await expect(page.getByTestId('roster-data').first()).toContainText(marker);
  await expect(page.getByTestId('subjects-loading').first()).toHaveText('false'); await expect(page.getByTestId('roster-loading').first()).toHaveText('false');
};
test('Teacher readers: preview blocks requests, concurrent observers and fresh remount deduplicate', async ({ page }) => {
  const f = await fixture(page); expect(f.ledger.snapshot()).toEqual([]); await start(page); await loaded(page); await f.ledger.successfulBatch(0, 2);
  const mark = f.ledger.mark(); await page.getByRole('button', { name: 'Toggle observer' }).click(); await loaded(page);
  await page.getByRole('button', { name: 'Toggle observer' }).click(); await page.getByRole('button', { name: 'Toggle readers' }).click(); await page.getByRole('button', { name: 'Toggle readers' }).click(); await loaded(page);
  expect(f.ledger.snapshot(mark)).toEqual([]);
});
test('Teacher readers: rapid target switching cancels exactly the abandoned roster and preserves current target', async ({ page }) => {
  const f = await fixture(page); f.hold(); await start(page);
  await expect.poll(() => f.ledger.snapshot().filter(r => r.path.endsWith('/1/students') && r.intercepted).length).toBe(1);
  await page.getByRole('button', { name: 'Switch target' }).click();
  await expect.poll(() => f.ledger.snapshot().filter(r => r.path.endsWith('/1/students') && r.terminal === 'aborted').length).toBe(1);
  f.release(); await loaded(page); await expect(page.getByTestId('roster-data')).toContainText('/2/students');
});
test('Teacher readers: pending old401 cannot expire a switched account or overwrite its data', async ({ page }) => {
  const f = await fixture(page); f.status.roster = 401; f.hold(); await start(page);
  await expect.poll(() => f.ledger.snapshot().filter(r => r.path.endsWith('/1/students') && r.intercepted).length).toBe(1);
  f.status.roster = 200; f.marker('Account 2'); await page.getByRole('button', { name: 'Switch account' }).click();
  await expect.poll(() => f.ledger.snapshot().filter(r => r.terminal === 'aborted').length).toBe(1);
  f.release(); await loaded(page, 'Account 2'); await expect(page.getByTestId('auth')).toHaveText('TEACHER:2');
  await expect(page.getByTestId('keys')).not.toContainText('"TEACHER","1"');
});
test('Teacher readers: role change clears private cached results and disables readers', async ({ page }) => {
  const f = await fixture(page); await start(page); await loaded(page); await f.ledger.successfulBatch(0, 2);
  const mark = f.ledger.mark(); await page.getByRole('button', { name: 'Switch role' }).click();
  await expect(page.getByTestId('subjects-data')).toBeEmpty(); await expect(page.getByTestId('roster-data')).toBeEmpty(); await expect(page.getByTestId('keys')).toHaveText('[]'); expect(f.ledger.snapshot(mark)).toEqual([]);
});
test('Teacher readers: confirmed logout clears all user-specific data', async ({ page }) => {
  const f = await fixture(page); await start(page); await loaded(page); await f.ledger.successfulBatch(0, 2);
  await page.route('**/api/auth/logout', r => r.fulfill({ json: { success: true } }));
  await page.getByRole('button', { name: 'Logout', exact: true }).click(); await page.getByRole('dialog', { name: 'Confirm logout' }).getByRole('button', { name: 'Log out', exact: true }).click();
  await expect(page.getByTestId('auth')).toHaveText('signed-out'); await expect(page.getByTestId('keys')).toHaveText('[]'); await expect(page.getByTestId('subjects-data')).toBeEmpty(); await expect(page.getByTestId('roster-data')).toBeEmpty();
});
for (const resource of ['subjects', 'roster'] as const) for (const status of [401, 403, 500]) test(`Teacher ${resource}:${status} preserves auth/privacy/retry contract`, async ({ page }) => {
  const f = await fixture(page); f.status[resource] = status; await start(page);
  if (status === 401) { await expect(page.getByTestId('auth')).toHaveText('signed-out'); return; }
  await expect(page.getByTestId(`${resource}-error`)).toContainText('Failed to load'); await expect(page.getByTestId(`${resource}-loading`)).toHaveText('false'); await expect(page.getByTestId(`${resource}-data`)).toBeEmpty(); await expect(page.getByTestId('auth')).toHaveText('TEACHER:1');
  f.status[resource] = 200; await page.getByRole('button', { name: `Retry ${resource}`, exact: true }).click(); await loaded(page);
});
