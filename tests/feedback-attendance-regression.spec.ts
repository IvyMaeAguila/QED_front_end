import {test,expect} from '@playwright/test';
import {mockDirectory} from './fixtures/directory';
import {waitForDataRoute} from './fixtures/routeReady';
test('attendance failed save is retryable; bulk cancellation writes nothing and partial success is explicit',async({page})=>{
  await page.clock.setFixedTime(new Date('2026-10-09T04:00:00Z'));
  const release=await mockDirectory(page,'TEACHER',false);release();
  let writes=0,fail=true;
  await page.route('**/api/teacherAttendance/advisory-sections',r=>r.fulfill({json:[{classId:'1',sectionId:'1',sectionName:'Maroon',gradeLevel:'Grade 1',terms:[{id:'1',termNumber:1,label:'Term 1',startDate:'2026-01-01',endDate:'2027-12-31',isActive:true}],roster:[{id:'1',name:'Learner One',gender:'F'},{id:'2',name:'Learner Two',gender:'M'}]}]}));
  await page.route(/\/api\/teacherAttendance\/1(?:\?|$)/,r=>{
    if(r.request().method()==='POST'){writes++;return r.fulfill({status:fail?500:200,json:{success:!fail,message:'Attendance save rejected'}})}
    return r.fulfill({json:{data:{}}});
  });
  await page.route('**/api/teacherAttendance/1/mark-present',r=>{writes++;return r.fulfill({status:fail?500:200,json:{success:!fail,message:'Attendance save rejected'}});});
  await page.goto('/teacher/attendance');await waitForDataRoute(page);
  const row=page.getByRole('row').filter({hasText:'Learner One'});
  await row.getByRole('button',{name:'Mark',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('could not be saved');
  await expect(row.getByRole('button',{name:'Mark',exact:true})).toBeVisible();
  fail=false;await page.getByRole('button',{name:'Retry failed changes',exact:true}).click();
  await expect(row.getByRole('button',{name:'P',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Mark All Present',exact:true}).click();
  const dialog=page.getByRole('alertdialog',{name:'Mark all present?',exact:true});
  await expect(dialog).toContainText('1 student');const before=writes;
  await dialog.getByRole('button',{name:'Cancel',exact:true}).click();expect(writes).toBe(before);
  fail=true;await page.getByRole('button',{name:'Mark All Present',exact:true}).click();
  await dialog.getByRole('button',{name:'Mark present',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('could not be saved');
  await expect(dialog).toHaveCount(0);await expect(page.getByText('All changes saved.',{exact:true})).toHaveCount(0);
});
for(const [width,dark] of [[1280,false],[390,true]] as const)test(`bulk attendance confirmation ${width} has standard spacing and a stable saving state`,async({page})=>{
 await page.setViewportSize({width,height:950});await page.clock.setFixedTime(new Date('2026-10-27T04:00:00Z'));
 const release=await mockDirectory(page,'TEACHER',dark);release();let finish!:()=>void;const gate=new Promise<void>(resolve=>finish=resolve);let writes=0;
 await page.route('**/api/teacherAttendance/advisory-sections',route=>route.fulfill({json:[{classId:'1',sectionId:'1',sectionName:'Maroon',gradeLevel:'Grade 1',terms:[{id:'1',label:'Term 1',startDate:'2026-10-01',endDate:'2026-10-31',isActive:true}],roster:[{id:'1',name:'Learner One',gender:'M'},{id:'2',name:'Learner Two',gender:'F'}]}]}));
 await page.route(/\/api\/teacherAttendance\/1(?:\?|$)/,async route=>{if(route.request().method()==='POST'){writes++;await gate;return route.fulfill({json:{success:true}});}return route.fulfill({json:{data:{}}});});
 await page.route('**/api/teacherAttendance/1/mark-present',async route=>{writes++;await gate;await route.fulfill({json:{success:true}});});
 await page.goto('/teacher/attendance');await waitForDataRoute(page);await expect(page.getByRole('button',{name:'Mark All Present',exact:true})).toBeEnabled();await page.getByRole('button',{name:'Mark All Present',exact:true}).click();
 const dialog=page.getByRole('alertdialog',{name:'Mark all present?',exact:true});await expect(dialog).toContainText('October 27, 2026');
 const button=dialog.getByRole('button',{name:'Mark present',exact:true});const before=await button.boundingBox();
 const footer=await dialog.locator('footer').boundingBox();expect(before!.y-footer!.y).toBeGreaterThanOrEqual(12);
 const bounds=await dialog.boundingBox();expect(bounds!.x).toBeGreaterThanOrEqual(0);expect(bounds!.x+bounds!.width).toBeLessThanOrEqual(width);
 await button.click();await expect(dialog).toHaveCount(0);
 const saving=page.getByRole('button',{name:'Saving...',exact:true});await expect(saving).toBeDisabled();
 await expect(page.getByRole('button',{name:'P',exact:true})).toHaveCount(2);
 await expect(page.locator('[data-sk-region="teacherattendancepage-button-field-4"][aria-busy="true"]')).toHaveCount(2);
 await page.screenshot({path:`monthly-report-review/mark-all-present-${width}-${dark?'dark':'light'}.png`,fullPage:true});finish();await expect(page.getByRole('button',{name:'Mark All Present',exact:true})).toBeVisible();expect(writes).toBe(1);
});
