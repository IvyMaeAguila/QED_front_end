import { test, expect, type Page } from "@playwright/test";
import { mockDirectory } from "./fixtures/directory";
import { mockAnalytics, type AnalyticsEndpoint } from "./fixtures/analytics";

// MOCKED real routes; the production config serves a newly built dist artifact.
const academic = (p: Page) => p.locator('[data-sk-region="report-metric-value-1"]');
const ready = async (p: Page, holistic = false) => {
  await expect(academic(p)).toHaveText(holistic ? "3.5 / 5" : "88%");
  await expect(p.locator('.sk-region[aria-busy="true"]')).toHaveCount(0);
};
for (const width of [375, 1280]) for (const dark of [false, true]) test(`Analytics ${width} ${dark ? "dark" : "light"}: filters, both routes, cache, offline, stale refresh, error and recovery`, async ({ page }, info) => {
  await page.setViewportSize({ width, height: 1000 });
  const release = await mockDirectory(page, "PRINCIPAL", dark); release(); const f = await mockAnalytics(page); f.hold("subjects");
  const errors: string[] = [], consoleErrors: string[] = [];
  page.on("pageerror", e => errors.push(e.name)); page.on("console", m => { if (m.type() === "error") consoleErrors.push(m.text()); });
  const capture = async (name: string) => { const path = info.outputPath(`${name}.png`); await page.screenshot({ path, fullPage: true }); await info.attach(name, { path, contentType: "image/png" }); };
  await page.goto("/principal/reports");
  await expect(page.getByRole("heading", { name: "Subject Performance Analytics", exact: true })).toBeVisible();
  await expect(page.locator('[data-sk-region="whole-elementary-ranking"]')).toHaveAttribute("aria-busy", "true"); await capture("academic-loading");
  f.release("subjects"); await ready(page); await expect(page.locator("svg.recharts-surface")).toBeVisible();
  await expect(page.locator(".qed-account-ui")).toHaveClass(dark ? /\bdark\b/ : /qed-account-ui/);
  if (!dark) await expect(page.locator(".qed-account-ui")).not.toHaveClass(/\bdark\b/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true); await capture("academic-loaded");
  await page.getByRole("combobox").nth(1).selectOption("Grade 1"); expect(f.state.subjects.calls).toBe(1);
  await page.getByRole("combobox").first().selectOption("Term 2"); await ready(page); await expect(page.getByText("Term 2 Mathematics", { exact: true }).first()).toBeVisible();
  await page.getByRole("combobox").first().selectOption("Term 1"); await ready(page); expect(f.state.subjects.calls).toBe(2);
  await page.getByRole("link", { name: "Holistic Development", exact: true }).click(); await ready(page, true);
  await expect(page.getByRole("button", { name: "Term 1 By Grade Level, Cognitive: 4.5", exact: true })).toBeVisible(); await capture("holistic-loaded");
  await page.getByRole("combobox").first().selectOption("By Subject"); await ready(page, true);
  await expect(page.getByRole("button", { name: "Term 1 By Subject, Cognitive: 4.5", exact: true })).toBeVisible();
  await page.context().setOffline(true); await expect(page.getByRole("alert")).toContainText("offline"); await ready(page, true); await capture("holistic-cached-offline");
  await expect(page.getByRole("button", { name: "Term 1 By Subject, Cognitive: 4.5", exact: true })).toBeVisible();
  await page.context().setOffline(false); await expect(page.getByRole("alert")).toHaveCount(0); expect(f.state.holistic.calls).toBe(2);
  await page.goBack(); await ready(page); expect(f.state.subjects.calls).toBe(2); expect(f.state.terms.calls).toBe(1); expect(f.state.year.calls).toBe(1);
  await page.context().setOffline(true); await expect(page.getByRole("alert")).toContainText("offline"); await ready(page); await capture("academic-cached-offline");
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Retry", exact: true }).click(); expect(f.state.subjects.calls).toBe(2);
  await page.context().setOffline(false); await expect(page.getByRole("alert")).toHaveCount(0); expect(f.state.subjects.calls).toBe(2);
  await page.clock.install(); await page.getByRole("link", { name: "Holistic Development", exact: true }).click(); await ready(page, true);
  await expect(page.getByRole("heading", { name: "Subject Performance Analytics", exact: true })).toHaveCount(0); await page.clock.fastForward(31_000);
  await page.getByRole("link", { name: "Subject Performance", exact: true }).click(); await ready(page); await expect.poll(() => f.state.subjects.calls).toBe(3);
  f.state.subjects.status = 500; await page.reload(); await expect(page.getByRole("alert")).toContainText("500"); await capture("academic-error");
  f.state.subjects.status = 200; await page.getByRole("button", { name: "Retry", exact: true }).click(); await ready(page);
  expect(f.state.subjects.calls).toBe(5); expect(errors).toEqual([]); expect(consoleErrors.filter(m => !m.includes("Failed to load resource"))).toEqual([]);
  await info.attach("sanitized-request-counts", { body: JSON.stringify({ backend: "mocked", width, dark, requests: f.requests, state: f.state }), contentType: "application/json" });
});
for (const endpoint of ["subjects", "holistic", "terms", "views", "grades", "year"] as AnalyticsEndpoint[]) for (const status of [401, 403]) test(`built Analytics ${endpoint} ${status} preserves authentication/privacy behavior`, async ({ page }) => {
  const release = await mockDirectory(page, "PRINCIPAL", false); release(); const f = await mockAnalytics(page); f.state[endpoint].status = status;
  const holistic = endpoint === "holistic" || endpoint === "views";
  await page.goto(holistic ? "/principal/holistic-performance-analytics" : "/principal/reports");
  if (status === 401) await expect(page).toHaveURL(/\/login/);
  else { await expect(page.getByRole("alert")).toContainText(endpoint === "year" ? "Failed to fetch academic year." : "403"); await expect(page).toHaveURL(/\/principal\//); await expect(page.locator('[data-sk-region="report-metric-value-1"]')).toHaveCount(0); }
});
for (const holistic of [false, true]) test(`built ${holistic ? "holistic" : "academic"} offline empty cache settles and reconnect resumes exactly once`, async ({ page }) => {
  const release = await mockDirectory(page, "PRINCIPAL", false); release(); const f = await mockAnalytics(page);
  await page.goto(holistic ? "/principal/holistic-performance-analytics" : "/principal/reports"); await ready(page, holistic); await page.clock.install();
  const menu = page.getByRole("button", { name: "Open menu", exact: true }); if (await menu.isVisible()) await menu.click();
  await page.getByRole("link", { name: "Help & Support", exact: true }).click(); await expect(page.getByRole("heading", { name: "Help & Support", exact: true })).toBeVisible();
  await expect(academic(page)).toHaveCount(0); await page.clock.fastForward(601_000); await page.context().setOffline(true); await page.goBack();
  await expect(page.getByRole("alert")).toContainText("offline"); await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0);
  await page.context().setOffline(false); await ready(page, holistic); expect(f.state[holistic ? "holistic" : "subjects"].calls).toBe(2);
});
test("built holistic cached scores remain visible with offline alert and recover without extra reads", async ({ page }) => {
  const release = await mockDirectory(page, "PRINCIPAL", true); release(); const f = await mockAnalytics(page);
  await page.goto("/principal/holistic-performance-analytics"); await ready(page, true); await page.context().setOffline(true);
  await expect(page.getByRole("alert")).toContainText("offline"); await ready(page, true);
  await expect(page.getByRole("button", { name: "Term 1 By Grade Level, Cognitive: 4.5", exact: true })).toBeVisible();
  await page.context().setOffline(false); await expect(page.getByRole("alert")).toHaveCount(0); expect(f.state.holistic.calls).toBe(1);
});
