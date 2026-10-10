import { waitForDataRoute } from "./fixtures/routeReady";
import {test,expect,type Page} from '@playwright/test';
import fs from 'node:fs';
import {assertNoDataSpinner,checkRenderedContrast,checkShimmerPixels,captureFixedOverlay} from './design-pixels';
import {mockDirectory} from './fixtures/directory';
test('parent detail keeps navigation and identity labels during linked-student fetch',async({page})=>{const release=await mockDirectory(page,'PARENT',false);await page.goto('/parent/students/1');await waitForDataRoute(page);await expect(page.getByRole('button',{name:'Overview',exact:true})).toBeVisible();await expect(page.getByText('Learner',{exact:true})).toBeVisible();await expect(page.locator('[data-sk-region="parent-student-identity"]')).toHaveAttribute('data-sk-phase','revealed');await expect(page.getByText(/couldn't find a student/)).toHaveCount(0);release();});

async function detailFixture(page:Page,dark=false,count=3,long=false,locked=false) {
  const context=await mockDirectory(page,'PARENT',dark);context();
  let finish!:()=>void;let gate=new Promise<void>(r=>finish=r);let failed='';
  const text=long?'Independent exploration and application of mathematical concepts in everyday situations with classmates and teachers':'Mathematics';
  const domains={cognitive:4,emotional:3,social:4,behavioral:3};
  await page.route('**/api/**',async route=>{
    const path=new URL(route.request().url()).pathname;
    if(!/sy_term|termPerformanceProgress|holisticPerformance|attendanceSummary|attendance|weeklyHolisticEvaluation|missedActivities|classSchedule|lowGradeTopics|studentProfile/.test(path))return route.fallback();
    await gate;let body:unknown={success:true,data:[]};
    if(path.includes('sy_term'))body={success:true,data:{months:[{month:10,year:2026}]}};
    else if(path.includes('term-performance'))body={success:true,data:[1,2,3].map(termNumber=>({key:'T'+termNumber,label:'Term '+termNumber,termNumber,released:true,average:88,subjects:Array.from({length:count},(_,i)=>({subject:text+i,grade:88}))})),meta:{learner:'Ana Cruz',gradeSection:'Grade 1 Maroon',classAdviser:'Teacher One',schoolYear:'2026-2027'}};
    else if(path.endsWith('/visibility'))body={success:true,data:[1,2,3].map(termNumber=>({termNumber,available:!locked,isVisible:!locked,termEnded:!locked,termLabel:'Term '+termNumber,gradingPeriodId:termNumber}))};
    else if(path.includes('holisticPerformance'))body={success:true,data:count?[{termNumber:1,termLabel:'Term 1',isActive:true,released:true,domainAverages:domains,evaluationCount:3,riskLevel:'NONE'}]:[]};
    else if(path.includes('attendanceSummary'))body={student:{id:1},gradingPeriods:[1,2,3].map(termNumber=>({termNumber,months:Array.from({length:count},(_,i)=>({monthLabel:long?text+i:'October '+i,monthKey:'2026-10',present:18,absent:1,tardiness:1,excused:0,totalDays:20})),totals:{present:18,absent:1,tardiness:1,totalDays:20,excused:0}}))};
    else if(path.includes('weeklyHolisticEvaluation'))body={success:true,data:{current:{domainAverages:count?domains:{cognitive:null,emotional:null,social:null,behavioral:null},evaluationCount:count,lastEvaluation:null,riskLevel:'NONE'},history:[],subjects:Array.from({length:count},(_,i)=>({subjectSectionId:i,subjectName:text+i,current:{domainAverages:domains,evaluationCount:3,lastEvaluation:null}}))}};
    else if(path.includes('missedActivities'))body={missedActivities:Array.from({length:count},(_,i)=>({item_id:i,item_date:'2026-10-07',topic:text+i,subject_name:text,tab:'writtenWorks',max_items:20,score:null}))};
    else if(path.includes('classSchedule'))body=Array.from({length:count},(_,i)=>({id:String(i),subject:text+i,teacher:'Teacher One',startTime:'8:00 AM',endTime:'9:00 AM',days:['Mon','Wed']}));
    else if(path.includes('lowGradeTopics'))body={lowGradeTopics:Array.from({length:count},(_,i)=>({topic_id:i,topic_name:text,subject_name:text,average_percent:60,developing_threshold:75,mastery_threshold:85,items_scored:1}))};
    else if(path.includes('studentProfile'))body={id:'1',lastName:'Cruz',firstName:'Ana',studentId:'2026-01',lrn:'109162100100',gender:'Female',gradeLevel:'Grade 1',section:'Maroon',status:'Active',personalInformation:{dateOfBirth:'2018-05-20',residentialAddress:long?text.repeat(4):'Candelaria, Quezon',currentClass:'Grade 1 - Maroon'},extracurricularActivities:[]};
    else body={success:true,data:{student:{id:1,student_number:'2026-01',full_name:'Ana Cruz'},school_days:20,status_summary:{present:18,absent:1,late:1,excused:0}}};
    await route.fulfill({status:failed&&path.includes(failed)?500:200,json:body});
  });
  return Object.assign(()=>finish(),{hold:()=>gate=new Promise<void>(r=>finish=r),fail:(path:string)=>failed=path,recover:()=>failed=''});
}
const tabs=[['overview','Attendance Overview'],['academic','Class Schedule'],['holistic','Whole-Child Snapshot'],['progressReport','Periodic Rating'],['studentProfile','Student information']] as const;
for(const width of [375,1280])for(const dark of [false,true])test(`parent profile ${width} ${dark?'dark':'light'} keeps known class and masks unknown avatar`,async({page})=>{
  await page.setViewportSize({width,height:1100});const release=await detailFixture(page,dark);await page.goto('/parent/students/1?tab=studentProfile');await waitForDataRoute(page);
  const profile=page.locator('[data-sk-region="parent-student-profile"]');await expect(profile).toHaveAttribute('data-sk-phase','revealed');
  await expect(profile.getByText('Current class',{exact:true}).locator('..')).toContainText('Grade 1 - Maroon');
  const avatar=profile.locator('[data-sk-region="parent-profile-avatar"]');await expect(avatar.locator('[data-sk-primitive="avatar"]')).toBeVisible();await expect(avatar.locator('img')).toHaveCount(0);
  await checkRenderedContrast(avatar.locator('[data-sk-primitive="avatar"]'),`parent-profile-avatar-${width}-${dark}`);
  const verify=await captureFixedOverlay(page,`parent-profile-avatar-${width}-${dark}`,['[data-sk-region="parent-profile-avatar"]']);
  release();await expect(profile).toHaveAttribute('data-sk-phase','settled');await expect(avatar.locator('img')).toBeVisible();await verify();
});
for(const [tab,title]of tabs)for(const width of [375,1280])for(const dark of [false,true])test(`parent detail ${tab} ${width} ${dark?'dark':'light'} preserves real layout`,async({page})=>{
  await page.setViewportSize({width,height:1100});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  const release=await detailFixture(page,dark);await page.goto('/parent/students/1?tab='+tab);await waitForDataRoute(page);
  await expect(page.getByText(title,{exact:true}).first()).toBeVisible();await expect(page.locator('[data-sk-phase="revealed"]').first()).toBeVisible();await assertNoDataSpinner(page);
  fs.mkdirSync('loading-screenshots',{recursive:true});const prefix=`loading-screenshots/parent-detail-${tab}-${width}-${dark?'dark':'light'}`;
  await page.screenshot({path:prefix+'-skeleton.png',fullPage:true});release();
  await expect(page.locator('[data-sk-primitive], [data-sk-shimmer]')).toHaveCount(0);await expect(page.getByRole('alert')).toHaveCount(0);expect(errors).toEqual([]);
  await page.screenshot({path:prefix+'-loaded.png',fullPage:true});
});
for(const count of [0,1,9])for(const tab of ['academic','holistic','progressReport','studentProfile'])test(`parent variable ${tab} ${count} items and wrapping`,async({page})=>{
  const release=await detailFixture(page,false,count,count===9);await page.goto('/parent/students/1?tab='+tab);await waitForDataRoute(page);await expect(page.locator('[data-sk-phase="revealed"]').first()).toBeVisible();release();await expect(page.locator('[data-sk-primitive]')).toHaveCount(0);await expect(page.getByRole('alert')).toHaveCount(0);
});
test('locked parent report settles into unavailable state without endless shapes',async({page})=>{
  const release=await detailFixture(page,false,3,false,true);await page.goto('/parent/students/1?tab=progressReport');await waitForDataRoute(page);await expect(page.getByText('Periodic Rating',{exact:true})).toBeVisible();release();await expect(page.getByText('This progress report is not available yet.',{exact:true})).toBeVisible();await expect(page.locator('[data-sk-primitive], [data-sk-shimmer]')).toHaveCount(0);
});

for(const [tab,title]of tabs)test(`parent ${tab} reserves variable frame before reveal and swaps once`,async({page})=>{
  await page.addInitScript(()=>{
    const samples:Record<string,Array<{phase:string;rect:number[];time:number}>>={};
    (window as any).__parentGeometry=samples;
    function sample(){for(const el of document.querySelectorAll('[data-sk-region][data-sk-phase]')){
      if(el.closest('[data-sk-outgoing]'))continue;
      const name=el.getAttribute('data-sk-region')!,phase=el.getAttribute('data-sk-phase')!;
      const r=el.getBoundingClientRect();let tx=0,ty=0;
      for(let node:Element|null=el;node;node=node.parentElement){const t=getComputedStyle(node).transform;if(t!=='none'){const matrix=new DOMMatrixReadOnly(t);tx+=matrix.m41;ty+=matrix.m42;}}
      const values=[r.x-tx,r.y-ty,r.width,r.height];const list=samples[name]??=[];
      if(!list.length||list.at(-1)!.phase!==phase||values.some((v,i)=>Math.abs(v-list.at(-1)!.rect[i])>.5))list.push({phase,rect:values,time:performance.now()});
    }requestAnimationFrame(sample);}requestAnimationFrame(sample);
  });
  const release=await detailFixture(page);await page.goto('/parent/students/1?tab='+tab);await waitForDataRoute(page);
  await expect(page.getByText(title,{exact:true}).first()).toBeVisible();await expect(page.locator('[data-sk-phase="revealed"]').first()).toBeVisible();
  const nav=page.getByRole('button',{name:'Overview',exact:true});const before=await nav.boundingBox();
  release();await expect(page.locator('[data-sk-primitive]')).toHaveCount(0);expect(await nav.boundingBox()).toEqual(before);
  const samples=await page.evaluate(()=>(window as any).__parentGeometry) as Record<string,Array<{phase:string;rect:number[]}>>;
  let reservations=0;
  for(const [name,list]of Object.entries(samples)){
    const waiting=list.find(s=>s.phase==='waiting'),revealed=list.find(s=>s.phase==='revealed');
    if(!waiting||!revealed)continue;reservations++;
    expect(revealed.rect,`${name}: reveal must not move reserved geometry`).toEqual(waiting.rect);
    const pending=list.filter(s=>['waiting','revealed'].includes(s.phase));for(const sample of pending)expect(sample.rect,`${name}: pending layout remains frozen`).toEqual(waiting.rect);
    const swaps=list.filter(s=>['swapping','settled'].includes(s.phase));const distinct=swaps.filter((s,i)=>!i||s.rect.some((v,j)=>Math.abs(v-swaps[i-1].rect[j])>1));
    expect(distinct.length,`${name}: at most one final geometry`).toBeLessThanOrEqual(1);
  }
  expect(reservations).toBeGreaterThan(0);
});

for(const dark of [false,true])test(`parent rendered pixels and fixed attendance overlay ${dark}`,async({page})=>{
  const release=await detailFixture(page,dark);await page.goto('/parent/students/1');await waitForDataRoute(page);
  const region=page.locator('[data-sk-region="parent-attendance-body"]');await expect(region).toHaveAttribute('data-sk-phase','revealed');
  const shape=region.locator('[data-sk-primitive="text"]').first();await checkRenderedContrast(shape,'parent-attendance-'+dark);await checkShimmerPixels(shape,'parent-attendance-'+dark);
  const verify=await captureFixedOverlay(page,'parent-attendance-'+dark,['[data-sk-region="parent-attendance-body"] .w-42.h-42']);
  release();await expect(region).toHaveAttribute('data-sk-phase','settled');await verify();
});

for(const [tab,path]of [['academic','classSchedule'],['holistic','weeklyHolisticEvaluation'],['progressReport','term-performance'],['studentProfile','studentProfile']] as const)test(`parent ${tab} fetch failure clears shapes and retries`,async({page})=>{
  const release=await detailFixture(page);release.fail(path);await page.goto('/parent/students/1?tab='+tab);await waitForDataRoute(page);await expect(page.locator('[data-sk-phase="revealed"]').first()).toBeVisible();release();await expect(page.getByRole('alert').first()).toBeVisible();release.recover();await page.getByRole('button',{name:'Retry',exact:true}).first().click();await expect(page.getByRole('alert')).toHaveCount(0);await expect(page.locator('[data-sk-primitive]')).toHaveCount(0);
});

test('parent report auto-column marking reflects measured native content variation',async({browser})=>{
  const runs=[];
  for(const long of [false,true]){const page=await browser.newPage({viewport:{width:1280,height:1100}});const release=await detailFixture(page,false,3,long);await page.goto('/parent/students/1?tab=progressReport');await waitForDataRoute(page);await expect(page.locator('[data-sk-region="parent-progress-report"]')).toHaveAttribute('data-sk-phase','revealed');release();await expect(page.locator('[data-sk-region="parent-progress-report"]')).toHaveAttribute('data-sk-phase','settled');await expect(page.locator('[data-sk-primitive]')).toHaveCount(0);
    runs.push(await page.locator('[data-sk-auto-columns] table:not([data-sk-outgoing])').evaluateAll(tables=>tables.map(t=>Array.from(t.querySelectorAll('thead tr:first-child th')).map(c=>c.getBoundingClientRect().width))));await page.close();
  }
  expect(runs[0]).toHaveLength(2);expect(runs[1]).toHaveLength(2);
  runs[0].forEach((widths,index)=>expect(runs[1][index].some((w,i)=>Math.abs(w-widths[i])>1),`table ${index} must actually vary to qualify AUTO-COLUMN`).toBe(true));
});

test('parent report repeat visit restores native column reservations within 2px',async({page})=>{
  const release=await detailFixture(page);await page.goto('/parent/students/1?tab=progressReport');await waitForDataRoute(page);const report=page.locator('[data-sk-region="parent-progress-report"]');await expect(report).toHaveAttribute('data-sk-phase','revealed');release();await expect(report).toHaveAttribute('data-sk-phase','settled');
  const tables=()=>report.locator('[data-sk-auto-columns] table:not([data-sk-outgoing])');
  const loaded=await tables().evaluateAll(ts=>ts.map(t=>Array.from(t.querySelectorAll('thead tr:first-child th')).map(c=>c.getBoundingClientRect().width)));
  expect(loaded).toHaveLength(2);
  await page.getByRole('button',{name:'Academic',exact:true}).click();await expect(page.getByText('Class Schedule',{exact:true})).toBeVisible();await expect(page.locator('[data-sk-primitive]')).toHaveCount(0);
  await page.evaluate(async()=>{const module=await import('/src/features/profiles/parent/pages/Student/ProgressReport/service/TermPerformance.service.ts');module.clearStudentTermPerformanceProgressCache('1');});
  release.hold();await page.getByRole('button',{name:'Progress Report',exact:true}).click();await expect(report).toHaveAttribute('data-sk-phase','revealed');
  const pending=await tables().evaluateAll(ts=>ts.map(t=>Array.from(t.querySelectorAll('thead tr:first-child th')).map(c=>c.getBoundingClientRect().width)));
  expect(pending).toHaveLength(loaded.length);pending.forEach((ws,i)=>ws.forEach((w,j)=>expect(Math.abs(w-loaded[i][j]),`table ${i} column ${j}`).toBeLessThanOrEqual(2)));
  release();await expect(report).toHaveAttribute('data-sk-phase','settled');
});
