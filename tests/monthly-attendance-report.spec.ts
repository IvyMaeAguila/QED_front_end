import { test, expect, type Page } from '@playwright/test';
import { readFileSync, mkdirSync } from 'node:fs';
import { PDFDocument } from 'pdf-lib';
import { mockDirectory } from './fixtures/directory';
import { waitForDataRoute } from './fixtures/routeReady';

function sample(month = '2026-09') {
  const dates = Array.from({length:30},(_,i)=>month+'-'+String(i+1).padStart(2,'0')).filter(d=>![0,6].includes(new Date(d+'T12:00:00Z').getUTCDay())).slice(0,22);
  return { classId:'1',schoolYearId:'1',schoolYearLabel:'2026-2027',gradeSection:'Kindergarten',month,months:['2026-09','2026-10','2026-11'],
    enrollment:{male:13,female:15,total:28},rosterCount:28,unknownGender:[] as {id:string;name:string}[],
    days:dates.map((date,i)=>({date,malePresent:i<7?12:13,femalePresent:i<12?14:15,maleAbsent:i<7?1:0,femaleAbsent:i<12?1:0,unmarked:0})),
    numberOfDays:22,sums:{male:279,female:318},ada:{male:13,female:14,total:27} as {male:number;female:number;total:number}|null,
    adviserName:'Teacher Example',principalName:'Principal Example',principalDesignation:'Acting Principal, Elementary Department',principalSource:'system' };
}
async function fixture(page:Page, dark=false, mode='sample') {
  const release=await mockDirectory(page,'TEACHER',dark);release();const writes:string[]=[];let requests=0;
  page.on('request',request=>{if(['POST','PUT','PATCH','DELETE'].includes(request.method()) && request.url().includes('/api/')) writes.push(request.url());});
  await page.route('**/api/teacherAttendance/advisory-sections',route=>route.fulfill({json:[{classId:'1',schoolYearId:'1',schoolYearLabel:'2026-2027',sectionId:'1',sectionName:'Maroon',gradeLevel:'Kindergarten',roster:[{id:'1',name:'Student One',gender:'Male'}],terms:[{id:'1',startDate:'2026-09-01',endDate:'2026-10-15',isActive:true},{id:'2',startDate:'2026-10-16',endDate:'2026-11-30',isActive:false}]}]}));
  await page.route(/\/api\/teacherAttendance\/1(?:\?|$)/,route=>route.fulfill({json:{data:{}}}));
  await page.route('**/api/teacherAttendance/1/monthly-report?*',route=>{
    requests++;const month=new URL(route.request().url()).searchParams.get('month')!;
    if(mode==='denied')return route.fulfill({status:403,json:{message:'You are not the adviser of this class.'}});
    const data=sample(month);
    if(mode==='empty'){data.days=[];data.numberOfDays=0;data.sums={male:0,female:0};data.ada=null;}
    if(mode==='incomplete'){data.days[0].unmarked=1;data.unknownGender=[{id:'99',name:'Unclassified Student'}];data.rosterCount=29;}
    return route.fulfill({json:{success:true,data}});
  });
  await page.goto('/teacher/attendance/records');await waitForDataRoute(page);
  await expect(page.getByRole('button',{name:'Monthly Report',exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'Summary',exact:true}).click();
  await page.getByRole('combobox',{name:'Month',exact:true}).selectOption('2026-09');
  await page.getByRole('button',{name:'Monthly Report',exact:true}).click();
  await page.getByRole('combobox',{name:'Report month'}).selectOption('2026-09');
  return {writes,requests:()=>requests};
}
test('editor uses system defaults; preview/download identical; report edits never write to sources and expire on close',async({page})=>{
 const state=await fixture(page);
 await expect(page.getByRole('textbox',{name:'Adviser name',exact:true})).toHaveValue('Teacher Example');
 await page.getByRole('textbox',{name:'Principal name',exact:true}).fill('Approved Principal');
 await page.getByRole('button',{name:'Preview report',exact:true}).click();
 const frame=page.locator('iframe[title="Monthly attendance PDF preview"]');await expect(frame).toBeVisible();
 const preview=await frame.getAttribute('src');
 const bytes=await page.evaluate(async url=>Array.from(new Uint8Array(await (await fetch(url!.split('#')[0])).arrayBuffer())),preview);
 const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Download PDF',exact:true}).click();const download=await pending;
 mkdirSync('monthly-report-review',{recursive:true});const path='monthly-report-review/browser-sample.pdf';await download.saveAs(path);
 expect(Buffer.from(bytes)).toEqual(readFileSync(path));
 const pdf=await PDFDocument.load(readFileSync(path));expect(pdf.getPages()).toHaveLength(1);expect(pdf.getPage(0).getWidth()).toBeCloseTo(595.32,1);expect(pdf.getForm().getFields()).toHaveLength(0);
 expect(state.writes).toEqual([]);
 await page.getByRole('button',{name:'Edit report details'}).click();await page.getByRole('button',{name:'Refresh data',exact:true}).click();await expect.poll(state.requests).toBeGreaterThan(1);
 await expect(page.getByRole('textbox',{name:'Principal name',exact:true})).toHaveValue('Approved Principal');
 await page.getByRole('button',{name:'Close dialog',exact:true}).click();
 await page.getByRole('button',{name:'Monthly Report',exact:true}).click();
 await expect(page.getByRole('textbox',{name:'Principal name',exact:true})).toHaveValue('Principal Example');
 expect(state.writes).toEqual([]);
});
test('empty month previews and downloads with blank ADA; no stale PDF after changing months',async({page})=>{
 await fixture(page,false,'empty');await expect(page.getByText('No recorded weekdays for this month.',{exact:false})).toBeVisible();
 await page.getByRole('button',{name:'Preview report',exact:true}).click();await expect(page.locator('iframe')).toBeVisible();
 const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Download PDF',exact:true}).click();await (await pending).saveAs('monthly-report-review/browser-empty.pdf');
 await page.getByRole('combobox',{name:'Report month'}).selectOption('2026-11');await expect(page.locator('iframe')).toHaveCount(0);await expect(page.getByRole('button',{name:'Download PDF',exact:true})).toHaveCount(0);
});
test('incomplete and unknown-gender warnings are explicit in a mobile dark modal',async({page})=>{
 await page.setViewportSize({width:390,height:844});await fixture(page,true,'incomplete');
 await expect(page.getByRole('alert').filter({hasText:'Incomplete attendance.'})).toBeVisible();await expect(page.getByRole('alert').filter({hasText:'Unclassified Student'})).toBeVisible();
 const dialog=page.getByRole('dialog',{name:'Monthly Attendance Report',exact:true});const box=await dialog.boundingBox();expect(box!.width).toBeLessThanOrEqual(390);expect(box!.x).toBeGreaterThanOrEqual(0);
 await page.screenshot({path:'monthly-report-review/editor-mobile-dark.png',fullPage:true});
});
test('denied report cannot preview or download',async({page})=>{
 await fixture(page,false,'denied');await expect(page.getByRole('alert').filter({hasText:'not the adviser'})).toBeVisible();await expect(page.getByRole('button',{name:'Preview report',exact:true})).toHaveCount(0);
});

test('successful attendance changes invalidate the selected class monthly report cache',async({page})=>{
 await page.clock.setFixedTime(new Date('2026-10-09T04:00:00Z'));
 const state=await fixture(page);await expect(page.getByRole('textbox',{name:'Adviser name',exact:true})).toHaveValue('Teacher Example');
 await page.getByRole('dialog',{name:'Monthly Attendance Report',exact:true}).getByRole('button',{name:'Close dialog',exact:true}).click();
 const invalidated=()=>page.evaluate(async()=>{
  const path='/src/shared/query/queryClient.ts';const {queryClient}=await import(path);
  return queryClient.getQueryCache().getAll().filter((q:{queryKey:unknown[]})=>q.queryKey.includes('monthly-attendance-report')).map((q:{state:{isInvalidated:boolean}})=>q.state.isInvalidated);
 });
 expect(await invalidated()).toContain(false);
 await page.getByRole('button',{name:'Go back',exact:true}).click();
 await page.getByRole('button',{name:'Mark',exact:true}).click();await expect(page.getByRole('button',{name:'P',exact:true})).toBeVisible();
 await expect.poll(async()=>{const flags=await invalidated();return flags.length>0&&flags.every(Boolean);}).toBe(true);expect(state.writes).toHaveLength(1);
});

test('Monthly Report belongs to the summary header and opens the selected month',async({page})=>{
 await fixture(page);
 const report=page.getByRole('dialog',{name:'Monthly Attendance Report',exact:true});
 await expect(report.getByRole('combobox',{name:'Report month'})).toHaveValue('2026-09');
 await report.getByRole('button',{name:'Close dialog',exact:true}).click();
 await page.getByRole('combobox',{name:'Month',exact:true}).selectOption('2026-11');
 const summary=page.getByRole('region',{name:'Monthly attendance summary'});
 await expect(summary.getByRole('button',{name:'Monthly Report',exact:true})).toBeEnabled();
 await page.screenshot({path:'monthly-report-review/summary-report-action.png',fullPage:true});
 await summary.getByRole('button',{name:'Monthly Report',exact:true}).click();
 await expect(report.getByRole('combobox',{name:'Report month'})).toHaveValue('2026-11');
});
