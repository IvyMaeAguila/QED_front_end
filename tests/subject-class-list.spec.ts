import { waitForDataRoute } from "./fixtures/routeReady";
import { test, expect, type Page } from "@playwright/test";
import { mockDirectory } from "./fixtures/directory";
import { assertNoDataSpinner } from "./design-pixels";
import fs from "node:fs";

async function rosterFixture(page: Page, dark: boolean, count = 3, long = false) {
  const releaseContext = await mockDirectory(page, "TEACHER", dark);
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/api/mySubjects/subjects/1/students", async route => {
    await gate;
    await route.fulfill({ json: { data: { subject_name: long ? "Mathematics and quantitative reasoning for primary education" : "Mathematics", grade_level: "Grade 1", section_name: "Maroon", students: Array.from({ length: count }, (_, index) => ({ student_id: index + 1, student_number: long ? `2026-PRIMARY-000000${index}` : `26-${index}`, first_name: long ? "Maria Alexandra Isabella Delos Santos" : "Ana", middle_name: "A", last_name: "Cruz", gender: index % 2 ? "Female" : "Male" })) } } });
  });
  return () => { releaseContext(); release(); };
}

for (const width of [375, 1280]) for (const dark of [false, true]) test(`subject roster ${width} ${dark ? "dark" : "light"}: real controls, shared table rows and screenshots`, async ({ page }) => {
  await page.setViewportSize({ width, height: 1000 });
  const release = await rosterFixture(page, dark);
  await page.goto("/teacher/subjects/1/students");await waitForDataRoute(page);
  await expect(page.getByRole("button", { name: "Export to Excel", exact: true })).toBeVisible();
  await expect(page.getByPlaceholder("Search student...")).toBeVisible();
  for (const label of ["No.", "Name", "Student ID"]) await expect(page.getByRole("columnheader", { name: label, exact: true })).toBeVisible();
  const region = page.locator('[data-sk-region="subject-class-roster"]');
  await expect(region).toHaveAttribute("data-sk-phase", "revealed");
  await assertNoDataSpinner(page);
  const before = await page.locator("thead th").evaluateAll(elements => elements.map(element => ({ x: element.getBoundingClientRect().x, width: element.getBoundingClientRect().width })));
  await page.waitForTimeout(80);
  expect(await page.locator("thead th").evaluateAll(elements => elements.map(element => ({ x: element.getBoundingClientRect().x, width: element.getBoundingClientRect().width })))).toEqual(before);
  fs.mkdirSync("loading-screenshots", { recursive: true });
  const prefix = `loading-screenshots/teacher-subject-class-list-${width}-${dark ? "dark" : "light"}`;
  await page.screenshot({ path: `${prefix}-skeleton.png`, fullPage: true });
  release(); await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0);
  await expect(page.locator("[data-sk-primitive], [data-sk-frame], [role=status]")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Mathematics", exact: true })).toBeVisible();
  await page.screenshot({ path: `${prefix}-loaded.png`, fullPage: true });
});

test("subject roster auto-column classification is supported by native width changes", async ({ page }) => {
  const results: number[][] = [];
  for (const long of [false, true]) {
    const release = await rosterFixture(page, false, 1, long);
    await page.goto("/teacher/subjects/1/students");await waitForDataRoute(page);
    await expect(page.getByPlaceholder("Search student...")).toBeVisible();
    release(); await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0);
    results.push(await page.locator("thead th").evaluateAll(elements => elements.map(element => element.getBoundingClientRect().width)));
    await page.unroute("**/api/**"); await page.unroute("**/api/mySubjects/subjects/1/students");
  }
  expect(results[0].some((width, index) => Math.abs(width - results[1][index]) > 1)).toBe(true);
});

for (const count of [0, 1, 9]) test(`subject roster ${count} results uses the real empty/short/long table`, async ({ page }) => {
  const release = await rosterFixture(page, false, count);
  await page.goto("/teacher/subjects/1/students");await waitForDataRoute(page);
  await expect(page.getByRole("columnheader", { name: "Student ID", exact: true })).toBeVisible();
  release(); await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0);
  await expect(page.locator('[data-sk-region="subject-class-student-row"]')).toHaveCount(count);
  if (!count) await expect(page.getByText('No students found matching "".')).toBeVisible();
});
