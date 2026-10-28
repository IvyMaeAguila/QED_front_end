import { test, expect, type Page } from '@playwright/test';
import { mockAdminUsers } from './fixtures/adminUsers';
import {waitForQueryReader} from './fixtures/queryLifecycle';
import { waitForDataRoute } from './fixtures/routeReady';
// All API responses and authentication are deterministic mocks. The real page,
// router, auth lifecycle, QueryClient and built artifact are exercised.
const accounts = (page: Page) => page.getByRole('region', { name: 'User accounts', exact: true });
const shown = (page: Page) => expect(page.getByText('4 of 4 accounts shown')).toBeVisible();
async function open(page: Page, path = '/admin/users') { await page.goto(path); await waitForDataRoute(page); }
async function list(page: Page) { await page.getByRole('link', { name: 'Manage Users', exact: true }).first().click(); await waitForDataRoute(page); }
async function save(page: Page, firstName: string) {
  // API completion and an enabled Save button can precede a field's crossfade.
  // Wait for each real control to replace its disabled, aria-hidden placeholder.
  const nameField = page.locator('[data-sk-region="user-form-firstName"]');
  await expect(nameField).toHaveAttribute('data-sk-phase', 'settled');
  await nameField.getByRole('textbox').fill(firstName);
  const statusField = page.locator('[data-sk-region="user-form-status"]');
  await expect(statusField).toHaveAttribute('data-sk-phase', 'settled');
  await statusField.getByRole('combobox').selectOption('Active');
  await page.getByRole('button', { name: 'Save Changes', exact: true }).click();
}
test('mocked Dashboard bootstrap hands fresh records to Users without another completed request', async ({ page }) => {
  const f = await mockAdminUsers(page); await open(page, '/admin');
  await expect(page.getByText('Synthetic Actor p1', { exact: true })).toBeVisible(); await f.ledger.successfulBatch();
  const before = f.state.calls; await list(page); await shown(page); expect(f.state.calls).toBe(before);
});
test('mocked fresh navigation reuses data; stale navigation performs one completed revalidation', async ({ page }, info) => {
  await page.clock.install(); const f = await mockAdminUsers(page); await open(page); await shown(page); await f.ledger.successfulBatch(); const before = f.state.calls;
  await page.getByRole('link', { name: 'Classes', exact: true }).first().click(); await waitForDataRoute(page);
  await expect(accounts(page)).toHaveCount(0); await list(page); await shown(page); expect(f.state.calls).toBe(before);
  await page.getByRole('link', { name: 'Classes', exact: true }).first().click(); await waitForDataRoute(page); await expect(accounts(page)).toHaveCount(0);
  // Classes now hands its shared providers to a separate lazy Query driver.
  // Finish that ownership handoff before advancing the cache clock.
  await waitForQueryReader(page,'ADMIN',['classes','list'],true);
  await waitForQueryReader(page,'ADMIN',['teachers','list'],true);
  await f.settled(); const mark = f.ledger.mark(); await page.clock.fastForward(30_001); await list(page); await shown(page);
  const batch = await f.ledger.successfulBatch(mark); expect(f.state.calls - before).toBe(1 + batch.filter(r => r.terminal === 'aborted' && r.intercepted).length);
  if (info.project.name === 'fresh-production') expect(f.state.calls).toBe(2);
});
test('mocked empty data keeps native empty UI', async ({ page }) => {
  const f = await mockAdminUsers(page); f.state.rows = []; await open(page);
  await expect(page.getByText('0 of 0 accounts shown')).toBeVisible(); await expect(accounts(page).getByRole('alert')).toHaveCount(0);
});
for (const status of [500, 403]) test(`mocked initial ${status} settles and explicit Retry recovers`, async ({ page }) => {
  const f = await mockAdminUsers(page); f.state.status = status; await open(page);
  await expect(accounts(page).getByRole('alert').first()).toContainText(`Synthetic users ${status}`);
  await expect(page.getByText('parent@example.invalid', { exact: true }).filter({ visible: true })).toHaveCount(0);
  const before = f.state.calls; f.state.status = 200; await accounts(page).getByRole('button', { name: 'Retry', exact: true }).filter({ visible: true }).click();
  await shown(page); expect(f.state.calls).toBe(before + 1);
});
test('mocked cached 403 hides private rows and preserves the signed-in Admin', async ({ page }) => {
  const f = await mockAdminUsers(page); await page.clock.install(); await open(page); await shown(page);
  await page.getByRole('link', { name: 'Classes', exact: true }).first().click(); await waitForDataRoute(page); await expect(accounts(page)).toHaveCount(0);
  f.state.status = 403; await page.clock.fastForward(30_001); await list(page);
  await expect(accounts(page).getByRole('alert').first()).toContainText('Synthetic users 403');
  await expect(page.getByText('parent@example.invalid', { exact: true }).filter({ visible: true })).toHaveCount(0); await expect(page).toHaveURL(/\/admin\/users$/);
});
test('mocked 401 expires the session instead of displaying account records', async ({ page }) => {
  const f = await mockAdminUsers(page); f.state.status = 401; await open(page);
  await expect(page).toHaveURL(/\/login/); await expect(page.getByText('parent@example.invalid', { exact: true })).toHaveCount(0);
});
test('mocked cached offline navigation preserves records and resumes a bounded Retry', async ({ page }) => {
  let phase='initial';const lifecycle:{event:string;path:string;phase:string;kind?:string;status?:number;failure?:string}[]=[];
  page.on('request',r=>{if(r.resourceType()==='script'||/\/api\/(classes|section|user)\//.test(r.url()))lifecycle.push({event:'request',path:new URL(r.url()).pathname,phase,kind:r.resourceType()});});
  page.on('response',r=>{if(r.request().resourceType()==='script')lifecycle.push({event:'response',path:new URL(r.url()).pathname,phase,status:r.status()});});
  page.on('requestfailed',r=>lifecycle.push({event:'failed',path:new URL(r.url()).pathname,phase,failure:r.failure()?.errorText}));
  try {
    const f = await mockAdminUsers(page); await open(page); await shown(page); await f.settled(); const before = f.state.calls;
    phase='classes';await page.getByRole('link', { name: 'Classes', exact: true }).first().click(); await waitForDataRoute(page); await expect(accounts(page)).toHaveCount(0);
    await waitForQueryReader(page,'ADMIN',['classes','list'],true);
    await waitForQueryReader(page,'ADMIN',['teachers','list'],true);
    phase='offline';await page.context().setOffline(true); await list(page); await expect(accounts(page).getByRole('alert').first()).toContainText('offline'); await shown(page);
    const retry = accounts(page).getByRole('button', { name: 'Retry', exact: true }).filter({ visible: true }); await retry.click(); await retry.click(); expect(f.state.calls).toBe(before);
    phase='reconnect';await page.context().setOffline(false); await expect(accounts(page).getByRole('alert')).toHaveCount(0); await shown(page); expect(f.state.calls).toBe(before);
  } finally {await test.info().attach('sanitized-Admin-offline-lifecycle',{body:Buffer.from(JSON.stringify(lifecycle)),contentType:'application/json'});}
});

test('mocked edit and status mutation update the list without an optimistic patch or duplicate PUT', async ({ page }) => {
  const f = await mockAdminUsers(page); await open(page, '/admin/users/parent/1/edit');
  await expect(page.getByRole('button', { name: 'Save Changes', exact: true })).toBeEnabled(); await f.settled(); const before = f.state.calls;
  f.holdWrite(); await save(page, 'ChangedParent'); await expect.poll(() => f.state.mutations.length).toBe(1);
  expect(f.state.rows.find(r => r.role === 'PARENT')?.firstName).toBe('Parent'); await expect(page.getByRole('button', { name: 'Saving...', exact: true })).toBeDisabled(); f.releaseWrite();
  await expect(page.getByText('User updated.', { exact: true })).toBeVisible(); await shown(page);
  const row = page.getByRole('row').filter({ hasText: 'parent@example.invalid' }); await expect(row).toContainText('ChangedParent'); await expect(row).toContainText('Active');
  expect(f.state.mutations).toHaveLength(1); expect(f.state.mutations[0]).toMatchObject({ method: 'PUT', path: '/api/user/editUser/1', payload: { role: 'PARENT', status: 'Active' } }); expect(f.state.calls).toBe(before + 1);
});
test('mocked failed edit preserves draft and records, without invalidation', async ({ page }) => {
  const f = await mockAdminUsers(page); await open(page, '/admin/users/parent/1/edit'); await expect(page.getByRole('button', { name: 'Save Changes', exact: true })).toBeEnabled(); await f.settled(); const before = f.state.calls;
  f.state.mutationStatus = 500; await save(page, 'UnsavedDraft'); await expect(page.getByText('Synthetic write failed', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'OK', exact: true }).click(); await expect(page.locator('[data-sk-region="user-form-firstName"] input')).toHaveValue('UnsavedDraft'); expect(f.state.calls).toBe(before); expect(f.state.rows.find(r => r.role === 'PARENT')?.firstName).toBe('Parent');
});
for (const failed of [false, true]) test(`mocked deletion ${failed ? 'failure and explicit recovery' : 'success'} waits for confirmation and refreshes once`, async ({ page }) => {
  const f = await mockAdminUsers(page); await open(page, '/admin/users/parent/1'); await expect(page.getByRole('heading', { name: 'Fixture, Parent', exact: true })).toBeVisible(); await f.ledger.successfulBatch(); const before = f.state.calls;
  await page.getByRole('button', { name: 'Remove User', exact: true }).click(); const dialog = page.getByRole('alertdialog');
  if (failed) f.state.mutationStatus = 500; else f.holdWrite(); await dialog.getByRole('button', { name: 'Remove User', exact: true }).click();
  if (failed) { await expect(dialog.getByRole('alert')).toContainText('Synthetic write failed'); await expect(page).toHaveURL(/\/parent\/1$/); expect(f.state.calls).toBe(before); f.state.mutationStatus = 200; await dialog.getByRole('button', { name: 'Retry', exact: true }).click(); }
  else { await expect.poll(() => f.state.mutations.length).toBe(1); await expect(page).toHaveURL(/\/parent\/1$/); await expect(dialog.getByRole('button', { name: 'Removing…', exact: true })).toBeDisabled(); f.releaseWrite(); }
  await expect(page).toHaveURL(/\/admin\/users$/); await expect(page.getByText('3 of 3 accounts shown')).toBeVisible(); expect(f.state.calls).toBe(before + 1);
  expect(f.state.mutations).toHaveLength(failed ? 2 : 1); expect(f.state.mutations.at(-1)).toMatchObject({ method: 'PATCH', path: '/api/user/deleteUser/1', payload: { role: 'PARENT' } });
});
test('mocked Teacher edit refreshes Admin profile Query/mapping and affected Dashboard readers only', async ({ page }, info) => {
  const f = await mockAdminUsers(page); await open(page, '/admin'); await expect(page.getByText('Synthetic Actor p1', { exact: true })).toBeVisible(); await f.settled(); await list(page); await shown(page);
  const row = page.getByRole('row').filter({ hasText: 'teacher@example.invalid' }); await row.getByRole('button').click(); await page.getByRole('menuitem', { name: 'View', exact: true }).click();
  // The remaining Admin profile reader now deduplicates completed reads. Keep
  // real StrictMode cancellation probes distinct from successful responses.
  await expect(page.getByRole('heading', { name: 'Teacher Fixture', exact: true })).toBeVisible(); const initialProfile = await f.profileLedger.successfulBatch(0, 1);
  expect(f.state.profileReads).toBe(1 + initialProfile.filter(r=>r.terminal==='aborted'&&r.intercepted).length);
  if(info.project.name==='fresh-production')expect(f.state.profileReads).toBe(1);
  const profileMark = f.profileLedger.mark(), profiles = f.state.profileReads, lookups = f.state.teacherLookups;
  await page.getByRole('button', { name: 'Edit User', exact: true }).click(); await expect(page.getByRole('button', { name: 'Save Changes', exact: true })).toBeEnabled(); await save(page, 'UpdatedTeacher');
  await expect(page.getByText('User updated.', { exact: true })).toBeVisible(); await shown(page);
  const updated = page.getByRole('row').filter({ hasText: 'teacher@example.invalid' }); await expect(updated).toContainText('UpdatedTeacher'); await updated.getByRole('button').click(); await page.getByRole('menuitem', { name: 'View', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'UpdatedTeacher Fixture', exact: true })).toBeVisible(); const refreshedProfile=await f.profileLedger.successfulBatch(profileMark, 1);
  expect(f.state.profileReads).toBe(profiles + 1 + refreshedProfile.filter(r=>r.terminal==='aborted'&&r.intercepted).length);
  if(info.project.name==='fresh-production')expect(f.state.profileReads).toBe(profiles+1);
  expect(f.state.teacherLookups).toBe(lookups + 1);
  const counts = Object.fromEntries(Object.entries(f.dashboardState).map(([name, s]) => [name, s.calls]));
  const marks = { users: f.ledgers.users.mark(), audit: f.ledgers.audit.mark() };
  await page.getByRole('link', { name: 'Dashboard', exact: true }).first().click(); await waitForDataRoute(page); await expect(page.getByText('Synthetic Actor p1', { exact: true })).toBeVisible();
  for (const endpoint of ['users', 'audit'] as const) {
    const batch = await f.ledgers[endpoint].successfulBatch(marks[endpoint]);
    expect(f.dashboardState[endpoint].calls - counts[endpoint]).toBe(1 + batch.filter(r => r.terminal === 'aborted' && r.intercepted).length);
    if (info.project.name === 'fresh-production') expect(f.dashboardState[endpoint].calls).toBe(counts[endpoint] + 1);
  }
  expect(f.dashboardState.students.calls).toBe(counts.students); expect(f.dashboardState.frequency.calls).toBe(counts.frequency);
});
