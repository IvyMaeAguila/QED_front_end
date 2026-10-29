import {test,expect,type Page} from '@playwright/test';
import {mockDirectory} from './fixtures/directory';
import {waitForDataRoute} from './fixtures/routeReady';
async function fixture(page:Page,initial=true){
 await page.clock.setFixedTime(new Date('2026-10-27T04:00:00Z'));const release=await mockDirectory(page,'TEACHER',false);release();
 let done!:()=>void;const gate=new Promise<void>(r=>done=r);let fail=false;const batch:unknown[]=[],single:{studentId:string;date:string;status:string|null}[]=[];
 const data:Record<string,Record<string,string|null>>=initial?{'1':{'2026-10-27':'A'},'2':{'2026-10-27':'E'}}:{};
 await page.route('**/api/teacherAttendance/advisory-sections',route=>route.fulfill({json:[{classId:'1',sectionId:'1',sectionName:'Maroon',gradeLevel:'Grade 1',terms:[{id:'1',label:'Term 1',startDate:'2026-10-01',endDate:'2026-10-31',isActive:true}],roster:[{id:'1',name:'Student One',gender:'M'},{id:'2',name:'Student Two',gender:'F'}]}]}));
 await page.route(/\/api\/teacherAttendance\/1(?:\?|$)/,async route=>{if(route.request().method()==='GET')return route.fulfill({json:{data,termId:'1'}});const value=route.request().postDataJSON();single.push(value);await gate;if(!fail){data[value.studentId]??={};data[value.studentId][value.date]=value.status;}await route.fulfill({status:fail?500:200,json:{success:!fail,message:'Save unavailable'}});});
 await page.route('**/api/teacherAttendance/1/mark-present',async route=>{const value=route.request().postDataJSON();batch.push(value);await gate;if(!fail)for(const id of value.studentIds){data[id]??={};data[id][value.date]='P';}await route.fulfill({status:fail?500:200,json:{success:!fail,message:'Bulk save unavailable'}});});
 await page.goto('/teacher/attendance');await waitForDataRoute(page);await expect(page.getByRole('button',{name:'Mark All Present',exact:true})).toBeEnabled();
 return {batch,single,release:done,fail:(value:boolean)=>{fail=value;}};
}
test('bulk marking starts immediately, uses one request, rolls back exact marks on failure and retries the batch',async({page})=>{
 const state=await fixture(page);state.fail(true);await page.getByRole('button',{name:'Mark All Present',exact:true}).click();
 await expect(page.getByRole('alertdialog')).toHaveCount(0);await expect(page.getByRole('button',{name:'P',exact:true})).toHaveCount(2);await expect.poll(()=>state.batch.length).toBe(1);expect(state.single).toEqual([]);
 await expect(page.getByText(/Attendance saved for/)).toHaveCount(0);state.release();await expect(page.getByRole('alert')).toContainText('could not be saved');
 await expect(page.getByRole('row').filter({hasText:'Student One'}).getByRole('button',{name:'A',exact:true})).toBeVisible();await expect(page.getByRole('row').filter({hasText:'Student Two'}).getByRole('button',{name:'E',exact:true})).toBeVisible();
 state.fail(false);await page.getByRole('button',{name:'Retry failed changes'}).click();await expect(page.getByRole('alert')).toHaveCount(0);await expect(page.getByRole('button',{name:'P',exact:true})).toHaveCount(2);await expect.poll(()=>state.batch.length).toBe(2);expect(state.batch[0]).toEqual(state.batch[1]);
});
test('individual clicks update instantly through rapid cycles while saves remain ordered',async({page})=>{
 const state=await fixture(page,false);const row=page.getByRole('row').filter({hasText:'Student One'});await row.getByRole('button',{name:'Mark',exact:true}).click();await expect(row.getByRole('button',{name:'P',exact:true})).toBeVisible();
 await row.getByRole('button',{name:'P',exact:true}).click();await expect(row.getByRole('button',{name:'A',exact:true})).toBeVisible();await expect.poll(()=>state.single.length).toBe(1);state.release();await expect.poll(()=>state.single.length).toBe(2);expect(state.single.map(value=>value.status)).toEqual(['P','A']);await expect(row.getByRole('button',{name:'A',exact:true})).toBeVisible();
});
