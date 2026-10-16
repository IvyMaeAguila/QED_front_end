import { test, expect, type Page } from '@playwright/test';
import { mockDirectory } from './fixtures/directory';
import { waitForDataRoute } from './fixtures/routeReady';
async function setup(page: Page, role: string, status = 201, delivery = 'accepted') {
  const release = await mockDirectory(page, 'ADMIN', false); release();
  let listReads = 0, creates = 0, registrations = 0, created = false;
  let payload: Record<string, unknown> | undefined;
  await page.route('**/api/user/usersList', route => { listReads++; return route.fulfill({ json: { success: true, data: created ? [{ id: '10', firstName: 'Fixture', lastName: 'Only', middleName: '', role, email: 'fixture@example.invalid', contactNumber: '00000000000', status: 'Active', gender: 'Male' }] : [] } }); });
  await page.route('**/api/auth/register', route => { registrations++; return route.fulfill({ status: 500, json: { message: 'Unexpected split registration' } }); });
  await page.route('**/api/user/addUser', async route => {
    creates++; payload = route.request().postDataJSON(); created = status === 201;
    await route.fulfill({ status, json: { success: status === 201, message: status === 201 ? 'Created' : 'Synthetic provisioning failure', data: { id: 10 }, credentialDelivery: delivery } });
  });
  await page.goto('/admin/users/new'); await waitForDataRoute(page);
  await expect(page.getByRole('button', { name: 'Continue', exact: true })).toBeEnabled();
  const form = page.getByRole('region', { name: 'User account form' });
  await form.locator('input').nth(0).fill('Only'); await form.locator('input').nth(1).fill('Fixture');
  await form.locator('select').first().selectOption(role);
  if (role !== 'ADMIN') await page.locator('#user-gender').selectOption('Male');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.locator('[data-sk-region="user-form-email"] input').fill('fixture@example.invalid');
  await page.locator('[data-sk-region="user-form-contactNumber"] input').fill('00000000000');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  return { snapshot: () => ({ listReads, creates, registrations, payload }) };
}
for (const role of ['TEACHER', 'PRINCIPAL', 'PARENT', 'ADMIN']) test(`mocked atomic ${role} creation posts once and refreshes users`, async ({ page }) => {
  const fixture = await setup(page, role); const before = fixture.snapshot().listReads;
  await page.getByRole('button', { name: 'Add User', exact: true }).click();
  await expect(page.getByText(/The email provider accepted the credentials email/)).toBeVisible();
  expect(fixture.snapshot().creates).toBe(1); expect(fixture.snapshot().registrations).toBe(0);
  expect(fixture.snapshot().listReads).toBe(before + 1);
  const payload = fixture.snapshot().payload!; expect(payload).toMatchObject({ role, firstName: 'Fixture', lastName: 'Only', email: 'fixture@example.invalid' });
  for (const key of ['userId', 'userName', 'password', 'generatedPassword']) expect(payload).not.toHaveProperty(key);
});
for (const status of [409, 500]) test(`mocked provisioning ${status} does not claim success or refresh list`, async ({ page }) => {
  const fixture = await setup(page, 'TEACHER', status); const before = fixture.snapshot().listReads;
  await page.getByRole('button', { name: 'Add User', exact: true }).click();
  await expect(page.getByText('Synthetic provisioning failure', { exact: true })).toBeVisible();
  expect(fixture.snapshot().listReads).toBe(before); expect(fixture.snapshot().creates).toBe(1); expect(fixture.snapshot().registrations).toBe(0);
  await expect(page.getByText(/credentials were sent/i)).toHaveCount(0);
});
for (const delivery of ['failed', 'test-recipient']) test(`mocked ${delivery} email result uses truthful feedback`, async ({ page }) => {
  const fixture = await setup(page, 'TEACHER', 201, delivery);
  await page.getByRole('button', { name: 'Add User', exact: true }).click();
  await expect(page.getByText(delivery === 'failed' ? /credentials email delivery failed/ : /configured development test recipient/)).toBeVisible();
  await expect(page.getByText(/The email provider accepted/)).toHaveCount(0); expect(fixture.snapshot().creates).toBe(1);
});
