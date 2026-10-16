import { test, expect } from "@playwright/test";
import { mockDirectory } from "./fixtures/directory";
import { waitForDataRoute } from "./fixtures/routeReady";

// SIMULATED: actual app/routes and browser, synthetic read-only API responses.
for (const width of [375, 1280]) for (const dark of [false, true]) {
  test(`students overview ${width} ${dark ? "dark" : "light"}: filters, rosters, cache, offline, retry`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 1000 });
    const release = await mockDirectory(page, "PRINCIPAL", dark);
    let calls = 0, completed = 0, cancelled = 0;
    let fail = false;
    let finish!: () => void;
    const gate = new Promise<void>(resolve => { finish = resolve; });
    const errors: string[] = [];
    const consoleErrors: string[] = [];
    page.on("pageerror", e => errors.push(e.name));
    page.on("console", m => { if (m.type() === "error") consoleErrors.push(m.text()); });
    const isOverview = (url: string) => new URL(url).pathname === "/api/student/grade-levels";
    page.on("requestfailed", r => { if (isOverview(r.url()) && /abort/i.test(r.failure()?.errorText ?? "")) cancelled++; });
    page.on("response", r => { if (isOverview(r.url()) && r.status() === 200) completed++; });
    await page.route("**/api/student/grade-levels", async route => {
      calls++;
      await gate;
      await route.fulfill({ status: fail ? 500 : 200, json: fail ? {} : [
        { gradeId: 1, classId: 1, grade: "Grade 1", section: "Maroon", totalStudents: 7 },
        { gradeId: 2, classId: null, grade: "Grade 2", section: null, totalStudents: 3 },
      ] });
    });
    const capture = async (name: string) => {
      const path = info.outputPath(`${name}.png`);
      await page.screenshot({ path, fullPage: true });
      await info.attach(name, { path, contentType: "image/png" });
    };
    await page.goto("/principal/students");
    await waitForDataRoute(page);
    if (dark) await expect(page.locator(".qed-account-ui")).toHaveClass(/\bdark\b/);
    else await expect(page.locator(".qed-account-ui")).not.toHaveClass(/\bdark\b/);
    await expect(page.locator('.sk-region[aria-busy="true"]').first()).toBeVisible();
    await capture("loading");
    release(); finish();
    // Use card headings, independent of LoadingRegion's internal DOM attributes.
    const cards = page.locator("article").filter({ has: page.getByRole("button", { name: /View class list for/ }) });
    await expect(cards).toHaveCount(2);
    await expect(page.getByRole("heading", { name: "Grade 1 - Maroon", exact: true })).toBeVisible();
    await expect(page.getByText("10", { exact: true })).toBeVisible();
    await expect(page.getByText("2026–2027", { exact: false }).first()).toBeVisible();
    const search = page.getByPlaceholder("Search grade or section...");
    await search.fill("MAROON");
    await expect(cards).toHaveCount(1);
    await search.fill("missing-grade");
    await expect(page.getByText("No grade levels match your search or filters.")).toBeVisible();
    await search.fill("");
    await page.getByRole("combobox", { name: "Grade level filter" }).selectOption("Grade 2");
    await expect(cards).toHaveCount(1);
    await expect(page.getByRole("heading", { name: "Grade 2", exact: true })).toBeVisible();
    await page.getByRole("combobox", { name: "Grade level filter" }).selectOption("All Grades");
    await page.getByRole("combobox", { name: "Section filter" }).selectOption("Maroon");
    await expect(cards).toHaveCount(1);
    await page.getByRole("combobox", { name: "Section filter" }).selectOption("All Sections");
    await expect(cards).toHaveCount(2);
    await capture("loaded");
    await expect.poll(() => completed).toBe(1);
    const initialCalls = calls;
    expect(initialCalls).toBe(1 + cancelled);
    for (const [title, path] of [["Grade 1 - Maroon", "/class/1"], ["Grade 2", "/grade/2"]]) {
      await page.getByRole("button", { name: `View class list for ${title}`, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      await expect(page.getByText("Ana", { exact: false }).first()).toBeVisible();
      await page.getByRole("button", { name: "Go back", exact: true }).click();
      await expect(cards).toHaveCount(2);
      expect(calls).toBe(initialCalls);
    }
    await page.context().setOffline(true);
    await expect(page.getByRole("alert")).toContainText("You're offline");
    await expect(cards).toHaveCount(2);
    await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0);
    for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Retry", exact: true }).click();
    expect(calls).toBe(initialCalls);
    await capture("cached-offline");
    await page.context().setOffline(false);
    await expect(page.getByRole("alert")).toHaveCount(0);
    expect(calls).toBe(initialCalls);
    await page.clock.install();
    await page.getByRole("button", { name: "View class list for Grade 1 - Maroon", exact: true }).click();
    await expect(page).toHaveURL(/\/class\/1$/);
    await page.clock.fastForward(301_000);
    const before = { calls, cancelled, completed };
    await page.getByRole("button", { name: "Go back", exact: true }).click();
    await expect.poll(() => completed).toBe(before.completed + 1);
    expect(calls - before.calls).toBe(1 + cancelled - before.cancelled);
    await expect(cards).toHaveCount(2);
    fail = true;
    await page.reload();
    await expect(page.getByRole("alert")).toContainText("Failed to fetch grade levels (500)");
    await capture("error");
    const failedCalls = calls;
    fail = false;
    await page.getByRole("button", { name: "Retry", exact: true }).click();
    await expect(cards).toHaveCount(2);
    expect(calls).toBe(failedCalls + 1);
    const finalCalls = calls;
    await page.waitForTimeout(1000);
    expect(calls).toBe(finalCalls);
    expect(errors).toEqual([]);
    expect(consoleErrors.filter(m => !m.includes("Failed to load resource"))).toEqual([]);
    if (info.project.name === "fresh-production") { expect(cancelled).toBe(0); expect(calls).toBe(4); }
    await info.attach("sanitized-metrics", { body: JSON.stringify({ backend: "mocked", width, dark, calls, completed, cancelled, pageErrors: errors.length }), contentType: "application/json" });
  });
}
