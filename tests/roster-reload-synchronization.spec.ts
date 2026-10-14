import { test, expect } from "@playwright/test";
import { mockDirectory } from "./fixtures/directory";
import { requestLedger } from "./fixtures/requestLedger";
import { waitForDataRoute } from "./fixtures/routeReady";

// MOCKED API acceptance: controlled events, real auth/route/query lifecycle.
for (const kind of ["class", "grade"] as const) for (const prerequisite of ["session", "profile"] as const) {
  test(`${kind} reload waits for ${prerequisite} before asserting error and explicit recovery`, async ({ page }, info) => {
    const releaseData = await mockDirectory(page, "PRINCIPAL", false);
    const endpoint = kind === "class" ? "/api/student/class-list/1" : "/api/student/grade/1/unassigned";
    const ledger = requestLedger(page, path => path === endpoint);
    let calls = 0, fail = false, hold = false;
    let releasePrerequisite!: () => void, prerequisiteSeen!: () => void;
    const gate = new Promise<void>(resolve => { releasePrerequisite = resolve; });
    const seen = new Promise<void>(resolve => { prerequisiteSeen = resolve; });
    await page.route(prerequisite === "session" ? "**/api/auth/me" : "**/api/user-profile/**", async route => {
      if (hold) { prerequisiteSeen(); await gate; }
      await route.fallback();
    });
    await page.route(`**${endpoint}`, async route => {
      calls++;
      ledger.intercept(route.request());
      await route.fulfill({ status: fail ? 500 : 200, json: fail ? {} : {
        classId: kind === "class" ? 1 : null, grade: "Grade 1",
        sectionInfo: { section: kind === "class" ? "Maroon" : "Unassigned", adviser: "Synthetic Adviser", room: "101" },
        roster: [{ studentId: "SIM-001", firstName: "Ana", lastName: "Cruz", middleInitial: "", gender: "Female" }],
      } });
    });
    releaseData();
    await page.goto(`/principal/students/${kind}/1`);
    await waitForDataRoute(page);
    await expect(page.getByText("Cruz, Ana", { exact: true })).toBeVisible();
    await ledger.successfulBatch();
    const beforeReload = ledger.mark(), beforeCalls = calls;
    hold = true; fail = true;
    await page.reload();
    await seen;
    await expect(page.locator('[data-sk-region="auth-bootstrap"]')).toHaveAttribute("aria-busy", "true");
    await expect(page.getByRole("status")).toHaveText("Loading…");
    // A held legitimate bootstrap must not leak cached roster data or issue GETs.
    expect(ledger.snapshot(beforeReload)).toEqual([]);
    expect(calls).toBe(beforeCalls);
    await expect(page.getByText("Cruz, Ana", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("alert")).toHaveCount(0);
    releasePrerequisite();
    await waitForDataRoute(page);
    await expect(page.getByRole("alert")).toContainText("Failed to fetch class list (500)");
    await expect.poll(() => ledger.snapshot(beforeReload).filter(r => r.terminal === "finished" && r.status === 500).length).toBe(1);
    await expect.poll(() => ledger.snapshot(beforeReload).every(r => r.terminal !== undefined)).toBe(true);
    const failedBatch = ledger.snapshot(beforeReload);
    expect(failedBatch.filter(r => r.terminal === "failed")).toEqual([]);
    expect(failedBatch.filter(r => r.terminal === "finished")).toHaveLength(1);
    expect(calls - beforeCalls).toBe(1 + failedBatch.filter(r => r.terminal === "aborted" && r.intercepted).length);
    const beforeRetry = ledger.mark();
    fail = false;
    await page.getByRole("button", { name: "Retry", exact: true }).click();
    await expect(page.getByText("Cruz, Ana", { exact: true })).toBeVisible();
    await ledger.successfulBatch(beforeRetry);
    await expect(page.getByRole("alert")).toHaveCount(0);
    await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0);
    const all = ledger.snapshot();
    expect(all.filter(r => r.terminal === "finished" && r.status === 200)).toHaveLength(2);
    expect(all.filter(r => r.terminal === "finished" && r.status === 500)).toHaveLength(1);
    expect(calls).toBe(3 + all.filter(r => r.terminal === "aborted" && r.intercepted).length);
    if (info.project.name === "fresh-production") {
      expect(all.filter(r => r.terminal === "aborted")).toEqual([]);
      expect(calls).toBe(3);
    }
    await info.attach("sanitized-reload-lifecycle", { body: JSON.stringify({ backend: "mocked", kind, prerequisite, calls, requests: all }), contentType: "application/json" });
  });
}
