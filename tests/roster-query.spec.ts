import { test, expect, type Page } from "@playwright/test";

// Mocked endpoints; actual auth context, QueryClient, hooks and browser events.
type Endpoint = "class1" | "class2" | "grade1" | "year";
async function fixture(page: Page, holdAuth = false) {
  const state = {
    class1: { calls: 0, status: 200, name: "Class One", empty: false },
    class2: { calls: 0, status: 200, name: "Class Two", empty: false },
    grade1: { calls: 0, status: 200, name: "Unassigned One", empty: false },
    year: { calls: 0, status: 200, name: "2026–2027", empty: false, id: 1 },
  };
  const gates: Partial<Record<Endpoint, Promise<void>>> = {};
  const releases: Partial<Record<Endpoint, () => void>> = {};
  let releaseAuth = () => {};
  const authGate = holdAuth ? new Promise<void>(resolve => { releaseAuth = resolve; }) : Promise.resolve();
  await page.route("**/api/**", async route => {
    const path = new URL(route.request().url()).pathname;
    const endpoint: Endpoint | null = path.endsWith("/class-list/1") ? "class1" : path.endsWith("/class-list/2") ? "class2"
      : path.endsWith("/grade/1/unassigned") ? "grade1" : path.includes("getAcademicYear") ? "year" : null;
    if (endpoint) {
      const { status, name, empty } = state[endpoint];
      const yearId = state.year.id;
      state[endpoint].calls++;
      await gates[endpoint];
      return route.fulfill({ status, json: status !== 200 ? { message: "Synthetic failure" }
        : endpoint === "year" ? { data: { id: yearId, label: name } }
        : { classId: endpoint === "grade1" ? null : endpoint === "class1" ? 1 : 2, grade: "Grade 1",
          sectionInfo: { section: endpoint === "grade1" ? "Unassigned" : "Maroon", adviser: "Test Adviser", room: "101" },
          roster: empty ? [] : [{ studentId: "fixture-1", firstName: name, lastName: "Fixture", middleInitial: "", gender: "Female" }] } });
    }
    if (path === "/api/auth/me") {
      await authGate;
      return route.fulfill({ json: { user: { id: "1", role: "PRINCIPAL", user_name: "principal" } } });
    }
    if (path.includes("user-profile")) return route.fulfill({ json: { id: "1", role: "PRINCIPAL", userName: "principal" } });
    return route.fulfill({ json: { success: true } });
  });
  await page.goto("/tests/roster-query.html");
  await expect(page.getByTestId("auth")).toHaveText(holdAuth ? "pending" : "1");
  return { state, releaseAuth,
    hold: (endpoint: Endpoint) => { gates[endpoint] = new Promise<void>(resolve => { releases[endpoint] = resolve; }); },
    release: (endpoint: Endpoint) => { releases[endpoint]?.(); delete gates[endpoint]; },
  };
}
const start = (page: Page) => page.getByRole("button", { name: "Toggle preview" }).click();
const toggle = (page: Page) => page.getByRole("button", { name: "Toggle roster" }).click();

test("roster preview and auth readiness gate year and roster requests", async ({ page }) => {
  const data = await fixture(page, true);
  await start(page);
  expect(data.state.year.calls).toBe(0);
  expect(data.state.class1.calls).toBe(0);
  data.releaseAuth();
  await expect(page.getByTestId("students")).toHaveText("Class One");
  await expect(page.getByTestId("year")).toHaveText("2026–2027");
  expect(data.state.year.calls).toBe(1);
  expect(data.state.class1.calls).toBe(1);
  await start(page);
  await expect(page.getByTestId("students")).toBeEmpty();
});

test("missing target has no requests and is not found rather than indefinitely loading", async ({ page }) => {
  const { state } = await fixture(page);
  await page.getByRole("button", { name: "Missing target" }).click();
  await start(page);
  await expect(page.getByTestId("loading")).toHaveText("false");
  await expect(page.getByTestId("not-found")).toHaveText("true");
  expect(state.year.calls).toBe(0);
  expect(state.class1.calls).toBe(0);
});

for (const endpoint of ["class1", "grade1"] as const) {
  const title = endpoint === "class1" ? "Class One" : "Unassigned One";
  const select = async (page: Page) => { if (endpoint === "grade1") await page.getByRole("button", { name: "Grade 1", exact: true }).click(); };

  test(`${endpoint}: 404 is cached successful null; fresh remount and explicit retry preserve semantics`, async ({ page }) => {
    const { state } = await fixture(page);
    state[endpoint].status = 404;
    await select(page); await start(page);
    await expect(page.getByTestId("loading")).toHaveText("false");
    await expect(page.getByTestId("not-found")).toHaveText("true");
    await expect(page.getByTestId("error")).toBeEmpty();
    expect(state[endpoint].calls).toBe(1);
    await toggle(page); await toggle(page);
    await expect(page.getByTestId("not-found")).toHaveText("true");
    expect(state[endpoint].calls).toBe(1);
    await page.context().setOffline(true);
    await expect(page.getByTestId("not-found")).toHaveText("true");
    await expect(page.getByTestId("error")).toContainText("You're offline");
    await page.context().setOffline(false);
    state[endpoint].status = 200;
    await page.getByRole("button", { name: "Retry query" }).click();
    await expect(page.getByTestId("students")).toHaveText(title);
    await expect(page.getByTestId("not-found")).toHaveText("false");
    expect(state[endpoint].calls).toBe(2);
  });

  test(`${endpoint}: empty roster is an existing class; 500 loads an error and explicit retry recovers`, async ({ page }) => {
    const data = await fixture(page);
    data.hold(endpoint); data.state[endpoint].status = 500;
    await select(page); await start(page);
    await expect.poll(() => data.state[endpoint].calls).toBe(1);
    await expect(page.getByTestId("loading")).toHaveText("true");
    data.release(endpoint);
    await expect(page.getByTestId("error")).toContainText("(500)");
    await expect(page.getByTestId("not-found")).toHaveText("false");
    expect(data.state[endpoint].calls).toBe(1);
    data.state[endpoint].status = 200; data.state[endpoint].empty = true;
    await page.getByRole("button", { name: "Retry query" }).click();
    await expect(page.getByTestId("class")).toHaveText("Grade 1");
    await expect(page.getByTestId("students")).toBeEmpty();
    await expect(page.getByTestId("not-found")).toHaveText("false");
    await expect(page.getByTestId("error")).toBeEmpty();
    expect(data.state[endpoint].calls).toBe(2);
  });

  test(`${endpoint}: initial offline stops loading, repeated retries do nothing, recovery fetches once`, async ({ page }) => {
    const { state } = await fixture(page);
    await select(page);
    await page.context().setOffline(true);
    await start(page);
    await expect(page.getByTestId("loading")).toHaveText("false");
    await expect(page.getByTestId("error")).toContainText("You're offline");
    await expect(page.getByTestId("not-found")).toHaveText("false");
    for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Retry query" }).click();
    expect(state.year.calls).toBe(0); expect(state[endpoint].calls).toBe(0);
    await page.context().setOffline(false);
    await expect(page.getByTestId("students")).toHaveText(title);
    expect(state.year.calls).toBe(1); expect(state[endpoint].calls).toBe(1);
  });

  test(`${endpoint}: stale cached rows remain offline and resume one refresh`, async ({ page }) => {
    const { state } = await fixture(page);
    await select(page); await page.clock.install(); await start(page);
    await expect(page.getByTestId("students")).toHaveText(title);
    await toggle(page); await page.clock.fastForward(31_000);
    await page.context().setOffline(true); await toggle(page);
    await expect(page.getByTestId("students")).toHaveText(title);
    await expect(page.getByTestId("loading")).toHaveText("false");
    await expect(page.getByTestId("error")).toContainText("You're offline");
    state[endpoint].name = "Refreshed roster";
    await page.context().setOffline(false);
    await expect(page.getByTestId("students")).toHaveText("Refreshed roster");
    expect(state[endpoint].calls).toBe(2);
    expect(state.year.calls).toBe(2);
  });
}

test("class and grade keys separate equal IDs, deduplicate observers and reuse fresh targets", async ({ page }) => {
  const { state } = await fixture(page);
  await start(page);
  await expect(page.getByTestId("students")).toHaveText("Class One");
  await page.getByRole("button", { name: "Toggle second observer" }).click();
  await expect(page.getByTestId("secondary")).toHaveText("Class One");
  expect(state.class1.calls).toBe(1);
  await page.getByRole("button", { name: "Grade 1", exact: true }).click();
  await expect(page.getByTestId("students")).toHaveText("Unassigned One");
  await page.getByRole("button", { name: "Class 2", exact: true }).click();
  await expect(page.getByTestId("students")).toHaveText("Class Two");
  await page.getByRole("button", { name: "Class 1", exact: true }).click();
  await expect(page.getByTestId("students")).toHaveText("Class One");
  expect(state.class1.calls).toBe(1); expect(state.class2.calls).toBe(1); expect(state.grade1.calls).toBe(1);
  expect(state.year.calls).toBe(1);
});

test("active year change uses a new roster key and cannot display old-year rows during new load", async ({ page }) => {
  const data = await fixture(page);
  await page.clock.install(); await start(page);
  await expect(page.getByTestId("students")).toHaveText("Class One");
  await toggle(page); await page.clock.fastForward(31_000);
  data.state.year.id = 2; data.state.year.name = "2027–2028";
  data.state.class1.name = "New year roster"; data.hold("class1");
  await toggle(page);
  await expect(page.getByTestId("year")).toHaveText("2027–2028");
  await expect(page.getByTestId("students")).toBeEmpty();
  await expect(page.getByTestId("loading")).toHaveText("true");
  data.release("class1");
  await expect(page.getByTestId("students")).toHaveText("New year roster");
  const keys = await page.evaluate(async () => {
    // @ts-expect-error Vite test harness module import.
    const { queryClient } = await import("/src/shared/query/queryClient.ts");
    return queryClient.getQueryCache().getAll().filter((q: { queryKey: unknown[]; state: { data: unknown } }) => q.queryKey[6] === "roster" && q.state.data !== undefined).map((q: { queryKey: unknown[] }) => q.queryKey);
  });
  expect(keys.some((key: unknown[]) => key[7] === 2)).toBe(true);
});

test("changing targets cancels the old request and rejects its late result", async ({ page }) => {
  const data = await fixture(page);
  const cancelled: string[] = [];
  page.on("requestfailed", r => { if (r.url().includes("class-list/1")) cancelled.push(r.failure()?.errorText ?? ""); });
  data.hold("class1"); await start(page);
  await expect.poll(() => data.state.class1.calls).toBe(1);
  await page.getByRole("button", { name: "Class 2", exact: true }).click();
  await expect(page.getByTestId("students")).toHaveText("Class Two");
  await expect.poll(() => cancelled.length).toBe(1);
  expect(cancelled[0]).toMatch(/abort/i);
  data.release("class1");
  await expect(page.getByTestId("students")).toHaveText("Class Two");
});

for (const endpoint of ["class1", "grade1", "year"] as const) {
  test(`${endpoint} 401 expires the owning session`, async ({ page }) => {
    const { state } = await fixture(page);
    if (endpoint === "grade1") await page.getByRole("button", { name: "Grade 1", exact: true }).click();
    state[endpoint].status = 401; await start(page);
    await expect(page.getByTestId("auth")).toHaveText("signed-out");
    await expect(page.getByTestId("students")).toBeEmpty();
    expect(state[endpoint].calls).toBe(1);
  });
  test(`${endpoint} 403 hides cached private data without logging out or automatic retries`, async ({ page }) => {
    const { state } = await fixture(page);
    if (endpoint === "grade1") await page.getByRole("button", { name: "Grade 1", exact: true }).click();
    await start(page);
    await expect(page.getByTestId("students")).not.toBeEmpty();
    state[endpoint].status = 403;
    await page.getByRole("button", { name: "Retry query" }).click();
    await expect(page.getByTestId("error")).not.toBeEmpty();
    await expect(page.getByTestId("auth")).toHaveText("1");
    await expect(page.getByTestId("students")).toBeEmpty();
    await expect(page.getByTestId("year")).toBeEmpty();
    expect(state[endpoint].calls).toBe(2);
    state[endpoint].status = 200;
    await page.getByRole("button", { name: "Retry query" }).click();
    await expect(page.getByTestId("students")).not.toBeEmpty();
    await expect(page.getByTestId("error")).toBeEmpty();
  });
}

for (const transition of ["switch", "logout-login"] as const) {
  test(`old roster 401 after year 500 cannot expire a newer session on ${transition}`, async ({ page }) => {
    const data = await fixture(page);
    await start(page); await expect(page.getByTestId("students")).toHaveText("Class One");
    data.state.year.status = 500; data.state.class1.status = 401; data.hold("class1");
    await page.getByRole("button", { name: "Retry query" }).click();
    await expect(page.getByTestId("error")).not.toBeEmpty();
    data.state.year.status = data.state.class1.status = 200; data.state.class1.name = "New session roster";
    if (transition === "switch") await page.getByRole("button", { name: "Switch account" }).click();
    else {
      await page.getByRole("button", { name: "Logout", exact: true }).click();
      await page.getByRole("button", { name: "Log out", exact: true }).click();
      await expect(page.getByTestId("students")).toBeEmpty();
      await page.getByRole("button", { name: "Login again" }).click();
    }
    await expect.poll(() => data.state.class1.calls).toBe(3);
    data.release("class1");
    await expect(page.getByTestId("students")).toHaveText("New session roster");
    await page.getByRole("button", { name: "Expire old session" }).click();
    await expect(page.getByTestId("auth")).toHaveText(transition === "switch" ? "2" : "1");
  });
}

test("repeated retries do not duplicate pending reads; unmount cancels year and roster refetches", async ({ page }) => {
  const data = await fixture(page);
  await start(page); await expect(page.getByTestId("students")).toHaveText("Class One");
  const cancelled: string[] = [];
  page.on("requestfailed", r => { if (/class-list\/1|getAcademicYear/.test(r.url())) cancelled.push(r.failure()?.errorText ?? ""); });
  data.hold("year"); data.hold("class1");
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Retry query" }).click();
  await expect.poll(() => data.state.class1.calls).toBe(2);
  expect(data.state.year.calls).toBe(2);
  await toggle(page);
  await expect.poll(() => cancelled.length).toBe(2);
  expect(cancelled.every(reason => /abort/i.test(reason))).toBe(true);
  data.release("year"); data.release("class1");
});

test("account switch cancels pending data and cache keys contain only the new session identity", async ({ page }) => {
  const data = await fixture(page);
  await start(page); await expect(page.getByTestId("students")).toHaveText("Class One");
  data.hold("class1"); await page.getByRole("button", { name: "Retry query" }).click();
  await expect.poll(() => data.state.class1.calls).toBe(2);
  data.state.class1.name = "Account Two";
  await page.getByRole("button", { name: "Switch account" }).click();
  await expect(page.getByTestId("students")).toBeEmpty();
  await expect.poll(() => data.state.class1.calls).toBe(3);
  data.release("class1");
  await expect(page.getByTestId("students")).toHaveText("Account Two");
  const keys = await page.evaluate(async () => {
    // @ts-expect-error Vite test harness module import.
    const { queryClient } = await import("/src/shared/query/queryClient.ts");
    return queryClient.getQueryCache().getAll().map((q: { queryKey: unknown[] }) => q.queryKey);
  });
  expect(keys.length).toBeGreaterThanOrEqual(2);
  expect(keys.every((key: unknown[]) => key[2] === "PRINCIPAL" && key[3] === "2")).toBe(true);
});

test("logout clears populated roster and year data, and same-account login reloads", async ({ page }) => {
  const { state } = await fixture(page);
  await start(page); await expect(page.getByTestId("students")).toHaveText("Class One");
  await page.getByRole("button", { name: "Logout", exact: true }).click();
  await page.getByRole("button", { name: "Log out", exact: true }).click();
  await expect(page.getByTestId("auth")).toHaveText("signed-out");
  await expect(page.getByTestId("students")).toBeEmpty();
  const populated = await page.evaluate(async () => {
    // @ts-expect-error Vite test harness module import.
    const { queryClient } = await import("/src/shared/query/queryClient.ts");
    return queryClient.getQueryCache().getAll().filter((q: { state: { data: unknown } }) => q.state.data !== undefined).length;
  });
  expect(populated).toBe(0);
  state.class1.name = "Fresh Login";
  await page.getByRole("button", { name: "Login again" }).click();
  await expect(page.getByTestId("students")).toHaveText("Fresh Login");
  expect(state.class1.calls).toBe(2); expect(state.year.calls).toBe(2);
});

for (const role of ["ADMIN", "TEACHER", "PARENT"]) test(`${role} cannot reuse or fetch Principal roster data`, async ({ page }) => {
  const { state } = await fixture(page);
  await start(page); await expect(page.getByTestId("students")).toHaveText("Class One");
  await page.getByRole("button", { name: `Switch ${role}`, exact: true }).click();
  await expect(page.getByTestId("students")).toBeEmpty();
  await page.getByRole("button", { name: "Retry query" }).click();
  expect(state.class1.calls).toBe(1); expect(state.year.calls).toBe(1);
});
