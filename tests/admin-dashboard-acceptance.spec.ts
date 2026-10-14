import { test, expect } from "@playwright/test";
import { mockAdminDashboard, adminEndpoints } from "./fixtures/adminDashboard";
import { waitForDataRoute } from "./fixtures/routeReady";
import { waitForQueryReader } from "./fixtures/queryLifecycle";
// @ts-expect-error Existing Node-only production audit helper.
import { rolesInChunks } from "../scripts/startup-harness.mjs";

const stat = (page: import("@playwright/test").Page) => page.locator('[data-sk-fixed-region="admin-stat-Total Users"] [data-sk-content]');
const audit = (page: import("@playwright/test").Page) => page.locator("section").filter({ has: page.getByRole("heading", { name: "System Audit Logs", exact: true }) });
const chart = (page: import("@playwright/test").Page) => page.locator("section").filter({ has: page.getByRole("heading", { name: "Login Frequency", exact: true }) });
for (const outcome of [200, 500]) test(`Admin startup stays Query-free while providers initialize; provider ${outcome} releases dashboard`, async ({ page }) => {
  const f = await mockAdminDashboard(page);
  let release!: () => void, seen!: () => void;
  const gate = new Promise<void>(r => { release = r; }), arrived = new Promise<void>(r => { seen = r; });
  await page.route("**/api/user/usersList", async route => { seen(); await gate; await route.fulfill({ status: outcome, json: { success: outcome === 200, data: [], message: "Synthetic provider failure" } }); });
  const runtime: string[] = []; page.on("request", r => { if (r.resourceType() === "script") runtime.push(r.url()); });
  await page.goto("/admin"); await arrived; await waitForDataRoute(page);
  await expect(page.getByRole("heading", { name: "Login Frequency", exact: true })).toBeVisible();
  for (const e of adminEndpoints) expect(f.state[e].calls).toBe(0);
  expect(runtime.some(url => /AdminDashboardQueries|useAdminDashboardQueries|@tanstack/.test(url))).toBe(false);
  release(); await expect(stat(page)).toHaveText("120"); await expect(page.getByText("Synthetic Actor p1", { exact: true })).toBeVisible();
});
test("Admin navigation reuses fresh cache; stale remount refreshes exactly once per reader", async ({ page }, info) => {
  const scripts: string[] = []; page.on("request", request => { if (request.resourceType() === "script") scripts.push(request.url()); });
  const f = await mockAdminDashboard(page); await page.clock.install(); await page.goto("/admin"); await waitForDataRoute(page);
  await expect(stat(page)).toHaveText("120"); await expect(page.getByText("Synthetic Actor p1", { exact: true })).toBeVisible();
  for (const e of adminEndpoints) await f.ledgers[e].successfulBatch();
  if (info.project.name === "fresh-production") expect(rolesInChunks(scripts)).toEqual(["admin"]);
  const initial = Object.fromEntries(adminEndpoints.map(e => [e, f.state[e].calls]));
  await page.getByRole("link", { name: "Classes", exact: true }).first().click(); await waitForDataRoute(page);
  await expect(page.getByRole("heading", { name: "Login Frequency", exact: true })).toHaveCount(0);
  await page.goBack(); await waitForDataRoute(page); await expect(stat(page)).toHaveText("120");
  for (const e of adminEndpoints) expect(f.state[e].calls).toBe(initial[e]);
  await page.getByRole("link", { name: "Classes", exact: true }).first().click(); await waitForDataRoute(page);
  await expect(page.getByRole("heading", { name: "Login Frequency", exact: true })).toHaveCount(0);
  await f.settled();
  const marks = Object.fromEntries(adminEndpoints.map(e => [e, f.ledgers[e].mark()]));
  await page.clock.fastForward(30_001); await page.goBack(); await waitForDataRoute(page); await expect(stat(page)).toHaveText("120");
  for (const e of adminEndpoints) {
    const batch = await f.ledgers[e].successfulBatch(marks[e]);
    expect(f.state[e].calls - initial[e]).toBe(1 + batch.filter(r => r.terminal === "aborted" && r.intercepted).length);
    if (info.project.name === "fresh-production") { expect(initial[e]).toBe(1); expect(f.state[e].calls).toBe(2); }
  }
});
test("empty and null Admin data preserve zero cards and native empty audit table", async ({ page }) => {
  const f = await mockAdminDashboard(page); f.state.users.body = null; f.state.students.body = { total: null };
  f.state.frequency.body = null; f.state.audit.body = { success: true, data: null };
  await page.goto("/admin"); await waitForDataRoute(page);
  for (const label of ["Total Users", "Total Students", "Total Teachers", "Total Parents"]) {
    await expect(page.locator(`[data-sk-fixed-region="admin-stat-${label}"] [data-sk-content]`)).toHaveText("0");
  }
  await expect(page.getByText("No audit events match these filters.", { exact: true })).toBeVisible();
  await expect(page.getByText("0 events · Page 1 of 1", { exact: true })).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
});
test("complete API failure settles all regions; audit Retry recovers independently", async ({ page }) => {
  const f = await mockAdminDashboard(page); for (const e of adminEndpoints) f.state[e].status = 500;
  await page.goto("/admin"); await waitForDataRoute(page);
  await expect(page.locator('[data-sk-fixed-region="admin-stat-Total Users"]').getByRole("alert")).toContainText("500");
  await expect(chart(page).getByRole("alert")).toContainText("Synthetic frequency 500");
  await expect(audit(page).getByRole("alert")).toContainText("Synthetic audit 500");
  f.state.audit.status = 200; await audit(page).getByRole("button", { name: "Retry", exact: true }).click();
  await expect(page.getByText("Synthetic Actor p1", { exact: true })).toBeVisible();
  await expect(chart(page).getByRole("alert")).toContainText("Synthetic frequency 500");
});
test("audit form drafts, pagination, role/action/date filters and chart period preserve behavior", async ({ page }) => {
  const f = await mockAdminDashboard(page); await page.goto("/admin"); await waitForDataRoute(page);
  await expect(page.getByText("Synthetic Actor p1", { exact: true })).toBeVisible();
  const initial = f.state.audit.calls;
  await page.getByPlaceholder("Search user, action, endpoint, ID").fill("  Applied  "); expect(f.state.audit.calls).toBe(initial);
  await page.getByRole("button", { name: "Next page", exact: true }).click(); await expect(page.getByText("Synthetic Actor p2", { exact: true })).toBeVisible();
  await audit(page).getByRole("button", { name: "Search", exact: true }).click(); await expect(page.getByText("Applied p1", { exact: true })).toBeVisible();
  await page.getByRole("combobox", { name: "Filter by role", exact: true }).selectOption("TEACHER");
  await page.getByRole("combobox", { name: "Filter by action", exact: true }).selectOption("LOGIN");
  await page.getByLabel("From date", { exact: true }).fill("2026-10-01"); await page.getByLabel("To date", { exact: true }).fill("2026-10-11");
  await expect.poll(() => f.records.filter(r => r.endpoint === "audit").at(-1)?.params).toEqual({ page: "1", search: "Applied", role: "TEACHER", action: "LOGIN", from: "2026-10-01", to: "2026-10-11", limit: "20" });
  await chart(page).getByRole("button", { name: "Weekly", exact: true }).click(); await page.getByRole("option", { name: "Monthly", exact: true }).click();
  await expect.poll(() => f.records.filter(r => r.endpoint === "frequency").at(-1)?.params).toEqual({ period: "monthly" });
  await expect(page.getByPlaceholder("Search user, action, endpoint, ID")).toHaveValue("  Applied  ");
});
for (const endpoint of adminEndpoints) test(`built Admin ${endpoint} 403 remains permission error and Retry recovers`, async ({ page }) => {
  const f = await mockAdminDashboard(page); f.state[endpoint].status = 403; await page.goto("/admin"); await waitForDataRoute(page);
  const region = endpoint === "audit" ? audit(page) : endpoint === "frequency" ? chart(page) : page.locator('[data-sk-fixed-region="admin-stat-Total Users"]');
  await expect(region.getByRole("alert")).toContainText(`Synthetic ${endpoint} 403`); await expect(page).toHaveURL(/\/admin$/);
  f.state[endpoint].status = 200; await region.getByRole("button", { name: "Retry", exact: true }).click();
  if (endpoint === "audit") await expect(page.getByText("Synthetic Actor p1", { exact: true })).toBeVisible();
  else if (endpoint === "frequency") await expect(chart(page).locator('[data-sk-content] [data-sk-region="loginfrequency-span-field-4"]')).toHaveText(["7", "14"]);
  else await expect(stat(page)).toHaveText("120");
});
for (const endpoint of adminEndpoints) test(`built Admin ${endpoint} 401 expires authentication`, async ({ page }) => {
  const f = await mockAdminDashboard(page); f.state[endpoint].status = 401; await page.goto("/admin");
  await expect(page).toHaveURL(/\/login$/); await expect(page.getByText("Synthetic Actor p1", { exact: true })).toHaveCount(0);
});
test("cached offline UI preserves records; uncached period shows connection error and reconnects", async ({ page, context }) => {
  const f = await mockAdminDashboard(page); await page.goto("/admin"); await waitForDataRoute(page);
  await expect(stat(page)).toHaveText("120"); await expect(page.getByText("Synthetic Actor p1", { exact: true })).toBeVisible();
  const before = f.state.frequency.calls; await context.setOffline(true);
  await expect(page.getByRole("alert").first()).toContainText("offline"); await expect(stat(page)).toHaveText("120");
  await expect(page.getByText("Synthetic Actor p1", { exact: true })).toBeVisible();
  await chart(page).getByRole("button", { name: "Weekly", exact: true }).click(); await page.getByRole("option", { name: "Monthly", exact: true }).click();
  await expect(chart(page).getByRole("alert")).toContainText("offline");
  await chart(page).getByRole("button", { name: "Retry", exact: true }).click(); await chart(page).getByRole("button", { name: "Retry", exact: true }).click();
  expect(f.state.frequency.calls).toBe(before); await context.setOffline(false);
  await expect(chart(page).getByRole("alert")).toHaveCount(0); await expect.poll(() => f.state.frequency.calls).toBe(before + 1);
});

test("offline transition outside Dashboard is reconciled on cached return", async ({ page, context }) => {
  let phase = "initial";
  const lifecycle: { event: string; path?: string; phase: string; failure?: string }[] = [];
  page.on("request", r => { if (r.resourceType() === "script") lifecycle.push({event:"request",path:new URL(r.url()).pathname,phase}); });
  page.on("requestfailed", r => { if (r.resourceType() === "script") lifecycle.push({event:"failed",path:new URL(r.url()).pathname,phase,failure:r.failure()?.errorText}); });
  page.on("pageerror", e => lifecycle.push({event:"pageerror",phase,failure:/dynamically imported|Loading chunk/.test(e.message)?e.message:e.name}));
  try {
  const f = await mockAdminDashboard(page); await page.goto("/admin"); await waitForDataRoute(page);
  await expect(stat(page)).toHaveText("120"); await expect(page.getByText("Synthetic Actor p1", { exact: true })).toBeVisible();
  await f.settled(); const initial = Object.fromEntries(adminEndpoints.map(e => [e, f.state[e].calls]));
  phase = "classes"; await page.getByRole("link", { name: "Classes", exact: true }).first().click();
  await expect(page.getByRole("heading", { name: "Login Frequency", exact: true })).toHaveCount(0);
  await waitForQueryReader(page,"ADMIN",["classes","list"],true);
  await waitForQueryReader(page,"ADMIN",["teachers","list"],true);
  lifecycle.push({event:"class-query-readers-idle",phase});
  phase = "offline"; await context.setOffline(true); await page.goBack(); await waitForDataRoute(page);
  await expect(page.getByRole("alert").first()).toContainText("offline");
  await expect(stat(page)).toHaveText("120"); await expect(page.getByText("Synthetic Actor p1", { exact: true })).toBeVisible();
  phase = "reconnect"; await context.setOffline(false); await expect(page.getByRole("alert")).toHaveCount(0);
  for (const e of adminEndpoints) expect(f.state[e].calls, e).toBe(initial[e]);
  } finally { await test.info().attach("sanitized-dashboard-offline-lifecycle", {body:Buffer.from(JSON.stringify(lifecycle)),contentType:"application/json"}); }
});
