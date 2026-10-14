import { expect, type Page } from "@playwright/test";
import { requestLedger } from "./requestLedger";
export const adminPaths = {
  users: "/api/user/totalUser", students: "/api/student/totalStudents",
  frequency: "/api/analytics/login-frequency", audit: "/api/audit-logs",
};
export type AdminEndpoint = keyof typeof adminPaths;
export const adminEndpoints = Object.keys(adminPaths) as AdminEndpoint[];
export function frequencyBody(period = "weekly") {
  return { period, chart: [{ label: "Mon", count: 7 }, { label: "Sun", count: 14 }], summary: {
    peakLabel: "Sun", peakCount: 14, peakType: "Peak Day", averageDaily: 3,
    averageLabel: "Avg. Daily Logins", growthPercent: 50, growthLabel: "Weekly Growth",
  } };
}
export function auditBody(page = 1, search = "") {
  return { success: true, data: { page, limit: 20, total: 40, entries: [{ id: page,
    createdAt: "2026-10-08T02:00:00Z", actorFullName: `${search || "Synthetic Actor"} p${page}`,
    actorUsername: "synthetic", actorRole: "ADMIN", action: "LOGIN", resource: "session",
    resourceId: "1", httpMethod: "POST", endpoint: "/api/auth/login", statusCode: 200,
  }] } };
}
// All APIs/auth mocked; actual browser components/hooks/Query/auth lifecycle.
export async function mockAdminDashboard(page: Page, dark = false, holdAuth = false) {
  await page.addInitScript(dark => localStorage.setItem("qed.settings", JSON.stringify({ darkMode: dark })), dark);
  await page.route("https://fonts.googleapis.com/**", route => route.abort());
  await page.route("**/socket.io/**", route => route.abort());
  let releaseAuth!: () => void;
  const authGate = holdAuth ? new Promise<void>(resolve => { releaseAuth = resolve; }) : Promise.resolve();
  const state = Object.fromEntries(adminEndpoints.map(e => [e, { status: 200, body: undefined as unknown,
    calls: 0, gate: Promise.resolve(), release: () => {} }])) as Record<AdminEndpoint, {
      status: number; body: unknown; calls: number; gate: Promise<void>; release: () => void;
    }>;
  const records: { endpoint: AdminEndpoint; params: Record<string, string> }[] = [];
  const ledgers = Object.fromEntries(adminEndpoints.map(e => [e, requestLedger(page, p => p === adminPaths[e])])) as Record<AdminEndpoint, ReturnType<typeof requestLedger>>;
  await page.route("**/api/**", async route => {
    const url = new URL(route.request().url()), path = url.pathname;
    if (path === "/api/auth/me") { await authGate; return route.fulfill({ json: { user: { id: "1", role: "ADMIN", user_name: "admin" } } }); }
    if (path.includes("user-profile")) return route.fulfill({ json: { id: "1", role: "ADMIN", userName: "admin", name: "Synthetic Admin" } });
    const endpoint = adminEndpoints.find(e => adminPaths[e] === path);
    if (!endpoint) return route.fulfill({ json: { success: true, data: [], notifications: [], unreadCount: 0 } });
    const s = state[endpoint], status = s.status, override = s.body;
    s.calls++; ledgers[endpoint].intercept(route.request());
    records.push({ endpoint, params: Object.fromEntries(url.searchParams) });
    const body = override !== undefined ? override : endpoint === "users" ? { totalUsers: 120, totalTeachers: 12, totalParents: 100 }
      : endpoint === "students" ? { success: true, total: 240 }
      : endpoint === "frequency" ? frequencyBody(url.searchParams.get("period") ?? "weekly")
      : auditBody(Number(url.searchParams.get("page") ?? 1), url.searchParams.get("search") ?? "");
    await s.gate;
    return route.fulfill({ status, json: status === 200 ? body : { message: `Synthetic ${endpoint} ${status}` } });
  });
  return { state, records, ledgers, releaseAuth: () => releaseAuth?.(),
    hold(e: AdminEndpoint) { state[e].gate = new Promise<void>(resolve => { state[e].release = resolve; }); },
    release(e: AdminEndpoint) { state[e].release(); state[e].gate = Promise.resolve(); },
    async settled() { for (const e of adminEndpoints) await expect.poll(() => ledgers[e].snapshot().every(r => r.terminal !== undefined)).toBe(true); },
  };
}
