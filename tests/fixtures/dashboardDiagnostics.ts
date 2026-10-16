import type { Page, TestInfo } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import { requestLedger } from "./requestLedger";

// Opt-in source diagnostics only. Never collect identities, headers, bodies,
// cookies or credentials, and never import source modules into the built app.
const captures = new WeakMap<Page, unknown[]>();
const ledgers = new WeakMap<Page, ReturnType<typeof requestLedger>>();
const browserEvents = new WeakMap<Page, unknown[]>();
export async function observeDashboardQueries(page: Page) {
  if (process.env.QED_DASHBOARD_DIAGNOSTICS !== "1") return;
  const documents: unknown[] = [];
  captures.set(page, documents);
  const browser: unknown[] = [];
  browserEvents.set(page, browser);
  page.on("framenavigated", frame => {
    if (frame === page.mainFrame()) browser.push({ time: Date.now(), type: "navigation", path: new URL(frame.url()).pathname });
  });
  page.on("websocket", socket => socket.on("framereceived", frame => {
    try {
      const message = JSON.parse(String(frame.payload));
      if (message.type === "full-reload" || message.type === "update") {
        browser.push({ time: Date.now(), type: "vite", event: message.type, path: message.path,
          updates: message.updates?.map((update: { type: string; path: string }) => ({ type: update.type, path: update.path })) });
      }
    } catch { /* Non-Vite websocket frames are intentionally not recorded. */ }
  }));
  ledgers.set(page, requestLedger(page, path => path.includes("/api/principal-dashboard/") || path === "/api/academic-year/getAcademicYear"));
  page.on("console", message => {
    if (message.text().startsWith("QED_QUERY_LIFECYCLE ")) {
      documents.push(JSON.parse(message.text().slice("QED_QUERY_LIFECYCLE ".length)));
    }
  });
  await page.addInitScript(() => {
    type Event = Record<string, unknown>;
    const runtime = window as typeof window & { qedQueryEvents?: Event[] };
    const events: Event[] = [];
    const scopes = new Map<string, number>();
    runtime.qedQueryEvents = events;
    const record = (event: Event) => events.push({ time: Date.now(), ...event });
    document.addEventListener("click", event => {
      const button = (event.target as Element).closest("button");
      const label = button?.getAttribute("aria-label") ?? button?.textContent?.trim();
      if (["Expand ranking", "Close dialog", "Retry", "Open menu"].includes(label ?? "")) record({ type: "ui", action: label });
    }, true);
    window.addEventListener("beforeunload", () => console.log("QED_QUERY_LIFECYCLE " + JSON.stringify(events)));
    const original = window.fetch;
    let observing = false;
    window.fetch = (...args: Parameters<typeof fetch>) => {
      const path = new URL(args[0] instanceof Request ? args[0].url : String(args[0]), location.href).pathname;
      if (path.includes("/api/principal-dashboard/") || path === "/api/academic-year/getAcademicYear") {
        record({ type: "fetch", path });
        // Observe only after the app has loaded its own QueryClient. Diagnostics
        // must not preload the client or change auth/bootstrap import ordering.
        if (!observing) { observing = true; void observeCache(); }
        args[1]?.signal?.addEventListener("abort", () => record({ type: "abort", path }), { once: true });
      }
      return original(...args);
    };
    const observeCache = async () => {
      if (!document.querySelector('script[src="/@vite/client"]')) return;
      const modulePath = "/src/shared/query/queryClient.ts";
      const { queryClient } = await import(/* @vite-ignore */ modulePath);
      type CacheEvent = { type: string; action?: { type: string }; query: {
        queryKey: unknown[]; state: { status: string; fetchStatus: string; dataUpdatedAt: number; dataUpdateCount: number };
        getObserversCount(): number; isStale(): boolean;
      } };
      queryClient.getQueryCache().subscribe((event: CacheEvent) => {
        const q = event.query;
        if (!q.queryKey.includes("dashboard")) return;
        const scopeKey = JSON.stringify(q.queryKey.slice(0, 4));
        if (!scopes.has(scopeKey)) scopes.set(scopeKey, scopes.size + 1);
        record({ type: "cache", scope: scopes.get(scopeKey), event: event.type, action: event.action?.type,
          resource: q.queryKey.slice(4), status: q.state.status, fetchStatus: q.state.fetchStatus,
          updatedAt: q.state.dataUpdatedAt, updates: q.state.dataUpdateCount,
          observers: q.getObserversCount(), stale: q.isStale() });
      });
    };
  });
}

export async function attachDashboardDiagnostics(page: Page, info: TestInfo) {
  const documents = captures.get(page);
  if (!documents) return;
  documents.push(await page.evaluate(() => (window as typeof window & { qedQueryEvents?: unknown[] }).qedQueryEvents ?? []).catch(() => []));
  const path = info.outputPath("sanitized-dashboard-query-lifecycle.json");
  await writeFile(path, JSON.stringify({ backend: "mocked", documents, browser: browserEvents.get(page), requests: ledgers.get(page)?.snapshot() }, null, 2));
  await info.attach("sanitized-dashboard-query-lifecycle", {
    path, contentType: "application/json",
  });
}
