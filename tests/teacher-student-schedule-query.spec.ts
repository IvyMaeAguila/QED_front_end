import {test,expect,type Page} from '@playwright/test';
import {mockTeacher} from './fixtures/teacher';
import {requestLedger} from './fixtures/requestLedger';
// Synthetic APIs; actual shared student profile with Teacher-only Query facade.
async function fixture(page:Page){
 const release=await mockTeacher(page,false);release();
 const ledger=requestLedger(page,p=>p==='/api/classes/'||p==='/api/section/getTeachers');
 let status=200,endpoint='',student=1,gate:Promise<void>|undefined,unlock:(()=>void)|undefined;
 await page.route('**/api/student/allStudents',r=>r.fulfill({json:{data:[{id:student,student_number:`S${student}`,first_name:`Student${student}`,last_name:'Synthetic',middle_name:'',gender:'Female',grade_level_id:student,grade_level_name:`Grade ${student}`,section_id:student*11,section_name:`Section ${student}`}]}}));
 await page.route('**/api/classes/',async r=>{
  ledger.intercept(r.request());const code=endpoint==='teachers'?200:status;await gate;
  await r.fulfill({status:code,json:code===200?{success:true,data:[1,2].map(id=>({id,gradeLevelId:id,gradeLevel:`Grade ${id}`,sectionId:id*11,section:`Section ${id}`,room:'101',adviserId:id+40,adviserName:`Teacher${id}`,studentCount:1,schedule:[{id,subject:`Subject${id}`,teacherId:id+40,startTime:'08:00',endTime:'09:00',days:['Monday']}]}))}:{success:false,message:'Synthetic class error'}});
 });
 await page.route('**/api/section/getTeachers',async r=>{
  ledger.intercept(r.request());const code=endpoint==='classes'?200:status;await gate;
  await r.fulfill({status:code,json:code===200?{status:'success',data:[1,2].map(id=>({id:id+40,user_id:id+700,first_name:`Teacher${id}`,last_name:'Synthetic',middle_name:null,email_address:`synthetic${id}@example.test`,contact_number:''}))}:{message:'Synthetic teacher error'}});
 });
 await page.goto('/tests/teacher-readers-query.html?schedule');await expect(page.getByTestId('auth')).toHaveText('TEACHER:1');
 return {ledger,status:(n:number,target='')=>{status=n;endpoint=target;},student:(n:number)=>{student=n;},hold:()=>{gate=new Promise(r=>{unlock=r;});},release:()=>{unlock?.();gate=undefined;}};
}
const start=(p:Page)=>p.getByRole('button',{name:'Toggle preview',exact:true}).click();
const profile=(p:Page,id=1)=>p.getByRole('button',{name:`Student ${id}`,exact:true}).click();
const ready=(p:Page,id=1)=>expect(p.getByText(`Teacher${id} Synthetic`,{exact:true})).toBeVisible();
test('Teacher student schedules: no eager context reads, owned schedule/staff projection and fresh navigation reuse',async({page})=>{
 const f=await fixture(page);await start(page);await expect(page.getByTestId('keys')).toContainText('"students","authorized"');expect(f.ledger.snapshot()).toEqual([]);await profile(page);await ready(page);await f.ledger.successfulBatch(0,2);await expect(page.getByTestId('schedule-cache')).toContainText('"ids":[1]');await expect(page.getByTestId('schedule-cache')).toContainText('"ids":[41]');await expect(page.getByTestId('schedule-cache')).not.toContainText('"ids":[2]');await expect(page.getByTestId('schedule-cache')).not.toContainText('"ids":[42]');const mark=f.ledger.mark();await page.getByRole('button',{name:'Dashboard',exact:true}).click();await profile(page);await ready(page);expect(f.ledger.snapshot(mark)).toEqual([]);
});
test('Teacher student schedules: stale navigation refreshes each endpoint once',async({page})=>{
 const f=await fixture(page);await page.clock.install();await start(page);await profile(page);await ready(page);await f.ledger.successfulBatch(0,2);const mark=f.ledger.mark();await page.getByRole('button',{name:'Dashboard',exact:true}).click();await page.clock.fastForward(31_000);await profile(page);await ready(page);await f.ledger.successfulBatch(mark,2);
});
for(const target of ['classes','teachers'])for(const status of [401,403,500])test(`Teacher student schedules: ${target} ${status} isolation and explicit retry`,async({page})=>{
 const f=await fixture(page);f.status(status,target);await start(page);await profile(page);if(status===401){await expect(page.getByTestId('auth')).toHaveText('signed-out');return;}await expect(page.getByRole('alert')).toBeVisible();await expect(page.getByTestId('auth')).toHaveText('TEACHER:1');await expect(page.getByText('Teacher1 Synthetic',{exact:true})).toHaveCount(0);f.status(200);await page.getByRole('button',{name:'Retry',exact:true}).click();await ready(page);
});
test('Teacher student schedules: cached offline profile, bounded Retry and reconnect',async({page,context})=>{
 const f=await fixture(page);await start(page);await profile(page);await ready(page);await f.ledger.successfulBatch(0,2);const mark=f.ledger.mark();await context.setOffline(true);await ready(page);await page.getByRole('button',{name:'Dashboard',exact:true}).click();await profile(page);await ready(page);expect(f.ledger.snapshot(mark)).toEqual([]);await context.setOffline(false);await ready(page);
});
test('Teacher student schedules: offline uncached schedule settles; Retry cannot queue duplicate requests',async({page,context})=>{
 const f=await fixture(page);await start(page);await expect(page.getByTestId('keys')).toContainText('"students","authorized"');await context.setOffline(true);await profile(page);await expect(page.getByRole('alert')).toContainText("You're offline");for(let i=0;i<3;i++)await page.getByRole('button',{name:'Retry',exact:true}).click();expect(f.ledger.snapshot()).toEqual([]);await context.setOffline(false);await ready(page);await f.ledger.successfulBatch(0,2);
});
test('Teacher student schedules: old pending401 cancelled; new account cannot inherit schedule or roster',async({page})=>{
 const f=await fixture(page);f.status(401,'classes');f.hold();await start(page);await profile(page);await expect.poll(()=>f.ledger.snapshot().filter(r=>r.intercepted).length).toBe(1);const old=f.ledger.snapshot().map(r=>r.id);f.status(200);f.student(2);await page.getByRole('button',{name:'Switch account',exact:true}).click();await expect.poll(()=>f.ledger.snapshot().filter(r=>old.includes(r.id)&&r.terminal==='aborted').length).toBe(1);await expect(page.getByText('Teacher1 Synthetic',{exact:true})).toHaveCount(0);f.release();await profile(page,2);await ready(page,2);await expect(page.getByTestId('auth')).toHaveText('TEACHER:2');await expect(page.getByTestId('schedule-cache')).not.toContainText('"ids":[1]');await expect(page.getByTestId('schedule-cache')).not.toContainText('"ids":[41]');
});
