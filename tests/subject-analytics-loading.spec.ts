import { waitForDataRoute } from "./fixtures/routeReady";
import { test, expect, type Page } from "@playwright/test";
import { mockDirectory } from "./fixtures/directory";
import { assertNoDataSpinner, captureFixedOverlay, checkRenderedContrast, checkShimmerPixels } from "./design-pixels";
import fs from "node:fs";

async function subjectFixture(page: Page, dark: boolean, count = 3, long = false) {
  const context = await mockDirectory(page, "PRINCIPAL", dark);
  let release!: () => void; const gate = new Promise<void>(resolve => { release = resolve; });
  let failed = false, requests = 0;
  let nextGate = Promise.resolve(); let finishNext = () => {};
  await page.route("**/api/reports/**", async route => {
    const path = new URL(route.request().url()).pathname;
    requests++; await gate; await nextGate;
    if (failed) { await route.fulfill({ status: 500, json: { message: "Ranking unavailable" } }); return; }
    const data = path.endsWith("term-options") ? ["Term 1", "Term 2", "Term 3"] : path.endsWith("grade-options") ? ["All Grades", "Grade 1", "Grade 2"] : Array.from({ length: count }, (_, index) => ({ subject: long ? `Mathematics and reasoning for elementary learners ${index}` : `Subject ${index + 1}`, grade: `Grade ${index % 2 + 1}`, score: 95 - index * 3, trend: index % 2 ? "down" : "up" }));
    await route.fulfill({ json: { success: true, data } });
  });
  return Object.assign(() => { context(); release(); }, { fail: () => { failed = true; }, recover: () => { failed = false; }, requests: () => requests, hold: () => { nextGate = new Promise<void>(resolve => { finishNext = resolve; }); }, finish: () => finishNext() });
}

for (const width of [375, 1280]) for (const dark of [false, true]) test(`subject analytics ${width} ${dark ? "dark" : "light"}: real ranking frames and controls`, async ({ page }) => {
  await page.setViewportSize({ width, height: 1000 });
  const release = await subjectFixture(page, dark);
  await page.goto("/principal/reports");await waitForDataRoute(page);
  for (const name of ["Whole Elementary Department Ranking", "Per Grade Level Ranking", "Priority Focus"]) await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  await expect(page.getByText("All subject-grade combinations", { exact: false })).toBeVisible();
  await expect(page.locator('[data-sk-region="whole-elementary-ranking"]')).toHaveAttribute("data-sk-phase", "revealed");
  await assertNoDataSpinner(page);
  await expect(page.locator('[data-sk-chart="bars"] foreignObject [data-sk-primitive]')).not.toHaveCount(0);
  const verify = await captureFixedOverlay(page, `principal-subject-metrics-${width}-${dark ? "dark" : "light"}`, [0, 1, 2, 3].map(index => `[data-sk-region="report-metric-value-${index}"]`));
  fs.mkdirSync("loading-screenshots", { recursive: true });
  const prefix = `loading-screenshots/principal-subject-analytics-${width}-${dark ? "dark" : "light"}`;
  await page.screenshot({ path: `${prefix}-skeleton.png`, fullPage: true });
  release(); await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0);
  await expect(page.locator('[data-sk-region="leading-subject-row"]')).toHaveCount(3);
  await expect(page.locator('[data-sk-region="per-grade-ranking-row"]')).toHaveCount(3);
  await expect(page.locator("[data-sk-primitive], [data-sk-layer], [role=status]:not(.recharts-default-tooltip)")).toHaveCount(0);
  await expect(page.locator(".recharts-default-tooltip[role=status]")).toHaveCount(1);
  await page.screenshot({ path: `${prefix}-loaded.png`, fullPage: true });
  await verify();
});

for (const dark of [false, true]) test(`subject priority ${dark ? "dark" : "light"}: track placeholder fits its actual surface`, async ({ page }) => {
  const release = await subjectFixture(page, dark);
  await page.goto("/principal/reports");await waitForDataRoute(page);
  await expect(page.locator('[data-sk-region="priority-focus"]')).toHaveAttribute("data-sk-phase", "revealed");
  const shape = page.locator('[data-sk-region="priority-focus"] .bg-white\\/20 [data-sk-primitive]');
  await checkRenderedContrast(shape, `subject-priority-${dark ? "dark" : "light"}-track`);
  await checkShimmerPixels(shape, `subject-priority-${dark ? "dark" : "light"}-track`);
  release();
});

for (const count of [0, 1, 9]) test(`subject analytics ${count} subjects preserve the real empty, short and full ranking states`, async ({ page }) => {
  const release = await subjectFixture(page, false, count, count === 9);
  await page.goto("/principal/reports");await waitForDataRoute(page);
  await expect(page.getByRole("heading", { name: "Priority Focus", exact: true })).toBeVisible();
  release(); await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0);
  await expect(page.locator('[data-sk-region="leading-subject-row"]')).toHaveCount(Math.min(5, count));
  await expect(page.locator('[data-sk-region="per-grade-ranking-row"]')).toHaveCount(Math.min(3, count));
  if (count > 3) {
    await page.getByRole("button", { name: `View full ranking · ${count}`, exact: true }).click();
    await expect(page.locator('[data-sk-region="per-grade-ranking-row"]')).toHaveCount(count);
  }
  if (!count) await expect(page.getByText("No subject scores are available for this term.", { exact: true })).toHaveCount(2);
});

test("subject analytics failure removes placeholders and retries all report requests", async ({ page }) => {
  const release = await subjectFixture(page, false); release.fail();
  await page.goto("/principal/reports");await waitForDataRoute(page);
  await expect(page.locator('[data-sk-region="whole-elementary-ranking"]')).toHaveAttribute("data-sk-phase", "revealed");
  release(); await expect(page.getByRole("alert")).toBeVisible();
  expect(await page.locator("[data-sk-primitive]").count()).toBe(0);
  const before = release.requests(); release.recover();
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(page.locator('[data-sk-region="leading-subject-row"]')).toHaveCount(3);
  await expect(page.getByRole("alert")).toHaveCount(0);
  expect(release.requests()).toBe(before + 3);
});

for (const fast of [true, false]) test(`subject analytics ${fast ? "fast" : "slow"} term refetch preserves the old ranking`, async ({ page }) => {
  const release = await subjectFixture(page, false);
  await page.goto("/principal/reports");await waitForDataRoute(page);
  await expect(page.getByRole("heading", { name: "Priority Focus", exact: true })).toBeVisible();
  release(); await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0);
  const region = page.locator('[data-sk-region="whole-elementary-ranking"]');
  const heading = page.getByRole("heading", { name: "Subject Performance Analytics", exact: true });
  const before = await heading.boundingBox();
  await region.evaluate(element => {
    (window as Window & { reportPhases?: string[] }).reportPhases = [];
    new MutationObserver(() => (window as Window & { reportPhases?: string[] }).reportPhases!.push(element.getAttribute("data-sk-phase")!)).observe(element, { attributes: true, attributeFilter: ["data-sk-phase"] });
  });
  release.hold(); await page.getByRole("combobox").first().selectOption("Term 2");
  if (fast) { await page.waitForTimeout(60); release.finish(); }
  else {
    await expect(region).toHaveAttribute("data-sk-phase", "dimmed");
    await expect(region.locator("[data-sk-stale]")).toHaveCSS("opacity", "0.6");
    await expect(region.locator('[data-sk-region="leading-subject-row"]')).toHaveCount(3);
    expect(await heading.boundingBox()).toEqual(before);
    await expect(region).toHaveAttribute("data-sk-phase", "revealed", { timeout: 2500 });
    await expect(region.locator("[data-sk-primitive]").first()).toBeVisible();
    release.finish();
  }
  await expect(region).toHaveAttribute("data-sk-phase", "settled");
  if (fast) {
    const phases = await page.evaluate(() => (window as Window & { reportPhases?: string[] }).reportPhases!);
    expect(phases).not.toContain("dimmed"); expect(phases).not.toContain("revealed");
  }
  expect(await heading.boundingBox()).toEqual(before);
  await assertNoDataSpinner(page);
});

for (const dark of [false, true]) test(`subject analytics ${dark ? "dark" : "light"}: native chart bars and priority text use scoped neutral pixels`, async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  const release = await subjectFixture(page, dark);
  await page.goto("/principal/reports");await waitForDataRoute(page);
  await expect(page.locator('[data-sk-region="whole-elementary-ranking"]')).toHaveAttribute("data-sk-phase", "revealed");
  for (const [name, selector] of [["chart-bar", '[data-sk-chart="bars"] foreignObject [data-sk-primitive="block"]'], ["priority-title", '[data-sk-region="priorityfocus-h3-field-3"] [data-sk-primitive]']]) {
    const shape = page.locator(selector).first();
    await checkRenderedContrast(shape, `subject-${dark ? "dark" : "light"}-${name}`);
    await checkShimmerPixels(shape, `subject-${dark ? "dark" : "light"}-${name}`);
  }
  release();
});
