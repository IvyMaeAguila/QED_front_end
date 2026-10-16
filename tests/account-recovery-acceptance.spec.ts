import { test, expect, type Page } from '@playwright/test';
import { mockDirectory } from './fixtures/directory';
// Browser-only contract fixtures. Actual router/JWT security is tested separately
// by the isolated backend suite; no live account, email or database is contacted.
async function setup(page: Page, failure?: 'otp' | 'reset') {
  const release = await mockDirectory(page, 'TEACHER', false); release();
  const calls: string[] = [];
  await page.route('**/api/auth/**', async route => {
    const path = new URL(route.request().url()).pathname;
    let status = 200, body: object = { user: null };
    if (path.endsWith('/forgot-password')) body = { message: 'If the account information matches, a recovery code will be emailed.' };
    if (path.endsWith('/verify-otp')) { status = failure === 'otp' ? 400 : 200; body = status === 400 ? { message: 'Invalid or expired OTP.' } : { resetToken: 'synthetic-browser-fixture' }; }
    if (path.endsWith('/reset-password')) { status = failure === 'reset' ? 401 : 200; body = { message: status === 401 ? 'Invalid or expired reset token. Please request a new one.' : 'Password reset successful.' }; }
    if (!path.endsWith('/me')) calls.push(path);
    await route.fulfill({ status, json: body });
  });
  await page.goto('/login');
  await page.getByRole('button', { name: 'Forgot password?' }).click();
  return calls;
}
async function requestCode(page: Page, role: string) {
  await page.getByPlaceholder('e.g. PRT_juan.delacruz').fill(`fixture.${role.toLowerCase()}`);
  await page.getByPlaceholder('you@example.com').fill('fixture@example.invalid');
  await page.getByRole('button', { name: 'Send OTP', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Enter Verification Code' })).toBeVisible();
  await expect(page.getByText(/If your account details match/)).toBeVisible();
}
async function verifyCode(page: Page) {
  await page.getByPlaceholder('000000').fill('123456');
  await page.getByRole('button', { name: 'Verify Code', exact: true }).click();
}
async function reset(page: Page) {
  await page.getByPlaceholder('Enter new password', { exact: true }).fill('fixturepass123');
  await page.getByPlaceholder('Re-enter new password', { exact: true }).fill('fixturepass123');
  await page.getByRole('button', { name: 'Reset Password', exact: true }).click();
}
for (const role of ['ADMIN', 'PRINCIPAL', 'TEACHER', 'PARENT']) test(`mocked ${role} recovery completes the existing modal flow`, async ({ page }) => {
  const calls = await setup(page); await requestCode(page, role); await verifyCode(page);
  await expect(page.getByRole('dialog', { name: 'Reset Password', exact: true })).toBeVisible();
  await reset(page); await expect(page.getByRole('dialog', { name: 'Reset Password', exact: true })).toHaveCount(0);
  await expect(page.getByRole('dialog', { name: 'Institutional Login' })).toBeVisible();
  expect(calls).toEqual(['/api/auth/forgot-password', '/api/auth/verify-otp', '/api/auth/reset-password']);
});
test('mocked invalid OTP stays in verification without submitting a reset', async ({ page }) => {
  const calls = await setup(page, 'otp'); await requestCode(page, 'TEACHER'); await verifyCode(page);
  await expect(page.getByText('Invalid or expired OTP.', { exact: true })).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Reset Password', exact: true })).toHaveCount(0);
  expect(calls).toEqual(['/api/auth/forgot-password', '/api/auth/verify-otp']);
});
test('mocked expired reset keeps the form and provides server feedback', async ({ page }) => {
  await setup(page, 'reset'); await requestCode(page, 'TEACHER'); await verifyCode(page); await reset(page);
  await expect(page.getByText('Invalid or expired reset token. Please request a new one.', { exact: true })).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Reset Password', exact: true })).toBeVisible();
});
test('mocked mobile recovery copy and controls remain usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await setup(page); await requestCode(page, 'TEACHER');
  await expect(page.getByRole('button', { name: 'Verify Code', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test('mocked Teacher session accesses Teacher shell and rejects Admin navigation', async ({ page }) => {
  const release = await mockDirectory(page, 'TEACHER', false); release();
  await page.goto('/teacher'); await expect(page.locator('.qed-account-ui')).toBeVisible();
  await expect(page).toHaveURL(/\/teacher/);
  await page.goto('/admin/users'); await expect(page).toHaveURL(/\/teacher/);
  await expect(page.locator('.qed-account-ui')).toBeVisible();
});
