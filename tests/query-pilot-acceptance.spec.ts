import { test, expect } from "@playwright/test";
import { mockDirectory } from "./fixtures/directory";
import { waitForDataRoute } from "./fixtures/routeReady";

// SIMULATED acceptance: real React/routes/browser, synthetic API records only.
// No backend accounts, cookies, student records or database writes are involved.
for (const width of [375, 1280]) for (const dark of [false, true]) {
  test(`simulated acceptance ${width} ${dark ? "dark" : "light"}: filters, schedule, cache, offline and retry`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 1000 });
    const release = await mockDirectory(page, "PRINCIPAL", dark);
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    page.on("pageerror", error => pageErrors.push(error.name));
    page.on("console", message => { if (message.type() === "error") consoleErrors.push(message.text()); });
    let calls = 0;
    let cancelled = 0;
    let completed = 0;
    page.on("requestfailed", request => {
      if (new URL(request.url()).pathname === "/api/teachers" && /abort/i.test(request.failure()?.errorText ?? "")) cancelled++;
    });
    page.on("response", response => {
      if (new URL(response.url()).pathname === "/api/teachers" && response.status() === 200) completed++;
    });
    let fail = false;
    let finish!: () => void;
    const initialGate = new Promise<void>(resolve => { finish = resolve; });
    await page.route("**/api/teachers", async route => {
      calls++;
      await initialGate;
      await route.fulfill({ status: fail ? 500 : 200, json: fail ? {} : [
        { teacherId: "1", fullName: "Ana", gender: "Female", gradeLevel: "Grade 1", advisorySection: "Maroon", room: "101", advisories: [] },
        { teacherId: "2", fullName: "Ben", gender: "Male", advisories: [] },
      ] });
    });
    const capture = async (state: string) => {
      const path = info.outputPath(`${state}.png`);
      await page.screenshot({ path, fullPage: true });
      await info.attach(state, { path, contentType: "image/png" });
    };
    const start = Date.now();
    await page.goto("/principal/teachers");
    await waitForDataRoute(page);
    await expect(page.locator(".qed-account-ui")).toHaveClass(dark ? /dark/ : /qed-account-ui/);
    if (!dark) await expect(page.locator(".qed-account-ui")).not.toHaveClass(/\bdark\b/);
    await expect(page.locator('.sk-region[aria-busy="true"]').first()).toBeVisible();
    await capture("loading");
    release(); finish();
    const rows = page.locator("tbody tr");
    await expect(rows).toHaveCount(2);
    await expect(page.getByText("Ana", { exact: true })).toBeVisible();
    const loadedMs = Date.now() - start;
    const search = page.getByRole("textbox", { name: "Search teachers by name, advisory, or room" });
    for (const term of ["ana", "MAROON", "101"]) {
      await search.fill(term);
      await expect(rows).toHaveCount(1);
      await expect(rows.first()).toContainText("Ana");
    }
    await search.fill("missing-test-name");
    await expect(page.getByText("No teachers match your search or filter.")).toBeVisible();
    await search.fill("");
    const gender = page.getByRole("combobox", { name: "Filter teachers by gender" });
    await gender.click();
    await page.getByRole("option", { name: "Male", exact: true }).click();
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText("Ben");
    await gender.selectOption("all");
    const advisory = page.getByRole("combobox", { name: "Filter teachers by advisory assignment" });
    await advisory.selectOption("unassigned");
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText("Ben");
    await advisory.selectOption("assigned");
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText("Ana");
    await advisory.selectOption("all");
    await capture("loaded");
    const baselineCalls = calls;
    // Development StrictMode may abort its probe and remount. Require one
    // completed request; every additional attempt must be explicitly cancelled.
    await expect.poll(() => completed).toBe(1);
    expect(baselineCalls).toBe(1 + cancelled);
    if (info.project.name === "fresh-production") {
      expect(cancelled).toBe(0);
      expect(baselineCalls).toBe(1);
    }
    await page.getByText("Ana", { exact: true }).click();
    await expect(page.getByRole("heading", { name: "Teacher Profile", exact: true })).toBeVisible();
    await page.getByRole("tab", { name: "Class schedule", exact: true }).click();
    await expect(page.getByRole("tabpanel", { name: "Class schedule" })).toContainText("Mathematics");
    await capture("schedule");
    await page.getByRole("button", { name: "Go back", exact: true }).click();
    await expect(rows).toHaveCount(2);
    expect(calls).toBe(baselineCalls);
    await page.context().setOffline(true);
    await expect(page.getByRole("alert")).toContainText("You're offline");
    await expect(rows).toHaveCount(2);
    await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0);
    for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Retry", exact: true }).click();
    expect(calls).toBe(baselineCalls);
    await capture("cached-offline");
    await page.context().setOffline(false);
    await expect(page.getByRole("alert")).toHaveCount(0);
    expect(calls).toBe(baselineCalls);
    // Advance browser time only; no server clock or database mutation.
    await page.clock.install();
    await page.getByText("Ana", { exact: true }).click();
    await expect(page.getByRole("heading", { name: "Teacher Profile", exact: true })).toBeVisible();
    await page.clock.fastForward(301_000);
    const completedBeforeRefresh = completed;
    const cancelledBeforeRefresh = cancelled;
    const callsBeforeRefresh = calls;
    await page.getByRole("button", { name: "Go back", exact: true }).click();
    await expect.poll(() => completed).toBe(completedBeforeRefresh + 1);
    expect(calls - callsBeforeRefresh).toBe(1 + cancelled - cancelledBeforeRefresh);
    await expect(page.getByText("Ana", { exact: true })).toBeVisible();
    // A reload creates an empty in-memory cache, then a controlled API failure.
    fail = true;
    await page.reload();
    await expect(page.getByRole("alert")).toContainText("Failed to fetch teachers (500)");
    await expect(page.getByRole("button", { name: "Retry", exact: true })).toBeVisible();
    await capture("error");
    const failedCalls = calls;
    fail = false;
    await page.getByRole("button", { name: "Retry", exact: true }).click();
    await expect(page.getByText("Ana", { exact: true })).toBeVisible();
    expect(calls).toBe(failedCalls + 1);
    // Observe a quiet interval for unexpected refetch loops.
    const finalCalls = calls;
    await page.waitForTimeout(1000);
    expect(calls).toBe(finalCalls);
    if (info.project.name === "fresh-production") {
      expect(cancelled).toBe(0);
      expect(calls).toBe(4);
    }
    expect(pageErrors).toEqual([]);
    const unexpectedConsoleErrors = consoleErrors.filter(message => !message.includes("Failed to load resource"));
    expect(unexpectedConsoleErrors).toEqual([]);
    await info.attach("sanitized-metrics", { body: JSON.stringify({ backend: "mocked", width, dark, loadedMsIncludingScreenshot: loadedMs, teacherRequests: calls, cancelledTeacherRequests: cancelled, completedTeacherRequests: completed, pageErrors: pageErrors.length, unexpectedConsoleErrors: unexpectedConsoleErrors.length }), contentType: "application/json" });
  });
}
