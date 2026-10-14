import { test,expect,type Page } from '@playwright/test';
import {mockTeacher} from './fixtures/teacher';
import {requestLedger} from './fixtures/requestLedger';
// Mocked browser APIs; actual Query, auth and advisory-selection hook.
async function fixture(page:Page,requested='') {
 const release=await mockTeacher(page,false);release();
 const ledger=requestLedger(page,p=>p==='/api/teacherAttendance/advisory-sections');
 let status=200,marker='Current',gate:Promise<void>|undefined,unlock:(()=>void)|undefined,empty=false;
 await page.route('**/api/teacherAttendance/advisory-sections',async route=>{
  ledger.intercept(route.request());const code=status,name=marker;await gate;
  await route.fulfill({status:code,json:code===200?empty?[]:[1,2].map(id=>({classId:String(id),sectionId:String(id),sectionName:`${name} ${id}`,gradeLevel:`Grade ${id}`,roster:[],terms:[{id:'7',label:'Term 1',isActive:true,startDate:'2090-08-01',endDate:'2090-10-31'}]})):{message:'Synthetic advisory failure'}});
 });
 await page.goto('/tests/teacher-readers-query.html?advisory'+requested);await expect(page.getByTestId('auth')).toHaveText('TEACHER:1');
 return {ledger,status:(n:number)=>{status=n;},marker:(s:string)=>{marker=s;},empty:()=>{empty=true;},hold:()=>{gate=new Promise(r=>{unlock=r;});},release:()=>{unlock?.();gate=undefined;}};
}
const start=(p:Page)=>p.getByRole('button',{name:'Toggle preview',exact:true}).click();
const loaded=(p:Page,name='Current')=>expect(p.getByTestId('advisory-selected').first()).toContainText(name);
test('Teacher advisory: preview, default class, URL selection, concurrent observers and fresh cache',async({page})=>{
 const f=await fixture(page);expect(f.ledger.snapshot()).toEqual([]);await start(page);await loaded(page);await expect(page.getByTestId('advisory-selected')).toContainText('"classId":"1"');await f.ledger.successfulBatch(0,1);const mark=f.ledger.mark();
 await page.getByRole('button',{name:'Select advisory 2'}).click();await expect(page).toHaveURL(/classId=2/);await expect(page.getByTestId('advisory-selected')).toContainText('"classId":"2"');
 await page.getByRole('button',{name:'Toggle observer'}).click();await expect(page.getByTestId('advisory-selected')).toHaveCount(2);await page.getByRole('button',{name:'Toggle observer'}).click();await page.getByRole('button',{name:'Toggle readers'}).click();await page.getByRole('button',{name:'Toggle readers'}).click();await loaded(page);expect(f.ledger.snapshot(mark)).toEqual([]);
});
test('Teacher advisory: requested class preserved; stale refresh updates roster context',async({page})=>{
 const f=await fixture(page,'&classId=2');await page.clock.install();await start(page);await loaded(page);await expect(page.getByTestId('advisory-selected')).toContainText('"classId":"2"');await f.ledger.successfulBatch(0,1);await page.getByRole('button',{name:'Toggle readers'}).click();await page.clock.fastForward(31_000);f.marker('New year');const mark=f.ledger.mark();await page.getByRole('button',{name:'Toggle readers'}).click();await loaded(page,'New year');await f.ledger.successfulBatch(mark,1);await expect(page.getByTestId('advisory-selected')).toContainText('"classId":"2"');
});
for(const kind of ['empty','404'])test(`Teacher advisory: cached ${kind} remains successful null class`,async({page})=>{
 const f=await fixture(page);if(kind==='empty')f.empty();else f.status(404);await start(page);await expect(page.getByTestId('advisory-data')).toHaveText('null');await expect(page.getByTestId('advisory-selected')).toHaveText('null');await expect(page.getByTestId('advisory-error')).toBeEmpty();await expect.poll(()=>f.ledger.snapshot().filter(r=>r.terminal==='finished').length).toBe(1);const mark=f.ledger.mark();await page.getByRole('button',{name:'Toggle readers'}).click();await page.getByRole('button',{name:'Toggle readers'}).click();await expect(page.getByTestId('advisory-data')).toHaveText('null');expect(f.ledger.snapshot(mark)).toEqual([]);
});
for(const status of [401,403,500])test(`Teacher advisory: ${status} preserves auth/error and explicit recovery`,async({page})=>{
 const f=await fixture(page);f.status(status);await start(page);if(status===401){await expect(page.getByTestId('auth')).toHaveText('signed-out');return;}
 await expect(page.getByTestId('advisory-error')).toHaveText("Couldn't load your advisory classes. Please try again.");await expect(page.getByTestId('auth')).toHaveText('TEACHER:1');await expect.poll(()=>f.ledger.snapshot().filter(r=>r.terminal==='finished').length).toBe(1);const mark=f.ledger.mark();f.status(200);await page.getByRole('button',{name:'Retry advisory'}).click();await loaded(page);await f.ledger.successfulBatch(mark,1);expect(f.ledger.snapshot().map(r=>r.status)).toEqual([status,200]);
});
test('Teacher advisory: offline initial connection error, bounded retries and cached recovery',async({page,context})=>{
 const f=await fixture(page);await context.setOffline(true);await start(page);await expect(page.getByTestId('advisory-error')).toContainText("You're offline");for(let i=0;i<3;i++)await page.getByRole('button',{name:'Retry advisory'}).click();expect(f.ledger.snapshot()).toEqual([]);await context.setOffline(false);await loaded(page);await f.ledger.successfulBatch(0,1);const mark=f.ledger.mark();await context.setOffline(true);await loaded(page);await page.getByRole('button',{name:'Retry advisory'}).click();expect(f.ledger.snapshot(mark)).toEqual([]);await context.setOffline(false);await loaded(page);
});
test('Teacher advisory: old pending401 cancelled on account switch; role change clears roster',async({page})=>{
 const f=await fixture(page);f.status(401);f.hold();await start(page);await expect.poll(()=>f.ledger.snapshot().filter(r=>r.intercepted).length).toBe(1);const old=f.ledger.snapshot().map(r=>r.id);f.status(200);f.marker('New account');await page.getByRole('button',{name:'Switch account'}).click();await expect.poll(()=>f.ledger.snapshot().filter(r=>old.includes(r.id)&&r.terminal==='aborted').length).toBe(1);f.release();await loaded(page,'New account');await expect(page.getByTestId('auth')).toHaveText('TEACHER:2');await expect(page.getByTestId('keys')).not.toContainText('"TEACHER","1"');await page.getByRole('button',{name:'Switch role'}).click();await expect(page.getByTestId('advisory-selected')).toBeEmpty();await expect(page.getByTestId('keys')).toHaveText('[]');
});
