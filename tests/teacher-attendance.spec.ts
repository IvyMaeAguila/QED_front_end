import { waitForDataRoute } from "./fixtures/routeReady";
import { test, expect, type Page } from "@playwright/test";
import { mockDirectory } from "./fixtures/directory";
import { assertNoDataSpinner } from "./design-pixels";
import fs from "node:fs";

async function attendanceFixture(page: Page, dark: boolean, long = false) {
  const releaseContext = await mockDirectory(page, "TEACHER", dark);
  let releaseSections!: () => void, releaseAttendance!: () => void;
  const sectionGate = new Promise<void>(resolve => { releaseSections = resolve; });
  const attendanceGate = new Promise<void>(resolve => { releaseAttendance = resolve; });
  const mutations: unknown[] = [];
  await page.route("**/api/teacherAttendance/advisory-sections", async route => {
    await sectionGate;
    await route.fulfill({ json: [{ classId: "1", sectionId: "1", sectionName: "Maroon", gradeLevel: "Grade 1", terms: [{ id: "1", termNumber: 1, label: "Term 1", startDate: "2026-01-01", endDate: "2027-12-31", isActive: true }], roster: Array.from({ length: 3 }, (_, index) => ({ id: String(index), name: long ? "Maria Alexandra Isabella Delos Santos ".repeat(8) : "Ana Cruz", gender: index % 2 ? "F" : "M" })) }] });
  });
  await page.route(/\/api\/teacherAttendance\/1(?:\?|$)/, async route => {
    if (route.request().method() === "POST") { mutations.push(route.request().postDataJSON()); await route.fulfill({ json: { success: true } }); return; }
    await attendanceGate; await route.fulfill({ json: { data: {} } });
  });
  return { sections: () => { releaseContext(); releaseSections(); }, finish: () => { releaseContext(); releaseSections(); releaseAttendance(); }, mutations };
}

for (const width of [375, 1280]) for (const dark of [false, true]) test(`teacher attendance ${width} ${dark ? "dark" : "light"}: staged fetches keep real controls and table`, async ({ page }) => {
  await page.setViewportSize({ width, height: 1000 });
  const fixture = await attendanceFixture(page, dark);
  await page.goto("/teacher/attendance");await waitForDataRoute(page);
  await expect(page.getByRole("heading", { name: /^Attendance/ })).toBeVisible();
  for (const label of ["Full Records", "Mark All Present"]) await expect(page.getByRole("button", { name: label, exact: true })).toBeVisible();
  await expect(page.getByPlaceholder("Search student...")).toBeVisible();
  for (const label of ["No.", "Student", "Status"]) await expect(page.getByRole("columnheader", { name: label, exact: true })).toBeVisible();
  const region = page.locator('[data-sk-region="today-attendance-roster"]');
  await expect(region).toHaveAttribute("data-sk-phase", "revealed");
  await assertNoDataSpinner(page);
  fixture.sections(); await expect(region).toHaveAttribute("aria-busy", "true");
  await expect(region).toHaveAttribute("data-sk-phase", "revealed");
  await assertNoDataSpinner(page);
  fs.mkdirSync("loading-screenshots", { recursive: true });
  const prefix = `loading-screenshots/teacher-attendance-${width}-${dark ? "dark" : "light"}`;
  await page.screenshot({ path: `${prefix}-skeleton.png`, fullPage: true });
  fixture.finish(); await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0);
  await expect(page.locator("[data-sk-primitive], [data-sk-frame], [role=status]")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Attendance — Maroon", exact: true })).toBeVisible();
  await page.screenshot({ path: `${prefix}-loaded.png`, fullPage: true });
});

test("attendance column classification is justified by long returned names", async ({ page }) => {
  const widths: number[][] = [];
  for (const long of [false, true]) {
    const fixture = await attendanceFixture(page, false, long);
    await page.goto("/teacher/attendance");await waitForDataRoute(page);
    await expect(page.getByRole("heading", { name: /^Attendance/ })).toBeVisible();
    fixture.finish(); await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0);
    widths.push(await page.locator("thead th").evaluateAll(elements => elements.map(element => element.getBoundingClientRect().width)));
    await page.unrouteAll({ behavior: "wait" });
  }
  expect(widths[0].some((width, index) => Math.abs(width - widths[1][index]) > 1)).toBe(true);
});

test("attendance loading migration preserves the marking request", async ({ page }) => {
  const fixture = await attendanceFixture(page, false);
  await page.goto("/teacher/attendance");await waitForDataRoute(page);
  await expect(page.getByRole("heading", { name: /^Attendance/ })).toBeVisible();
  fixture.finish(); await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0);
  await page.getByRole("button", { name: "Mark", exact: true }).first().click();
  await expect.poll(() => fixture.mutations.length).toBe(1);
  expect(fixture.mutations[0]).toMatchObject({ studentId: "0", status: "P", term: "1" });
});
