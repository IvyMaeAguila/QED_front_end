import {test,expect} from '@playwright/test';
import {AttendanceSaveQueue} from '../src/features/profiles/teacher/query/attendanceSaveQueue';
import {mockDirectory} from './fixtures/directory';
import {waitForDataRoute} from './fixtures/routeReady';
test('queue preserves latest intent, retries failures and stops queued work after session ends',async()=>{
 const q=new AttendanceSaveQueue();let release!:()=>void;const gate=new Promise<void>(r=>release=r),seen:string[]=[];
 const first=q.enqueue('1','1:date',async()=>{seen.push('first');await gate;});await Promise.resolve();await Promise.resolve();
 const old=q.enqueue('1','1:date',async()=>{seen.push('obsolete');});
 const last=q.enqueue('1','1:date',async()=>{seen.push('latest');throw Error('Unavailable');});release();await Promise.all([first,old,last]);
 expect(seen).toEqual(['first','latest']);expect(q.snapshot().filter(j=>j.state==='failed')).toHaveLength(1);
 q.active=false;q.retry();expect(q.snapshot()).toHaveLength(1);
 await q.enqueue('2','1:date',async()=>{seen.push('wrong-session');});expect(seen).not.toContain('wrong-session');
});
test('bulk saves wait for previous cells and later cell saves wait for bulk',async()=>{
 const q=new AttendanceSaveQueue(),seen:string[]=[];
 await Promise.all([q.enqueue('1','1:d',async()=>{seen.push('cell');}),q.enqueue('1','bulk-present:d',async()=>{seen.push('bulk');}),q.enqueue('1','2:d',async()=>{seen.push('later');})]);
 expect(seen).toEqual(['cell','bulk','later']);
});
test('rapid attendance saves continue after leaving Today and remain visible on return',async({page})=>{
 await page.clock.setFixedTime(new Date('2026-10-27T04:00:00Z'));const releaseDirectory=await mockDirectory(page,'TEACHER',false);releaseDirectory();
 let release!:()=>void;const gate=new Promise<void>(r=>release=r),writes:string[]=[];let status:string|null=null,failNext=false;
 await page.route('**/api/teacherAttendance/advisory-sections',r=>r.fulfill({json:[{classId:'1',sectionId:'1',sectionName:'Maroon',gradeLevel:'Grade 1',terms:[{id:'1',label:'Term 1',startDate:'2026-10-01',endDate:'2026-10-31',isActive:true}],roster:[{id:'1',name:'Student One',gender:'M'}]}]}));
 await page.route(/\/api\/teacherAttendance\/1(?:\?|$)/,async r=>{if(r.request().method()==='GET')return r.fulfill({json:{termId:'1',data:{'1':{'2026-10-27':status}}}});const body=r.request().postDataJSON();writes.push(body.status);await gate;if(failNext){failNext=false;return r.fulfill({status:500,json:{message:'Save unavailable'}});}status=body.status;await r.fulfill({json:{success:true}});});
 await page.goto('/teacher/attendance');await waitForDataRoute(page);
 const row=page.getByRole('row').filter({hasText:'Student One'});await row.getByRole('button',{name:'Mark',exact:true}).click();await expect.poll(()=>writes.length).toBe(1);
 await row.getByRole('button',{name:'P',exact:true}).click();
 await page.getByRole('button',{name:'Full Records',exact:true}).click();await expect(page).toHaveURL(/attendance\/records/);
 await expect(page.getByText(/Saving .* attendance change/)).toBeVisible();await expect(page.getByRole('alertdialog')).toHaveCount(0);
 await page.getByRole('button',{name:'Summary',exact:true}).click();release();await expect.poll(()=>writes.length).toBe(2);expect(writes).toEqual(['P','A']);
 await expect(page.getByText(/Saving .* attendance change/)).toHaveCount(0);
 await page.getByRole('button',{name:'Go back',exact:true}).click();await expect(row.getByRole('button',{name:'A',exact:true})).toBeVisible();
 failNext=true;await row.getByRole('button',{name:'A',exact:true}).click();await page.getByRole('button',{name:'Full Records',exact:true}).click();
 await expect(page.getByRole('alert')).toContainText('could not be saved');
 await page.getByRole('button',{name:'Retry failed changes',exact:true}).click();await expect(page.getByRole('alert')).toHaveCount(0);
 expect(writes).toEqual(['P','A','L','L']);
});
