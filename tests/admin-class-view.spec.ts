import { waitForDataRoute } from "./fixtures/routeReady";
import { test, expect, type Page } from "@playwright/test";
import { mockDirectory } from "./fixtures/directory";
import { assertNoDataSpinner, checkRenderedContrast, checkShimmerPixels, captureFixedOverlay } from "./design-pixels";
import fs from "node:fs";

async function classFixture(page: Page, dark: boolean, count = 3, long = false) {
  const releaseContext = await mockDirectory(page, "ADMIN", dark);
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  let unavailable = false, requests = 0;
  await page.route("**/api/section/getTeachers", async route => {
    await gate;
    await route.fulfill({ json: { status: "success", data: [{ id: 1, user_id: 1, first_name: "Ana", last_name: "Cruz", middle_name: null, email_address: "ana@example.test", contact_number: "09123456789", gender: "Female" }] } });
  });
  await page.route("**/api/student/allStudents", async route => {
    await gate;
    await route.fulfill({ json: { data: Array.from({ length: 3 }, (_, index) => ({ id: index + 1, grade_level_id: 1, section_id: 1, student_number: `2026-${index}`, learner_reference_number: `12345678900${index}`, first_name: long ? "Maria Alexandra Isabella Delos Santos ".repeat(8) : "Ana", last_name: "Cruz", middle_name: "A", gender: index % 2 ? "Female" : "Male", grade_level_name: "Grade 1", section_name: "Maroon" })) } });
  });
  await page.route("**/api/classes/", async route => {
    requests++;
    await gate;
    if (unavailable) { await route.fulfill({ status: 500, json: { success: false, message: "Class temporarily unavailable" } }); return; }
    await route.fulfill({ json: { success: true, data: [{ id: 1, gradeLevelId: 1, gradeLevel: "Grade 1", sectionId: 1, section: "Maroon", room: "101", adviserId: 1, adviserName: "Ana Cruz", adviserEmail: "ana@example.test", adviserContact: "09123456789", studentCount: 3, schedule: Array.from({ length: count }, (_, index) => ({ id: index + 1, subject: long ? "Mathematics and quantitative reasoning for elementary learners ".repeat(5) : "Mathematics", teacherId: "1", teacherName: long ? "Maria Alexandra Isabella Delos Santos ".repeat(4) : "Ana Cruz", startTime: `${String(index + 7).padStart(2, "0")}:30`, endTime: `${String(index + 8).padStart(2, "0")}:30`, days: ["Monday", "Wednesday"] })) }] } });
  });
  return Object.assign(() => { releaseContext(); release(); }, { unavailable: () => { unavailable = true; }, recover: () => { unavailable = false; }, requests: () => requests });
}

for (const width of [375, 1280]) for (const dark of [false, true]) test(`class details ${width} ${dark ? "dark" : "light"}: real actions, tabs and weekday headings`, async ({ page }) => {
  const reloads: string[] = [];
  page.on("websocket", socket => socket.on("framereceived", frame => { if (String(frame.payload).includes('"type":"full-reload"')) reloads.push(String(frame.payload)); }));
  await page.setViewportSize({ width, height: 1000 });
  const release = await classFixture(page, dark);
  await page.goto("/admin/classes/1");await waitForDataRoute(page);
  await expect(page.getByRole("heading", { name: "Class Details", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Edit Class", exact: true })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Class schedule", exact: true })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Time", exact: true })).toBeVisible();
  await expect(page.getByText("Teacher ·", { exact: true })).toBeVisible();
  await expect(page.locator('.sk-region[aria-busy="true"]').first()).toHaveAttribute("data-sk-phase", "revealed");
  await assertNoDataSpinner(page);
  const verifyOverlay = await captureFixedOverlay(page, `admin-class-details-${width}-${dark ? "dark" : "light"}`, ['[data-sk-region="profile-avatar"]', '[data-sk-region="profile-stat-Advisory"]', '[data-sk-region="profile-stat-Room"]', '[data-sk-region="profile-stat-Total subjects"]']);
  fs.mkdirSync("loading-screenshots", { recursive: true });
  const prefix = `loading-screenshots/admin-class-details-${width}-${dark ? "dark" : "light"}`;
  await page.screenshot({ path: `${prefix}-skeleton.png`, fullPage: true });
  release(); await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0);
  await expect(page.locator("[data-sk-primitive], [data-sk-layer], [data-sk-frame], [role=status]")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Ana Cruz", exact: true })).toBeVisible();
  await page.screenshot({ path: `${prefix}-loaded.png`, fullPage: true });
  await verifyOverlay();
  await page.getByRole("tab", { name: /Class list/ }).click();
  await expect(page.getByPlaceholder("Search student...")).toBeVisible();
  await expect(page.locator('[data-sk-region="student-directory-row"]')).toHaveCount(3);
  expect(reloads, "generated overlays must not reload the app during interaction").toEqual([]);
});

for (const count of [0, 1, 9]) test(`class schedule ${count} returned time slots retains original content`, async ({ page }) => {
  const release = await classFixture(page, false, count, count === 9);
  await page.goto("/admin/classes/1");await waitForDataRoute(page);
  await expect(page.getByRole("heading", { name: "Class Details", exact: true })).toBeVisible();
  release(); await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0);
  await expect(page.locator('[data-sk-region="class-schedule-row"]')).toHaveCount(count);
  if (!count) await expect(page.getByText("No schedule set yet.", { exact: true })).toBeVisible();
});

test("class details error removes every reservation immediately and retries context loads", async ({ page }) => {
  const release = await classFixture(page, false);
  release.unavailable();
  await page.goto("/admin/classes/1");await waitForDataRoute(page);
  await expect(page.locator('[data-sk-region="class-identity"]')).toHaveAttribute("data-sk-phase", "revealed");
  release();
  await expect(page.getByRole("alert")).toBeVisible();
  expect(await page.locator("[data-sk-primitive]").count()).toBe(0);
  const before = release.requests(); release.recover();
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Ana Cruz", exact: true })).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
  expect(release.requests()).toBe(before + 1);
});

test("class schedule auto-column classification observes native content width changes", async ({ page }) => {
  const widths: number[][] = [];
  for (const long of [false, true]) {
    const release = await classFixture(page, false, 1, long);
    await page.goto("/admin/classes/1");await waitForDataRoute(page);
    await expect(page.getByRole("heading", { name: "Class Details", exact: true })).toBeVisible();
    release(); await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0);
    widths.push(await page.locator("thead th").evaluateAll(elements => elements.map(element => element.getBoundingClientRect().width)));
    await page.unroute("**/api/**"); await page.unroute("**/api/classes/");
  }
  expect(widths[0].some((width, index) => Math.abs(width - widths[1][index]) > 1)).toBe(true);
});

test("class roster auto-column classification observes native content width changes", async ({ page }) => {
  const widths: number[][] = [];
  for (const long of [false, true]) {
    const release = await classFixture(page, false, 1, long);
    await page.goto("/admin/classes/1");await waitForDataRoute(page);
    await expect(page.getByRole("heading", { name: "Class Details", exact: true })).toBeVisible();
    release(); await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0);
    await page.getByRole("tab", { name: /Class list/ }).click();
    widths.push(await page.locator("thead th").evaluateAll(elements => elements.map(element => element.getBoundingClientRect().width)));
    await page.unroute("**/api/**"); await page.unroute("**/api/classes/");
  }
  expect(widths[0].some((width, index) => Math.abs(width - widths[1][index]) > 1)).toBe(true);
});

for (const dark of [false, true]) test(`class schedule ${dark ? "dark" : "light"}: time cell shimmer fits its real tinted surface`, async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  const release = await classFixture(page, dark);
  await page.goto("/admin/classes/1");await waitForDataRoute(page);
  await expect(page.locator('[data-sk-region="class-schedule"]')).toHaveAttribute("data-sk-phase", "revealed");
  const shape = page.locator('[data-sk-region="class-schedule-time"] [data-sk-primitive]').first();
  await checkRenderedContrast(shape, `class-schedule-${dark ? "dark" : "light"}-time`);
  await checkShimmerPixels(shape, `class-schedule-${dark ? "dark" : "light"}-time`);
  release();
});


