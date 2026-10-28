import {test,expect,type Page} from '@playwright/test';
import {mockTeacher} from './fixtures/teacher';
import {requestLedger} from './fixtures/requestLedger';

// Actual assessment UI and mutation driver; synthetic HTTP only. A lost commit
// acknowledgement is modelled with a deleted server item and an uncertain 503.
async function fixture(page:Page,status:number){
 await page.clock.setFixedTime(new Date('2026-10-09T04:00:00Z'));
 const release=await mockTeacher(page,false);release();
 const ledger=requestLedger(page,p=>p.startsWith('/api/teacherGrading/')||p.startsWith('/api/subject/getEffectiveWeights/')||p==='/api/gradingPeriods');
 const writes:{method:string;path:string;body:string|null}[]=[];let deleted=false;
 const message=status===503?'Assessment deletion could not be confirmed. Refresh this class before trying again.':'Internal server error.';
 await page.route(/\/api\/(teacherGrading|gradingPeriods|subject\/getEffectiveWeights)/,async route=>{
  const request=route.request(),path=new URL(request.url()).pathname;
  if(request.method()!=='GET'){
   writes.push({method:request.method(),path,body:request.postData()});
   if(status===200||status===503)deleted=true;
   await route.fulfill({status,json:status===200?{success:true}:{success:false,message,...(status===503?{outcome:'uncertain'}:{})}});return;
  }
  ledger.intercept(request);let data:unknown;
  if(path.endsWith('/gradingPeriods'))data=[{id:'1',schoolYearId:'1',termNumber:1,termLabel:'Term 1',isActive:true}];
  else if(path.includes('getEffectiveWeights'))data={source:'manual',ww:30,pt:50,exam:20};
  else if(path.endsWith('/items'))data=deleted?[]:[{id:'item1',tab:'writtenWorks',date:'2026-10-09',activityName:'Practice',topic:'Numbers',format:'Quiz',maxItems:20,gradingPeriodId:'1'}];
  // Saved assessments move to Full Records; this fixture uses the existing
  // Score Sheet deletion control for an assessment without saved scores.
  else if(path.endsWith('/scores'))data={};
  else if(path.endsWith('/holistic'))data={};else if(path.endsWith('/topics'))data=[];
  else data={subjectName:'Math',gradeLevel:'Grade 1',roster:[{id:'1',name:'Synthetic Learner',gender:'F'}],isOwnAdvisory:true,adviserName:'Synthetic Teacher'};
  await route.fulfill({json:{success:true,data,weekStartDate:'2026-10-05'}});
 });
 await page.goto('/tests/teacher-readers-query.html?academic');
 await expect(page.getByTestId('auth')).toHaveText('TEACHER:1');await page.getByRole('button',{name:'Toggle preview',exact:true}).click();
 await expect(page.locator('[data-sk-region="assessment-roster"]')).toHaveAttribute('data-sk-phase','settled');await ledger.successfulBatch(0,6);
 return {ledger,writes,message};
}
for(const status of [200,500,503])test(`assessment deletion ${status}: confirmation, truthful outcome and authoritative reconciliation`,async({page})=>{
 const f=await fixture(page,status),mark=f.ledger.mark();
 const selected=page.getByRole('radio',{name:/Select Practice on/});
 await selected.click();await page.getByRole('button',{name:'Delete Practice',exact:true}).click();
 const dialog=page.getByRole('alertdialog',{name:'Delete this item?',exact:true});await expect(dialog).toBeVisible();expect(f.writes).toEqual([]);
 await dialog.getByRole('button',{name:'Delete',exact:true}).click();await expect.poll(()=>f.writes.length).toBe(1);
 expect(f.writes[0]).toEqual({method:'DELETE',path:'/api/teacherGrading/1/items/item1',body:null});
 if(status===200){
  await expect(dialog).toHaveCount(0);await expect(selected).toHaveCount(0);await expect(page.getByText('Item deleted.',{exact:true})).toBeVisible();
  await expect.poll(async()=>{
   const states=JSON.parse(await page.getByTestId('query-state').innerText()) as {key:unknown[];isInvalidated:boolean}[];
   return states.filter(s=>s.key[2]==='TEACHER'&&s.key[3]==='1'&&s.key[6]==='1'&&(s.key.includes('items')||s.key.includes('scores'))).map(s=>({resource:s.key.includes('items')?'items':'scores',invalidated:s.isInvalidated})).sort((a,b)=>a.resource.localeCompare(b.resource));
  }).toEqual([{resource:'items',invalidated:true},{resource:'scores',invalidated:true}]);
 }else{
  await expect(dialog.getByRole('alert')).toHaveText(f.message);await expect(dialog.getByRole('button',{name:'Delete',exact:true})).toBeEnabled();
  await expect(page.getByText('Item deleted.',{exact:true})).toHaveCount(0);await expect(page.getByTestId('query-state')).not.toContainText('"isInvalidated":true');
  await dialog.getByRole('button',{name:'Cancel',exact:true}).click();await expect(dialog).toHaveCount(0);await expect(selected).toBeVisible();
 }
 expect(f.ledger.snapshot(mark)).toEqual([]);expect(f.writes).toHaveLength(1);
 if(status===503){
  // Follow the uncertain-outcome message with a real reload, never a DELETE replay.
  const refresh=f.ledger.mark();await page.reload();await expect(page.getByTestId('auth')).toHaveText('TEACHER:1');
  await page.getByRole('button',{name:'Toggle preview',exact:true}).click();
  await expect(page.locator('[data-sk-region="assessment-roster"]')).toHaveAttribute('data-sk-phase','settled');
  await expect(selected).toHaveCount(0);await expect(page.getByText('No items yet — tap Add Item',{exact:true})).toBeVisible();
  await f.ledger.successfulBatch(refresh,6);expect(f.ledger.snapshot(refresh).some(r=>r.path==='/api/teacherGrading/1/items')).toBe(true);
  expect(f.ledger.snapshot(refresh).some(r=>r.path==='/api/teacherGrading/1/scores')).toBe(true);expect(f.writes).toHaveLength(1);
 }
});
