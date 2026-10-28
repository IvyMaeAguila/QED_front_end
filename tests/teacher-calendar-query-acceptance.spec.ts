import { test, expect, type Page } from '@playwright/test';
import { mockDirectory } from './fixtures/directory';
import { requestLedger } from './fixtures/requestLedger';
import { browserCalendarDate } from './fixtures/browserDate';
import { waitForDataRoute } from './fixtures/routeReady';
// MOCKED APIs; actual read-only Teacher Calendar, no database or real account.
const resources = ['activities', 'holidays', 'all-activities', 'all-holidays'] as const;
async function fixture(page: Page, dark = false) {
  const release = await mockDirectory(page, 'TEACHER', dark); release();
  const today = await browserCalendarDate(page);
  const ledger = requestLedger(page, p => p.startsWith('/api/calendar/'));
  const status = Object.fromEntries(resources.map(r => [r, 200])) as Record<typeof resources[number], number>;
  const writes: string[] = [];
  let gate: Promise<void> | undefined, unlock: (() => void) | undefined, empty = false;
  await page.route('**/api/calendar/**', async route => {
    if (route.request().method() !== 'GET') { writes.push(route.request().method()); await route.abort(); return; }
    ledger.intercept(route.request());
    const resource = new URL(route.request().url()).pathname.split('/').pop()! as typeof resources[number];
    const code = status[resource]; await gate;
    await route.fulfill({ status: code, json: code !== 200 ? { success: false, message: 'Synthetic Calendar failure' } : { success: true, data: empty ? [] : [{ id: 71, title: 'Synthetic assembly', date: today, type: 'regular' }] } });
  });
  return { ledger, status, writes, empty: () => { empty = true; },
    hold: () => { gate = new Promise(r => { unlock = r; }); }, release: () => { unlock?.(); gate = undefined; },
    async settled(n: number | Record<string,number>) { await expect.poll(() => resources.map(r => ledger.snapshot().filter(e => e.path.endsWith('/' + r) && e.terminal === 'finished').length)).toEqual(resources.map(r => typeof n === 'number' ? n : n[r])); },
  };
}
async function nav(page: Page, name: string) {
  const menu = page.getByRole('button', { name: 'Open menu', exact: true }); if (await menu.isVisible()) await menu.click();
  await page.getByRole('link', { name, exact: true }).click();
}
async function ready(page: Page) { await expect(page.locator('main [aria-busy="true"]')).toHaveCount(0); }
for (const width of [375, 1280]) for (const dark of [false, true]) test(`Teacher Calendar ${width} ${dark ? 'dark' : 'light'}: read-only layout, fresh cache and offline recovery`, async ({ page }, info) => {
  await page.setViewportSize({ width, height: 1000 }); const f = await fixture(page, dark);
  await page.goto('/teacher/calendar'); await waitForDataRoute(page); await ready(page); await f.settled(1);
  await expect(page.getByText('Synthetic assembly').first()).toBeVisible();
  await expect(page.getByRole('button', { name: /Add activit|Add holiday/i })).toHaveCount(0);
  await page.getByRole('button', { name: 'Expand activities' }).click();
  const dialog = page.getByRole('dialog', { name: 'All Activities', exact: true });
  await expect(dialog).toContainText('Synthetic assembly');
  await dialog.getByRole('button', { name: 'Close dialog', exact: true }).click();
  await nav(page, 'Help & Support'); await expect(page.getByRole('heading', { name: 'Help & Support', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Calendar', exact: true })).toHaveCount(0);
  const mark = f.ledger.mark(); await nav(page, 'Calendar'); await ready(page); expect(f.ledger.snapshot(mark)).toEqual([]);
  await page.context().setOffline(true); await expect(page.getByRole('alert')).toContainText("You're offline"); await ready(page);
  await expect(page.getByText('Synthetic assembly').first()).toBeVisible();
  await page.context().setOffline(false); await expect(page.getByRole('alert')).toHaveCount(0);
  expect(f.ledger.snapshot(mark)).toEqual([]); expect(f.writes).toEqual([]);
  const path = info.outputPath('teacher-calendar.png'); await page.screenshot({ path, fullPage: true }); await info.attach('Teacher Calendar', { path, contentType: 'image/png' });
});
for (const resource of resources) for (const code of [401, 403, 500]) test(`Teacher Calendar independent ${resource}:${code}`, async ({ page }) => {
  const f = await fixture(page); f.status[resource] = code;
  await page.goto('/teacher/calendar');
  if (code === 401) { await expect(page).toHaveURL(/\/login/); return; }
  await expect(page.getByRole('alert').first()).toContainText('Synthetic Calendar failure'); await ready(page); await f.settled(Object.fromEntries(resources.map(r=>[r,r===resource&&code===500?2:1])));
  await expect(page).toHaveURL(/\/teacher\/calendar/);
  f.status[resource] = 200; await page.getByRole('button', { name: 'Retry', exact: true }).first().click();
  await expect(page.getByRole('alert')).toHaveCount(0); await ready(page); await f.settled(Object.fromEntries(resources.map(r=>[r,r===resource?(code===500?3:2):1])));
});
test('Teacher Calendar cancellation aborts all four GETs and late401 cannot expire the current route', async ({ page }, info) => {
  const f = await fixture(page); f.status.activities = 401; f.hold(); await page.goto('/teacher/calendar');
  await expect.poll(() => f.ledger.snapshot().filter(r => r.intercepted && r.terminal !== 'aborted').length).toBe(4);
  const initial = f.ledger.snapshot();
  await info.attach('before-navigation-lifecycle', { body: JSON.stringify(initial), contentType: 'application/json' });
  const probes = initial.filter(r => r.terminal === 'aborted');
  if (info.project.name === 'fresh-production') expect(probes).toHaveLength(0);
  for (const resource of resources) {
    expect(initial.filter(r => r.intercepted && r.path.endsWith('/' + resource) && r.terminal !== 'aborted')).toHaveLength(1);
    expect(probes.filter(r => r.path.endsWith('/' + resource)).length).toBeLessThanOrEqual(1);
  }
  expect(initial).toHaveLength(4 + probes.length);
  await nav(page, 'Help & Support'); await expect(page.getByRole('heading', { name: 'Help & Support', exact: true })).toBeVisible();
  await expect.poll(() => f.ledger.snapshot().filter(r => r.terminal === 'aborted').length).toBe(4 + probes.length);
  expect(f.ledger.snapshot().filter(r => r.terminal === 'finished')).toEqual([]);
  f.release(); await expect(page).toHaveURL(/\/teacher\/help/); expect(f.writes).toEqual([]);
});
test('Teacher Calendar empty, stale refresh and uncached offline reconnect stay bounded', async ({ page }) => {
  await page.clock.install(); const f = await fixture(page); f.empty();
  await page.goto('/teacher/calendar'); await ready(page); await f.settled(1); await expect(page.getByText('No activities on this date.')).toBeVisible();
  await nav(page, 'Help & Support'); await expect(page.getByRole('heading', { name: 'Calendar', exact: true })).toHaveCount(0);
  await page.clock.fastForward(31_000); await nav(page, 'Calendar'); await ready(page); await f.settled(2);
  await nav(page, 'Help & Support'); await expect(page.getByRole('heading', { name: 'Calendar', exact: true })).toHaveCount(0);
  await page.clock.fastForward(6 * 60_000); const mark = f.ledger.mark(); await page.context().setOffline(true); await nav(page, 'Calendar');
  await expect(page.getByRole('alert').first()).toContainText('offline'); await ready(page);
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Retry', exact: true }).first().click();
  expect(f.ledger.snapshot(mark)).toEqual([]);
  await page.context().setOffline(false); await expect(page.getByRole('alert')).toHaveCount(0); await f.settled(3);
});
