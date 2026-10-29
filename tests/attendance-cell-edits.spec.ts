import {test,expect,type Page} from '@playwright/test';
import {mockDirectory} from './fixtures/directory';
import {waitForDataRoute} from './fixtures/routeReady';

type Mark={studentId:string;date:string;status:string|null;term:string};
async function fixture(page:Page,failures:number[]=[]) {
 await page.clock.setFixedTime(new Date('2026-10-09T04:00:00Z'));
 const release=await mockDirectory(page,'TEACHER',false);release();
 let unlock!:()=>void;const gate=new Promise<void>(resolve=>{unlock=resolve;});
 const writes:Mark[]=[];const failing=new Set(failures);let complete=0;
 const maps:Record<string,Record<string,Record<string,string|null>>>={'1':{},'2':{'1':{'2026-10-09':'E'}}};
 await page.route('**/api/teacherAttendance/advisory-sections',route=>route.fulfill({json:[1,2].map(id=>({classId:String(id),sectionId:String(id),sectionName:id===1?'Maroon':'White',gradeLevel:'Grade 1',terms:[{id:'1',label:'Term 1',termNumber:1,startDate:'2026-10-01',endDate:'2026-10-31',isActive:true}],roster:[{id:'1',name:id===1?'Student One':'White Student',gender:'M'},{id:'2',name:'Student Two',gender:'F'}]}))}));
 await page.route(/\/api\/teacherAttendance\/[12](?:\?|$)/,async route=>{
  const classId=new URL(route.request().url()).pathname.split('/').at(-1)!;
  if(route.request().method()==='GET')return route.fulfill({json:{data:maps[classId]}});
  const mark=route.request().postDataJSON() as Mark;writes.push(mark);const index=writes.length;
  await gate;
  const failed=failing.has(index);
  if(!failed){maps[classId][mark.studentId]??={};maps[classId][mark.studentId][mark.date]=mark.status;}
  await route.fulfill({status:failed?500:200,json:{success:!failed}});complete++;
 });
 await page.goto('/teacher/attendance/records');await waitForDataRoute(page);
 const region=page.locator('[data-sk-region="attendance-records-table"]');await expect(region).toHaveAttribute('data-sk-phase','settled');
 return {writes,release:unlock,success:()=>failing.clear(),complete:()=>complete,region,maps};
}
const cell=(page:Page,id='1')=>page.locator('button[data-attendance-date="2026-10-09"][data-attendance-student="'+id+'"]');

test('attendance edits cycle immediately through rapid clicks, serialize requests and keep the table stable',async({page})=>{
 const state=await fixture(page);const target=cell(page);
 const heading=page.getByRole('heading',{name:'Attendance Records',exact:true}).last();const before=(await heading.boundingBox())!.y;
 for(const value of ['P','A','L','E','·','P']){await target.click();await expect(target).toHaveText(value);}
 await expect.poll(()=>state.writes.length).toBe(1);await expect(target).toHaveAttribute('aria-busy','true');
 await expect(state.region).toHaveAttribute('data-sk-phase','settled');await expect(state.region.locator('[data-sk-primitive]')).toHaveCount(0);
 await expect(page.getByText('All changes saved.',{exact:true})).toHaveCount(0);await expect(page.getByText(/Saving .* attendance change/)).toBeVisible();
 expect(Math.abs((await heading.boundingBox())!.y-before)).toBeLessThan(1);
 state.release();await expect.poll(state.complete).toBe(2);await expect(target).toHaveAttribute('aria-busy','false');await expect(target).toHaveText('P');
 expect(state.writes.map(w=>w.status)).toEqual(['P','P']);expect(state.maps['1']['1']['2026-10-09']).toBe('P');
 expect(Math.abs((await heading.boundingBox())!.y-before)).toBeLessThan(1);
});
test('attendance edits on independent cells save independently without a table loading state',async({page})=>{
 const state=await fixture(page);await cell(page).click();await cell(page,'2').click();
 await expect.poll(()=>state.writes.length).toBe(2);await expect(cell(page)).toHaveText('P');await expect(cell(page,'2')).toHaveText('P');await expect(state.region).toHaveAttribute('data-sk-phase','settled');
 state.release();await expect.poll(state.complete).toBe(2);
});
test('attendance edits roll back only the failed latest value and retry the intended status',async({page})=>{
 const state=await fixture(page,[2]);const target=cell(page);
 for(const value of ['P','A','L']){await target.click();await expect(target).toHaveText(value);}
 state.release();await expect.poll(state.complete).toBe(2);await expect(target).toHaveText('P');await expect(page.getByRole('alert')).toContainText('could not be saved');
 state.success();await page.getByRole('button',{name:'Retry failed changes',exact:true}).click();await expect(target).toHaveText('L');await expect.poll(state.complete).toBe(3);await expect(page.getByRole('alert')).toHaveCount(0);
 expect(state.writes.map(w=>w.status)).toEqual(['P','L','L']);await expect(page.getByText('All changes saved.',{exact:true})).toHaveCount(0);
});
test('attendance edits cannot apply an old class response to a newly selected class',async({page})=>{
 const state=await fixture(page);await cell(page).click();await expect.poll(()=>state.writes.length).toBe(1);
 await page.getByRole('button',{name:'White',exact:true}).click();
 await expect(page.getByRole('alertdialog')).toHaveCount(0);
 await expect(page.getByText('White Student',{exact:true})).toBeVisible();await expect(state.region).toHaveAttribute('data-sk-phase','settled');await expect(cell(page)).toHaveText('E');
 state.release();await expect.poll(state.complete).toBe(1);await expect(cell(page)).toHaveText('E');
});
