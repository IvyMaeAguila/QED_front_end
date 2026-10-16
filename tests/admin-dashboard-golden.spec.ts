import { test, expect } from "@playwright/test";
import { mockAdminDashboard } from "./fixtures/adminDashboard";
import { waitForDataRoute } from "./fixtures/routeReady";

// Same real-page output goldens executed BEFORE and AFTER migration. APIs mocked.
for (const width of [375, 1280]) for (const dark of [false, true]) test(`Admin dashboard golden ${width} ${dark ? "dark" : "light"}`, async ({ page }, info) => {
  await page.setViewportSize({ width, height: 1000 });
  const f = await mockAdminDashboard(page, dark);
  const errors: string[] = []; page.on("pageerror", e => errors.push(e.message));
  await page.goto("/admin"); await waitForDataRoute(page);
  for (const [label, value] of [["Total Users", "120"], ["Total Students", "240"], ["Total Teachers", "12"], ["Total Parents", "100"]]) {
    await expect(page.locator(`[data-sk-fixed-region="admin-stat-${label}"] [data-sk-content]`)).toHaveText(value);
  }
  const chart = page.locator("section").filter({ has: page.getByRole("heading", { name: "Login Frequency", exact: true }) });
  await expect(chart.locator('[data-sk-content] [data-sk-region="loginfrequency-span-field-4"]')).toHaveText(["7", "14"]);
  await expect(chart.locator('[data-sk-content] [data-sk-region="loginfrequency-span-field-7"]')).toHaveText(["Mon", "Sun"]);
  await expect(chart.locator('[data-sk-content] [data-sk-region="loginfrequency-p-field-10"]')).toHaveText(["Sun", "3", "+50%"]);
  await expect(chart.locator('[data-sk-content] [data-sk-region="loginfrequency-div-field-5"]')).toHaveCount(2);
  expect(await chart.locator('[data-sk-content] [data-sk-region="loginfrequency-div-field-5"]').evaluateAll(bars => bars.map(b => (b as HTMLElement).style.height))).toEqual(["28%", "56%"]);
  await expect(page.getByText("Synthetic Actor p1", { exact: true })).toBeVisible();
  await expect(page.getByText("40 events · Page 1 of 2", { exact: true })).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await f.settled(); expect(errors).toEqual([]);
  const image = info.outputPath("admin-dashboard.png"); await page.screenshot({ path: image, fullPage: true });
  await info.attach("admin-dashboard-render", { path: image, contentType: "image/png" });
  await page.getByRole("heading", { name: "System Audit Logs", exact: true }).scrollIntoViewIfNeeded();
  const auditImage = info.outputPath("admin-dashboard-audit.png"); await page.screenshot({ path: auditImage, fullPage: true });
  await info.attach("admin-dashboard-audit-render", { path: auditImage, contentType: "image/png" });
  await info.attach("sanitized-request-counts", { body: JSON.stringify(Object.fromEntries(Object.entries(f.ledgers).map(([e, l]) => [e, l.snapshot()]))), contentType: "application/json" });
});
