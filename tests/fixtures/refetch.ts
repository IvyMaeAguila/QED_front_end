import { expect, type Page } from "@playwright/test";

/** Start fake latency at request interception, never after a driver action returns. */
export function refetchGate() {
  let pending = Promise.resolve();
  let finish = () => {};
  let fast = false;
  return {
    hold(quick = false) { fast = quick; pending = new Promise<void>(resolve => { finish = resolve; }); },
    async wait() { if (fast) await new Promise<void>(resolve => setTimeout(resolve, 60)); else await pending; },
    release() { finish(); pending = Promise.resolve(); fast = false; },
  };
}

/** Prove a fast response fits the unchanged 200ms boundary; optionally align with the region delay. */
export async function measureFastRefetch(page: Page, endpoint: string, pendingRegion?: string) {
  await page.evaluate(({endpoint, pendingRegion}) => {
    const durations: number[] = [];
    (window as unknown as { skFetchDurations: number[] }).skFetchDurations = durations;
    const windows: { waitingStarted: number | null; responseHeaders: number }[] = [];
    (window as unknown as { skFastPendingWindows: typeof windows }).skFastPendingWindows = windows;
    let waitingStarted: number | null = null;
    // Observe the same DOM phase that starts LoadingRegion's 200ms delay.
    // Fetch can begin before React commits that phase.
    const captureWaiting = () => {
      if (pendingRegion && waitingStarted === null && document.querySelector(pendingRegion)?.getAttribute('data-sk-phase') === 'waiting') waitingStarted = performance.now();
    };
    const observer = pendingRegion ? new MutationObserver(captureWaiting) : undefined;
    observer?.observe(document, {subtree: true, attributes: true, attributeFilter: ['data-sk-phase']});
    captureWaiting();
    const original = window.fetch;
    window.fetch = async (input, init) => {
      const url = input instanceof Request ? input.url : String(input);
      if (!url.includes(endpoint)) return original.call(window, input, init);
      const started = performance.now();
      const response = await original.call(window, input, init);
      const responseHeaders = performance.now();
      durations.push(responseHeaders - started);
      if (pendingRegion) {
        windows.push({waitingStarted, responseHeaders});
        observer?.disconnect();
      }
      return response;
    };
  }, {endpoint, pendingRegion});
  return async () => {
    await expect.poll(() => page.evaluate(() => (window as unknown as { skFetchDurations: number[] }).skFetchDurations.length), { message: "the fast refetch must finish its API request" }).toBeGreaterThan(0);
    const durations = await page.evaluate(() => (window as unknown as { skFetchDurations: number[] }).skFetchDurations);
    expect(durations.length, "the fast refetch must actually issue its API request").toBeGreaterThan(0);
    if (pendingRegion) {
      const windows = await page.evaluate(() => (window as unknown as { skFastPendingWindows: { waitingStarted: number | null; responseHeaders: number }[] }).skFastPendingWindows);
      expect(windows.length, "every measured request must have a loading-window measurement").toBe(durations.length);
      for (const window of windows) {
        expect(window.waitingStarted, "the region must enter waiting before the fast response").not.toBeNull();
        const elapsed = window.responseHeaders - window.waitingStarted!;
        expect(elapsed, "response must follow the observed waiting phase").toBeGreaterThanOrEqual(0);
        expect(elapsed, "fast response within LoadingRegion's unchanged 200ms waiting window").toBeLessThan(200);
      }
    } else {
      for (const duration of durations) expect(duration, "fast fixture elapsed time in the browser").toBeLessThan(200);
    }
  };
}
