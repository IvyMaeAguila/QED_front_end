import { waitForDataRoute } from "./fixtures/routeReady";
import { test, expect, type Page } from "@playwright/test";
import { mockDirectory } from "./fixtures/directory";
import { assertNoDataSpinner, captureFixedOverlay } from "./design-pixels";
import fs from "node:fs";

async function studentFixture(page: Page, dark: boolean, count = 3, long = false, missing = false) {
  const context = await mockDirectory(page, "TEACHER", dark);
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  let failed = false, requests = 0;
  await page.route("**/api/student/allStudents", async route => {
    requests++; await gate;
    if (failed) { await route.fulfill({ status: 500, json: { message: "Student data unavailable" } }); return; }
    await route.fulfill({ json: { data: missing ? [] : [{ id: 1, grade_level_id: 1, section_id: 1, student_number: "2026-01", learner_reference_number: "123456789001", first_name: long ? "Maria Alexandra Isabella ".repeat(8) : "Ana", last_name: "Cruz", middle_name: "", gender: "Female", grade_level_name: "Grade 1", section_name: "Maroon" }] } });
  });
  await page.route("**/api/classes/", async route => {
    await gate; await route.fulfill({ json: { success: true, data: [{ id: 1, gradeLevelId: 1, gradeLevel: "Grade 1", sectionId: 1, section: "Maroon", room: "101", adviserId: 1, adviserName: "Teacher Cruz", studentCount: 1, schedule: Array.from({ length: count }, (_, index) => ({ id: index + 1, subject: long ? "Mathematics and reasoning for elementary learners ".repeat(8) : "Mathematics", teacherId: "1", startTime: "07:30", endTime: "08:30", days: ["Monday"] })) }] } });
  });
  await page.route("**/api/section/getTeachers", async route => {
    await gate; await route.fulfill({ json: { status: "success", data: [{ id: 1, user_id: 1, first_name: long ? "Maria Alexandra Isabella ".repeat(8) : "Teacher", last_name: "Cruz", middle_name: null, email_address: "teacher@example.test", contact_number: "09123456789", gender: "Female" }] } });
  });
  return Object.assign(() => { context(); release(); }, { fail: () => { failed = true; }, recover: () => { failed = false; }, requests: () => requests });
}

for (const width of [375, 1280]) for (const dark of [false, true]) test(`student details ${width} ${dark ? "dark" : "light"}: real labels, baseline chart and controls`, async ({ page }) => {
  await page.setViewportSize({ width, height: 1000 });
  const release = await studentFixture(page, dark);
  await page.goto("/teacher/students/1");await waitForDataRoute(page);
  await expect(page.getByRole("button", { name: "Back to Students", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Personal Information", exact: true })).toBeVisible();
  await expect(page.getByText("No records yet", { exact: true })).toBeVisible();
  await expect(page.locator('.sk-region[aria-busy="true"]').first()).toHaveAttribute("data-sk-phase", "revealed");
  await assertNoDataSpinner(page);
  fs.mkdirSync("loading-screenshots", { recursive: true });
  const prefix = `loading-screenshots/teacher-student-details-${width}-${dark ? "dark" : "light"}`;
  await page.screenshot({ path: `${prefix}-skeleton.png`, fullPage: true });
  release(); await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Cruz, Ana", exact: true })).toBeVisible();
  await expect(page.locator('[data-sk-region="student-performance-row"]')).toHaveCount(3);
  await page.screenshot({ path: `${prefix}-loaded.png`, fullPage: true });
});
for (const count of [0, 1, 9]) test(`student details ${count} scheduled subjects preserve native rows and known status`, async ({ page }) => {
  const release = await studentFixture(page, false, count, count === 9);
  await page.goto("/teacher/students/1");await waitForDataRoute(page);
  await expect(page.getByRole("heading", { name: "Personal Information", exact: true })).toBeVisible();
  release(); await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0);
  await expect(page.locator('[data-sk-region="student-performance-row"]')).toHaveCount(count);
  if (!count) await expect(page.getByText(/No subjects assigned or scheduled for/)).toBeVisible();
  else await expect(page.locator('[data-sk-region="student-performance-row"]').first().getByText("Pending", { exact: true })).toBeVisible();
});

test("student details failure removes all placeholders and retries the original context request", async ({ page }) => {
  const release = await studentFixture(page, false); release.fail();
  await page.goto("/teacher/students/1");await waitForDataRoute(page);
  await expect(page.locator('.sk-region[aria-busy="true"]').first()).toHaveAttribute("data-sk-phase", "revealed");
  release(); await expect(page.getByRole("alert")).toBeVisible();
  expect(await page.locator("[data-sk-primitive]").count()).toBe(0);
  const before = release.requests(); release.recover();
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Cruz, Ana", exact: true })).toBeVisible();
  expect(release.requests()).toBe(before + 1);
});

test("student details not-found state waits for the student request", async ({ page }) => {
  const release = await studentFixture(page, false, 3, false, true);
  await page.goto("/teacher/students/1");await waitForDataRoute(page);
  await expect(page.getByRole("heading", { name: "Personal Information", exact: true })).toBeVisible();
  release(); await expect(page.getByRole("heading", { name: "Student Not Found", exact: true })).toBeVisible();
  await expect(page.locator("[data-sk-primitive]")).toHaveCount(0);
});

test("student performance AUTO-COLUMN classification requires native width variation", async ({ page }) => {
  const widths: number[][] = [];
  for (const long of [false, true]) {
    const release = await studentFixture(page, false, 1, long);
    await page.goto("/teacher/students/1");await waitForDataRoute(page);
    await expect(page.getByRole("heading", { name: "Personal Information", exact: true })).toBeVisible();
    release(); await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0);
    widths.push(await page.locator("thead th").evaluateAll(elements => elements.map(element => element.getBoundingClientRect().width)));
    await page.unroute("**/api/**"); await page.unroute("**/api/student/allStudents"); await page.unroute("**/api/classes/"); await page.unroute("**/api/section/getTeachers");
  }
  expect(widths[0].some((width, index) => Math.abs(width - widths[1][index]) > 1)).toBe(true);
});
