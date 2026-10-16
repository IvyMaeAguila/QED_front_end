import { test, expect, type Page } from "@playwright/test";
import { mockDirectory } from "./fixtures/directory";
import { waitForDataRoute } from "./fixtures/routeReady";

// MOCKED acceptance: actual Principal routes, synthetic profile/student records.
const profile = { teacherId: "1", fullName: "Profile Fixture", gender: "Female", room: "101", gradeLevel: "Grade 1", advisorySection: "Maroon",
  advisories: [{ classId: 1, gradeLevel: "Grade 1", section: "Maroon", room: "101" }],
  schedule: [{ classId: 1, day: "Monday", time: "8:00 AM – 9:00 AM", subject: "Mathematics", gradeSection: "Grade 1 · Maroon", room: "101" }] };
const ready = async (page: Page) => {
  await expect(page.getByRole("heading", { name: "Profile Fixture", exact: true })).toBeVisible();
  await expect(page.getByRole("tabpanel", { name: "Class list", exact: true })).toContainText("Ana");
};
for (const width of [375, 1280]) for (const dark of [false, true]) test(`Principal profile ${width} ${dark ? "dark" : "light"}: navigation, schedule, cache, offline, stale refresh and retry`, async ({ page }, info) => {
  await page.setViewportSize({ width, height: 1000 });
  const release = await mockDirectory(page, "PRINCIPAL", dark);
  let calls = 0, fail = false, completed = 0;
  const errors: string[] = [], consoleErrors: string[] = [];
  page.on("pageerror", e => errors.push(e.name));
  page.on("console", m => { if (m.type() === "error") consoleErrors.push(m.text()); });
  page.on("response", r => { if (r.url().endsWith("/api/teachers/1") && r.status() === 200) completed++; });
  await page.route("**/api/teachers/1", r => { calls++; return r.fulfill({ status: fail ? 500 : 200, json: fail ? {} : profile }); });
  const capture = async (name: string) => { const path = info.outputPath(`${name}.png`); await page.screenshot({ path, fullPage: true }); await info.attach(name, { path, contentType: "image/png" }); };
  await page.goto("/principal/teachers/1"); await waitForDataRoute(page);
  await expect(page.getByRole("heading", { name: "Teacher Profile", exact: true })).toBeVisible();
  await expect(page.locator('.sk-region[aria-busy="true"]').first()).toBeVisible(); await capture("loading");
  release(); await ready(page); await capture("loaded");
  if (dark) await expect(page.locator(".qed-account-ui")).toHaveClass(/\bdark\b/);
  else await expect(page.locator(".qed-account-ui")).not.toHaveClass(/\bdark\b/);
  await page.getByRole("tab", { name: "Class schedule", exact: true }).click();
  await expect(page.getByRole("tabpanel", { name: "Class schedule", exact: true })).toContainText("Mathematics");
  await page.getByRole("tab", { name: /Class list/ }).click(); await ready(page);
  const initialCalls = calls;
  await page.getByRole("button", { name: "Go back", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Teachers", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Teacher Profile", exact: true })).toHaveCount(0);
  await page.goBack(); await ready(page); expect(calls).toBe(initialCalls);
  await page.context().setOffline(true); await expect(page.getByRole("alert")).toContainText("You're offline");
  await ready(page); await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0);
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Retry", exact: true }).click();
  expect(calls).toBe(initialCalls); await capture("cached-offline");
  await page.context().setOffline(false); await expect(page.getByRole("alert")).toHaveCount(0); expect(calls).toBe(initialCalls);
  await page.clock.install(); await page.getByRole("button", { name: "Go back", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Teachers", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Teacher Profile", exact: true })).toHaveCount(0);
  await page.clock.fastForward(31_000); const before = completed;
  await page.goBack(); await ready(page); await expect.poll(() => completed).toBe(before + 1);
  fail = true; await page.reload(); await expect(page.getByRole("alert")).toContainText("Failed to fetch teacher profile (500)"); await capture("error");
  const failedCalls = calls; fail = false; await page.getByRole("button", { name: "Retry", exact: true }).click(); await ready(page); expect(calls).toBe(failedCalls + 1);
  const finalCalls = calls; await page.waitForTimeout(1000); expect(calls).toBe(finalCalls);
  expect(errors).toEqual([]); expect(consoleErrors.filter(m => !m.includes("Failed to load resource"))).toEqual([]);
  if (info.project.name === "fresh-production") expect(calls).toBe(4);
  await info.attach("sanitized-metrics", { body: JSON.stringify({ backend: "mocked", width, dark, calls, completed }), contentType: "application/json" });
});

test("Principal profile cached 404 keeps Not Found navigation and offline alert", async ({ page }) => {
  const release = await mockDirectory(page, "PRINCIPAL", false); let calls = 0;
  await page.route("**/api/teachers/1", r => { calls++; return r.fulfill({ status: 404, json: {} }); });
  await page.goto("/principal/teachers/1"); release();
  await expect(page.getByRole("heading", { name: "Teacher Not Found", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Go back", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Teachers", exact: true })).toBeVisible(); await page.goBack();
  await expect(page.getByRole("heading", { name: "Teacher Not Found", exact: true })).toBeVisible(); expect(calls).toBe(1);
  await page.context().setOffline(true); await expect(page.getByRole("alert")).toContainText("offline");
  await expect(page.getByRole("heading", { name: "Teacher Not Found", exact: true })).toBeVisible();
});
test("Principal empty advisories and schedule preserve existing empty UI", async ({ page }) => {
  const release = await mockDirectory(page, "PRINCIPAL", false); let rosterCalls = 0;
  page.on("request", r => { if (r.url().includes("/class-list/")) rosterCalls++; });
  await page.route("**/api/teachers/1", r => r.fulfill({ json: { ...profile, advisories: [], schedule: [] } }));
  await page.goto("/principal/teachers/1"); release();
  await expect(page.getByText("No class lists are available for this teacher yet.", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Class schedule", exact: true }).click();
  await expect(page.getByText("No schedule entries found.", { exact: true })).toBeVisible(); expect(rosterCalls).toBe(0);
});
test("Principal partial advisory failure keeps available sections and all-failure Retry recovers", async ({ page }) => {
  const release = await mockDirectory(page, "PRINCIPAL", false); let fail = true;
  await page.route("**/api/teachers/1", r => r.fulfill({ json: { ...profile, advisories: [...profile.advisories, { ...profile.advisories[0], classId: 2 }] } }));
  await page.route("**/api/student/class-list/2", r => r.fulfill({ status: 500, json: {} }));
  await page.route("**/api/student/class-list/1", r => r.fulfill({ status: fail ? 500 : 200, json: { classId: 1, grade: "Grade 1", sectionInfo: { section: "Maroon", room: "101" }, roster: [{ studentId: "fixture", firstName: "Ana", lastName: "Fixture", gender: "Female" }] } }));
  await page.goto("/principal/teachers/1"); release(); await expect(page.getByRole("alert")).toContainText("The class lists could not be loaded.");
  fail = false; await page.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(page.getByRole("tabpanel", { name: "Class list", exact: true })).toContainText("Ana Fixture");
  await expect(page.getByText("Some class lists could not be loaded; the available sections are shown below.", { exact: true })).toBeVisible();
});
test("Principal profile advisory cache is reused by the class roster route", async ({ page }) => {
  const release = await mockDirectory(page, "PRINCIPAL", false); let calls = 0;
  page.on("request", r => { if (r.url().endsWith("/api/student/class-list/1")) calls++; });
  await page.route("**/api/teachers/1", r => r.fulfill({ json: profile }));
  await page.goto("/principal/teachers/1"); release(); await ready(page); const initial = calls;
  await page.getByRole("link", { name: "Students", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Students", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "View class list for Grade 1 - Maroon", exact: true }).first().click();
  await expect(page.getByRole("heading", { name: "Class List", exact: true })).toBeVisible();
  await expect(page.getByText("Cruz, Ana A", { exact: false }).first()).toBeVisible(); expect(calls).toBe(initial);
});
