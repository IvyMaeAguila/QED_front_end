import { test, expect, type Page } from "@playwright/test";

// All endpoint responses are synthetic. Real auth/query/hooks execute in Chromium.
type Endpoint = "grades" | "year";
async function fixture(page: Page, holdAuth = false) {
  const state = {
    grades: { status: 200, calls: 0, name: "Grade 1", empty: false },
    year: { status: 200, calls: 0, name: "2026–2027", empty: false },
  };
  const gates: Partial<Record<Endpoint, Promise<void>>> = {};
  const releases: Partial<Record<Endpoint, () => void>> = {};
  let releaseAuth = () => {};
  const authGate = holdAuth ? new Promise<void>(resolve => { releaseAuth = resolve; }) : Promise.resolve();
  await page.route("**/api/**", async route => {
    const path = new URL(route.request().url()).pathname;
    const endpoint = path === "/api/student/grade-levels" ? "grades" : path.includes("academic-year") ? "year" : null;
    if (endpoint) {
      const { status, name, empty } = state[endpoint];
      state[endpoint].calls++;
      await gates[endpoint];
      return route.fulfill({ status, json: status === 200
        ? endpoint === "grades" ? empty ? [] : [{ gradeId: 1, classId: 1, grade: name, section: "Maroon", totalStudents: 7 }]
          : { data: { label: name } }
        : { message: "Synthetic endpoint failure" } });
    }
    if (path === "/api/auth/me") {
      await authGate;
      return route.fulfill({ json: { user: { id: "1", role: "PRINCIPAL", user_name: "principal" } } });
    }
    if (path.includes("user-profile")) return route.fulfill({ json: { id: "1", role: "PRINCIPAL", userName: "principal" } });
    return route.fulfill({ json: { success: true } });
  });
  await page.goto("/tests/students-query.html");
  await expect(page.getByTestId("auth")).toHaveText(holdAuth ? "pending" : "1");
  return { state, releaseAuth,
    hold: (endpoint: Endpoint) => { gates[endpoint] = new Promise<void>(resolve => { releases[endpoint] = resolve; }); },
    release: (endpoint: Endpoint) => { releases[endpoint]?.(); delete gates[endpoint]; },
  };
}
const start = (page: Page) => page.getByRole("button", { name: "Toggle preview" }).click();
const toggle = (page: Page) => page.getByRole("button", { name: "Toggle overview" }).click();

test("overview preview and authentication readiness gate requests", async ({ page }) => {
  const data = await fixture(page, true);
  expect(data.state.grades.calls).toBe(0);
  await start(page);
  expect(data.state.grades.calls).toBe(0);
  data.releaseAuth();
  await expect(page.getByTestId("grades")).toHaveText("Grade 1");
  await expect(page.getByTestId("total")).toHaveText("7");
  await expect(page.getByTestId("year")).toHaveText("2026–2027");
  expect(data.state.grades.calls).toBe(1);
});

test("overview loading, both errors, explicit retry and empty results", async ({ page }) => {
  const data = await fixture(page);
  data.hold("grades");
  data.hold("year");
  data.state.grades.status = data.state.year.status = 500;
  await start(page);
  await expect(page.getByTestId("loading")).toHaveText("true");
  data.release("grades");
  data.release("year");
  await expect(page.getByTestId("loading")).toHaveText("false");
  await expect(page.getByTestId("error")).not.toBeEmpty();
  expect(data.state.grades.calls).toBe(1);
  expect(data.state.year.calls).toBe(1);
  data.state.grades.status = data.state.year.status = 200;
  data.state.grades.empty = true;
  await page.getByRole("button", { name: "Retry query" }).click();
  await expect(page.getByTestId("error")).toBeEmpty();
  await expect(page.getByTestId("loading")).toHaveText("false");
  await expect(page.getByTestId("grades")).toBeEmpty();
  await expect(page.getByTestId("total")).toHaveText("0");
  expect(data.state.grades.calls).toBe(2);
});

test("overview fresh remount reuses cache; stale remount refreshes within bounded requests", async ({ page }) => {
  const { state } = await fixture(page);
  await page.clock.install();
  await start(page);
  await expect(page.getByTestId("grades")).toHaveText("Grade 1");
  await toggle(page); await toggle(page);
  await expect(page.getByTestId("grades")).toHaveText("Grade 1");
  expect(state.grades.calls).toBe(1);
  state.grades.name = "Grade 2";
  await page.clock.fastForward(301_000);
  await toggle(page); await toggle(page);
  await expect(page.getByTestId("grades")).toHaveText("Grade 2");
  expect(state.grades.calls).toBeGreaterThanOrEqual(2);
  expect(state.grades.calls).toBeLessThanOrEqual(3); // StrictMode may abort one probe.
  expect(state.year.calls).toBe(state.grades.calls);
});

test("overview initial offline stops loading, ignores repeated retries and resumes once", async ({ page }) => {
  const { state } = await fixture(page);
  await page.context().setOffline(true);
  await start(page);
  await expect(page.getByTestId("loading")).toHaveText("false");
  await expect(page.getByTestId("error")).toContainText("You're offline");
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Retry query" }).click();
  expect(state.grades.calls).toBe(0);
  await page.context().setOffline(false);
  await expect(page.getByTestId("grades")).toHaveText("Grade 1");
  await expect(page.getByTestId("error")).toBeEmpty();
  expect(state.grades.calls).toBe(1);
  expect(state.year.calls).toBe(1);
});

test("overview stale cache remains visible offline then refreshes once", async ({ page }) => {
  const { state } = await fixture(page);
  await page.clock.install();
  await start(page);
  await expect(page.getByTestId("grades")).toHaveText("Grade 1");
  await toggle(page);
  await page.clock.fastForward(301_000);
  await page.context().setOffline(true);
  await toggle(page);
  await expect(page.getByTestId("grades")).toHaveText("Grade 1");
  await expect(page.getByTestId("loading")).toHaveText("false");
  await expect(page.getByTestId("error")).toContainText("You're offline");
  state.grades.name = "Grade 2";
  await page.context().setOffline(false);
  await expect(page.getByTestId("grades")).toHaveText("Grade 2");
  expect(state.grades.calls).toBe(2);
});

for (const late of ["grades", "year"] as const) {
  test(`overview detects late ${late} 401 independently after other endpoint 500`, async ({ page }) => {
    const data = await fixture(page);
    data.state[late === "grades" ? "year" : "grades"].status = 500;
    data.state[late].status = 401;
    data.hold(late);
    await start(page);
    await expect(page.getByTestId("error")).not.toBeEmpty();
    await expect(page.getByTestId("auth")).toHaveText("1");
    data.release(late);
    await expect(page.getByTestId("auth")).toHaveText("signed-out");
    await expect(page.getByTestId("grades")).toBeEmpty();
  });
  test(`overview ${late} 403 preserves auth without automatic retries`, async ({ page }) => {
    const { state } = await fixture(page);
    state[late].status = 403;
    await start(page);
    await expect(page.getByTestId("error")).not.toBeEmpty();
    await expect(page.getByTestId("auth")).toHaveText("1");
    expect(state[late].calls).toBe(1);
  });
}

for (const transition of ["switch", "logout-login"] as const) {
  test(`overview late old-session 401 cannot expire new session on ${transition}`, async ({ page }) => {
    const data = await fixture(page);
    data.state.grades.status = 500;
    data.state.year.status = 401;
    data.hold("year");
    await start(page);
    await expect(page.getByTestId("error")).not.toBeEmpty();
    data.state.grades.status = data.state.year.status = 200;
    data.state.grades.name = "New session grade";
    if (transition === "switch") await page.getByRole("button", { name: "Switch account" }).click();
    else {
      await page.getByRole("button", { name: "Logout", exact: true }).click();
      await page.getByRole("button", { name: "Log out", exact: true }).click();
      await expect(page.getByTestId("auth")).toHaveText("signed-out");
      await expect(page.getByTestId("grades")).toBeEmpty();
      await page.getByRole("button", { name: "Login again" }).click();
    }
    await expect.poll(() => data.state.year.calls).toBe(2);
    data.release("year");
    await expect(page.getByTestId("grades")).toHaveText("New session grade");
    await page.getByRole("button", { name: "Expire old session" }).click();
    await expect(page.getByTestId("auth")).toHaveText(transition === "switch" ? "2" : "1");
  });
}

test("overview account switch cancels pending reads and removes old session cache", async ({ page }) => {
  const cancelled: string[] = [];
  page.on("requestfailed", r => { if (r.url().includes("/api/student/grade-levels")) cancelled.push(r.failure()?.errorText ?? ""); });
  const data = await fixture(page);
  await start(page);
  await expect(page.getByTestId("grades")).toHaveText("Grade 1");
  data.hold("grades");
  await page.getByRole("button", { name: "Retry query" }).click();
  await expect.poll(() => data.state.grades.calls).toBe(2);
  data.state.grades.name = "New account grade";
  await page.getByRole("button", { name: "Switch account" }).click();
  await expect.poll(() => cancelled.length).toBeGreaterThan(0);
  await expect(page.getByTestId("grades")).toBeEmpty();
  await expect.poll(() => data.state.grades.calls).toBe(3);
  data.release("grades");
  await expect(page.getByTestId("grades")).toHaveText("New account grade");
  const keys = await page.evaluate(async () => {
    // @ts-expect-error Vite source module loaded by regression harness.
    const { queryClient } = await import("/src/shared/query/queryClient.ts");
    return queryClient.getQueryCache().getAll().map((q: { queryKey: unknown[] }) => q.queryKey);
  });
  expect(keys).toHaveLength(1);
  expect(keys[0].slice(2)).toEqual(["PRINCIPAL", "2", "principal", "students", "overview"]);
});

test("overview cross-role and preview access exposes no cached private records", async ({ page }) => {
  const { state } = await fixture(page);
  await start(page);
  await expect(page.getByTestId("grades")).toHaveText("Grade 1");
  await start(page);
  await expect(page.getByTestId("grades")).toBeEmpty();
  await page.getByRole("button", { name: "Switch role" }).click();
  await start(page);
  await page.getByRole("button", { name: "Retry query" }).click();
  await expect(page.getByTestId("grades")).toBeEmpty();
  expect(state.grades.calls).toBe(1);
});

test("overview logout clears populated private data and same-account login fetches again", async ({ page }) => {
  const { state } = await fixture(page);
  await start(page);
  await expect(page.getByTestId("grades")).toHaveText("Grade 1");
  await page.getByRole("button", { name: "Logout", exact: true }).click();
  await page.getByRole("button", { name: "Log out", exact: true }).click();
  await expect(page.getByTestId("auth")).toHaveText("signed-out");
  await expect(page.getByTestId("grades")).toBeEmpty();
  const populated = await page.evaluate(async () => {
    // @ts-expect-error Vite source module loaded by regression harness.
    const { queryClient } = await import("/src/shared/query/queryClient.ts");
    return queryClient.getQueryCache().getAll().filter((q: { state: { data: unknown } }) => q.state.data !== undefined).length;
  });
  expect(populated).toBe(0);
  state.grades.name = "Fresh login grade";
  await page.getByRole("button", { name: "Login again" }).click();
  await expect(page.getByTestId("grades")).toHaveText("Fresh login grade");
  expect(state.grades.calls).toBe(2);
});

test("overview repeated retries during pending work do not duplicate requests; unmount cancels both", async ({ page }) => {
  const data = await fixture(page);
  const cancelled: string[] = [];
  page.on("requestfailed", r => {
    if (r.url().includes("grade-levels") || r.url().includes("getAcademicYear")) cancelled.push(r.failure()?.errorText ?? "");
  });
  data.hold("grades"); data.hold("year");
  await start(page);
  await expect.poll(() => data.state.grades.calls).toBe(1);
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Retry query" }).click();
  expect(data.state.grades.calls).toBe(1);
  expect(data.state.year.calls).toBe(1);
  await toggle(page);
  await expect.poll(() => cancelled.length).toBe(2);
  expect(cancelled.every(reason => /abort/i.test(reason))).toBe(true);
  data.release("grades"); data.release("year");
});

test("roster transports have no competing cache and stay independent of overview Query data", async ({ page }) => {
  const { state } = await fixture(page);
  let rosters = 0;
  await page.route("**/api/student/class-list/1", route => { rosters++; return route.fulfill({ json: { classId: 1, roster: [] } }); });
  await page.route("**/api/student/grade/2/unassigned", route => { rosters++; return route.fulfill({ status: 404, json: {} }); });
  const results = await page.evaluate(async () => {
    // @ts-expect-error Vite source module loaded by regression harness.
    const service = await import("/src/features/profiles/principal/pages/students/services/students.service.ts");
    await service.getClassList(1); await service.getClassList(1);
    const missing = [await service.getUnassignedClassList(2), await service.getUnassignedClassList(2)];
    await service.getSchoolYear(); await service.getSchoolYear();
    return missing;
  });
  expect(results).toEqual([null, null]);
  expect(rosters).toBe(4);
  expect(state.year.calls).toBe(2);
  await start(page);
  await expect(page.getByTestId("grades")).toHaveText("Grade 1");
  expect(state.year.calls).toBe(3);
});
