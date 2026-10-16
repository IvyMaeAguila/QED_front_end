import { test, expect, type Page } from '@playwright/test';
import { mockGradeSheets, sheetEndpoints } from './fixtures/grade-sheets-query';
// MOCKED APIs, real hook/QueryClient/AuthProvider under React StrictMode.
const click = (p: Page, n: string) => p.getByRole('button', { name: n, exact: true }).click();
const reader = (p: Page) => p.getByTestId('reader').first();
const toggle = (p: Page) => click(p, 'Toggle reader');
const start = (p: Page) => click(p, 'Toggle preview');
async function fixture(p: Page, holdAuth = false) {
  let release = () => {};
  const gate = holdAuth ? new Promise<void>(r => { release = r; }) : Promise.resolve();
  await p.route('**/api/**', async r => {
    const path = new URL(r.request().url()).pathname;
    if (path === '/api/auth/me') { await gate; return r.fulfill({ json: { user: { id: '1', role: 'PRINCIPAL', user_name: 'fixture' } } }); }
    return r.fulfill({ json: path.includes('user-profile') ? { id: '1', role: 'PRINCIPAL', userName: 'fixture' } : { success: true } });
  });
  const f = await mockGradeSheets(p);
  await p.goto('/tests/grade-sheets-query.html');
  await expect(p.getByTestId('auth')).toHaveText(holdAuth ? 'pending' : '1');
  return { ...f, releaseAuth: release };
}
async function loaded(p: Page, scope = 'G1 S11 T1 Y1') {
  await expect(reader(p).getByTestId('section')).toContainText(scope);
  await expect(reader(p).getByTestId('loading')).toHaveText('false');
  await expect(reader(p).getByTestId('data')).toContainText('Fixture');
}
const cache = (p: Page) => p.evaluate(async () => {
  // @ts-expect-error Vite browser import
  const { queryClient } = await import('/src/shared/query/queryClient.ts');
  return queryClient.getQueryCache().getAll().map((q: { queryKey: unknown[]; state: { data: unknown; fetchStatus: string } }) => ({ key: q.queryKey, hasData: q.state.data !== undefined, fetching: q.state.fetchStatus }));
});
async function idle(p: Page) { await expect.poll(async () => (await cache(p)).every((q: { fetching: string }) => q.fetching === 'idle')).toBe(true); }

test('auth readiness, preview and independent observers gate and deduplicate all three reads', async ({ page }) => {
  const f = await fixture(page, true); await start(page); expect(f.state.year.calls).toBe(0); f.releaseAuth(); f.hold('periods');
  await expect.poll(() => f.state.periods.calls).toBe(1); expect(f.state.sheet.calls).toBe(0); await click(page, 'Second reader');
  await expect(reader(page).getByTestId('loading')).toHaveText('true'); f.release('periods'); await loaded(page);
  await f.settled({ year: 1, periods: 1, sheet: 1 }); await start(page); await expect(reader(page).getByTestId('data')).toHaveText('[]');
});
test('server-selected default, explicit period and unassigned grade keep original request arguments', async ({ page }) => {
  const f = await fixture(page); f.setDefault(2); await click(page, 'Default term'); await start(page); await loaded(page, 'G1 S11 T2 Y1');
  await click(page, 'Term 1'); await loaded(page); expect(f.state.periods.calls).toBe(1);
  await click(page, 'Unassigned grade'); await loaded(page, 'G2 Sall T1 Y1');
  expect(f.requests.filter(r => r.endpoint === 'sheet').map(r => [r.grade, r.section, r.period])).toEqual([['1','11','2'], ['1','11','1'], ['2',null,'1']]);
});
test('empty period list with null server default settles without a grade-sheet request', async ({ page }) => {
  const f = await fixture(page); f.setNoPeriods(); await click(page, 'Default term'); await start(page);
  await expect(reader(page).getByTestId('loading')).toHaveText('false'); await expect(reader(page).getByTestId('periods')).toHaveText('[]');
  expect(f.state.sheet.calls).toBe(0); await expect(reader(page).getByTestId('error')).toBeEmpty();
});
for (const kind of ['empty', 'null'] as const) test(`${kind} sheet is successful cache data, including offline`, async ({ page }) => {
  const f = await fixture(page); if (kind === 'empty') f.setEmpty(); else f.setNull(); await start(page);
  await expect(reader(page).getByTestId('loading')).toHaveText('false'); await idle(page);
  await expect(reader(page).getByTestId('data')).toHaveText('[]'); await expect(reader(page).getByTestId('not-found')).toHaveText(String(kind === 'null'));
  await toggle(page); await toggle(page); await idle(page); expect(f.state.sheet.calls).toBe(1);
  await page.context().setOffline(true); await expect(reader(page).getByTestId('cached-offline')).toHaveText('true'); await expect(reader(page).getByTestId('loading')).toHaveText('false');
  await page.context().setOffline(false); await expect(reader(page).getByTestId('error')).toBeEmpty(); expect(f.state.sheet.calls).toBe(1);
});
test('fresh term/navigation cache, thirty-second stale context and five-minute GC', async ({ page }) => {
  const f = await fixture(page); await page.clock.install(); await start(page); await loaded(page); await idle(page);
  await click(page, 'Term 2'); await loaded(page, 'G1 S11 T2 Y1'); await idle(page);
  await click(page, 'Term 1'); await loaded(page); await toggle(page); await toggle(page); await loaded(page);
  await f.settled({ year: 1, periods: 1, sheet: 2 }); await idle(page);
  await toggle(page); await page.clock.fastForward(31000); await toggle(page); await loaded(page); await f.settled({ year: 2, periods: 2, sheet: 3 }); await idle(page);
  await toggle(page); await page.clock.fastForward(301000); expect((await cache(page)).filter((q: { hasData: boolean }) => q.hasData)).toEqual([]);
});
for (const action of ['remount', 'term', 'retry']) test(`year rollover on ${action} resolves context before new scoped sheet`, async ({ page }) => {
  const f = await fixture(page); await page.clock.install(); await start(page); await loaded(page); await idle(page);
  if (action === 'remount') await toggle(page);
  await page.clock.fastForward(31000); f.setYear(2); f.hold('year');
  if (action === 'remount') await toggle(page); else await click(page, action === 'term' ? 'Term 2' : 'Retry');
  await expect.poll(() => f.state.year.calls).toBe(2); expect(f.state.sheet.calls).toBe(1); expect(f.state.periods.calls).toBe(1);
  f.release('year'); await loaded(page, `G1 S11 T${action === 'term' ? 2 : 1} Y2`); await idle(page);
  await f.settled({ year: 2, periods: 2, sheet: 2 });
  const keys = (await cache(page)).filter((q: { hasData: boolean; key: unknown[] }) => q.hasData && q.key[6] === 'sheet').map((q: { key: unknown[] }) => q.key);
  expect(keys.map((k: unknown[]) => k.slice(7))).toEqual([[1,'1','11','1'],[2,'1','11',action === 'term' ? '2' : '1']]);
});
test('rapid term switch cancels obsolete request; fresh previous term avoids another request', async ({ page }) => {
  const f = await fixture(page); await start(page); await loaded(page); await idle(page); f.hold('sheet');
  await click(page, 'Term 2'); await expect.poll(() => f.state.sheet.calls).toBe(2); await click(page, 'Term 1'); await loaded(page);
  await expect.poll(() => f.ledger.snapshot().filter(e => e.path === '/api/gradesheets/' && e.terminal === 'aborted').length).toBe(1);
  f.release('sheet'); await idle(page); expect(f.state.sheet.calls).toBe(2); await loaded(page);
});
test('rapid section change never borrows another section, then grade changes use distinct keys', async ({ page }) => {
  const f = await fixture(page); await start(page); await loaded(page); f.hold('periods');
  await click(page, 'Other section'); await expect.poll(() => f.state.periods.calls).toBe(2); await expect(reader(page).getByTestId('data')).toHaveText('[]');
  await click(page, 'Unassigned grade'); f.release('periods'); await loaded(page, 'G2 Sall T1 Y1');
  expect(f.requests.filter(r => r.endpoint === 'sheet').map(r => r.section)).toEqual(['11',null]);
});
for (const endpoint of sheetEndpoints) for (const status of [500, 401, 403]) test(`${endpoint} ${status} independently stops loading and preserves auth/error semantics`, async ({ page }) => {
  const f = await fixture(page); f.state[endpoint].status = status; await start(page);
  if (status === 401) { await expect(page.getByTestId('auth')).toHaveText('signed-out'); expect((await cache(page)).filter((q: { hasData: boolean }) => q.hasData)).toEqual([]); }
  else {
    await expect(reader(page).getByTestId('error')).not.toBeEmpty(); await expect(reader(page).getByTestId('loading')).toHaveText('false');
    await expect(page.getByTestId('auth')).toHaveText('1'); expect(f.state[endpoint].calls).toBe(1);
    if (status === 403) await expect(reader(page).getByTestId('data')).toHaveText('[]');
    f.state[endpoint].status = 200; await click(page, 'Retry'); await loaded(page); await idle(page); expect(f.state[endpoint].calls).toBe(2);
  }
});
for (const endpoint of sheetEndpoints) test(`${endpoint} malformed 403 hides previously cached private data and never logs out`, async ({ page }) => {
  await fixture(page); await start(page); await loaded(page); await idle(page);
  await page.route(endpoint === 'year' ? '**/api/academic-year/getAcademicYear' : endpoint === 'periods' ? '**/api/gradesheets/grading-period?**' : '**/api/gradesheets/?**', r => r.fulfill({ status: 403, contentType: 'text/html', body: 'Forbidden' }));
  await click(page, 'Retry'); await expect(reader(page).getByTestId('error')).not.toBeEmpty(); await expect(reader(page).getByTestId('data')).toHaveText('[]');
  await page.context().setOffline(true); await expect(reader(page).getByTestId('data')).toHaveText('[]'); await expect(page.getByTestId('auth')).toHaveText('1');
});
test('HTTP 404 is an error, distinct from successful null sheet', async ({ page }) => {
  const f = await fixture(page); f.state.sheet.status = 404; await start(page); await expect(reader(page).getByTestId('error')).toContainText('404');
  await expect(reader(page).getByTestId('not-found')).toHaveText('false'); f.state.sheet.status = 200; await click(page, 'Retry'); await loaded(page);
});
for (const cached of [false,true]) test(`offline ${cached ? 'cached' : 'initial'} settles and reconnect recovers once without queued Retry`, async ({ page }) => {
  const f = await fixture(page); if (cached) { await start(page); await loaded(page); await idle(page); }
  await page.context().setOffline(true); if (!cached) await start(page);
  await expect(reader(page).getByTestId('error')).toContainText('offline'); await expect(reader(page).getByTestId('loading')).toHaveText('false');
  if (cached) await loaded(page);
  for (let i=0;i<4;i++) await click(page,'Retry'); expect(f.state.sheet.calls).toBe(cached ? 1 : 0);
  await page.context().setOffline(false); await loaded(page); await f.settled({ year:1, periods:1, sheet:1 });
});
test('uncached offline term never displays a previous-term placeholder as current data', async ({ page }) => {
  const f = await fixture(page); await start(page); await loaded(page); await idle(page); await page.context().setOffline(true); await click(page,'Term 2');
  await expect(reader(page).getByTestId('error')).toContainText('offline'); await expect(reader(page).getByTestId('data')).toHaveText('[]'); await expect(reader(page).getByTestId('cached-offline')).toHaveText('false');
  await page.context().setOffline(false); await loaded(page,'G1 S11 T2 Y1'); expect(f.state.sheet.calls).toBe(2);
});
test('stale cached offline remount retains matching sheet then refreshes context exactly once', async ({ page }) => {
  const f = await fixture(page); await page.clock.install(); await start(page); await loaded(page); await idle(page); await toggle(page); await page.clock.fastForward(31000); await page.context().setOffline(true); await toggle(page);
  await expect(reader(page).getByTestId('cached-offline')).toHaveText('true'); await loaded(page); await page.context().setOffline(false); await loaded(page); await f.settled({year:2,periods:2,sheet:2});
});
test('bounded explicit retries revalidate all context; pending Retry cannot follow an obsolete term', async ({ page }) => {
  const f = await fixture(page); await start(page); await loaded(page); await idle(page); f.hold('year');
  for(let i=0;i<4;i++) await click(page,'Retry'); await expect.poll(()=>f.state.year.calls).toBe(2); await click(page,'Term 2'); f.release('year'); await loaded(page,'G1 S11 T2 Y1'); await idle(page);
  await f.settled({year:2,periods:1,sheet:2});
});
for(const endpoint of sheetEndpoints) test(`${endpoint} pending transport consumes AbortSignal on unmount`,async({page})=>{
  const f=await fixture(page);f.hold(endpoint);await start(page);await expect.poll(()=>f.state[endpoint].calls).toBe(1);await toggle(page);
  await expect.poll(()=>f.ledger.snapshot().some(e=>e.terminal==='aborted')).toBe(true);f.release(endpoint);await toggle(page);await loaded(page);
});
for(const endpoint of sheetEndpoints)for(const status of [200,401])for(const action of ['switch','logout-login'])test(`pending ${endpoint} ${status} cannot affect newer ${action} session`,async({page})=>{
  const f=await fixture(page);f.state[endpoint].status=status;f.hold(endpoint);await start(page);await expect.poll(()=>f.state[endpoint].calls).toBe(1);
  f.state[endpoint].status=200;f.setMarker('New identity');
  if(action==='switch')await click(page,'Switch account');else{await click(page,'Logout');await click(page,'Log out');await expect(page.getByTestId('auth')).toHaveText('signed-out');await click(page,'Login');}
  await expect(reader(page).getByTestId('data')).toHaveText('[]');f.release(endpoint);await loaded(page);await expect(reader(page).getByTestId('data')).toContainText('New identity');await expect(page.getByTestId('auth')).toHaveText(action==='switch'?'2':'1');
  expect((await cache(page)).filter((q:{hasData:boolean})=>q.hasData).every((q:{key:unknown[]})=>q.key[3]===(action==='switch'?'2':'1'))).toBe(true);
});
test('logout clears private caches and same-account login uses a different generation',async({page})=>{
  const f=await fixture(page);await start(page);await loaded(page);const generation=(await cache(page))[0].key[1];await click(page,'Logout');await click(page,'Log out');
  await expect(reader(page).getByTestId('data')).toHaveText('[]');expect((await cache(page)).filter((q:{hasData:boolean})=>q.hasData)).toEqual([]);await click(page,'Login');await loaded(page);expect(f.state.sheet.calls).toBe(2);
  expect((await cache(page)).filter((q:{hasData:boolean})=>q.hasData).every((q:{key:unknown[]})=>q.key[1]!==generation)).toBe(true);
});
for(const role of ['ADMIN','TEACHER','PARENT'])test(`${role} switch cannot expose or fetch Principal sheet data`,async({page})=>{
  const f=await fixture(page);await start(page);await loaded(page);await click(page,`Switch ${role}`);await expect(reader(page).getByTestId('data')).toHaveText('[]');expect(f.state.sheet.calls).toBe(1);
});

test('all failing endpoints recover in dependency order with bounded explicit attempts',async({page})=>{
 const f=await fixture(page);sheetEndpoints.forEach(e=>{f.state[e].status=500;});await start(page);
 await expect(reader(page).getByTestId('error')).toContainText('academic year');expect(f.state.periods.calls).toBe(0);expect(f.state.sheet.calls).toBe(0);
 f.state.year.status=200;await click(page,'Retry');await expect(reader(page).getByTestId('error')).toContainText('periods 500');expect(f.state.sheet.calls).toBe(0);
 f.state.periods.status=200;await click(page,'Retry');await expect(reader(page).getByTestId('error')).toContainText('sheet 500');
 f.state.sheet.status=200;await click(page,'Retry');await loaded(page);await idle(page);await f.settled({year:4,periods:3,sheet:2});
});

test('rechecking a fresh shared year after a stale term change does not force extra period or sheet reads',async({page})=>{
 const f=await fixture(page);await page.clock.install();await start(page);await loaded(page);await idle(page);await page.clock.fastForward(31000);await click(page,'Term 2');await loaded(page,'G1 S11 T2 Y1');await idle(page);await f.settled({year:2,periods:2,sheet:2});
 f.hold('year');await page.evaluate(()=>{
  // @ts-expect-error Vite browser import
  void import('/src/shared/query/queryClient.ts').then(({queryClient})=>queryClient.refetchQueries({predicate:(q:{queryKey:unknown[]})=>q.queryKey.includes('roster-year')}));
 });await expect.poll(()=>f.state.year.calls).toBe(3);await expect(reader(page).getByTestId('loading')).toHaveText('true');f.release('year');await loaded(page,'G1 S11 T2 Y1');await idle(page);await f.settled({year:3,periods:2,sheet:2});
});

for(const endpoint of sheetEndpoints)test(`populated cache plus pending ${endpoint} 401 cannot expose old data after switching`,async({page})=>{
 const f=await fixture(page);await start(page);await loaded(page);await idle(page);f.hold(endpoint);f.state[endpoint].status=401;await click(page,'Retry');await expect.poll(()=>f.state[endpoint].calls).toBe(2);
 f.state[endpoint].status=200;f.setMarker('New identity');await click(page,'Switch account');await expect(reader(page).getByTestId('data')).toHaveText('[]');f.release(endpoint);await loaded(page);await expect(reader(page).getByTestId('data')).toContainText('New identity');await expect(page.getByTestId('auth')).toHaveText('2');
});

test('ordinary cached period failure followed by offline retains data with connection alert',async({page})=>{
 const f=await fixture(page);await start(page);await loaded(page);await idle(page);f.state.periods.status=500;await click(page,'Retry');await expect(reader(page).getByTestId('error')).toContainText('periods 500');await page.context().setOffline(true);
 await expect(reader(page).getByTestId('error')).toContainText('offline');await expect(reader(page).getByTestId('cached-offline')).toHaveText('true');await loaded(page);f.state.periods.status=200;await page.context().setOffline(false);await click(page,'Retry');await loaded(page);await expect(reader(page).getByTestId('error')).toBeEmpty();
});
