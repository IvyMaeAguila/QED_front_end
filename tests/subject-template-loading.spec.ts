import { waitForDataRoute } from "./fixtures/routeReady";
import { test, expect, type Page } from "@playwright/test";
import { mockDirectory } from "./fixtures/directory";
import { assertNoDataSpinner, checkRenderedContrast, checkShimmerPixels } from "./design-pixels";
import fs from "node:fs";

async function templateFixture(page: Page, dark: boolean, present = true) {
  const releaseContext = await mockDirectory(page, "ADMIN", dark);
  releaseContext();
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  let fail = false;
  let requests = 0;
  await page.route("**/api/subject/getActiveGradeTemplate/1", async route => {
    requests++;
    await gate;
    await route.fulfill({ status: fail ? 500 : 200, json: fail ? { success: false, message: "Template temporarily unavailable" } : { success: true, data: present ? { id: 1, subject_id: 1, file_name: "Official DepEd workbook.xlsx", wwWeightPercent: 30, ptWeightPercent: 50, examWeightPercent: 20, examSt1SubweightPercent: 30, examSt2SubweightPercent: 30, examTeSubweightPercent: 40, uploadedAt: "2026-10-01" } : null } });
  });
  return { finish: release, unavailable: () => { fail = true; }, recover: () => { fail = false; }, requests: () => requests };
}

for (const width of [375, 1280]) for (const dark of [false, true]) test(`subject template ${width} ${dark ? "dark" : "light"}: upload frame is real before fetched metadata`, async ({ page }) => {
  await page.setViewportSize({ width, height: 1000 });
  const fixture = await templateFixture(page, dark);
  await page.goto("/admin/subjects/1");await waitForDataRoute(page);
  await expect(page.getByText("Official DepEd Grade Template", { exact: true })).toBeVisible();
  await expect(page.getByText("Drop an .xlsx here or choose a file", { exact: true })).toBeVisible();
  await expect(page.locator('[data-sk-region="subject-template"]')).toHaveAttribute("data-sk-phase", "revealed");
  await assertNoDataSpinner(page);
  fs.mkdirSync("loading-screenshots", { recursive: true });
  const prefix = `loading-screenshots/subject-template-${width}-${dark ? "dark" : "light"}`;
  await page.screenshot({ path: `${prefix}-skeleton.png`, fullPage: true });
  fixture.finish();
  await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0);
  await expect(page.locator("[data-sk-primitive], [data-sk-layer], [data-sk-frame], [role=status]")).toHaveCount(0);
  await expect(page.getByText("Official DepEd workbook.xlsx", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Replace Template", exact: true })).toBeEnabled();
  await page.screenshot({ path: `${prefix}-loaded.png`, fullPage: true });
});

test("subject template absent result keeps original upload operation", async ({ page }) => {
  const fixture = await templateFixture(page, false, false);
  await page.goto("/admin/subjects/1");await waitForDataRoute(page);
  await expect(page.getByText("Official DepEd Grade Template", { exact: true })).toBeVisible();
  fixture.finish();
  await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0);
  await expect(page.getByText("Current Template", { exact: true })).toHaveCount(0);
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Upload Template", exact: true }).click();
  expect((await chooser).isMultiple()).toBe(false);
});

test("subject template error clears skeleton and retries existing service", async ({ page }) => {
  const fixture = await templateFixture(page, false);
  fixture.unavailable();
  await page.goto("/admin/subjects/1");await waitForDataRoute(page);
  await expect(page.getByText("Official DepEd Grade Template", { exact: true })).toBeVisible();
  fixture.finish();
  await expect(page.getByRole("alert")).toContainText("Template temporarily unavailable");
  await expect(page.locator("[data-sk-primitive]")).toHaveCount(0);
  const before = fixture.requests(); fixture.recover();
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(page.getByText("Official DepEd workbook.xlsx", { exact: true })).toBeVisible();
  expect(fixture.requests()).toBe(before + 1);
});

for (const dark of [false, true]) test(`subject template ${dark ? "dark" : "light"}: fetched button label uses the actual maroon surface`, async ({ page }) => {
  const fixture = await templateFixture(page, dark);
  await page.goto("/admin/subjects/1");await waitForDataRoute(page);
  const region = page.locator('[data-sk-region="subject-template"]');
  await expect(region).toHaveAttribute("data-sk-phase", "revealed");
  const shape = region.locator("button [data-sk-primitive]");
  await checkRenderedContrast(shape, `subject-template-${dark ? "dark" : "light"}-button`);
  await checkShimmerPixels(shape, `subject-template-${dark ? "dark" : "light"}-button`);
  fixture.finish();
});
