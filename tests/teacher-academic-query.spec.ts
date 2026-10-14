import {test,expect,type Page} from '@playwright/test';
import {mockTeacher} from './fixtures/teacher';
import {requestLedger} from './fixtures/requestLedger';
// All API responses are synthetic. Actual subject/records UI, Query and auth.
async function fixture(page:Page){
 await page.clock.setFixedTime(new Date('2026-10-09T04:00:00Z'));const release=await mockTeacher(page,false);release();
 const ledger=requestLedger(page,p=>p.startsWith('/api/teacherGrading/')||p.startsWith('/api/subject/getEffectiveWeights/')||p==='/api/gradingPeriods');
 const writes:{path:string;body:unknown}[]=[];
 let status=200,failed='',saveStatus=200,name='Current',year='1',score:number|undefined,gate:Promise<void>|undefined,unlock:(()=>void)|undefined;
 await page.route(/\/api\/(teacherGrading|gradingPeriods|subject\/getEffectiveWeights)/,async r=>{
  const path=new URL(r.request().url()).pathname;
  if(r.request().method()!=='GET'){writes.push({path,body:r.request().postDataJSON()});if(saveStatus===200&&path.endsWith('/scores'))score=r.request().postDataJSON().value;await r.fulfill({status:saveStatus,json:{success:saveStatus===200,id:'new-item',data:{}}});return;}
  ledger.intercept(r.request());const code=failed&&!(path.endsWith(failed))?200:status,marker=name;
  if(!path.endsWith('gradingPeriods'))await gate;
  const id=path.split('/')[3];let data:unknown;
  if(path.endsWith('gradingPeriods'))data=[1,2].map(id=>({id:String(id),schoolYearId:year,termNumber:id,termLabel:`Term ${id}`,isActive:id===1}));
  else if(path.includes('getEffectiveWeights'))data={source:'manual',ww:30,pt:50,exam:20};
  else if(path.endsWith('/items'))data=[{id:'item1',tab:'writtenWorks',date:'2026-10-09',activityName:'Practice',topic:'Numbers',format:'Quiz',maxItems:20,gradingPeriodId:'1'}];
  else if(path.endsWith('/scores'))data=score===undefined?{}:{'1':{item1:score}};
  else if(path.endsWith('/holistic'))data={};
  else if(path.endsWith('/topics'))data=[{id:'topic1',topicName:'Numbers'}];
  else data={subjectName:`Math ${id}`,gradeLevel:'Grade 1',roster:[{id:'1',name:`${marker} ${id}`,gender:'F'}],isOwnAdvisory:true,adviserName:'Synthetic Teacher'};
  await r.fulfill({status:code,json:code===200?{success:true,data,weekStartDate:'2026-10-05'}:{success:false,message:'Synthetic academic error'}});
 });
 await page.goto('/tests/teacher-readers-query.html?academic');await expect(page.getByTestId('auth')).toHaveText('TEACHER:1');
 return {ledger,writes,status:(n:number,endpoint='')=>{status=n;failed=endpoint;},saveStatus:(n:number)=>{saveStatus=n;},name:(s:string)=>{name=s;},year:(s:string)=>{year=s;},hold:()=>{gate=new Promise(r=>{unlock=r;});},release:()=>{unlock?.();gate=undefined;}};
}
const start=(p:Page)=>p.getByRole('button',{name:'Toggle preview',exact:true}).click();
const ready=async(p:Page,name='Current 1')=>{await expect(p.locator('[data-sk-region="assessment-roster"]')).toHaveAttribute('data-sk-phase','settled');await expect(p.getByText(name,{exact:true})).toBeVisible();};
test('Teacher academic: preview, fresh subject reuse, stale revalidation and year rollover',async({page})=>{
 const f=await fixture(page);await page.clock.install();expect(f.ledger.snapshot()).toEqual([]);await start(page);await ready(page);await f.ledger.successfulBatch(0,6);const mark=f.ledger.mark();await page.getByRole('button',{name:'Toggle readers',exact:true}).click();await page.getByRole('button',{name:'Toggle readers',exact:true}).click();await ready(page);expect(f.ledger.snapshot(mark)).toEqual([]);
 await page.getByRole('button',{name:'Toggle readers',exact:true}).click();await page.clock.fastForward(301_000);f.year('2');f.name('Rollover');await page.getByRole('button',{name:'Toggle readers',exact:true}).click();await ready(page,'Rollover 1');await f.ledger.successfulBatch(mark,6);await expect(page.getByTestId('keys')).toContainText('"subject","2","1","scores"');
});
test('Teacher academic: score draft stays local; confirmed save invalidates and records show server value',async({page})=>{
 const f=await fixture(page);try{await start(page);await ready(page);await f.ledger.successfulBatch(0,6);await page.getByRole('spinbutton',{name:'Current 1 score for Practice, out of 20',exact:true}).fill('17');expect(f.writes).toEqual([]);await expect(page.getByTestId('query-state')).not.toContainText('"isInvalidated":true');await page.getByRole('button',{name:'Save',exact:true}).click();await expect.poll(()=>f.writes.length).toBe(1);expect(f.writes[0]).toEqual({path:'/api/teacherGrading/1/scores',body:{studentId:'1',itemId:'item1',value:17}});await expect(page.getByTestId('query-state')).toContainText('"isInvalidated":true');await expect(page.getByText('No items yet — tap Add Item',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Full Records',exact:true}).click();await expect(page.getByTestId('academic-location')).toHaveText('/teacher/subjects/1/records');await expect(page.locator('[data-sk-region="subject-assessment-records"]')).toHaveAttribute('data-sk-phase','settled');await expect(page.getByText('17',{exact:true}).first()).toBeVisible(); }finally{await test.info().attach('academic-request-lifecycle',{body:JSON.stringify(f.ledger.snapshot()),contentType:'application/json'});const cache=await page.evaluate(()=>(window as unknown as {__qedTeacherDiagnostics:()=>unknown}).__qedTeacherDiagnostics());await test.info().attach('academic-cache-lifecycle',{body:JSON.stringify(cache),contentType:'application/json'});}

});
test('Teacher academic: failed score save retains draft and reports failure without retry or cache publication',async({page})=>{
 const f=await fixture(page);f.saveStatus(500);await start(page);await ready(page);const input=page.getByRole('spinbutton',{name:'Current 1 score for Practice, out of 20',exact:true});await input.fill('17');await page.getByRole('button',{name:'Save',exact:true}).click();await expect.poll(()=>f.writes.length).toBe(1);await expect(page.getByText('Could not save scores. Please try again.',{exact:true})).toBeVisible();await expect(input).toHaveValue('17');await expect(page.getByText('Grades saved to Records.',{exact:true})).toHaveCount(0);await expect(page.getByTestId('query-state')).not.toContainText('"isInvalidated":true');expect(f.writes).toHaveLength(1);
});
for(const status of [401,403,500])test(`Teacher academic: ${status} preserves privacy/session and explicit Retry`,async({page})=>{
 const f=await fixture(page);f.status(status,'scores');await start(page);if(status===401){await expect(page.getByTestId('auth')).toHaveText('signed-out');return;}await expect(page.getByRole('alert')).toBeVisible();await expect(page.getByTestId('auth')).toHaveText('TEACHER:1');await expect(page.locator('[data-sk-region="assessment-student-row"]')).toHaveCount(0);f.status(200);await page.getByRole('button',{name:'Retry',exact:true}).click();await ready(page);
});
test('Teacher academic: offline initial recovery, cached records and no queued writes',async({page,context})=>{
 const f=await fixture(page);await context.setOffline(true);await start(page);await expect(page.getByRole('alert')).toContainText("You're offline");expect(f.ledger.snapshot()).toEqual([]);await context.setOffline(false);await ready(page);await f.ledger.successfulBatch(0,6);const mark=f.ledger.mark();await context.setOffline(true);await ready(page);await page.getByRole('spinbutton',{name:'Current 1 score for Practice, out of 20',exact:true}).fill('17');await page.getByRole('button',{name:'Save',exact:true}).click();expect(f.writes).toEqual([]);expect(f.ledger.snapshot(mark)).toEqual([]);await context.setOffline(false);expect(f.writes).toEqual([]);
});
test('Teacher academic: rapid subject switching cancels old requests and preserves correct roster',async({page})=>{
 const f=await fixture(page);f.hold();await start(page);await expect.poll(()=>f.ledger.snapshot().filter(r=>r.path==='/api/gradingPeriods'&&r.terminal==='finished').length).toBe(1);await expect.poll(()=>f.ledger.snapshot().filter(r=>r.path==='/api/teacherGrading/1'&&r.intercepted&&!r.terminal).length).toBe(1);await test.info().attach('rapid-before-switch.json',{body:JSON.stringify(f.ledger.snapshot()),contentType:'application/json'});const old=f.ledger.snapshot().filter(r=>r.path==='/api/teacherGrading/1'&&!r.terminal).map(r=>r.id);await page.getByRole('button',{name:'Subject 2',exact:true}).click();await test.info().attach('rapid-after-switch.json',{body:JSON.stringify(f.ledger.snapshot()),contentType:'application/json'});await expect.poll(()=>f.ledger.snapshot().filter(r=>old.includes(r.id)&&r.terminal==='aborted').length).toBe(1);f.release();await ready(page,'Current 2');await expect(page.getByText('Current 1',{exact:true})).toHaveCount(0);
});
test('Teacher academic: old pending401 cannot expire a new account',async({page})=>{
 const f=await fixture(page);await start(page);await ready(page);await f.ledger.successfulBatch(0,6);f.status(401);f.hold();await page.getByRole('button',{name:'Subject 2',exact:true}).click();await expect.poll(()=>f.ledger.snapshot().filter(r=>r.intercepted&&!r.terminal).length).toBe(1);const old=f.ledger.snapshot().filter(r=>!r.terminal).map(r=>r.id);f.status(200);f.name('New account');await page.getByRole('button',{name:'Switch account',exact:true}).click();await expect(page.getByText('Current 1',{exact:true})).toHaveCount(0);await expect.poll(()=>f.ledger.snapshot().filter(r=>old.includes(r.id)&&r.terminal==='aborted').length).toBe(1);f.release();await ready(page,'New account 2');await expect(page.getByTestId('auth')).toHaveText('TEACHER:2');await expect(page.getByTestId('keys')).not.toContainText('"TEACHER","1"');
});
test('Teacher records: navigation snapshot cannot expose prior account roster',async({page})=>{
 const f=await fixture(page);await start(page);await ready(page);await page.getByRole('button',{name:'Full Records',exact:true}).click();await expect(page.getByTestId('academic-location')).toHaveText('/teacher/subjects/1/records');await expect(page.locator('[data-sk-region="subject-assessment-records"]')).toHaveAttribute('data-sk-phase','settled');f.hold();f.name('New account');await page.getByRole('button',{name:'Switch account',exact:true}).click();await expect(page.getByText('Current 1',{exact:true})).toHaveCount(0);f.release();await expect(page.getByText('New account 1',{exact:true})).toBeVisible();await expect(page.getByTestId('auth')).toHaveText('TEACHER:2');
});
