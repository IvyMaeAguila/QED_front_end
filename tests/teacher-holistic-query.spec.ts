import {test,expect,type Page} from '@playwright/test';
import {mockTeacher} from './fixtures/teacher';
import {requestLedger} from './fixtures/requestLedger';
// Synthetic browser APIs; actual holistic page, QueryClient and AuthProvider.
async function fixture(page:Page,domains=false){
 const release=await mockTeacher(page,false);release();
 const ledger=requestLedger(page,p=>p.startsWith('/api/teacherHolistic/')||p==='/api/gradingPeriods');
 let status=200,year='1',name='Current',gate:Promise<void>|undefined,unlock:(()=>void)|undefined;
 await page.route('**/api/teacherAttendance/advisory-sections',r=>r.fulfill({json:[1,2].map(id=>({classId:String(id),sectionId:String(id),gradeLevel:'Grade 1',sectionName:`Section ${id}`,roster:[{id:'1',name:'Current',gender:'F'}],terms:[]}))}));
 await page.route('**/api/gradingPeriods',r=>{ledger.intercept(r.request());return r.fulfill({json:{success:true,data:[1,2].map(id=>({id:String(id),schoolYearId:year,termNumber:id,termLabel:`Term ${id}`,isActive:id===1}))}});});
 await page.route('**/api/teacherHolistic/**',async r=>{
  ledger.intercept(r.request());const code=status,marker=name;await gate;
  const point={weeksCount:3,weeklyScores:[],pastAverage:3.1,recentAverage:3.9,currentWeekAverage:3.9,trend:'Improving'};
  await r.fulfill({status:code,json:code===200?{success:true,data:domains?{sections:[1,2].map(id=>({classId:String(id),subjects:[],overallWeeks:[]}))}:[{studentId:'1',studentName:marker,isAdvisory:true,subjects:[],overall:point}]}:{success:false,message:'Synthetic holistic error'}});
 });
 await page.goto(`/tests/teacher-readers-query.html?holistic${domains?'&domains':''}`);await expect(page.getByTestId('auth')).toHaveText('TEACHER:1');
 return {ledger,status:(n:number)=>{status=n;},year:(s:string)=>{year=s;},name:(s:string)=>{name=s;},hold:()=>{gate=new Promise(r=>{unlock=r;});},release:()=>{unlock?.();gate=undefined;}};
}
const start=(p:Page)=>p.getByRole('button',{name:'Toggle preview',exact:true}).click();
const loaded=async(p:Page,name='Current')=>{const rows=p.locator('[data-sk-region="holistic-overview-row"]');await expect(rows).toHaveCount(1);await expect(rows).toContainText(name);};
test('Teacher holistic: preview protection, fresh cache, term reuse, stale refresh and year rollover',async({page},info)=>{
 let f:Awaited<ReturnType<typeof fixture>>|undefined;
 // Install before navigation so cleanup never mixes native and fake timer IDs.
 await page.clock.install();
 try {
 f=await fixture(page);expect(f.ledger.snapshot()).toEqual([]);await start(page);await loaded(page);await f.ledger.successfulBatch(0,2);
 await expect(page.getByRole('combobox',{name:'Select term',exact:true})).toBeEnabled();await page.getByRole('combobox',{name:'Select term',exact:true}).selectOption('2');await f.ledger.successfulBatch(2,1);await loaded(page);const mark=f.ledger.mark();await page.getByRole('combobox',{name:'Select term',exact:true}).selectOption('1');await loaded(page);expect(f.ledger.snapshot(mark)).toEqual([]);
 await page.getByRole('button',{name:'Toggle readers',exact:true}).click();await page.clock.fastForward(31_000);f.year('2');f.name('Rollover');await page.getByRole('button',{name:'Toggle readers',exact:true}).click();await loaded(page,'Rollover');await f.ledger.successfulBatch(mark,2);await expect(page.getByTestId('keys')).toContainText('"overview","2",1');
 } finally {
  await info.attach('sanitized-holistic-lifecycle',{body:JSON.stringify({requests:f?.ledger.snapshot(),browser:await page.evaluate(()=>({now:performance.now(),regions:[...document.querySelectorAll('[data-sk-region]')].filter(e=>/holistic-overview-term|holistic-overview-roster/.test(e.getAttribute('data-sk-region')??'')).map(e=>({name:e.getAttribute('data-sk-region'),phase:e.getAttribute('data-sk-phase')})),queries:(window as unknown as {__qedTeacherDiagnostics:()=>unknown}).__qedTeacherDiagnostics()})).catch(()=>null)}),contentType:'application/json'});
 }
});
for(const status of [401,403,500])test(`Teacher holistic: ${status} privacy and explicit recovery`,async({page})=>{
 const f=await fixture(page);f.status(status);await start(page);if(status===401){await expect(page.getByTestId('auth')).toHaveText('signed-out');await expect(page.getByText('Current',{exact:true})).toHaveCount(0);return;}
 await expect(page.getByRole('alert')).toContainText('Synthetic holistic error');await expect(page.getByTestId('auth')).toHaveText('TEACHER:1');await expect.poll(()=>f.ledger.snapshot().filter(r=>r.terminal==='finished').length).toBe(2);expect(f.ledger.snapshot().map(r=>r.status)).toEqual([200,status]);
 f.status(200);const mark=f.ledger.mark();await page.getByRole('button',{name:'Retry',exact:true}).click();await loaded(page);await f.ledger.successfulBatch(mark,1);
});
test('Teacher holistic: offline initial recovery and cached offline data without duplicate retries',async({page,context})=>{
 const f=await fixture(page);await context.setOffline(true);await start(page);await expect(page.getByRole('alert')).toContainText("You're offline");expect(f.ledger.snapshot()).toEqual([]);await context.setOffline(false);await loaded(page);await f.ledger.successfulBatch(0,2);const mark=f.ledger.mark();await context.setOffline(true);await loaded(page);expect(f.ledger.snapshot(mark)).toEqual([]);await context.setOffline(false);await loaded(page);expect(f.ledger.snapshot(mark)).toEqual([]);
});
test('Teacher holistic: pending old401 cannot expire new account or retain old local rows',async({page})=>{
 const f=await fixture(page);await start(page);await loaded(page);await f.ledger.successfulBatch(0,2);f.status(401);f.hold();await page.getByRole('combobox',{name:'Select term',exact:true}).selectOption('2');await expect.poll(()=>f.ledger.snapshot().filter(r=>r.intercepted&&!r.terminal).length).toBe(1);const pending=f.ledger.snapshot().filter(r=>!r.terminal).map(r=>r.id);
 f.status(200);f.name('New account');await page.getByRole('button',{name:'Switch account',exact:true}).click();await expect(page.getByText('Current',{exact:true})).toHaveCount(0);await expect.poll(()=>f.ledger.snapshot().filter(r=>pending.includes(r.id)&&r.terminal==='aborted').length).toBe(1);f.release();await loaded(page,'New account');await expect(page.getByTestId('auth')).toHaveText('TEACHER:2');await expect(page.getByTestId('keys')).not.toContainText('"TEACHER","1"');await page.getByRole('button',{name:'Switch role',exact:true}).click();await expect(page.getByText('New account',{exact:true})).toHaveCount(0);await expect(page.getByTestId('keys')).toHaveText('[]');
});
test('Teacher domain trends: class switching preserves URL and reuses one all-class response',async({page})=>{
 const f=await fixture(page,true);await start(page);await expect(page.locator('[data-sk-region="domain-trends-body"]')).toHaveAttribute('data-sk-phase','settled');await f.ledger.successfulBatch(0,2);const mark=f.ledger.mark();await page.getByRole('button',{name:/Section 2/}).click();await expect(page).toHaveURL(/classId=2/);await expect(page).toHaveURL(/term=1/);expect(f.ledger.snapshot(mark)).toEqual([]);
});
