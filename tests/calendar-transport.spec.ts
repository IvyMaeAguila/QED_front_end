import { test, expect } from "@playwright/test";

// Browser executes the actual Calendar service; every HTTP response is mocked.
// No cookie/token values are inspected, recorded or printed.
for (const deniedStatus of [0, 401, 403]) test(`Calendar transport ${deniedStatus || "success"}: credentials and exact write contracts`, async ({ page }) => {
  const dispatched: { method: string; path: string; body: unknown }[] = [];
  await page.route("https://fonts.googleapis.com/**", route => route.abort());
  await page.route("**/socket.io/**", route => route.abort());
  await page.route("**/api/**", async route => {
    const request = route.request(), path = new URL(request.url()).pathname;
    if (path.startsWith("/api/calendar/")) {
      dispatched.push({ method: request.method(), path, body: request.postDataJSON() });
      const denied = request.method() !== "GET" && deniedStatus;
      await route.fulfill({ status: denied || 200, json: denied ? { message: "Synthetic permission error" } : {
        success: true, data: [{ id: 21, title: "Synthetic event", date: "2026-10-12", type: "regular" }],
      } });
    } else await route.fulfill({ json: { user: null, notifications: [], unreadCount: 0 } });
  });
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const service = await import("/src/shared/calendar/services/calendar.service.ts");
    const originalFetch = window.fetch;
    const credentials: string[] = [], errors: string[] = [], values: unknown[] = [];
    window.fetch = (input, init) => {
      if (String(input).includes("/api/calendar/")) credentials.push(new Request(input, init).credentials);
      return originalFetch(input, init);
    };
    try {
      for (const operation of [
        () => service.createCalendarActivities([{ title: "Synthetic event", date: "2026-10-12" }]),
        () => service.updateCalendarActivity(21, { title: "Synthetic event", date: "2026-10-12" }),
        () => service.deleteCalendarActivityApi(21),
        () => service.createCalendarHolidays([{ title: "Synthetic event", date: "2026-10-12" }]),
        () => service.updateCalendarHoliday(21, { title: "Synthetic event", date: "2026-10-12" }),
        () => service.deleteCalendarHolidayApi(21),
      ]) {
        try { values.push(await operation()); }
        catch (error) { errors.push(error instanceof Error ? error.message : "Unknown error"); }
      }
      await service.fetchCalendarActivities(); await service.fetchAllCalendarActivities();
      await service.fetchCalendarHolidays(); await service.fetchAllCalendarHolidays();
      return { credentials, errors, values };
    } finally { window.fetch = originalFetch; }
  });
  expect(result.credentials).toEqual([...Array(6).fill("include"), ...Array(4).fill("same-origin")]);
  expect(result.errors).toEqual(deniedStatus ? Array(6).fill("Synthetic permission error") : []);
  if (!deniedStatus) {
    expect(result.values[0]).toEqual([{ id: 21, title: "Synthetic event", date: "2026-10-12" }]);
    expect(result.values[3]).toEqual([{ id: 21, title: "Synthetic event", date: "2026-10-12", type: "regular" }]);
  }
  expect(dispatched).toEqual([
    { method: "POST", path: "/api/calendar/activities", body: { entries: [{ title: "Synthetic event", date: "2026-10-12", createdBy: null }] } },
    { method: "PUT", path: "/api/calendar/activities/21", body: { title: "Synthetic event", date: "2026-10-12" } },
    { method: "DELETE", path: "/api/calendar/activities/21", body: null },
    { method: "POST", path: "/api/calendar/holidays", body: { entries: [{ title: "Synthetic event", date: "2026-10-12", holidayType: "regular", createdBy: null }] } },
    { method: "PUT", path: "/api/calendar/holidays/21", body: { title: "Synthetic event", date: "2026-10-12", holidayType: "regular" } },
    { method: "DELETE", path: "/api/calendar/holidays/21", body: null },
    ...["activities", "all-activities", "holidays", "all-holidays"].map(resource => ({ method: "GET", path: `/api/calendar/${resource}`, body: null })),
  ]);
});
