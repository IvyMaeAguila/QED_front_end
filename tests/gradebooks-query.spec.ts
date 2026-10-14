import { test, expect, type Page } from '@playwright/test';
import { mockGradebooks, gradebookEndpoints } from './fixtures/gradebooks-query';
// MOCKED API; actual hooks, singleton QueryClient, AuthProvider and cancellation.
const click = (p: Page, n: string) => p.getByRole('button', { name: n, exact: true }).click();
const reader = (p: Page) => p.getByTestId('reader').first();
async function fixture(p: Page, holdAuth = false) { let release = () => { }; const gate = holdAuth ? new Promise<void>(r => { release = r; }) : Promise.resolve(); await p.route('**/api/**', async (r) => { const path = new URL(r.request().url()).pathname; if (path === '/api/auth/me') {
    await gate;
    return r.fulfill({ json: { user: { id: '1', role: 'PRINCIPAL', user_name: 'fixture' } } });
} return r.fulfill({ json: path.includes('user-profile') ? { id: '1', role: 'PRINCIPAL', userName: 'fixture' } : { success: true } }); }); const f = await mockGradebooks(p); await p.goto('/tests/gradebooks-query.html'); await expect(p.getByTestId('auth')).toHaveText(holdAuth ? 'pending' : '1'); return { ...f, releaseAuth: release }; }
const start = (p: Page) => click(p, 'Toggle preview');
const toggle = (p: Page) => click(p, 'Toggle reader');
async function loaded(p: Page, marker = 'Maroon') { await expect(reader(p).getByTestId('data')).toContainText(marker); await expect(reader(p).getByTestId('loading')).toHaveText('false'); }
const keys = (p: Page) => p.evaluate(async () => {
    // @ts-expect-error Vite browser import
    const { queryClient } = await import('/src/shared/query/queryClient.ts');
    return queryClient.getQueryCache().getAll().filter((q: {
        state: {
            data: unknown;
        };
    }) => q.state.data !== undefined).map((q: {
        queryKey: unknown[];
    }) => q.queryKey);
});
test('auth readiness and preview suppress private requests and cached values', async ({ page }) => { const f = await fixture(page, true); await start(page); expect(f.state.year.calls).toBe(0); f.releaseAuth(); await loaded(page); await start(page); await expect(reader(page).getByTestId('data')).toHaveText('[]'); expect(f.state.summaries.calls).toBe(1); });
test('initial loading, independent observers and navigation deduplicate and reuse fresh cache', async ({ page }) => { const f = await fixture(page); f.hold('summaries'); await start(page); await expect(reader(page).getByTestId('loading')).toHaveText('true'); await click(page, 'Second reader'); f.release('summaries'); await loaded(page); await expect(page.getByTestId('reader')).toHaveCount(2); await toggle(page); await toggle(page); await loaded(page); gradebookEndpoints.forEach(e => expect(f.state[e].calls).toBe(1)); });
test('empty overview is a cacheable successful result', async ({ page }) => { const f = await fixture(page); f.setEmpty(); await start(page); await expect(reader(page).getByTestId('loading')).toHaveText('false'); await expect(reader(page).getByTestId('data')).toHaveText('[]'); await expect(reader(page).getByTestId('error')).toBeEmpty(); await toggle(page); await toggle(page); expect(f.state.summaries.calls).toBe(1); });
for (const endpoint of gradebookEndpoints)
    for (const status of [500, 403, 401])
        test(`${endpoint} ${status} independently settles and preserves authentication semantics`, async ({ page }) => { const f = await fixture(page); f.state[endpoint].status = status; await start(page); if (status === 401) {
            await expect(page.getByTestId('auth')).toHaveText('signed-out');
            expect(await keys(page)).toEqual([]);
        }
        else {
            await expect(reader(page).getByTestId('error')).not.toBeEmpty();
            await expect(reader(page).getByTestId('loading')).toHaveText('false');
            await expect(page.getByTestId('auth')).toHaveText('1');
            if (status === 403)
                await expect(reader(page).getByTestId('data')).toHaveText('[]');
            f.state[endpoint].status = 200;
            await click(page, 'Retry');
            await loaded(page);
            expect(f.state[endpoint].calls).toBe(2);
        } });
for (const endpoint of gradebookEndpoints)
    test(`${endpoint} malformed 403 hides previously cached private records even offline`, async ({ page }) => { await fixture(page); await start(page); await loaded(page); await page.route(endpoint === 'year' ? '**/api/academic-year/getAcademicYear' : '**/api/gradesheets/section-grade', r => r.fulfill({ status: 403, contentType: 'text/html', body: 'Forbidden' })); await click(page, 'Retry'); await expect(reader(page).getByTestId('error')).not.toBeEmpty(); await expect(reader(page).getByTestId('data')).toHaveText('[]'); await page.context().setOffline(true); await expect(reader(page).getByTestId('data')).toHaveText('[]'); await expect(page.getByTestId('auth')).toHaveText('1'); });
test('thirty-second freshness, five-minute GC and stale navigation refetch exactly once', async ({ page }) => { const f = await fixture(page); await page.clock.install(); await start(page); await loaded(page); await toggle(page); await toggle(page); await loaded(page); expect(f.state.summaries.calls).toBe(1); await toggle(page); await page.clock.fastForward(31000); await toggle(page); await expect.poll(() => f.state.summaries.calls).toBe(2); await loaded(page); expect(f.state.year.calls).toBe(2); await toggle(page); await page.clock.fastForward(301000); expect(await keys(page)).toEqual([]); });
test('changed school year resolves before summaries and uses a distinct year key', async ({ page }) => { const f = await fixture(page); await page.clock.install(); await start(page); await loaded(page); await toggle(page); await page.clock.fastForward(31000); f.setYear(2); f.setMarker('New year'); f.hold('year'); await toggle(page); await expect(reader(page).getByTestId('loading')).toHaveText('true'); expect(f.state.summaries.calls).toBe(1); f.release('year'); await loaded(page, 'New year'); await expect(reader(page).getByTestId('year')).toHaveText('Year 2'); expect((await keys(page)).filter((k: unknown[]) => k.includes('gradebooks')).map((k: unknown[]) => k.at(-1))).toEqual([1, 2]); });
test('explicit Retry resolves year first and never refreshes an old year after rollover', async ({ page }) => { const f = await fixture(page); await start(page); await loaded(page); f.setYear(2); f.setMarker('New year'); await click(page, 'Retry'); await loaded(page, 'New year'); expect(f.state.summaries.calls).toBe(2); await expect(reader(page).getByTestId('year')).toHaveText('Year 2'); });
test('repeated Retry while pending deduplicates and ordinary errors clear during recovery', async ({ page }) => { const f = await fixture(page); f.state.summaries.status = 500; await start(page); await expect(reader(page).getByTestId('error')).not.toBeEmpty(); expect(f.state.summaries.calls).toBe(1); f.state.summaries.status = 200; f.hold('year'); for (let i = 0; i < 4; i++)
    await click(page, 'Retry'); await expect(reader(page).getByTestId('loading')).toHaveText('true'); await expect(reader(page).getByTestId('error')).toBeEmpty(); expect(f.state.year.calls).toBe(2); f.release('year'); await loaded(page); expect(f.state.summaries.calls).toBe(2); });
for (const cached of [false, true])
    test(`offline ${cached ? 'cached' : 'initial'} settles, ignores repeated retries and recovers once`, async ({ page }) => { const f = await fixture(page); if (cached) {
        await start(page);
        await loaded(page);
    } await page.context().setOffline(true); if (!cached)
        await start(page); await expect(reader(page).getByTestId('error')).toContainText('offline'); await expect(reader(page).getByTestId('loading')).toHaveText('false'); if (cached)
        await loaded(page); for (let i = 0; i < 3; i++)
        await click(page, 'Retry'); expect(f.state.summaries.calls).toBe(cached ? 1 : 0); await page.context().setOffline(false); await loaded(page); gradebookEndpoints.forEach(e => expect(f.state[e].calls).toBe(1)); });
test('offline empty cache stays successful and visible on reconnect', async ({ page }) => { const f = await fixture(page); f.setEmpty(); await start(page); await expect(reader(page).getByTestId('loading')).toHaveText('false'); await page.context().setOffline(true); await expect(reader(page).getByTestId('data')).toHaveText('[]'); await expect(reader(page).getByTestId('error')).toContainText('offline'); await page.context().setOffline(false); await expect(reader(page).getByTestId('error')).toBeEmpty(); expect(f.state.summaries.calls).toBe(1); });
for (const endpoint of gradebookEndpoints)
    test(`${endpoint} AbortSignal cancels pending work on unmount`, async ({ page }) => { const f = await fixture(page); let aborted = 0; page.on('requestfailed', r => { if (r.url().includes(endpoint === 'year' ? 'getAcademicYear' : 'section-grade'))
        aborted++; }); f.hold(endpoint); await start(page); await expect.poll(() => f.state[endpoint].calls).toBe(1); await toggle(page); await expect.poll(() => aborted).toBeGreaterThan(0); f.release(endpoint); await toggle(page); await loaded(page); });
for (const endpoint of gradebookEndpoints)
    for (const status of [200, 401])
        test(`pending ${endpoint} ${status} cannot overwrite or expire switched account`, async ({ page }) => { const f = await fixture(page); f.state[endpoint].status = status; f.hold(endpoint); await start(page); await expect.poll(() => f.state[endpoint].calls).toBe(1); f.state[endpoint].status = 200; f.setMarker('Second account'); await click(page, 'Switch account'); await expect(page.getByTestId('auth')).toHaveText('2'); f.release(endpoint); await loaded(page, 'Second account'); await expect(page.getByTestId('auth')).toHaveText('2'); expect((await keys(page)).every((k: unknown[]) => k[3] === '2')).toBe(true); });
test('logout clears cache and same-account login starts a new generation', async ({ page }) => { const f = await fixture(page); await start(page); await loaded(page); const previous = (await keys(page))[0][1]; await click(page, 'Logout'); await click(page, 'Log out'); await expect(reader(page).getByTestId('data')).toHaveText('[]'); expect(await keys(page)).toEqual([]); await click(page, 'Login'); await loaded(page); expect(f.state.summaries.calls).toBe(2); expect((await keys(page)).every((k: unknown[]) => k[1] !== previous)).toBe(true); });
for (const role of ['ADMIN', 'TEACHER', 'PARENT'])
    test(`${role} cannot enable Principal gradebook requests`, async ({ page }) => { const f = await fixture(page); await click(page, `Switch ${role}`); await start(page); await expect(reader(page).getByTestId('data')).toHaveText('[]'); expect(f.state.year.calls).toBe(0); expect(f.state.summaries.calls).toBe(0); });
for (const endpoint of gradebookEndpoints)
    for (const status of [200, 401])
        test(`pending ${endpoint} ${status} cannot overwrite or expire logout/login generation`, async ({ page }) => { const f = await fixture(page); f.state[endpoint].status = status; f.hold(endpoint); await start(page); await expect.poll(() => f.state[endpoint].calls).toBe(1); f.state[endpoint].status = 200; f.setMarker('New login'); await click(page, 'Logout'); await click(page, 'Log out'); await expect(page.getByTestId('auth')).toHaveText('signed-out'); expect(await keys(page)).toEqual([]); await click(page, 'Login'); f.release(endpoint); await loaded(page, 'New login'); await expect(page.getByTestId('auth')).toHaveText('1'); });
