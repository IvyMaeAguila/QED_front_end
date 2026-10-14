import { test, expect, type Page } from '@playwright/test';
import { mockAdminUsers } from './fixtures/adminUsers';
const click = (page: Page, name: string) => page.getByRole('button', { name, exact: true }).click();
async function fixture(page: Page, holdAuth = false, clock = false, strict = false) {
  if (clock) await page.clock.install({ time: new Date('2026-10-12T02:00:00Z') });
  const f = await mockAdminUsers(page, false, holdAuth); await page.goto('/tests/admin-users-query.html' + (strict ? '?strict' : ''));
  await expect(page.getByTestId('auth')).toHaveText(holdAuth ? 'pending' : '1'); return f;
}
async function start(page: Page) { await click(page, 'Open users'); await click(page, 'Toggle preview'); }
async function loaded(page: Page) { await expect(page.getByTestId('users-loading')).toHaveText('false'); await expect(page.getByTestId('users-data')).toContainText('teacher@example.invalid'); }
async function cache(page: Page) { await click(page, 'Inspect cache'); return JSON.parse(await page.getByTestId('cache').innerText()) as { key: (string | number)[]; data?: unknown; invalidated: boolean; observers: number }[]; }
test('StrictMode has one completed initial read, identified cancellation probes and no fresh-navigation read', async ({ page }) => {
  const f = await fixture(page, false, false, true); await start(page); await loaded(page);
  const batch = await f.ledger.successfulBatch(0, 1), probes = batch.filter(r => r.terminal === 'aborted' && r.intercepted);
  expect(probes.length).toBeLessThanOrEqual(1); expect(f.state.calls).toBe(1 + probes.length);
  const before = f.state.calls; await click(page, 'Leave users'); await expect(page.getByTestId('users-data')).toHaveText('[]');
  await click(page, 'Open users'); await loaded(page); expect(f.state.calls).toBe(before);
});
test('auth readiness and route previews cannot request user records', async ({ page }) => {
  const f = await fixture(page, true); await click(page, 'Open users'); expect(f.state.calls).toBe(0);
  await click(page, 'Toggle preview'); expect(f.state.calls).toBe(0); f.releaseAuth(); await loaded(page); expect(f.state.calls).toBe(1);
  await click(page, 'Toggle preview'); await expect(page.getByTestId('users-data')).toHaveText('[]');
});
test('completed Query-free bootstrap hands off its original fresh data without another GET', async ({ page }) => {
  const f = await fixture(page); await click(page, 'Toggle preview'); await loaded(page); await f.settled(); expect(f.state.calls).toBe(1);
  expect((await cache(page)).filter(q => q.data !== undefined)).toHaveLength(0);
  await click(page, 'Open users'); await loaded(page); expect(f.state.calls).toBe(1);
  expect((await cache(page)).filter(q => q.data !== undefined)).toHaveLength(1);
});
test('fresh navigation and provider remount reuse the same list and Principal-conflict data', async ({ page }) => {
  const f = await fixture(page); await start(page); await loaded(page); await f.settled();
  await expect(page.getByTestId('principal')).toContainText('principal@example.invalid');
  await click(page, 'Leave users'); await expect(page.getByTestId('users-data')).toHaveText('[]');
  await click(page, 'Open users'); await loaded(page);
  await click(page, 'Toggle provider'); await click(page, 'Toggle provider'); await loaded(page); expect(f.state.calls).toBe(1);
});
test('stale remount revalidates once after thirty seconds', async ({ page }) => {
  const f = await fixture(page, false, true); await start(page); await loaded(page); await f.settled();
  await click(page, 'Leave users'); await expect.poll(async () => (await cache(page)).filter(q => q.data !== undefined).every(q => q.observers === 0)).toBe(true);
  await page.clock.fastForward(30_001); await click(page, 'Open users'); await loaded(page); await f.ledger.successfulBatch(0, 2); expect(f.state.calls).toBe(2);
});
test('inactive query is collected after five minutes', async ({ page }) => {
  await fixture(page, false, true); await start(page); await loaded(page);
  await click(page, 'Leave users'); await expect.poll(async () => (await cache(page)).every(q => q.observers === 0)).toBe(true);
  await page.clock.fastForward(300_001); expect(await cache(page)).toEqual([]);
});
test('loading, failure and bounded explicit Retry preserve request counts', async ({ page }) => {
  const f = await fixture(page); f.state.status = 500; f.hold(); await start(page);
  await expect.poll(() => f.state.calls).toBe(1); await expect(page.getByTestId('users-loading')).toHaveText('true');
  await click(page, 'Retry users'); await click(page, 'Retry users'); expect(f.state.calls).toBe(1); f.release();
  await expect(page.getByTestId('users-error')).toHaveText('Synthetic users 500'); await expect(page.getByTestId('users-loading')).toHaveText('false');
  f.state.status = 200; await click(page, 'Retry users'); await loaded(page); expect(f.state.calls).toBe(2);
});
test('empty list and absence of an active Principal remain successful', async ({ page }) => {
  const f = await fixture(page); f.state.rows = []; await start(page);
  await expect.poll(() => f.state.calls).toBe(1); await expect(page.getByTestId('users-loading')).toHaveText('false');
  await expect(page.getByTestId('users-data')).toHaveText('[]'); await expect(page.getByTestId('users-error')).toBeEmpty(); await expect(page.getByTestId('principal')).toBeEmpty();
});
for (const status of [401, 403]) test(`read ${status} preserves authentication/privacy contract`, async ({ page }) => {
  const f = await fixture(page); f.state.status = status; await start(page);
  if (status === 401) { await expect(page.getByTestId('auth')).toHaveText('signed-out'); expect((await cache(page)).filter(q => q.data !== undefined)).toHaveLength(0); }
  else { await expect(page.getByTestId('users-error')).toHaveText('Synthetic users 403'); await expect(page.getByTestId('auth')).toHaveText('1'); f.state.status = 200; await click(page, 'Retry users'); await loaded(page); }
});
test('cached private rows are hidden after a forbidden refresh', async ({ page }) => {
  const f = await fixture(page); await start(page); await loaded(page); f.state.status = 403; await click(page, 'Retry users');
  await expect(page.getByTestId('users-error')).toHaveText('Synthetic users 403'); await expect(page.getByTestId('users-data')).toHaveText('[]'); await expect(page.getByTestId('principal')).toBeEmpty();
});
for (const role of ['TEACHER', 'PRINCIPAL', 'PARENT']) test(`${role} cannot read or reuse Admin cache`, async ({ page }) => {
  const f = await fixture(page); await start(page); await loaded(page); await f.settled(); await click(page, `Switch ${role}`);
  await expect(page.getByTestId('users-data')).toHaveText('[]'); expect((await cache(page)).filter(q => q.data !== undefined)).toHaveLength(0); expect(f.state.calls).toBe(1);
});
test('logout clears user records and same-account login reads again', async ({ page }) => {
  const f = await fixture(page); await start(page); await loaded(page); await f.settled();
  await click(page, 'Logout'); await click(page, 'Log out'); await expect(page.getByTestId('auth')).toHaveText('signed-out');
  expect((await cache(page)).filter(q => q.data !== undefined)).toHaveLength(0); await click(page, 'Login again'); await loaded(page); await f.ledger.successfulBatch(0, 2);
});
for (const status of [200, 401]) test(`old-session pending ${status} is cancelled and cannot affect the new account`, async ({ page }) => {
  const f = await fixture(page); await start(page); await loaded(page); await f.settled(); const mark = f.ledger.mark();
  f.state.status = status; f.hold(); await click(page, 'Retry users'); await expect.poll(() => f.state.calls).toBe(2);
  f.state.status = 200; f.state.rows = f.state.rows.map(row => ({ ...row, firstName: 'NewAccount' }));
  await click(page, 'Switch account'); await expect(page.getByTestId('auth')).toHaveText('2');
  await expect.poll(() => f.ledger.snapshot(mark).some(r => r.terminal === 'aborted')).toBe(true); f.release();
  await expect(page.getByTestId('users-data')).toContainText('NewAccount'); await expect(page.getByTestId('auth')).toHaveText('2');
  expect((await cache(page)).filter(q => q.data !== undefined).every(q => q.key[3] === '2')).toBe(true);
});
test('leaving User Management cancels its pending read', async ({ page }) => {
  const f = await fixture(page); f.hold(); await start(page); await expect.poll(() => f.state.calls).toBe(1);
  await click(page, 'Leave users'); await expect.poll(() => f.ledger.snapshot().some(r => r.terminal === 'aborted')).toBe(true); f.release();
});
for (const cached of [false, true]) test(`offline ${cached ? 'cached' : 'initial'} requests recover once and reject queued writes`, async ({ page }) => {
  const f = await fixture(page);
  // Warm only the module, not its data, so the initial-offline case exercises
  // Query pause behavior independently of unavailable lazy JS chunks.
  await page.evaluate(() => import('/src/features/profiles/admin/pages/usermanagement/UsersQueryDriver.tsx'));
  if (cached) { await start(page); await loaded(page); await f.settled(); await click(page, 'Leave users'); }
  await page.context().setOffline(true);
  if (cached) await click(page, 'Open users'); else await start(page);
  await expect(page.getByTestId('users-error')).toContainText('offline'); await expect(page.getByTestId('users-loading')).toHaveText('false');
  if (cached) await expect(page.getByTestId('users-data')).toContainText('teacher@example.invalid');
  await click(page, 'Retry users'); await click(page, 'Retry users'); expect(f.state.calls).toBe(cached ? 1 : 0);
  await click(page, 'Create Teacher'); await expect(page.getByTestId('write-result')).toContainText('offline'); expect(f.state.mutations).toHaveLength(0);
  await page.context().setOffline(false); await loaded(page); await f.ledger.successfulBatch(0, 1); expect(f.state.calls).toBe(1);
});
for (const operation of ['Create Teacher', 'Edit Parent', 'Delete Teacher']) test(`${operation}: one write and success-only list/count/audit invalidation`, async ({ page }) => {
  const f = await fixture(page); await start(page); await loaded(page); await f.settled(); await click(page, 'Seed Dashboard');
  await click(page, operation); await expect(page.getByTestId('write-result')).toHaveText('success'); expect(f.state.mutations).toHaveLength(1);
  await f.ledger.successfulBatch(0, 2); expect(f.state.calls).toBe(2);
  const dashboard = (await cache(page)).filter(q => q.key[5] === 'dashboard');
  expect(dashboard.filter(q => q.invalidated).map(q => q.key[6]).sort()).toEqual(['audit', 'users']);
  if (operation === 'Create Teacher') { await expect(page.getByTestId('users-data')).toContainText('created@example.invalid'); for (const key of ['userId', 'password', 'generatedPassword']) expect(f.state.mutations[0].payload).not.toHaveProperty(key); }
  if (operation === 'Edit Parent') await expect(page.getByTestId('users-data')).toContainText('Changed');
  if (operation === 'Delete Teacher') await expect(page.getByTestId('users-data')).not.toContainText('teacher@example.invalid');
});
for (const status of [403, 409, 500]) test(`failed ${status} mutation changes no cached data and does not refetch`, async ({ page }) => {
  const f = await fixture(page); await start(page); await loaded(page); await f.settled(); await click(page, 'Seed Dashboard');
  const before = await page.getByTestId('users-data').innerText(); f.state.mutationStatus = status;
  await click(page, 'Create Teacher'); await expect(page.getByTestId('write-result')).toHaveText('Synthetic write failed');
  expect(f.state.mutations).toHaveLength(1); expect(f.state.calls).toBe(1); await expect(page.getByTestId('users-data')).toHaveText(before);
  expect((await cache(page)).filter(q => q.invalidated)).toEqual([]); await expect(page.getByTestId('auth')).toHaveText('1');
});
test('mutation 401 expires only its current session', async ({ page }) => {
  const f = await fixture(page); await start(page); await loaded(page); f.state.mutationStatus = 401; await click(page, 'Create Teacher');
  await expect(page.getByTestId('auth')).toHaveText('signed-out'); expect((await cache(page)).filter(q => q.data !== undefined)).toHaveLength(0);
});
test('duplicate pending creation is coalesced into one non-retried POST', async ({ page }) => {
  const f = await fixture(page); await start(page); await loaded(page); f.holdWrite(); await click(page, 'Create Teacher'); await expect.poll(() => f.state.mutations.length).toBe(1);
  await click(page, 'Create Teacher'); expect(f.state.mutations).toHaveLength(1); f.releaseWrite(); await expect(page.getByTestId('write-result')).toHaveText('success'); expect(f.state.mutations).toHaveLength(1);
});
for (const status of [200, 401]) test(`late mutation ${status} cannot invalidate or expire a newer login`, async ({ page }) => {
  const f = await fixture(page); await start(page); await loaded(page); f.state.mutationStatus = status; f.holdWrite(); await click(page, 'Create Teacher');
  await expect.poll(() => f.state.mutations.length).toBe(1); await click(page, 'Switch account'); await expect(page.getByTestId('auth')).toHaveText('2'); await loaded(page); await f.settled();
  const before = f.state.calls; await click(page, 'Seed Dashboard');
  const completed = page.waitForResponse(response => new URL(response.url()).pathname === '/api/user/addUser' && response.request().method() === 'POST');
  f.releaseWrite(); await (await completed).finished();
  // An old facade's callback has been disposed; inspect real request/cache state
  // after that intercepted POST has finished rather than sleeping.
  expect(f.state.mutations).toHaveLength(1);
  await expect(page.getByTestId('auth')).toHaveText('2'); expect(f.state.calls).toBe(before); expect((await cache(page)).filter(q => q.invalidated)).toEqual([]);
});
