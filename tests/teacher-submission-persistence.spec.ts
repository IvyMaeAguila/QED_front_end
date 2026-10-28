import {test,expect,type Page} from '@playwright/test';
import {mockTeacher} from './fixtures/teacher';
type Kind='subject'|'advisory';
async function fixture(page:Page,kind:Kind,initialMode:string){
 const release=await mockTeacher(page,false);release();let mode=initialMode,version:string|null=null,logsFail=false,hold:Promise<void>|undefined,unlock:(()=>void)|undefined;
 const writes:{path:string;body:unknown}[]=[],reads:string[]=[];const student={studentId:'1',firstName:'Synthetic',lastName:'Learner',middleName:null,gender:'F',grades:{'1':{status:'submitted',average:85,termGrade:85,isOwnAdvisory:false}},overallAverage:85};
 await page.route(/\/api\/(teacherGrading|advisoryGrading|gradingPeriods|subject\/getEffectiveWeights)/,async r=>{
  const request=r.request(),path=new URL(request.url()).pathname;
  if(request.method()!=='GET'){
   writes.push({path,body:request.postDataJSON()});const current=mode;await hold;
   if(current==='not_saved'){await r.fulfill({status:500,json:{success:false,outcome:'not_saved',message:'Grade submission was not saved. Please try again.'}});return;}
   if(current==='conflict'){version='9';await r.fulfill({status:409,json:{success:false,outcome:'conflict',message:'Submission state changed. Reload this class to check its submission status and history before submitting again.'}});return;}
   version=String(Number(version??0)+1);
   if(current==='network'){await r.abort('failed');return;}
   if(current==='uncertain'||current==='bare500'){await r.fulfill({status:current==='uncertain'?503:500,json:{success:false,...(current==='uncertain'?{outcome:'uncertain'}:{}),message:'Grade submission could not be confirmed.'}});return;}
   await r.fulfill({json:{success:true,...(current==='notice_failed'?{notificationDelivery:'failed'}:{})}});return;
  }
  reads.push(path);let data:unknown;
  if(path.endsWith('/gradingPeriods'))data=[{id:'1',schoolYearId:'1',termNumber:1,termLabel:'Term 1',isActive:true}];
  else if(path.endsWith('/submission'))data={submitted:version!==null,submittedAt:version?'2026-10-21T04:00:00Z':null,submissionVersion:version};
  else if(path.endsWith('/logs')){if(logsFail){await r.fulfill({status:500,json:{success:false,message:'History temporarily unavailable.'}});return;}data=version?[{id:Number(version),type:'advisory',label:'Advisory gradebook',submittedByName:'Synthetic Teacher',submittedAt:'2026-10-21T04:00:00Z'}]:[];}
  else if(path.endsWith('/sections'))data=[{classId:'1',sectionName:'Synthetic Section',gradeLevel:'Grade 1'}];
  else if(path.endsWith('/gradebook'))data={sectionName:'Synthetic Section',gradeLevel:'Grade 1',subjects:[{subjectSectionId:'1',subjectId:1,subjectName:'Math',submitted:true,isOwnAdvisory:false}],students:[student]};
  else if(path.includes('getEffectiveWeights'))data={source:'template',templateId:1,ww:100,pt:0,exam:0,templateStructure:{ww:{domains:[]},pt:{domains:[]},examinations:{enabled:false,components:[]},transmutationTable:[{igMin:0,igMax:100,transmuted:85}],descriptorTable:[]}};
  else if(path.endsWith('/items'))data=[{id:'item1',tab:'writtenWorks',date:'2026-10-09',activityName:'Practice',maxItems:20,gradingPeriodId:'1'}];
  else if(path.endsWith('/scores'))data={'1':{item1:17}};
  else if(path.endsWith('/topics'))data=[];
  else data={subjectName:'Math',gradeLevel:'Grade 1',roster:[{id:'1',name:'Synthetic Learner',gender:'F'}],isOwnAdvisory:false,adviserName:'Synthetic Adviser'};
  await r.fulfill({json:{success:true,data}});
 });
 async function ready(){await expect(page.getByTestId('auth')).toHaveText('TEACHER:1');await page.getByRole('button',{name:'Toggle preview',exact:true}).click();
  if(kind==='subject'){await expect(page.locator('[data-sk-region="assessment-roster"]')).toHaveAttribute('data-sk-phase','settled');await page.getByRole('button',{name:'Full Records',exact:true}).click();await expect(page.locator('[data-sk-region="subject-assessment-records"]')).toHaveAttribute('data-sk-phase','settled');}
  else await expect(page.getByText('Learner, Synthetic',{exact:true})).toBeVisible();
 }
 await page.goto('/tests/teacher-readers-query.html?'+(kind==='subject'?'academic':'grades'));await ready();
 const dialog=()=>page.getByRole('alertdialog',{name:kind==='subject'?'Confirm Submission':/Submit class grades\?|Re-submit class grades\?/});
 const confirm=()=>dialog().getByRole('button',{name:kind==='subject'?'Confirm & Submit':/^(?:Re-submit|Submit) grades$/});
 async function open(){await page.getByRole('button',{name:kind==='subject'?'Submit Grades':/^(?:Re-submit|Submit) Class Grades$/,exact:true}).click();await expect(dialog()).toBeVisible();}
 return {writes,reads,dialog,confirm,open,mode:(m:string)=>{mode=m;},version:()=>version,logsFail:()=>{logsFail=true;},hold:()=>{hold=new Promise(r=>{unlock=r;});},release:()=>{hold=undefined;unlock?.();},reload:async()=>{await page.reload();await ready();}};
}
for(const kind of ['subject','advisory'] as const){
 test(`${kind} confirmed submission succeeds with notification failure, and deliberate resubmission uses current history version`,async({page})=>{
  const f=await fixture(page,kind,'notice_failed');await f.open();expect(f.writes).toHaveLength(0);await f.confirm().click();await expect(f.dialog()).toHaveCount(0);expect(f.writes[0]).toEqual({path:kind==='subject'?'/api/teacherGrading/1/submission':'/api/advisoryGrading/submission',body:{gradingPeriodId:'1',...(kind==='advisory'?{classId:'1'}:{}),expectedSubmissionVersion:null}});await expect(page.getByTestId('query-state')).toContainText('"isInvalidated":true');
  await f.open();if(kind==='subject')await expect(f.dialog()).toContainText('A submission is already recorded');expect(f.writes).toHaveLength(1);await f.confirm().click();await expect(f.dialog()).toHaveCount(0);expect(f.writes[1].body).toEqual({gradingPeriodId:'1',...(kind==='advisory'?{classId:'1'}:{}),expectedSubmissionVersion:'1'});expect(f.version()).toBe('2');expect(f.writes.every(w=>!w.path.endsWith('/visibility'))).toBe(true);
 });
 test(`${kind} definite failure remains visible and retries only through explicit confirmation`,async({page})=>{
  const f=await fixture(page,kind,'not_saved');await f.open();await f.confirm().click();await expect(f.dialog()).toBeVisible();await expect(page.getByText('Grade submission was not saved. Please try again.',{exact:true}).first()).toBeVisible();expect(f.writes).toHaveLength(1);expect(f.version()).toBeNull();await expect(page.getByTestId('query-state')).not.toContainText('"isInvalidated":true');
  f.mode('success');await f.confirm().click();await expect(f.dialog()).toHaveCount(0);expect(f.writes).toHaveLength(2);expect(f.writes[1]).toEqual(f.writes[0]);
 });
 for(const mode of ['uncertain','bare500','network','conflict'])test(`${kind} ${mode} retains truthful state, blocks replay across remount, reconciles on reload`,async({page})=>{
  const f=await fixture(page,kind,mode);await f.open();await f.confirm().click();await expect(page.getByText(/Reload this class to check/).first()).toBeVisible();await expect(f.dialog()).toBeVisible();expect(f.writes).toHaveLength(1);expect(f.version()).not.toBeNull();await expect(page.getByText(kind==='subject'?"Grades submitted to the adviser's gradesheet.":'Class grades submitted.',{exact:true})).toHaveCount(0);
  await f.confirm().click();expect(f.writes).toHaveLength(1);await f.dialog().getByRole('button',{name:'Cancel',exact:true}).click();await page.getByRole('button',{name:'Toggle readers',exact:true}).click();await page.getByRole('button',{name:'Toggle readers',exact:true}).click();if(kind==='subject'){await expect(page.locator('[data-sk-region="assessment-roster"]')).toHaveAttribute('data-sk-phase','settled');await page.getByRole('button',{name:'Full Records',exact:true}).click();await expect(page.locator('[data-sk-region="subject-assessment-records"]')).toHaveAttribute('data-sk-phase','settled');}else await expect(page.getByText('Learner, Synthetic',{exact:true})).toBeVisible();
  await f.open();await f.confirm().click();await expect(page.getByText(/Reload this class to check/).first()).toBeVisible();expect(f.writes).toHaveLength(1);const stored=f.version();f.mode('success');await f.reload();expect(f.writes).toHaveLength(1);if(kind==='advisory')await expect(page.getByRole('button',{name:'Re-submit Class Grades',exact:true})).toBeVisible();await f.open();if(kind==='subject')await expect(f.dialog()).toContainText('A submission is already recorded');await f.confirm().click();await expect(f.dialog()).toHaveCount(0);expect(f.writes).toHaveLength(2);expect((f.writes[1].body as {expectedSubmissionVersion:string}).expectedSubmissionVersion).toBe(stored);
 });
 test(`${kind} double confirmation sends one request`,async({page})=>{const f=await fixture(page,kind,'success');f.hold();await f.open();await f.confirm().dblclick();await expect.poll(()=>f.writes.length).toBe(1);f.release();await expect(f.dialog()).toHaveCount(0);expect(f.writes).toHaveLength(1);});
}
test('advisory committed submission remains successful if history refresh fails',async({page})=>{const f=await fixture(page,'advisory','success');f.logsFail();await f.open();await f.confirm().click();await expect(f.dialog()).toHaveCount(0);await expect(page.getByRole('button',{name:'Re-submit Class Grades',exact:true})).toBeVisible();await expect(page.getByText(/Class grades submitted, but submission history could not be refreshed/)).toBeVisible();expect(f.writes).toHaveLength(1);});
