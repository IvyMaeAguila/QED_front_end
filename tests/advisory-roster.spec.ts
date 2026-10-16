import { waitForDataRoute } from "./fixtures/routeReady";
import { test, expect, type Page } from "@playwright/test";
import { mockDirectory } from "./fixtures/directory";
import { assertNoDataSpinner } from "./design-pixels";
import fs from "node:fs";

async function advisoryFixture(page: Page, dark: boolean, count = 3, long = false) {
  const contextRelease = await mockDirectory(page, "TEACHER", dark);
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/api/teacherAttendance/advisory-sections", async route => {
    await gate;
    await route.fulfill({ json: [{ classId: "1", sectionId: "1", sectionName: "Maroon", gradeLevel: "Grade 1", terms: [], roster: Array.from({ length: count }, (_, index) => ({ id: String(index), name: long ? "Maria Alexandra Isabella Delos Santos ".repeat(8) : "Ana Cruz", gender: index % 2 ? "F" : "M" })) }] });
  });
  return () => { contextRelease(); release(); };
}

for (const width of [375, 1280]) for (const dark of [false, true]) test(`advisory roster ${width} ${dark ? "dark" : "light"}: real labels, actions and table`, async ({ page }) => {
  await page.setViewportSize({ width, height: 1000 });
  const release = await advisoryFixture(page, dark);
  await page.goto("/teacher/advisory");await waitForDataRoute(page);
  await expect(page.getByRole("heading", { name: "Class Roster", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Export to Excel", exact: true })).toBeVisible();
  await expect(page.getByPlaceholder("Search student...")).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Student", exact: true })).toBeVisible();
  await expect(page.locator('.sk-region[aria-busy="true"]').first()).toHaveAttribute("data-sk-phase", "revealed");
  for (const label of ["Male", "Female"]) await expect(page.getByText(label, { exact: true }).last()).toBeVisible();
  await assertNoDataSpinner(page);
  fs.mkdirSync("loading-screenshots", { recursive: true });
  const prefix = `loading-screenshots/teacher-advisory-roster-${width}-${dark ? "dark" : "light"}`;
  await page.screenshot({ path: `${prefix}-skeleton.png`, fullPage: true });
  release(); await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0);
  await expect(page.locator("[data-sk-primitive], [data-sk-frame], [role=status]")).toHaveCount(0);
  await page.screenshot({ path: `${prefix}-loaded.png`, fullPage: true });
});

test("student directory classification observes native columns across short/long names", async ({ page }) => {
  const widths: number[][] = [];
  for (const long of [false, true]) {
    const release = await advisoryFixture(page, false, 1, long);
    await page.goto("/teacher/advisory");await waitForDataRoute(page);
    await expect(page.getByRole("heading", { name: "Class Roster", exact: true })).toBeVisible();
    release(); await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0);
    await expect(page.locator("[data-sk-auto-columns]")).toHaveCount(1);
    widths.push(await page.locator("thead th").evaluateAll(elements => elements.map(element => element.getBoundingClientRect().width)));
    await page.unroute("**/api/**"); await page.unroute("**/api/teacherAttendance/advisory-sections");
  }
  // Native overflow with long names proved this is AUTO-COLUMN; loaded widths remain automatic.
  expect(widths[0].some((width, index) => Math.abs(width - widths[1][index]) > 1)).toBe(true);
});
