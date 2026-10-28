import { test, expect, type Page, type Route } from '@playwright/test';
import { mockAdminDashboard } from './fixtures/adminDashboard';
import { mockDirectory } from './fixtures/directory';
import { mockTeacher } from './fixtures/teacher';
import { mockParent } from './fixtures/parent';

const roles = ['ADMIN', 'PRINCIPAL', 'TEACHER', 'PARENT'] as const;
type Role = typeof roles[number];
type Mode = 'success' | '500' | '503' | 'network' | 'abort' | 'timeout' | '403' | 'invalid' | 'missing' | 'null' | 'malformed' | 'html' | 'unknown-role';
const home = (role: Role) => `/${role.toLowerCase()}`;
const verification = (page: Page) => page.locator('[data-sk-region="auth-verification"]');

async function fixture(page: Page, role: Role, mode: Mode = 'success', dark = false) {
  if (role === 'ADMIN') await mockAdminDashboard(page, dark);
  else if (role === 'TEACHER') (await mockTeacher(page, dark))();
  else if (role === 'PARENT') await mockParent(page, dark);
  else (await mockDirectory(page, role, dark))();
  const user = { id: role === 'PARENT' ? '801' : '1', role, user_name: 'synthetic', name: 'Synthetic Session' };
  let release = () => {};
  const state = { mode, authCalls: 0, privateCalls: [] as string[], writes: [] as string[], release: () => release() };
  page.on('request', request => {
    const path = new URL(request.url()).pathname;
    if (!path.startsWith('/api/')) return;
    if (path !== '/api/auth/me') state.privateCalls.push(path);
    if (request.method() !== 'GET' && request.method() !== 'OPTIONS') state.writes.push(path);
  });
  await page.route('**/api/auth/me', async route => {
    state.authCalls++;
    const current = state.mode;
    if (current === 'timeout') await new Promise<void>(resolve => { release = resolve; });
    if (current === 'network' || current === 'abort') return route.abort(current === 'network' ? 'internetdisconnected' : 'aborted');
    if (current === '500' || current === '503') return route.fulfill({ status: Number(current), json: { message: 'Synthetic outage', user } });
    if (current === 'missing') return route.fulfill({ status: 401, json: { message: 'No token provided.' } });
    if (current === 'invalid') return route.fulfill({ status: 403, json: { message: 'Invalid or expired token.' } });
    if (current === '403') return route.fulfill({ status: 403, json: { message: 'Request origin is not allowed.' } });
    if (current === 'null') return route.fulfill({ json: { user: null } });
    if (current === 'malformed') return route.fulfill({ json: { success: true } });
    if (current === 'html') return route.fulfill({ status: 503, contentType: 'text/html', body: '<h1>Unavailable</h1>' });
    if (current === 'unknown-role') return route.fulfill({ json: { user: { ...user, role: 'OWNER' } } });
    return route.fulfill({ json: { user } });
  });
  return { state, user };
}

async function authenticated(page: Page, role: Role) {
  await expect(page).toHaveURL(new RegExp(`/${role.toLowerCase()}(?:/|$)`));
  await expect(page.locator('.qed-account-ui').first()).toBeVisible();
  await expect(verification(page)).toHaveCount(0);
}

for (const role of roles) {
  test(`${role}: verified bootstrap gates private reads until session verification completes`, async ({ page }) => {
    const { state } = await fixture(page, role, 'timeout');
    await page.goto(home(role));
    await expect.poll(() => state.authCalls).toBeGreaterThan(0);
    expect(state.privateCalls).toEqual([]);
    await expect(page.locator('.qed-account-ui')).toHaveCount(0);
    state.release();
    await authenticated(page, role);
    expect(state.writes).toEqual([]);
  });

  for (const mode of ['missing', 'invalid', 'null'] as const) {
    test(`${role}: confirmed ${mode} session redirects to login`, async ({ page, context }) => {
      const { state } = await fixture(page, role, mode);
      // No cookie is stored: authentication is cookie-based, not localStorage.
      expect(await context.cookies('http://localhost:7400')).toEqual([]);
      await page.goto(home(role));
      await expect(page).toHaveURL(/\/login$/);
      await expect(page.getByPlaceholder('e.g. TC_maria.delacruz')).toBeVisible();
      await expect(verification(page)).toHaveCount(0);
      expect(state.privateCalls).toEqual([]);
      expect(state.writes).toEqual([]);
    });
  }

  for (const mode of ['500', '503', 'network', 'abort', 'timeout', '403', 'malformed', 'html', 'unknown-role'] as const) {
    test(`${role}: ${mode} verification failure retains credentials, blocks private content and recovers only on Retry`, async ({ page, context }) => {
      if (mode === 'timeout') await page.clock.install();
      await context.addCookies([{ name: 'token', value: 'synthetic-existing-session', url: 'http://localhost:7400', httpOnly: true, sameSite: 'Lax' }]);
      const { state } = await fixture(page, role, mode);
      await page.goto(home(role));
      await expect.poll(() => state.authCalls).toBeGreaterThan(0);
      if (mode === 'timeout') await page.clock.fastForward(15_001);
      await expect(verification(page).getByRole('alert')).toContainText('Unable to verify your session.');
      await expect(page).toHaveURL(new RegExp(`${home(role)}$`));
      await expect(page.locator('.qed-account-ui')).toHaveCount(0);
      await expect(page.getByPlaceholder('e.g. TC_maria.delacruz')).toHaveCount(0);
      expect(state.privateCalls).toEqual([]);
      expect(state.writes).toEqual([]);
      const calls = state.authCalls;
      if (mode === 'timeout') { state.release(); await page.clock.resume(); }
      // Settled errors neither loop verification nor replay a write.
      await page.waitForTimeout(100);
      expect(state.authCalls).toBe(calls);
      expect((await context.cookies('http://localhost:7400')).find(c => c.name === 'token')?.value).toBe('synthetic-existing-session');
      state.mode = 'success';
      await verification(page).getByRole('button', { name: 'Retry', exact: true }).click();
      await authenticated(page, role);
      expect(state.authCalls).toBe(calls + 1);
      expect(state.writes).toEqual([]);
      expect((await context.cookies('http://localhost:7400')).find(c => c.name === 'token')?.value).toBe('synthetic-existing-session');
    });
  }

  test(`${role}: role mismatch redirects to the verified role home`, async ({ page }) => {
    const { state } = await fixture(page, role);
    await page.goto(role === 'TEACHER' ? '/admin' : '/teacher');
    await authenticated(page, role);
    expect(state.writes).toEqual([]);
  });

  test(`${role}: explicit logout clears local identity and redirects to login`, async ({ page }) => {
    const { state } = await fixture(page, role);
    await page.goto(home(role)); await authenticated(page, role);
    await page.getByRole('button', { name: 'Log Out', exact: true }).click();
    await page.getByRole('dialog', { name: 'Confirm logout' }).getByRole('button', { name: 'Log out', exact: true }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.locator('.qed-account-ui')).toHaveCount(0);
    expect(state.writes).toEqual(['/api/auth/logout']);
  });

  test(`${role}: optional profile outage retains the session already verified by me`, async ({ page }) => {
    const { state } = await fixture(page, role);
    await page.route('**/api/user-profile/**', route => route.fulfill({ status: 503, json: { message: 'Profile unavailable' } }));
    await page.goto(home(role)); await authenticated(page, role);
    expect(state.writes).toEqual([]);
  });

  test(`${role}: an authenticated reload outage recovers the existing cookie without a new login`, async ({ page, context }) => {
    await context.addCookies([{ name: 'token', value: 'synthetic-existing-session', url: 'http://localhost:7400', httpOnly: true, sameSite: 'Lax' }]);
    const { state } = await fixture(page, role);
    await page.goto(home(role)); await authenticated(page, role);
    state.mode = '503'; await page.reload();
    await expect(verification(page).getByRole('alert')).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`${home(role)}$`));
    state.mode = 'success';
    await verification(page).getByRole('button', { name: 'Retry', exact: true }).click();
    await authenticated(page, role);
    expect(state.writes).toEqual([]);
    expect((await context.cookies('http://localhost:7400')).find(c => c.name === 'token')?.value).toBe('synthetic-existing-session');
  });

  test(`${role}: profile identity mismatch cannot change the verified role`, async ({ page }) => {
    await fixture(page, role);
    await page.route('**/api/user-profile/**', route => route.fulfill({ json: { id: '999', role: role === 'ADMIN' ? 'TEACHER' : 'ADMIN', name: 'Unrelated Identity' } }));
    await page.goto(home(role)); await authenticated(page, role);
    await expect(page.getByText('Unrelated Identity', { exact: true })).toHaveCount(0);
  });

  for (const status of [401, 403]) test(`${role}: confirmed invalid profile session (${status}) does not publish fallback identity`, async ({ page }) => {
    const { state } = await fixture(page, role);
    await page.route('**/api/user-profile/**', route => route.fulfill({ status, json: { message: 'Invalid or expired token.' } }));
    await page.goto(home(role));
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.locator('.qed-account-ui')).toHaveCount(0);
    expect(state.privateCalls.every(path => path.startsWith('/api/user-profile'))).toBe(true);
    expect(state.writes).toEqual([]);
  });
}

test('profile enrichment timeout falls back to the verified session without infinite loading', async ({ page }) => {
  await page.clock.install();
  await fixture(page, 'TEACHER');
  const pending: Route[] = [];
  await page.route('**/api/user-profile/**', route => { pending.push(route); });
  await page.goto('/teacher');
  await expect.poll(() => pending.length).toBeGreaterThan(0);
  await page.clock.fastForward(15_001); await page.clock.resume();
  await authenticated(page, 'TEACHER');
});

test('late bootstrap cannot replace a newer login and cleanup aborts its request', async ({ page }) => {
  const { state } = await fixture(page, 'PRINCIPAL', 'timeout');
  await page.goto('/tests/query-pilot.html');
  await expect(page.getByTestId('auth')).toHaveText('pending');
  await expect.poll(() => state.authCalls).toBeGreaterThan(0);
  await page.route('**/api/user-profile/**', route => route.fulfill({ json: { id: '2', role: 'PRINCIPAL', name: 'New Session', userName: 'new' } }));
  await page.getByRole('button', { name: 'Login again', exact: true }).click();
  await expect(page.getByTestId('auth')).toHaveText('2');
  // The old bootstrap has been aborted; releasing it cannot publish user 1.
  state.release();
  await page.waitForTimeout(100);
  await expect(page.getByTestId('auth')).toHaveText('2');
});

for (const width of [375, 1280]) for (const dark of [false, true]) {
  test(`verification error fits ${width}px ${dark ? 'dark' : 'light'} and exposes an accessible retry`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await fixture(page, 'ADMIN', '503', dark);
    await page.goto('/admin');
    await expect(verification(page).getByRole('alert')).toBeVisible();
    if (dark) await expect(page.locator('html')).toHaveClass(/dark/);
    else await expect(page.locator('html')).not.toHaveClass(/dark/);
    await expect(page.getByRole('heading', { name: 'Session verification unavailable' })).toBeVisible();
    await expect(verification(page).getByRole('button', { name: 'Retry', exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: test.info().outputPath('verification-error.png') });
  });
}

for (const failure of ['network', 'timeout'] as const) test(`verifier asset ${failure} has a bounded recovery screen and retry reloads the preserved session`, async ({ page, context }) => {
  if (failure === 'timeout') await page.clock.install();
  await context.addCookies([{ name: 'token', value: 'synthetic-existing-session', url: 'http://localhost:7400', httpOnly: true, sameSite: 'Lax' }]);
  const { state } = await fixture(page, 'ADMIN');
  const asset = /\/src\/features\/auth\/services\/sessionVerification\.service\.ts(?:\?.*)?$/;
  let requested = 0;
  await page.route(asset, route => { requested++; if (failure === 'network') return route.abort('failed'); });
  await page.goto('/admin');
  await expect.poll(() => requested).toBeGreaterThan(0);
  if (failure === 'timeout') await page.clock.fastForward(15_001);
  const fallback = page.locator('[data-sk-region="auth-bootstrap"]');
  await expect(fallback.getByRole('alert')).toBeVisible();
  expect(state.authCalls).toBe(0);
  expect(state.privateCalls).toEqual([]);
  expect(state.writes).toEqual([]);
  await page.unroute(asset);
  if (failure === 'timeout') await page.clock.resume();
  await fallback.getByRole('button', { name: 'Retry', exact: true }).click();
  await authenticated(page, 'ADMIN');
  expect(state.writes).toEqual([]);
  expect((await context.cookies('http://localhost:7400')).find(c => c.name === 'token')?.value).toBe('synthetic-existing-session');
});
