import { test, expect } from '@playwright/test';

test('the real login submits once to the configured API origin', async ({ page, baseURL }) => {
  const expectedOrigin = process.env.QED_EXPECT_API_ORIGIN || 'http://localhost:7400';
  const localOrigin = new URL(baseURL!).origin;
  const loginRequests: { url: string; method: string }[] = [];
  await page.route('**/*', async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === '/api/auth/login') {
      loginRequests.push({ url: request.url(), method: request.method() });
      return route.fulfill({ status: 401, json: { message: 'Synthetic credentials rejected' } });
    }
    if (url.pathname === '/api/auth/me') return route.fulfill({ status: 401, json: { message: 'No token provided.' } });
    if (url.origin === localOrigin && !url.pathname.startsWith('/api/')) return route.continue();
    return route.abort();
  });
  await page.goto('/login');
  await page.getByPlaceholder('e.g. TC_maria.delacruz').fill('TC_synthetic');
  await page.locator('input[type="password"]').fill('synthetic-password');
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await expect(page.getByText('Synthetic credentials rejected', { exact: true })).toBeVisible();
  expect(loginRequests).toHaveLength(1);
  expect(new URL(loginRequests[0].url).origin).toBe(expectedOrigin);
  expect(new URL(loginRequests[0].url).pathname).toBe('/api/auth/login');
  expect(loginRequests[0].method).toBe('POST');
});
