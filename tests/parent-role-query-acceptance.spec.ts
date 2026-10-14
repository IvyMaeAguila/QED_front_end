import { test, expect, type Page } from '@playwright/test';
import { mockParent, parentPaths, type ParentResource } from './fixtures/parent';
import { waitForDataRoute } from './fixtures/routeReady';
import { waitForQueryReader, invalidateReaderForTest, getQueryCollectionSize } from './fixtures/queryLifecycle';
import fs from 'node:fs';
const region=(page:Page,name:string)=>page.locator(`[data-sk-region="${name}"]`);
async function open(page:Page,tab='studentProfile'){await page.goto('/parent/students/101?tab='+tab);await waitForDataRoute(page);}
async function settled(page:Page,name:string){await expect(region(page,name)).toHaveAttribute('data-sk-phase','settled');}
async function tab(page:Page,name:string){await page.getByRole('button',{name,exact:true}).click();}
async function logout(page:Page){await page.getByRole('button',{name:'Log Out',exact:true}).click();await page.getByRole('dialog',{name:'Confirm logout'}).getByRole('button',{name:'Log out',exact:true}).click();await expect(page).toHaveURL(/\/login/);}
async function login(page:Page){await page.getByPlaceholder('e.g. TC_maria.delacruz').fill('synthetic_parent_two');await page.getByPlaceholder('••••••••').fill('synthetic-fixture-only');await page.getByRole('button',{name:'Login',exact:true}).click();await waitForDataRoute(page);}
const boundaries=[
  ['studentProfile','Student Profile','parent-student-profile','profile',300_000],
  ['academic','Academic','parent-intervention','flags',0],
  ['holistic','Holistic','parent-weekly-holistic','weekly',30_000],
  ['progressReport','Progress Report','parent-progress-report','academic',30_000],
] as const;
for(const [route,label,name,resource,stale]of boundaries){
  if(stale>0)test(`mocked Parent ${label} fresh cache survives tab navigation`,async({page})=>{
    const f=await mockParent(page);await open(page,route);await settled(page,name);await f.settled();
    const before=f.resources[resource].calls;
    await tab(page,'Academic');await settled(page,'parent-intervention');await tab(page,label);await settled(page,name);
    expect(f.resources[resource].calls).toBe(before);expect(f.ledger.snapshot().filter(r=>r.path===parentPaths[resource]&&r.terminal==='finished'&&r.status===200)).toHaveLength(1);
  });
  test(`mocked Parent ${label} stale reader refreshes exactly once`,async({page},testInfo)=>{
    const f=await mockParent(page);await page.clock.install();await open(page,route);await settled(page,name);await f.settled();
    await tab(page,route==='academic'?'Student Profile':'Academic');await expect(page.locator('[data-sk-primitive]')).toHaveCount(0);
    const before=f.resources[resource].calls,mark=f.ledger.mark();await page.clock.fastForward(stale+1);await page.clock.resume();
    await tab(page,label);await settled(page,name);await f.settled();const evidence=testInfo.outputPath('sanitized-request-lifecycle.json');fs.writeFileSync(evidence,JSON.stringify(f.ledger.snapshot(),null,2));await testInfo.attach('sanitized-request-lifecycle',{path:evidence,contentType:'application/json'});
    const batch=f.ledger.snapshot(mark).filter(r=>r.path===parentPaths[resource]);expect(batch.filter(r=>r.terminal==='finished'&&r.status===200)).toHaveLength(1);expect(batch.every(r=>r.terminal==='aborted'||r.terminal==='finished'&&r.status===200)).toBe(true);
    expect(f.resources[resource].calls).toBe(before+1+batch.filter(r=>r.terminal==='aborted'&&r.intercepted).length);
    expect(f.ledger.snapshot().filter(r=>r.path===parentPaths[resource]&&r.terminal==='finished'&&r.status===200)).toHaveLength(2);
  });
}
test('mocked Parent auth readiness prevents private API requests',async({page})=>{
  const f=await mockParent(page,false,true);await page.goto('/parent/students/101?tab=studentProfile');
  await expect(page.locator('.qed-account-ui')).toHaveCount(0);expect(f.resources.children.calls).toBe(0);expect(f.resources.profile.calls).toBe(0);
  f.releaseAuth();await waitForDataRoute(page);await settled(page,'parent-student-profile');expect(f.resources.profile.calls).toBeGreaterThan(0);
});
test('mocked Parent multi-child navigation hides previous profile while next child is pending',async({page})=>{
  const f=await mockParent(page);await open(page);await settled(page,'parent-student-profile');await expect(page.getByText('SYNTHETIC-101',{exact:true})).toBeVisible();
  f.hold('profile');await page.getByRole('link',{name:'Enrolled Children',exact:true}).click();await waitForDataRoute(page);
  await page.getByRole('button',{name:/Synthetic Child102/}).click();await waitForDataRoute(page);await tab(page,'Student Profile');
  await expect(page.getByText('SYNTHETIC-101',{exact:true})).toHaveCount(0);f.release('profile');await settled(page,'parent-student-profile');
  await expect(page.getByText('SYNTHETIC-102',{exact:true})).toBeVisible();
});
test('mocked Parent rapid child navigation cancels pending profile requests',async({page})=>{
  const f=await mockParent(page);f.hold('profile');await open(page);await expect.poll(()=>f.resources.profile.calls).toBeGreaterThan(0);
  await page.getByRole('link',{name:'Enrolled Children',exact:true}).click();await waitForDataRoute(page);
  await expect.poll(()=>f.ledger.snapshot().filter(r=>r.path===parentPaths.profile&&r.terminal==='aborted').length).toBeGreaterThan(0);
  f.release('profile');await page.getByRole('button',{name:/Synthetic Child102/}).click();await waitForDataRoute(page);await tab(page,'Student Profile');
  await settled(page,'parent-student-profile');await expect(page.getByText('SYNTHETIC-101',{exact:true})).toHaveCount(0);await expect(page.getByText('SYNTHETIC-102',{exact:true})).toBeVisible();
});
for(const resource of ['academic','visibility','holistic','attendance'] as ParentResource[])test(`mocked Parent independent ${resource}401 expires even when academic/peer500 completes first`,async({page})=>{
  const f=await mockParent(page);const peer:ParentResource=resource==='academic'?'visibility':'academic';f.resources[peer].status=500;f.resources[resource].status=401;f.hold(resource);
  await open(page,'progressReport');await expect.poll(()=>f.ledger.snapshot().filter(r=>r.path===parentPaths[peer]&&r.status===500&&r.terminal==='finished').length).toBe(1);
  f.release(resource);await expect(page).toHaveURL(/\/login/);await expect(page.getByText('Mathematics 101',{exact:true})).toHaveCount(0);
});
for(const resource of ['holistic','attendance','visibility'] as ParentResource[])test(`mocked Parent partial ${resource}500 retains successful academic section`,async({page})=>{
  const f=await mockParent(page);f.resources[resource].status=500;await open(page,'progressReport');await settled(page,'parent-progress-report');
  if(resource==='visibility'){await expect(page.getByText('This progress report is not available yet.',{exact:true})).toBeVisible();}
  else {await expect(page.getByText('Mathematics 101',{exact:true}).first()).toBeVisible();await expect(region(page,'parent-report-average-ring')).toContainText('90%');}
});
test('mocked Parent complete progress failure and one explicit recovery keep request counts bounded',async({page})=>{
  const f=await mockParent(page);for(const r of ['academic','visibility','holistic','attendance'] as ParentResource[])f.resources[r].status=500;
  await open(page,'progressReport');await expect(region(page,'parent-progress-report').getByRole('alert')).toContainText('Synthetic academic 500');
  for(const r of ['academic','visibility','holistic','attendance'] as ParentResource[])f.resources[r].status=200;
  await region(page,'parent-progress-report').getByRole('button',{name:'Retry',exact:true}).click();await settled(page,'parent-progress-report');await f.settled();
  for(const r of ['academic','visibility','holistic','attendance'] as ParentResource[])expect(f.ledger.snapshot().filter(e=>e.path===parentPaths[r]&&e.status===200&&e.terminal==='finished')).toHaveLength(1);
});
test('mocked cached Parent403 hides private profile through Retry and offline navigation',async({page,context})=>{
  const f=await mockParent(page);await open(page);await settled(page,'parent-student-profile');await f.settled();
  await tab(page,'Academic');await settled(page,'parent-intervention');f.resources.profile.status=403;await invalidateReaderForTest(page,'PARENT',['profile']);await tab(page,'Student Profile');
  await expect(region(page,'parent-student-profile').getByRole('alert')).toContainText('Synthetic profile 403');await expect(page.getByText('SYNTHETIC-101',{exact:true})).toHaveCount(0);
  f.hold('profile');await region(page,'parent-student-profile').getByRole('button',{name:'Retry',exact:true}).click();await expect(page.getByText('SYNTHETIC-101',{exact:true})).toHaveCount(0);f.release('profile');
  await expect(region(page,'parent-student-profile').getByRole('alert')).toBeVisible();await tab(page,'Academic');await settled(page,'parent-intervention');await f.settled();
  await context.setOffline(true);await tab(page,'Student Profile');await expect(page.getByText('SYNTHETIC-101',{exact:true})).toHaveCount(0);await expect(page).toHaveURL(/\/parent\/students\/101/);
});
test('mocked Parent cached offline profile remains visible without duplicate GET and recovers',async({page,context})=>{
  const f=await mockParent(page);await open(page);await settled(page,'parent-student-profile');await f.settled();const before=f.resources.profile.calls;
  await tab(page,'Academic');await settled(page,'parent-intervention');await f.settled();await context.setOffline(true);await tab(page,'Student Profile');
  await settled(page,'parent-student-profile');await expect(page.getByText('SYNTHETIC-101',{exact:true})).toBeVisible();await expect(page.getByRole('alert').first()).toContainText("You're offline");expect(f.resources.profile.calls).toBe(before);
  await context.setOffline(false);await expect(page.getByRole('alert')).toHaveCount(0);expect(f.resources.profile.calls).toBe(before);
});
test('mocked Parent child403 removes sibling cached grades before navigation can reveal them',async({page})=>{
  const f=await mockParent(page);await open(page,'progressReport');await settled(page,'parent-progress-report');await expect(page.getByText('Mathematics 101',{exact:true}).first()).toBeVisible();
  f.resources.profile.status=403;await tab(page,'Student Profile');await expect(region(page,'parent-student-profile').getByRole('alert')).toBeVisible();f.resources.academic.status=403;
  f.hold('academic');await tab(page,'Progress Report');await expect(page.getByText('Mathematics 101',{exact:true})).toHaveCount(0);f.release('academic');await expect(region(page,'parent-progress-report').getByRole('alert')).toBeVisible();await expect(page).toHaveURL(/\/parent\/students\/101/);
});
test('mocked Parent peer403 rejects a previously started academic200 without masking a peer401',async({page})=>{
  const f=await mockParent(page);f.hold('academic');f.resources.visibility.status=403;await open(page,'progressReport');await expect.poll(()=>f.resources.academic.calls).toBeGreaterThan(0);
  await expect.poll(()=>f.ledger.snapshot().filter(r=>r.path===parentPaths.visibility&&r.status===403&&r.terminal==='finished').length).toBe(1);f.release('academic');await f.settled();
  await expect(page.getByText('Mathematics 101',{exact:true})).toHaveCount(0);await expect(region(page,'parent-progress-report').getByRole('alert')).toBeVisible();
  f.resources.academic.status=401;f.resources.visibility.status=200;await region(page,'parent-progress-report').getByRole('button',{name:'Retry',exact:true}).click();await expect(page).toHaveURL(/\/login/);
});
test('mocked Parent uncached offline reader settles and reconnect makes one request',async({page,context})=>{
  const f=await mockParent(page);f.resources.profile.status=500;await open(page);await expect(region(page,'parent-student-profile').getByRole('alert')).toBeVisible();
  await tab(page,'Academic');await settled(page,'parent-intervention');await f.settled();f.resources.profile.status=200;const before=f.resources.profile.calls;
  await context.setOffline(true);await tab(page,'Student Profile');await expect(region(page,'parent-student-profile').getByRole('alert')).toContainText("You're offline");await expect(region(page,'parent-student-profile')).toHaveAttribute('aria-busy','false');
  await region(page,'parent-student-profile').getByRole('button',{name:'Retry',exact:true}).click();expect(f.resources.profile.calls).toBe(before);
  await context.setOffline(false);await settled(page,'parent-student-profile');await f.settled();expect(f.resources.profile.calls).toBe(before+1);
});
test('mocked Parent school-year rollover creates new scoped profile and does not reuse old-year cache',async({page})=>{
  const f=await mockParent(page);await open(page);await settled(page,'parent-student-profile');await f.settled();const before=f.resources.profile.calls;
  await tab(page,'Academic');await settled(page,'parent-intervention');f.state.year=8;await invalidateReaderForTest(page,'PARENT',['school-year','active']);
  await tab(page,'Student Profile');await settled(page,'parent-student-profile');await f.settled();expect(f.resources.profile.calls).toBe(before+1);expect(f.requests.filter(r=>r.path===parentPaths.profile).at(-1)?.year).toBe(8);
});
test('mocked Parent month selection preserves both year and month across calendar-year change',async({page})=>{
  const f=await mockParent(page);await open(page,'overview');await settled(page,'parent-attendance-body');
  await page.getByRole('combobox',{name:'Select attendance month',exact:true}).selectOption('2027-01');await settled(page,'parent-attendance-body');await f.settled();
  expect(f.requests.filter(r=>r.path===parentPaths.monthly).at(-1)?.params).toEqual({student_id:'101',month:'1',year:'2027'});
});
test('mocked Parent rapid term selections preserve golden averages without additional reads',async({page})=>{
  const duplicateKeys:string[]=[];page.on('console',message=>{if(/same key/.test(message.text()))duplicateKeys.push(message.text());});
  const f=await mockParent(page);await open(page,'progressReport');await settled(page,'parent-progress-report');await f.settled();const before=f.resources.academic.calls;
  await expect(region(page,'parent-report-average-ring')).toContainText('90%');
  for(const [label,value]of [['1st Term','88%'],['2nd Term','89%'],['3rd Term','90%'],['Overall','89%']] as const){await tab(page,label);await expect(region(page,'parent-report-average-ring')).toContainText(value);}
  expect(f.resources.academic.calls).toBe(before);await expect(page.getByRole('row').filter({hasText:'Mathematics 101'}).first()).toContainText('89.0');
  expect(duplicateKeys).toEqual([]);
});
test('mocked Parent locked terms remain unavailable without publishing grades',async({page})=>{
  const f=await mockParent(page);f.state.locked=true;await open(page,'progressReport');await expect(page.getByText('This progress report is not available yet.',{exact:true})).toBeVisible();
  await expect(page.getByText('Mathematics 101',{exact:true})).toHaveCount(0);await expect(page.locator('[data-sk-primitive]')).toHaveCount(0);
});
test('mocked Parent empty linked-child list settles without child data requests',async({page})=>{
  const f=await mockParent(page);f.state.empty=true;await page.goto('/parent/enrolled-children');await waitForDataRoute(page);await expect(page.getByText('No linked students yet. Use the form to connect your child.',{exact:true})).toBeVisible();expect(f.resources.profile.calls).toBe(0);expect(f.resources.academic.calls).toBe(0);
});
test('mocked Parent Calendar reuses Dashboard event reads and keeps four endpoint counts exact',async({page})=>{
  const f=await mockParent(page);await page.goto('/parent');await waitForDataRoute(page);await settled(page,'parent-school-events');await f.settled();
  await page.getByRole('link',{name:'Calendar',exact:true}).click();await waitForDataRoute(page);await expect(page.getByRole('heading',{name:'Calendar',exact:true})).toBeVisible();await waitForQueryReader(page,'PARENT',['calendar','all-holidays'],true);await f.settled();
  for(const r of ['activities','holidays','allActivities','allHolidays'] as ParentResource[])expect(f.ledger.snapshot().filter(e=>e.path===parentPaths[r]&&e.status===200&&e.terminal==='finished')).toHaveLength(1);
});
test('mocked Parent logout clears child cache and late old401 cannot expire a new Parent account',async({page})=>{
  const f=await mockParent(page);f.hold('profile');f.resources.profile.status=401;await open(page);await expect.poll(()=>f.resources.profile.calls).toBeGreaterThan(0);
  await logout(page);expect(await getQueryCollectionSize(page,'PARENT',['children','list'])).toBe(0);f.resources.profile.status=200;await login(page);
  await expect(page.getByRole('button',{name:'View Synthetic Child201',exact:true})).toBeVisible();f.release('profile');await f.settled();
  await expect(page).toHaveURL(/\/parent\/?$/);await expect(page.getByText('SYNTHETIC-101',{exact:true})).toHaveCount(0);await expect(page.getByRole('button',{name:'View Synthetic Child101',exact:true})).toHaveCount(0);
});
test('mocked Parent notification receipts use one driver and only confirmed writes clear unread',async({page})=>{
  const f=await mockParent(page);await page.goto('/parent/help');await waitForDataRoute(page);await page.getByRole('button',{name:'Notifications',exact:true}).click();await expect(page.getByText('Synthetic notice 801',{exact:true})).toBeVisible();await f.notificationLedger.successfulBatch();
  f.state.writeStatus=500;await page.getByRole('button',{name:'Mark all as read',exact:true}).click();await expect.poll(()=>f.state.writes.length).toBe(1);await expect(page.getByLabel('Unread',{exact:true})).toHaveCount(1);
  f.state.writeStatus=200;await page.getByRole('button',{name:'Mark all as read',exact:true}).click();await expect(page.getByLabel('Unread',{exact:true})).toHaveCount(0);await f.notificationLedger.successfulBatch(0,2);expect(f.state.writes.map(w=>w.path)).toEqual(['/api/notification/user/801/read-all','/api/notification/user/801/read-all']);
});
test('mocked Parent notifications retain exactly one 30-second poll and focus refresh',async({page})=>{
  const f=await mockParent(page);await page.clock.install();await page.goto('/parent/help');await waitForDataRoute(page);await f.notificationLedger.successfulBatch();
  await page.clock.fastForward(30_001);await page.clock.resume();await f.notificationLedger.successfulBatch(0,2);
  await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await f.notificationLedger.successfulBatch(0,3);
});
