import { test, expect, type Page } from "@playwright/test";
import { mockDirectory } from "./fixtures/directory";
import { waitForDataRoute } from "./fixtures/routeReady";
import { mockDashboard, dashboardEndpoints, type DashboardEndpoint } from "./fixtures/dashboard";
import { observeDashboardQueries, attachDashboardDiagnostics } from "./fixtures/dashboardDiagnostics";

test.beforeEach(async ({ page }) => { await observeDashboardQueries(page); });
test.afterEach(async ({ page }, info) => { await attachDashboardDiagnostics(page, info); });

// MOCKED acceptance. Actual Principal UI/routes, including the fresh built app;
// synthetic GET responses only. No live credentials or backend verification.
const region = (page: Page, name: string) => page.locator(`[data-sk-region="${name}"]`);
const ready = async (page: Page) => {
  await expect(region(page, "principal-dashboard-data")).toHaveAttribute("aria-busy", "false");
  await expect(region(page, "principal-kpi-total-students")).toContainText("1,234");
  await expect(region(page, "principal-school-year")).toContainText("Year 1");
};
const leaveDashboard = async (page: Page) => {
  const menu = page.getByRole("button", { name: "Open menu", exact: true });
  if (await menu.isVisible()) await menu.click();
  await page.getByRole("link", { name: "Help & Support", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Help & Support", exact: true })).toBeVisible();
  // Wait for the existing outgoing route animation to release its observers.
  await expect(region(page, "principal-dashboard-data")).toHaveCount(0);
};
for (const width of [375, 1280]) for (const dark of [false, true]) test(`Dashboard ${width} ${dark ? "dark" : "light"}: charts, ranking, navigation, cache, offline and retry`, async ({ page }, info) => {
  await page.setViewportSize({ width, height: 1000 });
  const release = await mockDirectory(page, "PRINCIPAL", dark);
  const f = await mockDashboard(page); f.hold("overview");
  const errors: string[] = [], consoleErrors: string[] = [];
  page.on("pageerror", e => errors.push(e.name));
  page.on("console", m => { if (m.type() === "error") consoleErrors.push(m.text()); });
  const capture = async (name: string) => { const path = info.outputPath(`${name}.png`); await page.screenshot({ path, fullPage: true }); await info.attach(name, { path, contentType: "image/png" }); };
  await page.goto("/principal"); release(); await waitForDataRoute(page);
  await expect(region(page, "principal-dashboard-data")).toHaveAttribute("aria-busy", "true");
  await expect(page.getByRole("status").filter({ hasText: "Loading" }).first()).toBeVisible(); await capture("loading");
  f.release("overview"); await ready(page); await f.settled(1);
  await expect(region(page, "principal-kpi-total-teachers")).toContainText("17");
  await expect(region(page, "principal-kpi-overall-attendance")).toContainText("93.25%");
  await expect(region(page, "principal-kpi-academic-performance")).toContainText("86.75%");
  await expect(region(page, "principal-kpi-needs-intervention")).toContainText("0");
  await expect(region(page, "principal-current-term")).toHaveText("Term 2");
  await expect(page.getByText("Fixture Mathematics", { exact: true })).toBeVisible();
  // Existing holistic mean (3.25+3.5+3.75+4)/4 rounds to 3.6; no calculation changed.
  await expect(page.getByText("3.6", { exact: true })).toBeVisible();
  await expect(region(page, "principal-grade-performance-plot").locator("svg.recharts-surface")).toBeVisible();
  await expect(region(page, "principal-term-trend-plot").locator("svg.recharts-surface")).toBeVisible();
  await expect(page.locator("svg.recharts-surface")).toHaveCount(4);
  if (dark) await expect(page.locator(".qed-account-ui")).toHaveClass(/\bdark\b/);
  else await expect(page.locator(".qed-account-ui")).not.toHaveClass(/\bdark\b/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await capture("loaded");
  await page.locator("select").selectOption("Term 3");
  await expect(page.getByText("Term 3 Subject 1", { exact: true })).toBeVisible();
  await expect(page.locator('[data-sk-region="principal-ranking-row"]')).toHaveCount(5);
  await page.getByRole("button", { name: "Expand ranking", exact: true }).click();
  const modal = page.getByRole("dialog", { name: "Full subject ranking", exact: true });
  await expect(modal).toContainText("Term 3 Subject 7"); await modal.locator("select").selectOption("Term 1");
  await expect(modal).toContainText("Term 1 Subject 7"); await modal.getByRole("button", { name: "Close dialog", exact: true }).click();
  await expect(page.locator("select")).toHaveValue("Term 1"); dashboardEndpoints.forEach(e => expect(f.state[e].calls, e).toBe(1));
  await leaveDashboard(page); await page.goBack(); await ready(page);
  dashboardEndpoints.forEach(e => expect(f.state[e].calls, e).toBe(1));
  await page.context().setOffline(true); await expect(page.getByRole("alert")).toContainText("You're offline"); await ready(page);
  await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0);
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Retry", exact: true }).click();
  dashboardEndpoints.forEach(e => expect(f.state[e].calls, e).toBe(1)); await capture("cached-offline");
  await page.context().setOffline(false); await expect(page.getByRole("alert")).toHaveCount(0); dashboardEndpoints.forEach(e => expect(f.state[e].calls, e).toBe(1));
  await page.clock.install(); await leaveDashboard(page); await page.clock.fastForward(31_000);
  await page.goBack(); await ready(page); await f.settled(2); dashboardEndpoints.forEach(e => expect(f.state[e].calls, e).toBe(2));
  f.state.overview.status = 500; await page.reload();
  await expect(region(page, "principal-dashboard-data").getByRole("alert")).toContainText("Failed to fetch overview (500)"); await capture("error");
  f.state.overview.status = 200; await region(page, "principal-dashboard-data").getByRole("button", { name: "Retry", exact: true }).click();
  await ready(page); await expect.poll(()=>f.state.overview.calls).toBe(5); await f.settled(5,["overview"]); await f.settled(3,dashboardEndpoints.filter(e=>e!=="overview")); dashboardEndpoints.forEach(e => expect(f.state[e].calls, e).toBe(e==="overview"?5:3));
  expect(errors).toEqual([]); expect(consoleErrors.filter(m => !m.includes("Failed to load resource"))).toEqual([]);
  await info.attach("sanitized-metrics", { body: JSON.stringify({ backend: "mocked", width, dark, calls: f.state }), contentType: "application/json" });
});

test("empty dashboard preserves zero KPIs and existing chart/ranking empty states", async ({ page }) => {
  const release = await mockDirectory(page, "PRINCIPAL", false); const f = await mockDashboard(page); f.setEmpty();
  await page.goto("/principal"); release();
  await expect(region(page, "principal-dashboard-data")).toHaveAttribute("aria-busy", "false");
  await expect(region(page, "principal-kpi-total-students")).toContainText("0");
  await expect(page.getByText("Subject performance will appear when grades are available.", { exact: true })).toBeVisible();
  await expect(page.getByText("There are no subject rankings for this term yet.", { exact: true })).toBeVisible();
  await expect(page.getByText("No domain ratings are available for this term yet.", { exact: true })).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
});
test("header partial failure and aggregate failure retain independent Retry controls", async ({ page }) => {
  const release = await mockDirectory(page, "PRINCIPAL", false); const f = await mockDashboard(page); f.state.year.status = 500; f.state.trend.status = 500;
  await page.goto("/principal"); release();
  await expect(region(page, "principal-school-year").getByRole("alert")).toContainText("year failure (500)");
  await expect(region(page, "principal-dashboard-data").getByRole("alert")).toContainText("trend failure (500)");
  f.state.trend.status = 200; await region(page, "principal-dashboard-data").getByRole("button", { name: "Retry", exact: true }).click();
  await expect(region(page,"principal-dashboard-data")).toHaveAttribute("data-sk-phase","settled");
  await expect(region(page, "principal-kpi-total-students")).toContainText("1,234");
  await expect(region(page, "principal-school-year").getByRole("alert")).toContainText("500"); const calls = f.state.overview.calls;
  f.state.year.status = 200; await region(page, "principal-school-year").getByRole("button", { name: "Retry", exact: true }).click();
  await ready(page); expect(f.state.overview.calls).toBe(calls);
});
test("offline route with loaded application code and expired data cache settles and resumes", async ({ page }) => {
  const release = await mockDirectory(page, "PRINCIPAL", false); const f = await mockDashboard(page);
  await page.goto("/principal"); release(); await ready(page); await f.settled(1); await page.clock.install();
  await leaveDashboard(page);
  await page.clock.fastForward(301_000);
  await page.context().setOffline(true); await page.getByRole("link", { name: "Dashboard", exact: true }).click();
  await expect(region(page, "principal-dashboard-data").getByRole("alert")).toContainText("offline");
  await expect(region(page, "principal-dashboard-data")).toHaveAttribute("aria-busy", "false");
  await region(page, "principal-dashboard-data").getByRole("button", { name: "Retry", exact: true }).click();
  expect(f.state.term.calls).toBe(1); await page.context().setOffline(false); await ready(page); await f.settled(2); dashboardEndpoints.forEach(e => expect(f.state[e].calls, e).toBe(2));
});
for (const endpoint of ["year", "holistic"] as DashboardEndpoint[]) for (const status of [401, 403]) test(`built-route ${endpoint} ${status} preserves session/permission behavior`, async ({ page }) => {
  const release = await mockDirectory(page, "PRINCIPAL", false); const f = await mockDashboard(page); f.state[endpoint].status = status;
  await page.goto("/principal"); release();
  if (status === 401) { await expect(page).toHaveURL(/\/login$/); await expect(page.locator(".qed-account-ui")).toHaveCount(0); }
  else { await expect(region(page, "principal-dashboard-data").getByRole("alert")).toContainText("403"); await expect(page).toHaveURL(/\/principal$/); expect(f.state[endpoint].calls).toBe(1); }
});

test("offline and online events missed while the dashboard provider is unmounted are reconciled", async ({ page }) => {
  const release = await mockDirectory(page, "PRINCIPAL", false); const f = await mockDashboard(page);
  await page.goto("/principal"); release(); await ready(page); await page.clock.install(); await leaveDashboard(page);
  await page.clock.fastForward(31_000); await page.context().setOffline(true);
  await page.getByRole("link", { name: "Dashboard", exact: true }).click(); await ready(page);
  await expect(page.getByRole("alert")).toContainText("offline"); dashboardEndpoints.forEach(e => expect(f.state[e].calls, e).toBe(1));
  await leaveDashboard(page); await page.context().setOffline(false);
  await page.getByRole("link", { name: "Dashboard", exact: true }).click(); await ready(page);
  await expect(page.getByRole("alert")).toHaveCount(0); await f.settled(2);
  dashboardEndpoints.forEach(e => expect(f.state[e].calls, e).toBe(2));
});

test("stale remount waits for independently delayed year dispatch without duplicating snapshot reads", async ({ page }) => {
  // Deterministically reproduce the ordering the old overview-only barrier
  // incorrectly ruled out. This is browser scheduling, not a backend fixture.
  await page.addInitScript(() => {
    const target = window as typeof window & { releaseYear?: () => void; waitingYear?: boolean };
    const original = window.fetch;
    let years = 0;
    window.fetch = async (...args: Parameters<typeof fetch>) => {
      const input = args[0];
      const url = input instanceof Request ? input.url : String(input);
      if (new URL(url, location.href).pathname === "/api/academic-year/getAcademicYear" && ++years === 2) {
        target.waitingYear = true;
        await new Promise<void>(resolve => { target.releaseYear = resolve; });
      }
      return original(...args);
    };
  });
  const release = await mockDirectory(page, "PRINCIPAL", false), f = await mockDashboard(page);
  await page.goto("/principal"); release(); await ready(page); await f.settled(1);
  await page.clock.install(); await leaveDashboard(page); await page.clock.fastForward(31_000);
  await page.goBack(); await ready(page);
  await expect.poll(() => f.state.overview.calls).toBe(2);
  await expect.poll(() => page.evaluate(() => (window as typeof window & { waitingYear?: boolean }).waitingYear)).toBe(true);
  expect(f.state.year.calls).toBe(1); // Cached year/content is intentionally usable.
  await page.evaluate(() => (window as typeof window & { releaseYear?: () => void }).releaseYear!());
  await f.settled(2); await ready(page);
  dashboardEndpoints.forEach(e => expect(f.state[e].calls, e).toBe(2));
});
