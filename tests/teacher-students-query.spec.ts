import { test, expect, type Page } from '@playwright/test';
import { mockTeacher } from './fixtures/teacher';
import { requestLedger } from './fixtures/requestLedger';
const ledgers = new WeakMap<Page, ReturnType<typeof requestLedger>>();
test.afterEach(async ({page}, info) => { const ledger=ledgers.get(page);if(ledger)await info.attach('student-request-lifecycle',{body:JSON.stringify(ledger.snapshot()),contentType:'application/json'}); });
// Deterministic mocked transport, actual Auth/TeacherStudentsProvider and Query.
async function fixture(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', m => { if(m.type()==='error' && /Cannot update a component|Maximum update|Invalid hook/.test(m.text()))errors.push(m.text()); });
  const release = await mockTeacher(page, false); release();
  const ledger = requestLedger(page, p => p === '/api/student/allStudents');
  ledgers.set(page,ledger);
  let status=200,marker='Account 1',gate:Promise<void>|undefined,unlock:(()=>void)|undefined,empty=false;
  await page.route('**/api/student/allStudents',async route=>{
    ledger.intercept(route.request()); const code=status,name=marker;await gate;
    await route.fulfill({status:code,json:code===200?{success:true,data:empty?[]:[{id:101,first_name:name,last_name:'Synthetic',middle_name:'',student_number:'S101',learner_reference_number:'L101',gender:'Male',grade_level_id:1,section_id:11,grade_level_name:'Grade 1',section_name:'Maroon'}]}:{message:'Synthetic student failure'}});
  });
  await page.goto('/tests/teacher-readers-query.html?students');
  await expect(page.getByTestId('auth')).toHaveText('TEACHER:1');
  return {ledger,errors,status:(v:number)=>{status=v;},marker:(v:string)=>{marker=v;},empty:()=>{empty=true;},hold:()=>{gate=new Promise(r=>{unlock=r;});},release:()=>{unlock?.();gate=undefined;}};
}
const start=(page:Page)=>page.getByRole('button',{name:'Toggle preview',exact:true}).click();
const loaded=async(page:Page,name='Account 1')=>{await expect(page.getByTestId('students-data').first()).toContainText(name);await expect(page.getByTestId('students-loading').first()).toHaveText('false');};
test('Teacher authorized students: readiness, one cache, concurrent observers and fresh reuse',async({page})=>{
  const f=await fixture(page);expect(f.ledger.snapshot()).toEqual([]);await start(page);await loaded(page);await f.ledger.successfulBatch(0,1);
  const mark=f.ledger.mark();await page.getByRole('button',{name:'Toggle observer'}).click();await loaded(page);await expect(page.getByTestId('students-data')).toHaveCount(2);
  await page.getByRole('button',{name:'Toggle observer'}).click();await page.getByRole('button',{name:'Toggle readers'}).click();await page.getByRole('button',{name:'Toggle readers'}).click();await loaded(page);
  expect(f.ledger.snapshot(mark)).toEqual([]);expect(f.errors).toEqual([]);
});
test('Teacher authorized students: stale cache refreshes on remount exactly once',async({page})=>{
  const f=await fixture(page);await page.clock.install();await start(page);await loaded(page);await f.ledger.successfulBatch(0,1);
  await page.getByRole('button',{name:'Toggle readers'}).click();await page.clock.fastForward(31_000);f.marker('Refreshed');const mark=f.ledger.mark();
  await page.getByRole('button',{name:'Toggle readers'}).click();await loaded(page,'Refreshed');await f.ledger.successfulBatch(mark,1);expect(f.errors).toEqual([]);
});
test('Teacher authorized students: offline initial load recovers once and cached data stays visible',async({page,context})=>{
  const f=await fixture(page);await context.setOffline(true);await start(page);await expect(page.getByTestId('students-error')).toContainText("You're offline");await expect(page.getByTestId('students-loading')).toHaveText('false');
  for(let n=0;n<3;n++)await page.getByRole('button',{name:'Retry students'}).click();expect(f.ledger.snapshot()).toEqual([]);
  await context.setOffline(false);await loaded(page);await f.ledger.successfulBatch(0,1);const mark=f.ledger.mark();await context.setOffline(true);await loaded(page);
  for(let n=0;n<3;n++)await page.getByRole('button',{name:'Retry students'}).click();expect(f.ledger.snapshot(mark)).toEqual([]);
  await context.setOffline(false);await loaded(page);expect(f.errors).toEqual([]);
});
for(const status of [401,403,500])test(`Teacher authorized students: initial${status} and bounded retry`,async({page})=>{
  const f=await fixture(page);f.status(status);await start(page);
  if(status===401){await expect(page.getByTestId('auth')).toHaveText('signed-out');await expect(page.getByTestId('students-data')).toHaveText('[]');return;}
  await expect(page.getByTestId('students-error')).toHaveText('Synthetic student failure');await expect(page.getByTestId('students-loading')).toHaveText('false');await expect(page.getByTestId('students-data')).toHaveText('[]');await expect(page.getByTestId('auth')).toHaveText('TEACHER:1');
  await expect.poll(()=>f.ledger.snapshot().filter(r=>r.status===status&&r.terminal==='finished').length).toBe(1);const mark=f.ledger.mark();
  f.status(200);await page.getByRole('button',{name:'Retry students'}).click();await loaded(page);await f.ledger.successfulBatch(mark,1);expect(f.ledger.snapshot().map(r=>r.status)).toEqual([status,200]);expect(f.errors).toEqual([]);
});
test('Teacher authorized students:403 removes previously cached profiles, including offline',async({page,context})=>{
  const f=await fixture(page);await start(page);await loaded(page);f.status(403);await page.getByRole('button',{name:'Retry students'}).click();await expect(page.getByTestId('students-error')).toHaveText('Synthetic student failure');await expect(page.getByTestId('students-data')).toHaveText('[]');
  await context.setOffline(true);await expect(page.getByTestId('students-data')).toHaveText('[]');await expect(page.getByTestId('auth')).toHaveText('TEACHER:1');await context.setOffline(false);expect(f.errors).toEqual([]);
});
test('Teacher authorized students: old pending401 aborted on account switch; new account data isolated',async({page})=>{
  const f=await fixture(page);f.hold();f.status(401);await start(page);await expect.poll(()=>f.ledger.snapshot().filter(r=>r.intercepted).length).toBe(1);
  const old=f.ledger.snapshot().map(r=>r.id);const mark=f.ledger.mark();
  f.status(200);f.marker('Account 2');await page.getByRole('button',{name:'Switch account'}).click();await expect.poll(()=>f.ledger.snapshot().filter(r=>old.includes(r.id)&&r.terminal==='aborted').length).toBe(1);
  f.release();await loaded(page,'Account 2');const current=await f.ledger.successfulBatch(mark,1);
  expect(current.filter(r=>r.terminal==='aborted').length).toBeLessThanOrEqual(1); // one development StrictMode remount probe
  await expect(page.getByTestId('auth')).toHaveText('TEACHER:2');await expect(page.getByTestId('keys')).not.toContainText('"TEACHER","1"');expect(f.errors).toEqual([]);
});
test('Teacher authorized students: role switch and confirmed logout clear user data',async({page})=>{
  const f=await fixture(page);await start(page);await loaded(page);await page.getByRole('button',{name:'Switch role'}).click();await expect(page.getByTestId('students-data')).toHaveText('[]');await expect(page.getByTestId('keys')).toHaveText('[]');
  await page.getByRole('button',{name:'Switch account'}).click();await loaded(page);await page.route('**/api/auth/logout',r=>r.fulfill({json:{success:true}}));await page.getByRole('button',{name:'Logout',exact:true}).click();await page.getByRole('dialog',{name:'Confirm logout'}).getByRole('button',{name:'Log out',exact:true}).click();await expect(page.getByTestId('auth')).toHaveText('signed-out');await expect(page.getByTestId('students-data')).toHaveText('[]');await expect(page.getByTestId('keys')).toHaveText('[]');expect(f.errors).toEqual([]);
});
test('Teacher authorized students: empty authorized scope is a successful empty list',async({page})=>{
  const f=await fixture(page);f.empty();await start(page);await expect(page.getByTestId('students-loading')).toHaveText('false');await expect(page.getByTestId('students-error')).toBeEmpty();await expect(page.getByTestId('students-data')).toHaveText('[]');await f.ledger.successfulBatch(0,1);expect(f.errors).toEqual([]);
});
