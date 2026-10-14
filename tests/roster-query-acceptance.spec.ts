import { test, expect } from "@playwright/test";
import { mockDirectory } from "./fixtures/directory";
import { waitForDataRoute } from "./fixtures/routeReady";

// SIMULATED acceptance: real app and routes; all API records are synthetic.
const roster = (unassigned: boolean) => ({
  classId: unassigned ? null : 1, grade: "Grade 1",
  sectionInfo: { section: unassigned ? "Unassigned" : "Maroon", adviser: unassigned ? "Unassigned" : "Test Adviser", room: "101" },
  roster: [
    { studentId: "SIM-001", firstName: "Ana", lastName: "Cruz", middleInitial: "", gender: "Female" },
    { studentId: "SIM-002", firstName: "Ben", lastName: "Rivera", middleInitial: "", gender: "Male" },
  ],
});

for (const kind of ["class", "grade"] as const) for (const width of [375, 1280]) for (const dark of [false, true]) {
  test(`roster ${kind} ${width} ${dark ? "dark" : "light"}: layout, filters, navigation, cache, offline and retry`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 1000 });
    const release = await mockDirectory(page, "PRINCIPAL", dark);
    const endpoint = kind === "class" ? "/api/student/class-list/1" : "/api/student/grade/1/unassigned";
    const path = `/principal/students/${kind}/1`;
    let calls = 0, completed = 0, cancelled = 0;
    let fail = false;
    const errors: string[] = [], consoleErrors: string[] = [];
    const matches = (url: string) => new URL(url).pathname === endpoint;
    page.on("pageerror", e => errors.push(e.name));
    page.on("console", m => { if (m.type() === "error") consoleErrors.push(m.text()); });
    page.on("response", r => { if (matches(r.url()) && r.status() === 200) completed++; });
    page.on("requestfailed", r => { if (matches(r.url()) && /abort/i.test(r.failure()?.errorText ?? "")) cancelled++; });
    await page.route(`**${endpoint}`, async route => {
      calls++;
      await route.fulfill({ status: fail ? 500 : 200, json: fail ? {} : roster(kind === "grade") });
    });
    const capture = async (state: string) => {
      const screenshot = info.outputPath(`${state}.png`);
      await page.screenshot({ path: screenshot, fullPage: true });
      await info.attach(state, { path: screenshot, contentType: "image/png" });
    };
    await page.goto(path); await waitForDataRoute(page);
    await expect(page.getByRole("heading", { name: "Class List", exact: true })).toBeVisible();
    await expect(page.locator('.sk-region[aria-busy="true"]').first()).toBeVisible();
    await capture("loading");
    release();
    await expect(page.getByText("Cruz, Ana", { exact: true })).toBeVisible();
    await expect(page.getByText("Rivera, Ben", { exact: true })).toBeVisible();
    await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0);
    const rows = page.locator('[data-sk-region="student-directory-row"]');
    await expect(rows).toHaveCount(2);
    if (dark) await expect(page.locator(".qed-account-ui")).toHaveClass(/\bdark\b/);
    else await expect(page.locator(".qed-account-ui")).not.toHaveClass(/\bdark\b/);
    const search = page.getByRole("textbox", { name: "Search students by name or ID" });
    for (const term of ["CRUZ", "sim-001"]) {
      await search.fill(term); await expect(rows).toHaveCount(1); await expect(rows.first()).toContainText("Ana");
    }
    await search.fill("not-a-fixture");
    await expect(page.getByText("No students found.", { exact: true })).toBeVisible();
    await search.fill("");
    await page.getByRole("combobox", { name: "Filter students by gender" }).selectOption("Male");
    await expect(rows).toHaveCount(1); await expect(rows.first()).toContainText("Ben");
    await page.getByRole("combobox", { name: "Filter students by gender" }).selectOption("All");
    await expect(rows).toHaveCount(2);
    await capture("loaded");
    await expect.poll(() => completed).toBe(1);
    const initialCalls = calls;
    expect(initialCalls).toBe(1 + cancelled);
    await page.getByRole("button", { name: "Go back", exact: true }).click();
    await expect(page).toHaveURL(/\/principal\/students$/);
    await expect(page.getByRole("heading", { name: "Students", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Class List", exact: true })).toHaveCount(0);
    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`${kind}/1$`));
    await expect(page.getByText("Cruz, Ana", { exact: true })).toBeVisible();
    expect(calls).toBe(initialCalls);
    await page.context().setOffline(true);
    await expect(page.getByRole("alert")).toContainText("You're offline");
    await expect(page.getByText("Cruz, Ana", { exact: true })).toBeVisible();
    await expect(rows).toHaveCount(2);
    await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0);
    for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Retry", exact: true }).click();
    expect(calls).toBe(initialCalls);
    await capture("cached-offline");
    await page.context().setOffline(false);
    await expect(page.getByRole("alert")).toHaveCount(0);
    expect(calls).toBe(initialCalls);
    await page.clock.install();
    await page.getByRole("button", { name: "Go back", exact: true }).click();
    await expect(page).toHaveURL(/\/principal\/students$/);
    await expect(page.getByRole("heading", { name: "Students", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Class List", exact: true })).toHaveCount(0);
    await page.clock.fastForward(31_000);
    const before = { calls, cancelled, completed };
    await page.goBack();
    await expect.poll(() => completed).toBe(before.completed + 1);
    expect(calls - before.calls).toBe(1 + cancelled - before.cancelled);
    fail = true; await page.reload();
    // Reload rehydrates authentication and lazy role/page code before roster
    // requests can start. Assert data errors only after that independent gate.
    await waitForDataRoute(page);
    await expect(page.getByRole("alert")).toContainText("Failed to fetch class list (500)");
    await capture("error");
    const failedCalls = calls;
    fail = false;
    await page.getByRole("button", { name: "Retry", exact: true }).click();
    await expect(page.getByText("Cruz, Ana", { exact: true })).toBeVisible();
    expect(calls).toBe(failedCalls + 1);
    const finalCalls = calls;
    await page.waitForTimeout(1000);
    expect(calls).toBe(finalCalls);
    expect(errors).toEqual([]);
    expect(consoleErrors.filter(m => !m.includes("Failed to load resource"))).toEqual([]);
    if (info.project.name === "fresh-production") { expect(cancelled).toBe(0); expect(calls).toBe(4); }
    await info.attach("sanitized-metrics", { body: JSON.stringify({ backend: "mocked", kind, width, dark, calls, completed, cancelled }), contentType: "application/json" });
  });
}

for (const kind of ["class", "grade"] as const) test(`${kind} cached 404 retains the existing not-found UI and back navigation`, async ({ page }) => {
  const release = await mockDirectory(page, "PRINCIPAL", false);
  const endpoint = kind === "class" ? "/api/student/class-list/1" : "/api/student/grade/1/unassigned";
  let calls = 0;
  await page.route(`**${endpoint}`, r => { calls++; return r.fulfill({ status: 404, json: {} }); });
  await page.goto(`/principal/students/${kind}/1`); release();
  await expect(page.getByRole("heading", { name: "Section Not Found", exact: true })).toBeVisible();
  const before = calls;
  await page.getByRole("button", { name: "Go back", exact: true }).click();
  await expect(page).toHaveURL(/\/principal\/students$/);
  await page.goBack();
  await expect(page.getByRole("heading", { name: "Section Not Found", exact: true })).toBeVisible();
  expect(calls).toBe(before);
  await page.context().setOffline(true);
  await expect(page.getByRole("heading", { name: "Section Not Found", exact: true })).toBeVisible();
  await expect(page.getByRole("alert")).toContainText("You're offline");
  await page.context().setOffline(false);
  await expect(page.getByRole("alert")).toHaveCount(0);
  expect(calls).toBe(before);
});

test("invalid class ID retains not-found UI without roster or year requests", async ({ page }) => {
  const release = await mockDirectory(page, "PRINCIPAL", false);
  let calls = 0;
  page.on("request", r => { if (/class-list|getAcademicYear/.test(r.url())) calls++; });
  await page.goto("/principal/students/class/invalid"); release();
  await expect(page.getByRole("heading", { name: "Section Not Found", exact: true })).toBeVisible();
  expect(calls).toBe(0);
});

test("shared teacher-profile roster consumer and class schedule remain functional", async ({ page }) => {
  const release = await mockDirectory(page, "PRINCIPAL", false);
  let calls = 0;
  await page.route("**/api/student/class-list/1", r => { calls++; return r.fulfill({ json: roster(false) }); });
  await page.goto("/principal/teachers/1"); release();
  await expect(page.getByRole("heading", { name: "Teacher Profile", exact: true })).toBeVisible();
  await expect(page.getByRole("tabpanel", { name: "Class list", exact: true })).toContainText("Ana Cruz");
  await expect(page.getByRole("tabpanel", { name: "Class list", exact: true })).toContainText("Ben Rivera");
  expect(calls).toBeGreaterThanOrEqual(1);
  await page.getByRole("tab", { name: "Class schedule", exact: true }).click();
  await expect(page.getByRole("tabpanel", { name: "Class schedule", exact: true })).toContainText("Mathematics");
});
