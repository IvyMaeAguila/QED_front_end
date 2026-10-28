import { test, expect, type Page } from '@playwright/test';
import { mockAdminDashboard } from './fixtures/adminDashboard';
import { mockDirectory } from './fixtures/directory';
import { mockTeacher } from './fixtures/teacher';
import { mockParent } from './fixtures/parent';
const roles = ['ADMIN', 'PRINCIPAL', 'TEACHER', 'PARENT'] as const;
async function fixture(page: Page, role: typeof roles[number]) {
  if (role === 'ADMIN') await mockAdminDashboard(page);
  else if (role === 'PRINCIPAL') (await mockDirectory(page, role, false))();
  else if (role === 'TEACHER') (await mockTeacher(page))();
  else await mockParent(page);
}
for (const role of roles) {
  for (const kind of ['expired', 'invalid', 'missing']) test(`F07 ${role}: ${kind} bootstrap 401 reaches login once without private content or cookie deletion`, async ({ page, context }) => {
    await fixture(page, role);
    await context.addCookies([{ name: 'token', value: 'synthetic-rejected-token', url: 'http://localhost:7400', httpOnly: true, sameSite: 'Lax' }]);
    let calls = 0; const privateRequests: string[] = [];
    page.on('request', req => { const path = new URL(req.url()).pathname; if (path.startsWith('/api/') && path !== '/api/auth/me') privateRequests.push(path); });
    await page.route('**/api/auth/me', route => { calls++; return route.fulfill({ status: 401, json: { message: kind === 'missing' ? 'No token provided.' : 'Invalid or expired token.' } }); });
    await page.goto(`/${role.toLowerCase()}`);
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByPlaceholder('e.g. TC_maria.delacruz')).toBeVisible();
    await expect(page.locator('.qed-account-ui')).toHaveCount(0);
    await expect(page.locator('[data-sk-region="auth-verification"]')).toHaveCount(0);
    const settled = calls; await page.waitForTimeout(100); expect(calls).toBe(settled);
    expect(privateRequests).toEqual([]);
    expect((await context.cookies('http://localhost:7400')).find(c => c.name === 'token')?.value).toBe('synthetic-rejected-token');
  });
  test(`F07 ${role}: generic bootstrap 403 preserves cookie and URL and cannot expose protected content`, async ({ page, context }) => {
    await fixture(page, role);
    await context.addCookies([{ name: 'token', value: 'synthetic-valid-token', url: 'http://localhost:7400', httpOnly: true, sameSite: 'Lax' }]);
    await page.route('**/api/auth/me', route => route.fulfill({ status: 403, json: { message: 'Forbidden role.' } }));
    await page.goto(`/${role.toLowerCase()}`);
    await expect(page.locator('[data-sk-region="auth-verification"]').getByRole('alert')).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/${role.toLowerCase()}$`));
    await expect(page.locator('.qed-account-ui')).toHaveCount(0);
    expect((await context.cookies('http://localhost:7400')).find(c => c.name === 'token')?.value).toBe('synthetic-valid-token');
  });
}
// Exercise actual role/shared transports. No blanket 403 expiration rule or
// automatic retry is introduced at either the read or mutation boundary.
for (const client of ['parent', 'teacher', 'calendar', 'notification'] as const) {
  for (const status of [401, 403, 500, 503]) test(`F07 ${client} ${status}: only 401 expires and each failed operation is sent once`, async ({ page }) => {
    const requests: string[] = [];
    await page.route('**/api/**', route => { requests.push(route.request().method()); return route.fulfill({ status, json: { message: 'Synthetic denial', outcome: 'uncertain' } }); });
    await page.route('**/socket.io/**', route => route.abort());
    await page.goto('/loading-harness.html');
    const result = await page.evaluate(async ({ client }) => {
      let expirations = 0; const options = { onUnauthorized: () => expirations++ };
      const errors: Array<{ status: number; outcome?: string }> = [];
      const attempt = async (work: () => Promise<unknown>) => { try { await work(); } catch (e) { const error = e as { status: number; outcome?: string }; errors.push({ status: error.status, ...(error.outcome ? { outcome: error.outcome } : {}) }); } };
      if (client === 'parent') {
        const { parentFetch } = await import('/src/features/profiles/parent/query/parentRequest.ts');
        await attempt(() => parentFetch('http://localhost:7400/api/f07', options));
        await attempt(() => parentFetch('http://localhost:7400/api/f07', options, { method: 'POST' }));
      } else if (client === 'teacher') {
        const { getEffectiveWeightsSafe } = await import('/src/features/profiles/teacher/pages/subjects/services/subjectGradeTemplate.service.ts');
        await attempt(() => getEffectiveWeightsSafe(1, '1', options));
      } else if (client === 'calendar') {
        const { fetchAllCalendarActivities, createCalendarActivities } = await import('/src/shared/calendar/services/calendar.service.ts');
        await attempt(() => fetchAllCalendarActivities(options));
        await attempt(() => createCalendarActivities([{ title: 'Synthetic', date: '2090-01-01' }], 1, options));
      } else {
        const { notificationService } = await import('/src/shared/notification/Notification.service.ts');
        await attempt(() => notificationService.getAll('1', options));
        await attempt(() => notificationService.markAsRead(1, options));
      }
      return { expirations, errors };
    }, { client });
    const count = client === 'teacher' ? 1 : 2;
    expect(requests).toHaveLength(count);
    expect(result.expirations).toBe(status === 401 ? count : 0);
    // F05 now rejects grading-rule outages; 401-only expiration and one-send semantics remain unchanged.
    expect(result.errors).toHaveLength(count);
    expect(result.errors.every(e => e.status === status)).toBe(true);
    if (client === 'parent') expect(result.errors.every(e => e.outcome === 'uncertain')).toBe(true);
    await page.waitForTimeout(100); expect(requests).toHaveLength(count);
  });
}
