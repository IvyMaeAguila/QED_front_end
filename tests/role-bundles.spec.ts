import { test, expect } from '@playwright/test';
// @ts-expect-error Node-only production audit harness deliberately has no browser build.
import { serveBuild, prepareLogin, login, rolesInChunks, bundleAudit } from '../scripts/startup-harness.mjs';
let server: { url: string; close: () => Promise<void> };
test.beforeAll(async () => { server = await serveBuild(5192); });
test.afterAll(async () => { await server.close(); });
test('public login requests no protected role code', async ({ page }) => {
  const fixture = await prepareLogin(page);
  await page.goto(server.url + '/login');
  await expect(page.getByPlaceholder('e.g. TC_maria.delacruz')).toBeVisible();
  expect(rolesInChunks(fixture.requests)).toEqual([]);
  fixture.release();
});
for (const role of ['TEACHER', 'ADMIN', 'PRINCIPAL', 'PARENT']) test(`${role} login requests only its own role code`, async ({ page }) => {
  const fixture = await prepareLogin(page, role);
  await page.goto(server.url + '/login');
  await login(page);
  await expect(page.locator('.qed-account-ui')).toBeVisible();
  expect(rolesInChunks(fixture.requests)).toEqual([role.toLowerCase()]);
  fixture.release();
});
test('a 1500ms role import uses bootstrap then the real shell and registered skeleton', async ({ page }) => {
  const fixture = await prepareLogin(page);
  const chunk = bundleAudit().find((item: { modules: string[] }) => item.modules.some(id => id.endsWith('/teacher/pages/TeacherLayout.tsx')));
  expect(chunk.isEntry, 'protected layout must be outside the public entry').toBe(false);
  let arrived!: () => void;
  const requested = new Promise<void>(resolve => { arrived = resolve; });
  await page.route('**/' + chunk.fileName, async route => {
    arrived();
    await new Promise(resolve => setTimeout(resolve, 1500));
    await route.continue();
  });
  await page.goto(server.url + '/login');
  await login(page);
  await requested;
  await expect(page.locator('[data-bootstrap-loader]')).toBeVisible();
  await expect(page.locator('.qed-account-ui, main')).toHaveCount(0);
  await expect(page.locator('.qed-account-ui')).toBeVisible();
  await expect(page.locator('[data-sk-region="stat-value-Advisory Students"][aria-busy="true"]')).toBeAttached();
  await expect(page.locator('[data-bootstrap-loader]')).toHaveCount(0);
  expect(rolesInChunks(fixture.requests)).toEqual(['teacher']);
  fixture.release();
});
test('chart skeletons retain bars, line and radar while the heavy chart chunk is unavailable', async ({ page }) => {
  const fixture = await prepareLogin(page, 'PRINCIPAL');
  const chunk = bundleAudit().find((item: { modules: string[] }) => item.modules.some(id => /node_modules\/recharts\//.test(id)));
  expect(chunk.isEntry, 'chart library must be outside the public entry').toBe(false);
  let releaseCode!: () => void;
  const gate = new Promise<void>(resolve => { releaseCode = resolve; });
  let requested!: () => void;
  const arrived = new Promise<void>(resolve => { requested = resolve; });
  await page.route('**/' + chunk.fileName, async route => { requested(); await gate; await route.continue(); });
  await page.goto(server.url + '/login');
  await login(page);
  await arrived;
  await expect(page.locator('.qed-account-ui')).toBeVisible();
  await expect(page.locator('[data-sk-chart="bar"]')).toHaveCount(6);
  await expect(page.locator('[data-sk-chart="line"]')).toHaveCount(1);
  await expect(page.locator('[data-sk-chart="radar"]')).toHaveCount(1);
  const positions = await page.locator('header, aside, .recharts-responsive-container').evaluateAll(elements => elements.map(element => { const box = element.getBoundingClientRect(); return [box.x, box.y, box.width, box.height]; }));
  const loaded = page.waitForResponse('**/' + chunk.fileName);
  releaseCode();
  await loaded;
  expect(await page.locator('header, aside, .recharts-responsive-container').evaluateAll(elements => elements.map(element => { const box = element.getBoundingClientRect(); return [box.x, box.y, box.width, box.height]; }))).toEqual(positions);
  fixture.release();
});
