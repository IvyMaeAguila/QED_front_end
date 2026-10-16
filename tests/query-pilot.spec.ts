import { test, expect, type Page } from "@playwright/test";
import { mockDirectory } from "./fixtures/directory";
import { waitForDataRoute } from "./fixtures/routeReady";

test("real directory UI retries errors and reuses cache after schedule navigation", async ({ page }) => {
  const release = await mockDirectory(page, "PRINCIPAL", false);
  let failed = true;
  let calls = 0;
  await page.route("**/api/teachers", route => {
    calls++;
    return route.fulfill({ status: failed ? 500 : 200, json: failed ? {} : [
      { teacherId: "1", fullName: "Pilot teacher", gender: "Female", advisories: [] },
    ] });
  });
  await page.goto("/principal/teachers");
  release();
  await waitForDataRoute(page);
  await expect(page.getByRole("alert")).toContainText("Failed to fetch teachers (500)");
  failed = false;
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(page.getByText("Pilot teacher", { exact: true })).toBeVisible();
  const callsBeforeNavigation = calls;
  await page.getByText("Pilot teacher", { exact: true }).click();
  await expect(page.getByRole("heading", { name: "Teacher Profile", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Go back", exact: true }).click();
  await expect(page.getByText("Pilot teacher", { exact: true })).toBeVisible();
  expect(calls).toBe(callsBeforeNavigation);
});

async function fixture(page: Page, holdAuth = false) {
  const state = { calls: 0, years: 0, status: 200, name: "First teacher", hold: false };
  let release: () => void = () => {};
  let gate = Promise.resolve();
  let releaseAuth: () => void = () => {};
  const authGate = holdAuth ? new Promise<void>(resolve => { releaseAuth = resolve; }) : Promise.resolve();
  await page.route("**/api/**", async route => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/teachers") {
      state.calls++;
      const name = state.name;
      if (state.hold) await gate;
      await route.fulfill({ status: state.status, json: state.status === 200
        ? [{ teacherId: "1", fullName: name, advisories: [] }] : { message: "Unavailable" } });
    } else if (path.includes("academic-year")) {
      state.years++;
      await route.fulfill({ json: { data: { label: "2026–2027" } } });
    } else if (path === "/api/auth/me") {
      await authGate;
      await route.fulfill({ json: { user: { id: "1", role: "PRINCIPAL", name: "Principal", user_name: "principal" } } });
    } else if (path.includes("user-profile")) {
      await route.fulfill({ json: { id: "1", role: "PRINCIPAL", name: "Principal", userName: "principal" } });
    } else await route.fulfill({ json: { success: true } });
  });
  await page.goto("/tests/query-pilot.html");
  await expect(page.getByTestId("auth")).toHaveText(holdAuth ? "pending" : "1");
  return { state, hold: () => { state.hold = true; gate = new Promise<void>(r => { release = r; }); },
    release: () => { state.hold = false; release(); }, releaseAuth };
}

async function start(page: Page) {
  await page.getByRole("button", { name: "Toggle preview" }).click();
}

test("authentication bootstrap must finish before requests start", async ({ page }) => {
  const data = await fixture(page, true);
  await start(page);
  await expect(page.getByTestId("auth")).toHaveText("pending");
  expect(data.state.calls).toBe(0);
  data.releaseAuth();
  await expect(page.getByTestId("teachers")).toHaveText("First teacher");
  expect(data.state.calls).toBe(1);
});

test("preview and auth readiness suppress requests; fresh navigation deduplicates; expiry refetches", async ({ page }) => {
  const { state } = await fixture(page);
  expect(state.calls).toBe(0);
  await page.clock.install();
  await start(page);
  await expect(page.getByTestId("teachers")).toHaveText("First teacher");
  expect(state.calls).toBe(1);
  await page.getByRole("button", { name: "Toggle directory" }).click();
  await page.getByRole("button", { name: "Toggle directory" }).click();
  await expect(page.getByTestId("loading")).toHaveText("false");
  expect(state.calls).toBe(1);
  state.name = "Updated teacher";
  await page.clock.fastForward(301_000);
  await page.getByRole("button", { name: "Toggle directory" }).click();
  await page.getByRole("button", { name: "Toggle directory" }).click();
  await expect(page.getByTestId("teachers")).toHaveText("Updated teacher");
  // StrictMode can abort the first stale remount request and start its replacement.
  expect(state.calls).toBeGreaterThanOrEqual(2);
  expect(state.calls).toBeLessThanOrEqual(3);
  expect(state.years).toBe(state.calls);
});

test("loading, errors, explicit retries and empty results", async ({ page }) => {
  const fixtureData = await fixture(page);
  fixtureData.hold();
  await start(page);
  await expect(page.getByTestId("loading")).toHaveText("true");
  fixtureData.state.status = 500;
  fixtureData.release();
  await expect(page.getByTestId("error")).toContainText("(500)");
  expect(fixtureData.state.calls).toBe(1);
  fixtureData.state.status = 200;
  await page.getByRole("button", { name: "Retry query" }).click();
  await expect(page.getByTestId("teachers")).toHaveText("First teacher");
  await page.route("**/api/teachers", route => route.fulfill({ json: [] }));
  await page.getByRole("button", { name: "Retry query" }).click();
  await expect(page.getByTestId("loading")).toHaveText("false");
  await expect(page.getByTestId("teachers")).toBeEmpty();
  await expect(page.getByTestId("error")).toBeEmpty();
});

test("account switching cancels old work and discards cached identity data", async ({ page }) => {
  const cancelled: string[] = [];
  page.on("requestfailed", request => {
    if (new URL(request.url()).pathname === "/api/teachers") cancelled.push(request.failure()?.errorText ?? "");
  });
  const data = await fixture(page);
  await start(page);
  await expect(page.getByTestId("teachers")).toHaveText("First teacher");
  data.hold();
  await page.getByRole("button", { name: "Retry query" }).click();
  await expect.poll(() => data.state.calls).toBe(2);
  data.state.name = "Second account teacher";
  await page.getByRole("button", { name: "Switch account" }).click();
  await expect.poll(() => cancelled.length).toBeGreaterThan(0);
  await expect(page.getByTestId("teachers")).toBeEmpty();
  await expect.poll(() => data.state.calls).toBe(3);
  data.release();
  await expect(page.getByTestId("teachers")).toHaveText("Second account teacher");
  await page.getByRole("button", { name: "Expire old session" }).click();
  await expect(page.getByTestId("auth")).toHaveText("2");
  await expect(page.getByTestId("teachers")).toHaveText("Second account teacher");
  const scopes = await page.evaluate(async () => {
    // @ts-expect-error Vite source module is loaded in the browser.
    const { queryClient } = await import("/src/shared/query/queryClient.ts");
    return queryClient.getQueryCache().getAll().map((q: { queryKey: unknown[] }) => q.queryKey);
  });
  expect(scopes).toHaveLength(1);
  expect(scopes[0][3]).toBe("2");
});

test("teacher profile and schedule school-year caches remain independent", async ({ page }) => {
  const { state } = await fixture(page);
  let profiles = 0;
  await page.route("**/api/teachers/1", route => {
    profiles++;
    return route.fulfill({ json: { teacherId: "1", fullName: "Cached profile", schedule: [] } });
  });
  const cachedNames = await page.evaluate(async () => {
    // @ts-expect-error Vite source module is loaded in the browser.
    const service = await import("/src/features/profiles/principal/pages/teachers/services/teachers.service.ts");
    const first = await service.getTeacherProfile("1");
    const second = await service.getTeacherProfile("1");
    await service.getSchoolYear();
    await service.getSchoolYear();
    return [first.fullName, second.fullName];
  });
  expect(cachedNames).toEqual(["Cached profile", "Cached profile"]);
  expect(profiles).toBe(1);
  expect(state.years).toBe(1);
  await start(page);
  await expect(page.getByTestId("teachers")).toHaveText("First teacher");
  expect(state.years).toBe(2); // Directory does not read the schedule cache.
});

test("logout and same-account login do not reuse directory data", async ({ page }) => {
  const { state } = await fixture(page);
  await start(page);
  await expect(page.getByTestId("teachers")).toHaveText("First teacher");
  await page.getByRole("button", { name: "Logout", exact: true }).click();
  await page.getByRole("button", { name: "Log out", exact: true }).click();
  await expect(page.getByTestId("auth")).toHaveText("signed-out");
  await expect(page.getByTestId("teachers")).toBeEmpty();
  state.name = "New login teacher";
  await page.getByRole("button", { name: "Login again" }).click();
  await expect(page.getByTestId("teachers")).toHaveText("New login teacher");
  expect(state.calls).toBe(2);
});

test("401 expires the active session; 403 preserves auth and never retries automatically", async ({ page }) => {
  const { state } = await fixture(page);
  state.status = 403;
  await start(page);
  await expect(page.getByTestId("error")).toContainText("(403)");
  await expect(page.getByTestId("auth")).toHaveText("1");
  expect(state.calls).toBe(1);
  state.status = 401;
  await page.getByRole("button", { name: "Retry query" }).click();
  await expect(page.getByTestId("auth")).toHaveText("signed-out");
  await expect(page.getByTestId("teachers")).toBeEmpty();
  expect(state.calls).toBe(2);
});

test("a different role cannot fetch the principal directory", async ({ page }) => {
  const { state } = await fixture(page);
  await page.getByRole("button", { name: "Switch role" }).click();
  await start(page);
  await page.getByRole("button", { name: "Retry query" }).click();
  expect(state.calls).toBe(0);
});
