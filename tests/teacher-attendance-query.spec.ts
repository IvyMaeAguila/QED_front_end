import {test,expect,type Page} from '@playwright/test';
import {mockTeacher} from './fixtures/teacher';
import {requestLedger} from './fixtures/requestLedger';
// Mocked APIs; actual attendance page, mutations, Query cache and auth.
async function fixture(page:Page){
 await page.clock.setFixedTime(new Date('2026-10-09T04:00:00Z'));const release=await mockTeacher(page,false);release();
 const ledger=requestLedger(page,p=>/^\/api\/teacherAttendance\/\d+$/.test(p));const writes:{classId:string;body:unknown}[]=[];
 let status=200,saveStatus=200,name='Current',gate:Promise<void>|undefined,unlock:(()=>void)|undefined;
 await page.route('**/api/teacherAttendance/advisory-sections',r=>r.fulfill({json:[1,2].map(id=>({classId:String(id),sectionId:String(id),sectionName:`Section ${id}`,gradeLevel:'Grade 1',roster:[{id:String(id),name:`${name} ${id}`,gender:'F'}],terms:[{id:'7',label:'Term 1',termNumber:1,startDate:'2026-01-01',endDate:'2026-12-31',isActive:true}]}))}));
 await page.route(/\/api\/teacherAttendance\/\d+(?:\?|$)/,async r=>{
  const classId=new URL(r.request().url()).pathname.split('/').at(-1)!;
  if(r.request().method()==='POST'){writes.push({classId,body:r.request().postDataJSON()});await r.fulfill({status:saveStatus,json:{success:saveStatus===200}});return;}
  ledger.intercept(r.request());const code=status;await gate;await r.fulfill({status:code,json:code===200?{data:{}}:{message:'Synthetic error'}});
 });
 await page.goto('/tests/teacher-readers-query.html?attendance');await expect(page.getByTestId('auth')).toHaveText('TEACHER:1');
 return {ledger,writes,status:(n:number)=>{status=n;},saveStatus:(n:number)=>{saveStatus=n;},name:(s:string)=>{name=s;},hold:()=>{gate=new Promise(r=>{unlock=r;});},release:()=>{unlock?.();gate=undefined;}};
}
const start=(p:Page)=>p.getByRole('button',{name:'Toggle preview',exact:true}).click();
const ready=(p:Page)=>expect(p.getByRole('button',{name:'Mark',exact:true})).toHaveCount(1);
test('Teacher attendance: preview, cache reuse, successful mutation payload and success-only invalidation',async({page})=>{
 const f=await fixture(page);expect(f.ledger.snapshot()).toEqual([]);await start(page);await ready(page);await f.ledger.successfulBatch(0,1);const mark=f.ledger.mark();await page.getByRole('button',{name:'Toggle readers',exact:true}).click();await page.getByRole('button',{name:'Toggle readers',exact:true}).click();await ready(page);expect(f.ledger.snapshot(mark)).toEqual([]);
 await page.getByRole('button',{name:'Mark',exact:true}).click();await expect.poll(()=>f.writes.length).toBe(1);expect(f.writes[0]).toEqual({classId:'1',body:{studentId:'1',date:'2026-10-09',status:'P',term:'7'}});await expect(page.getByRole('button',{name:'P',exact:true})).toBeVisible();await expect(page.getByTestId('query-state')).toContainText('"isInvalidated":true');expect(f.ledger.snapshot(mark)).toEqual([]);
 await page.getByRole('button',{name:'Toggle readers',exact:true}).click();await page.getByRole('button',{name:'Toggle readers',exact:true}).click();await ready(page);await f.ledger.successfulBatch(mark,1);
});
test('Teacher attendance: failed mutation rolls back, never retries and does not invalidate fresh cache',async({page})=>{
 const f=await fixture(page);await start(page);await ready(page);await f.ledger.successfulBatch(0,1);const mark=f.ledger.mark();f.saveStatus(500);await page.getByRole('button',{name:'Mark',exact:true}).click();await expect.poll(()=>f.writes.length).toBe(1);await ready(page);await page.getByRole('button',{name:'Toggle readers',exact:true}).click();await page.getByRole('button',{name:'Toggle readers',exact:true}).click();await ready(page);expect(f.writes).toHaveLength(1);expect(f.ledger.snapshot(mark)).toEqual([]);
});
for(const status of [401,403,500])test(`Teacher attendance: ${status} and explicit recovery`,async({page})=>{
 const f=await fixture(page);f.status(status);await start(page);if(status===401){await expect(page.getByTestId('auth')).toHaveText('signed-out');return;}
 await expect(page.getByRole('alert')).toBeVisible();await expect(page.getByTestId('auth')).toHaveText('TEACHER:1');await expect.poll(()=>f.ledger.snapshot().filter(r=>r.terminal==='finished').length).toBe(1);const mark=f.ledger.mark();f.status(200);await page.getByRole('button',{name:'Retry',exact:true}).click();await ready(page);await f.ledger.successfulBatch(mark,1);expect(f.ledger.snapshot().map(r=>r.status)).toEqual([status,200]);
});
test('Teacher attendance: offline initial recovery and cached offline write rejection',async({page,context})=>{
 const f=await fixture(page);await context.setOffline(true);await start(page);await expect(page.getByRole('alert')).toContainText("You're offline");expect(f.ledger.snapshot()).toEqual([]);await context.setOffline(false);await ready(page);await f.ledger.successfulBatch(0,1);const mark=f.ledger.mark();await context.setOffline(true);await page.getByRole('button',{name:'Mark',exact:true}).click();await ready(page);expect(f.writes).toEqual([]);expect(f.ledger.snapshot(mark)).toEqual([]);await context.setOffline(false);await ready(page);expect(f.writes).toEqual([]);
});
test('Teacher attendance: pending old401 is cancelled and cannot expire next account',async({page})=>{
 const f=await fixture(page);f.status(401);f.hold();await start(page);await expect.poll(()=>f.ledger.snapshot().filter(r=>r.intercepted).length).toBe(1);const old=f.ledger.snapshot().map(r=>r.id);f.status(200);f.name('New account');await page.getByRole('button',{name:'Switch account',exact:true}).click();await expect.poll(()=>f.ledger.snapshot().filter(r=>old.includes(r.id)&&r.terminal==='aborted').length).toBe(1);f.release();await ready(page);await expect(page.getByTestId('auth')).toHaveText('TEACHER:2');await expect(page.getByText('New account 1',{exact:true})).toBeVisible();await expect(page.getByTestId('keys')).not.toContainText('"TEACHER","1"');
});
