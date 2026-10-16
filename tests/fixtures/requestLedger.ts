import { expect, type Page, type Request } from "@playwright/test";

// Correlate browser lifecycle events and interception by Request identity.
// URLs are reduced to paths; headers, cookies and response bodies are never logged.
export function requestLedger(page: Page, matches: (path: string) => boolean) {
  type Entry = { id: number; path: string; intercepted: boolean; status?: number; terminal?: "finished" | "aborted" | "failed" };
  const entries = new Map<Request, Entry>();
  const entry = (request: Request) => {
    const path = new URL(request.url()).pathname;
    if (request.method() !== "GET" || !matches(path)) return;
    if (!entries.has(request)) entries.set(request, { id: entries.size + 1, path, intercepted: false });
    return entries.get(request)!;
  };
  page.on("request", entry);
  page.on("response", response => { const e = entry(response.request()); if (e) e.status = response.status(); });
  page.on("requestfinished", request => { const e = entry(request); if (e) e.terminal = "finished"; });
  page.on("requestfailed", request => { const e = entry(request); if (e) e.terminal = /abort/i.test(request.failure()?.errorText ?? "") ? "aborted" : "failed"; });
  const snapshot = (after = 0) => [...entries.values()].filter(e => e.id > after).map(e => ({ ...e }));
  return {
    snapshot,
    mark: () => entries.size,
    intercept: (request: Request) => { const e = entry(request); if (e) e.intercepted = true; },
    async successfulBatch(after = 0, successes = 1) {
      await expect.poll(() => snapshot(after).filter(e => e.terminal === "finished" && e.status === 200).length).toBe(successes);
      await expect.poll(() => snapshot(after).every(e => e.terminal !== undefined)).toBe(true);
      const batch = snapshot(after), aborted = batch.filter(e => e.terminal === "aborted");
      expect(batch.filter(e => e.terminal === "failed")).toEqual([]);
      expect(batch.filter(e => e.terminal === "finished")).toHaveLength(successes);
      expect(batch.filter(e => e.terminal === "finished").every(e => e.intercepted)).toBe(true);
      expect(batch).toHaveLength(successes + aborted.length);
      expect(batch.filter(e => e.intercepted)).toHaveLength(successes + aborted.filter(e => e.intercepted).length);
      return batch;
    },
  };
}
