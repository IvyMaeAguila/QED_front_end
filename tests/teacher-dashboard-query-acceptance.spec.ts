import { test, expect, type Page } from "@playwright/test";
import { mockTeacher } from "./fixtures/teacher";
import { requestLedger } from "./fixtures/requestLedger";
import { waitForDataRoute } from "./fixtures/routeReady";

// MOCKED browser APIs only. Real React, router, singleton QueryClient and UI.
const endpoints = ["summary", "stats", "attendance", "upcoming", "schedule"] as const;
type Endpoint = typeof endpoints[number];
async function fixture(page: Page) {
  const releaseTeacher = await mockTeacher(page, false); releaseTeacher();
  const ledger = requestLedger(page, path => path.startsWith("/api/teacherDashboard/"));
  const status = Object.fromEntries(endpoints.map(e => [e, 200])) as Record<Endpoint, number>;
  const gates: Partial<Record<Endpoint, Promise<void>>> = {}, releases: Partial<Record<Endpoint, () => void>> = {};
  let empty = false;
  for (const e of endpoints) await page.route(`**/api/teacherDashboard/${e}*`, async route => {
    ledger.intercept(route.request());
    const code = status[e];
    await gates[e];
    const body = e === "summary" ? { success: true, name: "Synthetic Teacher" }
      : e === "stats" ? { success: true, advisoryClassCount: empty ? 0 : 21, totalStudents: empty ? 0 : 42, totalClasses: empty ? 0 : 3 }
      : e === "attendance" ? { success: true, hasAdvisory: !empty, present: empty ? 0 : 18, absent: 2, late: 1 }
      : { success: true, data: [] };
    await route.fulfill({ status: code, json: code === 200 ? body : { message: `Synthetic ${e} failure` } });
  });
  return { status, ledger,
    empty: () => { empty = true; },
    hold: (e: Endpoint) => { gates[e] = new Promise(resolve => { releases[e] = resolve; }); },
    release: (e: Endpoint) => { releases[e]?.(); delete gates[e]; },
    async settled(count: number | Record<Endpoint, number>) {
      await expect.poll(() => endpoints.map(e => ledger.snapshot().filter(r => r.path.endsWith('/' + e) && r.terminal === "finished").length)).toEqual(endpoints.map(e => typeof count === "number" ? count : count[e]));
      await expect.poll(() => ledger.snapshot().every(r => r.terminal !== undefined)).toBe(true);
      expect(ledger.snapshot().filter(r => r.terminal === "failed")).toEqual([]);
    },
  };
}
const ready = async (page: Page) => {
  await expect(page.locator('[data-sk-region="stat-value-Total Students"]')).toContainText("42");
  await expect(page.locator('[data-sk-layer]')).toHaveCount(0);
};
async function leave(page: Page) {
  await page.getByRole("link", { name: "Help & Support", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Help & Support", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Weekly Class Schedule" })).toHaveCount(0);
}
test("Teacher dashboard: independent loading, exact fresh reuse, stale revalidation and explicit retry", async ({ page }, info) => {
  const f = await fixture(page); f.hold("stats");
  await page.goto("/teacher"); await waitForDataRoute(page);
  await expect(page.locator('[data-sk-region="stat-value-Total Students"]')).toHaveAttribute("aria-busy", "true");
  f.release("stats"); await ready(page); await f.settled(1);
  const baseline = f.ledger.mark();
  await leave(page); await page.goBack(); await ready(page);
  expect(f.ledger.snapshot(baseline)).toEqual([]);
  await page.clock.install(); await page.clock.fastForward(31_000);
  await leave(page); await page.goBack(); await ready(page); await f.settled(2);
  f.status.stats = 500;
  // The offline alert exposes the existing Retry control; reconnect refetches stale reads.
  await page.context().setOffline(true);
  await expect(page.getByRole("alert")).toContainText("You're offline");
  await page.clock.fastForward(31_000); await page.context().setOffline(false);
  await expect(page.getByRole("alert")).toContainText("statistics"); await f.settled({summary:3,stats:4,attendance:3,upcoming:3,schedule:3});
  f.status.stats = 200; await page.getByRole("button", { name: "Retry", exact: true }).click();
  await ready(page); await f.settled({summary:3,stats:5,attendance:3,upcoming:3,schedule:3});
  await info.attach("sanitized-request-lifecycle", { body: JSON.stringify(f.ledger.snapshot()), contentType: "application/json" });
});
for (const endpoint of endpoints) test(`Teacher dashboard: ${endpoint} failure preserves independent sections and recovers`, async ({ page }) => {
  const f = await fixture(page); f.status[endpoint] = 500;
  await page.goto("/teacher"); await waitForDataRoute(page);
  await expect(page.getByRole("alert")).toContainText("Unable to load"); await f.settled(Object.fromEntries(endpoints.map(e=>[e,e===endpoint?2:1])) as Record<Endpoint,number>);
  await expect(page.locator('[data-sk-layer]')).toHaveCount(0);
  if (endpoint !== "stats") await ready(page);
  f.status[endpoint] = 200; await page.getByRole("button", { name: "Retry", exact: true }).click();
  await ready(page); await f.settled(Object.fromEntries(endpoints.map(e=>[e,e===endpoint?3:1])) as Record<Endpoint,number>);
});
test("Teacher dashboard: all endpoints fail, one bounded Retry recovers", async ({ page }) => {
  const f = await fixture(page); endpoints.forEach(e => { f.status[e] = 500; });
  await page.goto("/teacher"); await waitForDataRoute(page);
  await expect(page.getByRole("alert")).toContainText("profile, statistics, attendance, events, weekly schedule"); await f.settled(2);
  await expect(page.locator('[data-sk-layer]')).toHaveCount(0);
  endpoints.forEach(e => { f.status[e] = 200; });
  await page.getByRole("button", { name: "Retry", exact: true }).click(); await ready(page); await f.settled(3);
});
test("Teacher dashboard: uncached offline mount stops loading, repeated retries queue no requests, reconnect recovers", async ({ page }) => {
  const f = await fixture(page);
  await page.clock.install();
  await page.goto("/teacher"); await ready(page); await f.settled(1);
  // Load the application online; it has no service worker for offline hard navigation.
  // Unmount and expire the five-minute cache before the actual offline route mount.
  await leave(page); await page.clock.fastForward(6 * 60_000);
  const mark = f.ledger.mark();
  await page.context().setOffline(true); await page.goBack(); await waitForDataRoute(page);
  await expect(page.getByRole("alert")).toContainText("You're offline");
  await expect(page.locator('[data-sk-layer]')).toHaveCount(0);
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(page.locator('[data-sk-region="stat-value-Total Students"]')).toHaveCount(0);
  expect(f.ledger.snapshot(mark)).toEqual([]);
  await page.context().setOffline(false); await ready(page); await f.settled(2);
});
test("Teacher dashboard: cached data stays visible offline with no duplicate retries", async ({ page }) => {
  const f = await fixture(page); await page.goto("/teacher"); await ready(page); await f.settled(1);
  await page.context().setOffline(true); await expect(page.getByRole("alert")).toContainText("You're offline"); await ready(page);
  const mark = f.ledger.mark();
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Retry", exact: true }).click();
  expect(f.ledger.snapshot(mark)).toEqual([]);
  await page.context().setOffline(false); await ready(page); await expect(page.getByRole("alert")).toHaveCount(0);
  expect(f.ledger.snapshot(mark)).toEqual([]);
});
for (const endpoint of endpoints) test(`Teacher dashboard: independent ${endpoint}401 expires session`, async ({ page }) => {
  const f = await fixture(page); f.status[endpoint] = 401;
  await page.goto("/teacher"); await expect(page).toHaveURL(/\/login/);
  await expect(page.locator('[data-sk-region="stat-value-Total Students"]')).toHaveCount(0);
});
test("Teacher dashboard:403 hides affected cached statistics without logout, including offline", async ({ page }) => {
  const f = await fixture(page); await page.goto("/teacher"); await ready(page); await f.settled(1);
  f.status.stats = 403; await page.clock.install(); await page.clock.fastForward(31_000);
  await leave(page); await page.goBack(); await expect(page.getByRole("alert")).toContainText("statistics"); await f.settled(2);
  await expect(page.locator('[data-sk-region="stat-value-Total Students"]')).toHaveCount(0);
  await page.context().setOffline(true); await expect(page.getByRole("alert")).toContainText("You're offline");
  await expect(page.locator('[data-sk-region="stat-value-Total Students"]')).toHaveCount(0);
  await expect(page).toHaveURL(/\/teacher$/);
});
test("Teacher dashboard: empty statistics and schedules retain existing empty UI", async ({ page }) => {
  const f = await fixture(page); f.empty(); await page.goto("/teacher"); await f.settled(1);
  await expect(page.locator('[data-sk-region="stat-value-Total Students"]')).toContainText("0");
  await expect(page.locator('[data-sk-layer]')).toHaveCount(0);
  await expect(page.getByRole("alert")).toHaveCount(0);
});
