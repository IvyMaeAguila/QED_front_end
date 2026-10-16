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

/** Prove the fast fixture actually completed below the unchanged 200ms boundary. */
export async function measureFastRefetch(page: Page, endpoint: string) {
  await page.evaluate(endpoint => {
    const durations: number[] = [];
    (window as unknown as { skFetchDurations: number[] }).skFetchDurations = durations;
    const original = window.fetch;
    window.fetch = async (input, init) => {
      const url = input instanceof Request ? input.url : String(input);
      if (!url.includes(endpoint)) return original.call(window, input, init);
      const started = performance.now();
      const response = await original.call(window, input, init);
      durations.push(performance.now() - started);
      return response;
    };
  }, endpoint);
  return async () => {
    await expect.poll(() => page.evaluate(() => (window as unknown as { skFetchDurations: number[] }).skFetchDurations.length), { message: "the fast refetch must finish its API request" }).toBeGreaterThan(0);
    const durations = await page.evaluate(() => (window as unknown as { skFetchDurations: number[] }).skFetchDurations);
    expect(durations.length, "the fast refetch must actually issue its API request").toBeGreaterThan(0);
    for (const duration of durations) expect(duration, "fast fixture elapsed time in the browser").toBeLessThan(200);
  };
}
