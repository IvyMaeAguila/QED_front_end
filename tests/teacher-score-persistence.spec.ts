import {test,expect,type Page} from '@playwright/test';
import {mockTeacher} from './fixtures/teacher';
import {requestLedger} from './fixtures/requestLedger';

async function fixture(page:Page,mode:string,initial:number|null=null,secondItem=false){
 await page.clock.setFixedTime(new Date('2026-10-09T04:00:00Z'));const release=await mockTeacher(page,false);release();
 let stored=initial,currentMode=mode,held:Promise<void>|undefined,unlock:(()=>void)|undefined;
 const writes:{studentId:string;itemId:string;value:number|null;expectedValue:number|null}[]=[];
 const ledger=requestLedger(page,p=>p.startsWith('/api/teacherGrading/')||p.startsWith('/api/subject/getEffectiveWeights/')||p==='/api/gradingPeriods');
 await page.route(/\/api\/(teacherGrading|gradingPeriods|subject\/getEffectiveWeights)/,async route=>{
  const request=route.request(),path=new URL(request.url()).pathname;
  if(request.method()!=='GET'){
   const body=request.postDataJSON();writes.push(body);const responseMode=currentMode;const wait=held;held=undefined;await wait;
   if(responseMode==='conflict')stored=13;
   if(responseMode==='conflict'||body.expectedValue!==stored){await route.fulfill({status:409,json:{success:false,outcome:'conflict',message:'This score changed since it was loaded. Reload this class before saving again.'}});return;}
   stored=body.value;
   if(responseMode==='network'){await route.abort('failed');return;}
   if(responseMode==='uncertain'||responseMode==='bare500'){await route.fulfill({status:responseMode==='uncertain'?503:500,json:{success:false,...(responseMode==='uncertain'?{outcome:'uncertain'}:{}),message:'Score saving could not be confirmed. Reload this class to check the stored score before saving again.'}});return;}
   await route.fulfill({json:{success:true}});return;
  }
  ledger.intercept(request);let data:unknown;
  if(path.endsWith('/gradingPeriods'))data=[{id:'1',schoolYearId:'1',termNumber:1,termLabel:'Term 1',isActive:true}];
  else if(path.includes('getEffectiveWeights'))data={source:'manual',ww:30,pt:50,exam:20};
  else if(path.endsWith('/items'))data=[{id:'item1',tab:'writtenWorks',date:'2026-10-09',activityName:'Practice',topic:'Numbers',format:'Quiz',maxItems:20,gradingPeriodId:'1'},...(secondItem?[{id:'item2',tab:'writtenWorks',date:'2026-10-09',activityName:'Practice 2',topic:'Numbers',format:'Quiz',maxItems:20,gradingPeriodId:'1'}]:[])];
  else if(path.endsWith('/scores'))data=stored===null?{}:{'1':{item1:stored}};
  else if(path.endsWith('/holistic'))data={};else if(path.endsWith('/topics'))data=[];
  else data={subjectName:'Math',gradeLevel:'Grade 1',roster:[{id:'1',name:'Synthetic Learner',gender:'F'}],isOwnAdvisory:true,adviserName:'Synthetic Teacher'};
  await route.fulfill({json:{success:true,data,weekStartDate:'2026-10-05'}});
 });
 await page.goto('/tests/teacher-readers-query.html?academic');await expect(page.getByTestId('auth')).toHaveText('TEACHER:1');
 await page.getByRole('button',{name:'Toggle preview',exact:true}).click();await expect(page.locator('[data-sk-region="assessment-roster"]')).toHaveAttribute('data-sk-phase','settled');await ledger.successfulBatch(0,6);
 return {writes,ledger,stored:()=>stored,mode:(m:string)=>{currentMode=m;},hold:()=>{held=new Promise(resolve=>{unlock=resolve;});},release:()=>unlock?.()};
}
async function records(page:Page){await page.getByRole('button',{name:'Full Records',exact:true}).click();await expect(page.locator('[data-sk-region="subject-assessment-records"]')).toHaveAttribute('data-sk-phase','settled');}
async function reload(page:Page){
 const wasRecords=(await page.getByTestId('academic-location').innerText()).endsWith('/records');
 page.once('dialog',dialog=>dialog.accept());await page.reload();await expect(page.getByTestId('auth')).toHaveText('TEACHER:1');await page.getByRole('button',{name:'Toggle preview',exact:true}).click();
 // This existing test harness uses MemoryRouter, which starts at the subject
 // page on reload. Reopen Records through its real navigation control.
 if(wasRecords){await expect(page.locator('[data-sk-region="assessment-roster"]')).toHaveAttribute('data-sk-phase','settled');await records(page);}
}
for(const mode of ['uncertain','bare500','network'])test(`Score Sheet ${mode}: retained draft, no replay, authoritative reload`,async({page})=>{
 const f=await fixture(page,mode),input=page.getByRole('spinbutton',{name:'Synthetic Learner score for Practice, out of 20',exact:true});
 await input.fill('17');await page.getByRole('button',{name:'Save',exact:true}).click();await expect.poll(()=>f.writes.length).toBe(1);
 expect(f.writes[0]).toEqual({studentId:'1',itemId:'item1',value:17,expectedValue:null});
 await expect(page.getByText(/Score saving could not be confirmed/).first()).toBeVisible();await expect(input).toHaveValue('17');
 await expect(page.getByText('Could not save scores. Please try again.',{exact:true})).toHaveCount(0);await expect(page.getByText('Grades saved to Records.',{exact:true})).toHaveCount(0);
 await expect(page.getByTestId('query-state')).not.toContainText('"isInvalidated":true');
 await input.fill('18');await page.getByRole('button',{name:'Save',exact:true}).click();await expect(page.getByText(/Score state needs reconciliation/).first()).toBeVisible();
 await expect(input).toHaveValue('18');expect(f.writes).toHaveLength(1);expect(f.stored()).toBe(17);
 const mark=f.ledger.mark();f.mode('success');await reload(page);await expect(page.locator('[data-sk-region="assessment-roster"]')).toHaveAttribute('data-sk-phase','settled');
 await records(page);await expect(page.getByText('17',{exact:true}).first()).toBeVisible();expect(f.ledger.snapshot(mark).some(r=>r.path.endsWith('/scores')&&r.terminal==='finished')).toBe(true);expect(f.writes).toHaveLength(1);
 await page.getByRole('button',{name:'Edit Records',exact:true}).click();await page.getByRole('spinbutton').first().fill('18');await expect(page.getByText('All changes saved.',{exact:true})).toBeVisible();
 expect(f.writes).toHaveLength(2);expect(f.writes[1]).toEqual({studentId:'1',itemId:'item1',value:18,expectedValue:17});expect(f.stored()).toBe(18);
});
test('E-record uncertain result blocks queued/retried writes and preserves the newest unsaved edit',async({page})=>{
 const f=await fixture(page,'uncertain',10);await records(page);await page.getByRole('button',{name:'Edit Records',exact:true}).click();const input=page.getByRole('spinbutton').first();
 f.hold();await input.fill('5');await expect.poll(()=>f.writes.length).toBe(1);await input.fill('8');await expect(input).toHaveValue('8');expect(f.writes).toHaveLength(1);
 f.release();await expect(page.getByRole('alert')).toContainText('reconciliation');await expect(page.getByRole('button',{name:'Retry failed changes',exact:true})).toHaveCount(0);
 await expect(page.getByText('All changes saved.',{exact:true})).toHaveCount(0);await expect(input).toHaveValue('8');expect(f.stored()).toBe(5);expect(f.writes).toHaveLength(1);
 await input.fill('9');await expect(page.getByRole('alert')).toContainText('Reload this class');await expect(input).toHaveValue('9');expect(f.writes).toHaveLength(1);
 f.mode('success');await reload(page);await expect(page.locator('[data-sk-region="subject-assessment-records"]')).toHaveAttribute('data-sk-phase','settled');await expect(page.getByText('5',{exact:true}).first()).toBeVisible();expect(f.writes).toHaveLength(1);
});
test('E-record confirmed sequential edits use the last acknowledged score without overwriting a newer draft',async({page})=>{
 const f=await fixture(page,'success',10);await records(page);await page.getByRole('button',{name:'Edit Records',exact:true}).click();const input=page.getByRole('spinbutton').first();
 f.hold();await input.fill('5');await expect.poll(()=>f.writes.length).toBe(1);await input.fill('8');await expect(input).toHaveValue('8');expect(f.writes).toHaveLength(1);f.release();
 await expect(page.getByText('All changes saved.',{exact:true})).toBeVisible();await expect(input).toHaveValue('8');expect(f.writes).toEqual([{studentId:'1',itemId:'item1',value:5,expectedValue:10},{studentId:'1',itemId:'item1',value:8,expectedValue:5}]);expect(f.stored()).toBe(8);
});
test('E-record conflicting external edit is not overwritten by an old value or retry',async({page})=>{
 const f=await fixture(page,'conflict',10);await records(page);await page.getByRole('button',{name:'Edit Records',exact:true}).click();const input=page.getByRole('spinbutton').first();await input.fill('5');
 await expect(page.getByRole('alert')).toContainText('reconciliation');await expect(page.getByRole('alert')).toContainText('changed since it was loaded');await expect(input).toHaveValue('5');
 await expect(page.getByRole('button',{name:'Retry failed changes',exact:true})).toHaveCount(0);expect(f.writes).toHaveLength(1);expect(f.stored()).toBe(13);
 await input.fill('6');await expect(input).toHaveValue('6');expect(f.writes).toHaveLength(1);f.mode('success');await reload(page);
 await expect(page.locator('[data-sk-region="subject-assessment-records"]')).toHaveAttribute('data-sk-phase','settled');await expect(page.getByText('13',{exact:true}).first()).toBeVisible();expect(f.writes).toHaveLength(1);
});
test('Score Sheet does not send queued actions after the owning page unmounts',async({page})=>{
 const f=await fixture(page,'success',null,true);f.hold();
 await page.getByRole('spinbutton',{name:'Synthetic Learner score for Practice, out of 20',exact:true}).fill('17');
 await page.getByRole('spinbutton',{name:'Synthetic Learner score for Practice 2, out of 20',exact:true}).fill('18');
 await page.getByRole('button',{name:'Save',exact:true}).click();await expect.poll(()=>f.writes.length).toBe(1);
 await page.getByRole('button',{name:'Toggle readers',exact:true}).click();await expect(page.locator('[data-sk-region="assessment-roster"]')).toHaveCount(0);f.release();
 await expect.poll(()=>f.stored()).toBe(17);await expect(page.getByTestId('query-state')).toContainText('"isInvalidated":true');
 await page.getByRole('button',{name:'Toggle readers',exact:true}).click();await expect(page.locator('[data-sk-region="assessment-roster"]')).toHaveAttribute('data-sk-phase','settled');
 await expect(page.getByRole('spinbutton',{name:'Synthetic Learner score for Practice 2, out of 20',exact:true})).toHaveValue('');expect(f.writes).toHaveLength(1);
});
