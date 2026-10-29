import {test,expect,type Page} from '@playwright/test';
import {mockTeacher} from './fixtures/teacher';
import {requestLedger} from './fixtures/requestLedger';
// Mocked API fixtures; actual advisory grade page, Query, mutations and auth.
async function fixture(page:Page){
 const release=await mockTeacher(page,false);release();
 const ledger=requestLedger(page,p=>p.startsWith('/api/advisoryGrading/'));
 const writes:{path:string;body:unknown}[]=[];
 let status=200,failed='',saveStatus=200,year='1',firstName='Current',state='submitted',gate:Promise<void>|undefined,unlock:(()=>void)|undefined;
 await page.route('**/api/gradingPeriods',r=>r.fulfill({json:{success:true,data:[1,2].map(id=>({id:String(id),schoolYearId:year,termNumber:id,termLabel:`Term ${id}`,isActive:id===1}))}}));
 await page.route('**/api/student/allStudents',r=>r.fulfill({json:{success:true,data:[]}}));
 await page.route('**/api/advisoryGrading/**',async r=>{
  const path=new URL(r.request().url()).pathname,endpoint=path.split('/').at(-1)!;
  if(r.request().method()==='POST'){writes.push({path,body:r.request().postDataJSON()});await r.fulfill({status:saveStatus,json:{success:saveStatus===200,data:{updatedCount:1}}});return;}
  ledger.intercept(r.request());const code=failed&&failed!==endpoint?200:status,name=firstName;
  if(endpoint!=='sections')await gate;
  const student={studentId:'1',firstName:name,lastName:'Synthetic',middleName:null,gender:'F',grades:{'1':{status:state,termGrade:90,average:90,isOwnAdvisory:true},'2':{status:'submitted',termGrade:88,average:88,isOwnAdvisory:true}},overallAverage:89};
  const data=endpoint==='sections'?[1,2].map(id=>({classId:String(id),sectionName:`Section ${id}`,gradeLevel:'Grade 1'})):endpoint==='gradebook'?{sectionName:'Section 1',gradeLevel:'Grade 1',subjects:[1,2].map(id=>({subjectSectionId:String(id),subjectId:id,subjectName:id===1?'Math':'Reading',submitted:true,isOwnAdvisory:true})),students:[student]}:endpoint==='submission'?{submitted:false,submittedAt:null}:endpoint==='logs'?[]:{students:[{...student,parentName:'Synthetic Parent',parentContactNumber:null,parentEmail:null,isVisible:false,updatedAt:null}]};
  await r.fulfill({status:code,json:code===200?{success:true,data}:{success:false,message:'Synthetic grade error'}});
 });
 await page.goto('/tests/teacher-readers-query.html?grades');await expect(page.getByTestId('auth')).toHaveText('TEACHER:1');
 return {ledger,writes,status:(n:number,endpoint='')=>{status=n;failed=endpoint;},saveStatus:(n:number)=>{saveStatus=n;},year:(s:string)=>{year=s;},name:(s:string)=>{firstName=s;},state:(s:string)=>{state=s;},hold:()=>{gate=new Promise(r=>{unlock=r;});},release:()=>{unlock?.();gate=undefined;}};
}
const start=(p:Page)=>p.getByRole('button',{name:'Toggle preview',exact:true}).click();
const ready=async(p:Page,name='Current')=>{await expect(p.locator('[data-sk-region="teacher-grades-table:table-body"]')).toHaveAttribute('data-sk-phase','settled');await expect(p.getByText(`Synthetic, ${name}`,{exact:true})).toBeVisible();};
async function term(p:Page,label:string){await p.getByRole('button',{name:/^Term: Term/}).click();await p.getByRole('option',{name:label,exact:true}).click();}
test('Teacher grades: initial goldens, fresh term reuse and stale year refresh',async({page})=>{
 const f=await fixture(page);await page.clock.install();expect(f.ledger.snapshot()).toEqual([]);await start(page);await ready(page);for(const grade of ['90','88','89'])await expect(page.getByText(grade,{exact:true}).first()).toBeVisible();await f.ledger.successfulBatch(0,4);const second=f.ledger.mark();await term(page,'Term 2');await f.ledger.successfulBatch(second,3);await ready(page);const mark=f.ledger.mark();await term(page,'Term 1');await ready(page);expect(f.ledger.snapshot(mark)).toEqual([]);
 await page.getByRole('button',{name:'Toggle readers',exact:true}).click();await page.clock.fastForward(31_000);f.year('2');f.name('Rollover');await page.getByRole('button',{name:'Toggle readers',exact:true}).click();await ready(page,'Rollover');await f.ledger.successfulBatch(mark,4);await expect(page.getByTestId('keys')).toContainText('"advisory-grades","2","1","1","gradebook"');
});
test('Teacher grades: pending grade stays hidden despite numeric values in the fixture',async({page})=>{
 const f=await fixture(page);f.state('pending');await start(page);await ready(page);await expect(page.getByText('Pending',{exact:true})).toBeVisible();await expect(page.getByText('90',{exact:true})).toHaveCount(0);
});
for(const endpoint of ['gradebook','logs','submission'])test(`Teacher grades: independent ${endpoint} failure and explicit recovery`,async({page})=>{
 const f=await fixture(page);f.status(500,endpoint);await start(page);if(endpoint==='logs')await page.getByRole('button',{name:'Submission History',exact:true}).click();await expect(page.getByRole('alert')).toBeVisible();await expect(page.getByTestId('auth')).toHaveText('TEACHER:1');await expect.poll(()=>f.ledger.snapshot().filter(r=>r.terminal==='finished').length).toBe(4);f.status(200);await page.getByRole('button',{name:'Retry',exact:true}).click();await expect(page.getByRole('alert')).toHaveCount(0);if(endpoint!=='logs')await ready(page);
});
for(const status of [401,403])test(`Teacher grades: ${status} protects gradebook and session`,async({page})=>{
 const f=await fixture(page);f.status(status,'gradebook');await start(page);if(status===401)await expect(page.getByTestId('auth')).toHaveText('signed-out');else{await expect(page.getByRole('alert')).toBeVisible();await expect(page.getByTestId('auth')).toHaveText('TEACHER:1');}await expect(page.getByText('90',{exact:true})).toHaveCount(0);
});
test('Teacher grades: offline initial recovery and cached records remain visible',async({page,context})=>{
 const f=await fixture(page);await context.setOffline(true);await start(page);await expect(page.getByRole('alert')).toContainText("You're offline");expect(f.ledger.snapshot()).toEqual([]);await context.setOffline(false);await ready(page);await f.ledger.successfulBatch(0,4);const mark=f.ledger.mark();await context.setOffline(true);await ready(page);expect(f.ledger.snapshot(mark)).toEqual([]);await context.setOffline(false);await ready(page);
});
test('Teacher grades: pending old401 cancellation and account isolation',async({page})=>{
 const f=await fixture(page);await start(page);await ready(page);await f.ledger.successfulBatch(0,4);f.status(401,'gradebook');f.hold();await term(page,'Term 2');await expect.poll(()=>f.ledger.snapshot().filter(r=>r.intercepted&&!r.terminal).length).toBe(3);const old=f.ledger.snapshot().filter(r=>!r.terminal).map(r=>r.id);f.status(200);f.name('New account');await page.getByRole('button',{name:'Switch account',exact:true}).click();await expect(page.getByText('Synthetic, Current',{exact:true})).toHaveCount(0);await expect.poll(()=>f.ledger.snapshot().filter(r=>old.includes(r.id)&&r.terminal==='aborted').length).toBe(3);f.release();await ready(page,'New account');await expect(page.getByTestId('auth')).toHaveText('TEACHER:2');await expect(page.getByTestId('keys')).not.toContainText('"TEACHER","1"');
});
test('Teacher grades: confirmed submission preserves payload, revalidates history once, and never publishes pending grades',async({page})=>{
 const f=await fixture(page);await start(page);await ready(page);await f.ledger.successfulBatch(0,4);const mark=f.ledger.mark();await page.getByRole('button',{name:'Submit Class Grades',exact:true}).click();
 const confirmation=page.getByRole('alertdialog',{name:'Submit class grades?',exact:true});
 await expect(confirmation).toBeVisible();
 expect(f.writes).toHaveLength(0);
 await confirmation.getByRole('button',{name:'Submit grades',exact:true}).click();
 await expect.poll(()=>f.writes.length).toBe(1);expect(f.writes[0]).toEqual({path:'/api/advisoryGrading/submission',body:{gradingPeriodId:'1',classId:'1',expectedSubmissionVersion:null}});await expect(page.getByRole('button',{name:'Re-submit Class Grades',exact:true})).toBeVisible();await f.ledger.successfulBatch(mark,2);expect(f.ledger.snapshot(mark).map(r=>r.path)).toEqual(['/api/advisoryGrading/submission','/api/advisoryGrading/submission/logs']);
});
for(const status of [200,500])test(`Teacher visibility: ${status} preserves payload and confirmed-success-only cache invalidation`,async({page})=>{
 const f=await fixture(page);if(status===500)await page.clock.install();await start(page);await ready(page);await f.ledger.successfulBatch(0,4);await page.getByRole('button',{name:'Parent Visibility',exact:true}).click();await expect(page.getByText('Synthetic Parent',{exact:true})).toBeVisible();await f.ledger.successfulBatch(0,5);const mark=f.ledger.mark();f.saveStatus(status);await page.getByRole('button',{name:'Select all students',exact:true}).click();await page.getByRole('button',{name:'Show to Parents (1)',exact:true}).click();
 const confirmation=page.getByRole('alertdialog',{name:'Show reports to parents?',exact:true});
 await expect(confirmation).toBeVisible();
 expect(f.writes).toHaveLength(0);
 await confirmation.getByRole('button',{name:'Show reports',exact:true}).click();
 await expect.poll(()=>f.writes.length).toBe(1);expect(f.writes[0]).toEqual({path:'/api/advisoryGrading/visibility',body:{gradingPeriodId:'1',visible:true,applyToAll:true,classId:'1'}});
 if(status===200){await expect(page.getByTestId('query-state')).toContainText('"isInvalidated":true');await expect(page.getByText('Visible',{exact:true})).toBeVisible();}else{await expect(confirmation.getByRole('alert')).toHaveText('Request failed.');await expect(page.getByTestId('query-state')).not.toContainText('"isInvalidated":true');await expect(page.getByText('Visible',{exact:true})).toHaveCount(0);}
 expect(f.writes).toHaveLength(1);expect(f.ledger.snapshot(mark)).toEqual([]);
 if(status===500){
  const confirm=confirmation.getByRole('button',{name:'Show reports',exact:true});
  const cancel=confirmation.getByRole('button',{name:'Cancel',exact:true});
  const success=page.getByText('Term 1 reports shown for 1 students.',{exact:true});
  await expect(confirmation).toBeVisible();await expect(confirm).toBeEnabled();await expect(cancel).toBeEnabled();
  await expect(page.getByText('Hidden',{exact:true})).toBeVisible();await expect(success).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Retry',exact:true})).toHaveCount(0);
  // Only an explicit confirmation retries the write; another 500 remains a failure.
  await confirm.click();await expect.poll(()=>f.writes.length).toBe(2);
  expect(f.writes[1]).toEqual(f.writes[0]);await expect(confirmation.getByRole('alert')).toHaveText('Request failed.');
  await expect(confirm).toBeEnabled();await expect(cancel).toBeEnabled();
  await expect(page.getByTestId('query-state')).not.toContainText('"isInvalidated":true');
  await expect(page.getByText('Visible',{exact:true})).toHaveCount(0);await expect(success).toHaveCount(0);
  expect(f.ledger.snapshot(mark)).toEqual([]);expect(f.writes).toHaveLength(2);
  await cancel.click();await expect(confirmation).toHaveCount(0);await expect(page.getByRole('alert')).toHaveCount(0);
  expect(f.writes).toHaveLength(2);expect(f.ledger.snapshot(mark)).toEqual([]);
  // Read reconciliation is a stale-reader remount, not a replay of the failed write.
  await page.getByRole('button',{name:'Gradebook',exact:true}).click();await page.clock.fastForward(31_000);
  await page.getByRole('button',{name:'Parent Visibility',exact:true}).click();
  await expect(page.locator('[data-sk-region="teacher-grade-visibility:table-body"]')).toHaveAttribute('data-sk-phase','settled');
  await expect(page.getByText('Hidden',{exact:true})).toBeVisible();await f.ledger.successfulBatch(mark,1);
  expect(f.ledger.snapshot(mark).map(r=>r.path)).toEqual(['/api/advisoryGrading/visibility']);expect(f.writes).toHaveLength(2);
  // A later user-confirmed success is the first point that may update state/invalidate.
  const recoveryMark=f.ledger.mark();f.saveStatus(200);
  await page.getByRole('button',{name:'Select all students',exact:true}).click();
  await page.getByRole('button',{name:'Show to Parents (1)',exact:true}).click();await expect(confirmation).toBeVisible();expect(f.writes).toHaveLength(2);
  await confirm.click();await expect.poll(()=>f.writes.length).toBe(3);expect(f.writes[2]).toEqual(f.writes[0]);
  await expect(confirmation).toHaveCount(0);await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByText('Visible',{exact:true})).toBeVisible();await expect(success).toBeVisible();
  await expect(page.getByTestId('query-state')).toContainText('"isInvalidated":true');
  expect(f.ledger.snapshot(recoveryMark)).toEqual([]);expect(f.writes).toHaveLength(3);
 }
});

test('teacher gradebook pins gender headers and leaves unavailable subject grades blank',async({page})=>{
 await page.setViewportSize({width:375,height:1000});const f=await fixture(page);f.state('not_submitted');await start(page);await ready(page);
 const row=page.locator('[data-sk-region="teacher-grade-row"]').first();await expect(row.locator('td').nth(1)).toHaveText('');await expect(page.getByText('No grades yet',{exact:true})).toHaveCount(0);
 const label=page.getByRole('cell',{name:/^Female ·/});const before=(await label.boundingBox())!.x;
 await label.evaluate(element=>{let parent=element.parentElement;while(parent&&parent.scrollWidth<=parent.clientWidth)parent=parent.parentElement;if(parent)parent.scrollLeft=300;});
 await expect(label).toHaveCSS('position','sticky');expect(Math.abs((await label.boundingBox())!.x-before)).toBeLessThan(3);
});
