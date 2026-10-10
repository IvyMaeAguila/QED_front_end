import { waitForDataRoute } from "./fixtures/routeReady";
import { test, expect, type Page } from "@playwright/test";
import { mockDirectory } from "./fixtures/directory";
import { assertNoDataSpinner, captureFixedOverlay, checkRenderedContrast, checkShimmerPixels } from "./design-pixels";
import fs from "node:fs";

async function analyticsFixture(page: Page, dark: boolean, count = 3, long = false) {
  const releaseContext = await mockDirectory(page, "PRINCIPAL", dark);
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  let failed = false, requests = 0;
  await page.route("**/api/reports/**", async route => {
    const path = new URL(route.request().url()).pathname;
    requests++; await gate;
    if (failed) { await route.fulfill({ status: 500, json: { message: "Analytics unavailable" } }); return; }
    const data = path.endsWith("term-options") ? ["Term 1", "Term 2", "Term 3"] : path.endsWith("view-options") ? ["By Grade Level", "By Subject"] : Array.from({ length: count }, (_, index) => ({ label: long ? `Mathematics and quantitative reasoning for elementary learners ${index}` : `Grade ${index + 1}`, scores: { cognitive: 4.2, emotional: 3.5, behavioral: 2.8, social: index % 2 ? null : 4.5 } }));
    await route.fulfill({ json: { success: true, data } });
  });
  return Object.assign(() => { releaseContext(); release(); }, { fail: () => { failed = true; }, recover: () => { failed = false; }, requests: () => requests });
}

for (const width of [375, 1280]) for (const dark of [false, true]) test(`holistic analytics ${width} ${dark ? "dark" : "light"}: headers, legend and controls stay real`, async ({ page }) => {
  await page.setViewportSize({ width, height: 1000 });
  const release = await analyticsFixture(page, dark);
  await page.goto("/principal/holistic-performance-analytics");await waitForDataRoute(page);
  await expect(page.getByRole("heading", { name: "Development overview", exact: true })).toBeVisible();
  await expect(page.getByText("Excellent", { exact: true })).toBeVisible();
  await expect(page.getByText("Hover over or focus a score to see its meaning.", { exact: true })).toBeVisible();
  await expect(page.locator('.sk-region[aria-busy="true"]').first()).toHaveAttribute("data-sk-phase", "revealed");
  await assertNoDataSpinner(page);
  const verifyOverlay = await captureFixedOverlay(page, `principal-holistic-metrics-${width}-${dark ? "dark" : "light"}`, [0, 1, 2, 3].map(index => `[data-sk-region="report-metric-value-${index}"]`));
  fs.mkdirSync("loading-screenshots", { recursive: true });
  const prefix = `loading-screenshots/principal-holistic-analytics-${width}-${dark ? "dark" : "light"}`;
  await page.screenshot({ path: `${prefix}-skeleton.png`, fullPage: true });
  release(); await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Grade 1, Cognitive: 4.2", exact: true })).toBeVisible();
  await expect(page.locator("[data-sk-primitive], [data-sk-layer], [role=status]")).toHaveCount(0);
  await page.screenshot({ path: `${prefix}-loaded.png`, fullPage: true });
  await verifyOverlay();
});

test("holistic metric name and detail bars have measurable widths", async ({ page }) => {
  const release = await analyticsFixture(page, false);
  await page.goto("/principal/holistic-performance-analytics");await waitForDataRoute(page);
  await expect(page.locator('.sk-region[aria-busy="true"]').first()).toHaveAttribute("data-sk-phase", "revealed");
  for (const selector of ['[data-sk-region="report-metric-value-2"]', '[data-sk-region="report-metric-detail-3"]']) {
    const shape = page.locator(`${selector} [data-sk-primitive]`);
    await expect(shape).toBeVisible();
    expect((await shape.boundingBox())!.width).toBeGreaterThan(0);
  }
  release();
});

for (const count of [0, 1, 9]) test(`holistic analytics ${count} returned rows preserve empty, short and wrapping results`, async ({ page }) => {
  const release = await analyticsFixture(page, false, count, count === 9);
  await page.goto("/principal/holistic-performance-analytics");await waitForDataRoute(page);
  await expect(page.getByRole("heading", { name: "Development overview", exact: true })).toBeVisible();
  release(); await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0);
  await expect(page.locator('[data-sk-region="holistic-heatmap-row-label"]')).toHaveCount(count);
  await expect(page.getByText("Excellent", { exact: true })).toBeVisible();
  if (count) {
    const cell = page.locator('[data-sk-region="holistic-heatmap-score-cognitive"]').first();
    await cell.focus();
    await expect(page.getByText("Understands most concepts with minimal guidance", { exact: true })).toBeVisible();
  }
});

test("holistic analytics errors clear all shapes and retry options and scores", async ({ page }) => {
  const release = await analyticsFixture(page, false); release.fail();
  await page.goto("/principal/holistic-performance-analytics");await waitForDataRoute(page);
  await expect(page.locator('.sk-region[aria-busy="true"]').first()).toHaveAttribute("data-sk-phase", "revealed");
  release(); await expect(page.getByRole("alert")).toBeVisible();
  expect(await page.locator("[data-sk-primitive]").count()).toBe(0);
  const before = release.requests(); release.recover();
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(page.getByRole("button", { name: "Grade 1, Cognitive: 4.2", exact: true })).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
  expect(release.requests()).toBe(before + 3);
});

for (const dark of [false, true]) test(`holistic analytics ${dark ? "dark" : "light"}: actual card and heatmap surfaces retain shimmer pixels`, async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  const release = await analyticsFixture(page, dark);
  await page.goto("/principal/holistic-performance-analytics");await waitForDataRoute(page);
  await expect(page.locator('[data-sk-region="holistic-heatmap-grid"]')).toHaveAttribute("data-sk-phase", "revealed");
  for (const [name, selector] of [["metric", '[data-sk-region="report-metric-value-2"]'], ["row-label", '[data-sk-region="holistic-heatmap-row-label"]'], ["score", '[data-sk-region="holistic-heatmap-score-cognitive"]']]) {
    const shape = page.locator(`${selector} [data-sk-primitive]`).first();
    await checkRenderedContrast(shape, `holistic-${dark ? "dark" : "light"}-${name}`);
    await checkShimmerPixels(shape, `holistic-${dark ? "dark" : "light"}-${name}`);
  }
  release();
});
