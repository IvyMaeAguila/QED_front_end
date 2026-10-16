import { test, expect } from '@playwright/test';
import { mockAdminUsers } from './fixtures/adminUsers';
import { waitForDataRoute } from './fixtures/routeReady';
for (const width of [375, 1280]) for (const dark of [false, true]) test(`mocked Users golden ${width} ${dark}: local search/filter and role-scoped detail`, async ({ page }) => {
  await page.setViewportSize({ width, height: 1000 }); const f = await mockAdminUsers(page, dark);
  await page.goto('/admin/users'); await waitForDataRoute(page);
  await expect(page.getByText('4 of 4 accounts shown')).toBeVisible(); await f.settled(); const before = f.state.calls;
  await page.getByPlaceholder('Search name, ID, or email...').fill('parent@example.invalid');
  await expect(page.getByText('1 of 4 accounts shown')).toBeVisible();
  await page.getByPlaceholder('Search name, ID, or email...').fill('');
  await page.getByRole('button', { name: 'All Roles', exact: true }).selectOption('Parent');
  await page.getByRole('button', { name: 'All Statuses', exact: true }).selectOption('Inactive');
  await expect(page.getByText('1 of 4 accounts shown')).toBeVisible(); expect(f.state.calls).toBe(before);
  expect(f.state.queries.every(query => query === '')).toBe(true);
  await page.goto('/admin/users/parent/1'); await waitForDataRoute(page);
  await expect(page.getByRole('heading', { name: 'Fixture, Parent', exact: true })).toBeVisible();
  await expect(page.getByText('parent@example.invalid', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Edit User', exact: true })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Remove User', exact: true })).toBeEnabled();
});
test('mocked user list preserves server ordering and has no invented sort/pagination controls', async ({ page }) => {
  await mockAdminUsers(page); await page.goto('/admin/users'); await waitForDataRoute(page);
  const rows = page.getByRole('table').getByRole('row'); await expect(rows).toHaveCount(5);
  await expect(rows.nth(1)).toContainText('Fixture, Teacher'); await expect(rows.nth(2)).toContainText('Fixture, Parent');
  await expect(rows.nth(3)).toContainText('Fixture, Principal'); await expect(rows.nth(4)).toContainText('Fixture, Admin');
  await expect(page.getByRole('button', { name: /^(Next|Previous|Sort)$/ })).toHaveCount(0);
});
