import { waitForDataRoute } from "./fixtures/routeReady";
import { test, expect, type Page } from "@playwright/test";
import { mockDirectory } from "./fixtures/directory";
import { assertNoDataSpinner, checkRenderedContrast, checkShimmerPixels } from "./design-pixels";
import fs from "node:fs";

async function coursewareFixture(page: Page, dark: boolean, count = 3, long = false, fail = false) {
  const releaseContext = await mockDirectory(page, "PARENT", dark);
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  let requests = 0;
  let unavailable = fail;
  await page.route("**/api/courseware/1/1", async route => {
    requests++;
    await gate;
    if (unavailable) { await route.fulfill({ status: 500, json: { message: "Unavailable" } }); return; }
    await route.fulfill({ json: { cached: false, document: { title: long ? "Understanding fractions and their applications in everyday mathematics ".repeat(4) : "Fractions", content: Array.from({ length: count }, (_, index) => `## Lesson ${index + 1}\n${long ? "Explore fractions with everyday examples and compare the parts of a whole. ".repeat(15) : "A fraction represents part of a whole."}`).join("\n\n") }, videos: Array.from({ length: count }, (_, index) => ({ title: long ? "Explore fractions with everyday examples ".repeat(5) : `Fractions lesson ${index + 1}`, url: `https://www.youtube.com/watch?v=example${index}`, thumbnailUrl: "/images/missing-test-image.png", channelName: "School Learning" })) } });
  });
  return { finish: () => { releaseContext(); release(); }, recover: () => { unavailable = false; }, requests: () => requests };
}

for (const width of [375, 1280]) for (const dark of [false, true]) test(`courseware ${width} ${dark ? "dark" : "light"}: real learning frame before fetched leaves`, async ({ page }) => {
  await page.setViewportSize({ width, height: 1000 });
  const fixture = await coursewareFixture(page, dark);
  await page.goto("/parent/students/1/topics/1/courseware");await waitForDataRoute(page);
  await expect(page.getByText("Your learning quest", { exact: true })).toBeVisible();
  await expect(page.getByText("Explore the lesson", { exact: true })).toBeVisible();
  await expect(page.getByText("Follow the lesson, then watch a video to complete your learning path.", { exact: true })).toBeVisible();
  const region = page.locator('[data-sk-region="learning-resources"]');
  await expect(region).toHaveAttribute("data-sk-phase", "revealed");
  await assertNoDataSpinner(page);
  const before = await region.boundingBox();
  await page.waitForTimeout(80);
  expect(await region.boundingBox()).toEqual(before);
  fs.mkdirSync("loading-screenshots", { recursive: true });
  const prefix = `loading-screenshots/courseware-${width}-${dark ? "dark" : "light"}`;
  await page.screenshot({ path: `${prefix}-skeleton.png`, fullPage: true });
  fixture.finish();
  await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0);
  await expect(page.locator("[data-sk-primitive], [data-sk-layer], [data-sk-frame], [role=status]")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Fractions", exact: true })).toBeVisible();
  await page.screenshot({ path: `${prefix}-loaded.png`, fullPage: true });
});

for (const count of [0, 1, 9]) test(`courseware ${count} resources preserves empty/short/long content`, async ({ page }) => {
  const fixture = await coursewareFixture(page, false, count, count === 9);
  await page.goto("/parent/students/1/topics/1/courseware");await waitForDataRoute(page);
  await expect(page.getByText("Your learning quest", { exact: true })).toBeVisible();
  fixture.finish();
  await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0);
  await expect(page.locator('[data-sk-region="learning-video"]')).toHaveCount(count);
  await expect(page.locator('[data-sk-region="lesson-body"] h3')).toHaveCount(count);
  if (count) { await page.locator('[data-sk-region="learning-video"]').first().click(); await expect(page.locator("iframe")).toHaveCount(1); await page.locator('[data-sk-region="coursewareview-close"]').click(); await expect(page.locator("iframe")).toHaveCount(0); }
});

test("courseware error ends reservation and retries the same request", async ({ page }) => {
  const fixture = await coursewareFixture(page, false, 1, false, true);
  await page.goto("/parent/students/1/topics/1/courseware");await waitForDataRoute(page);
  await expect(page.getByText("Your learning quest", { exact: true })).toBeVisible();
  fixture.finish();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.locator("[data-sk-primitive]")).toHaveCount(0);
  const failedRequests = fixture.requests();
  fixture.recover();
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Fractions", exact: true })).toBeVisible();
  expect(fixture.requests()).toBe(failedRequests + 1);
});

for (const dark of [false, true]) test(`courseware ${dark ? "dark" : "light"}: actual hero and thumbnail surfaces keep visible shimmer`, async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  const fixture = await coursewareFixture(page, dark);
  await page.goto("/parent/students/1/topics/1/courseware");await waitForDataRoute(page);
  await expect(page.locator('[data-sk-region="learning-resources"]')).toHaveAttribute("data-sk-phase", "revealed");
  for (const [name, selector] of [["hero", '[data-sk-region="learning-quest-title"] [data-sk-primitive]'], ["video", '.sk-surface-courseware-video [data-sk-primitive]']] as const) {
    const shape = page.locator(selector).first();
    await checkRenderedContrast(shape, `courseware-${dark ? "dark" : "light"}-${name}`);
    await checkShimmerPixels(shape, `courseware-${dark ? "dark" : "light"}-${name}`);
  }
  fixture.finish();
});
