import {test,expect,type Page} from '@playwright/test';
import {mockTeacher} from './fixtures/teacher';
import {requestLedger} from './fixtures/requestLedger';
// Mocked APIs, actual Teacher routes; also suitable for the fresh artifact.
async function fixture(page:Page){
 const done=await mockTeacher(page,false);done();let authorized=true;const ledger=requestLedger(page,p=>p==='/api/student/allStudents');
 const reads=()=>ledger.snapshot().filter(r=>r.terminal==='finished'&&r.status===200).length;
 await page.route('**/api/student/allStudents',r=>{ledger.intercept(r.request());return r.fulfill({json:{data:authorized?[{id:1,student_number:'S1',first_name:'Synthetic',last_name:'Learner',middle_name:'',gender:'Female',grade_level_id:1,grade_level_name:'Grade 1',section_id:11,section_name:'Maroon'}]:[]}});});
 await page.route('**/api/classes/',r=>r.fulfill({json:{success:true,data:[{id:1,gradeLevelId:1,gradeLevel:'Grade 1',sectionId:11,section:'Maroon',room:'101',adviserId:41,adviserName:'Synthetic Teacher',studentCount:1,schedule:[{id:1,subject:'Math',teacherId:41,startTime:'08:00',endTime:'09:00',days:['Monday']}]}]}}));
 await page.route('**/api/section/getTeachers',r=>r.fulfill({json:{status:'success',data:[{id:41,user_id:701,first_name:'Synthetic',last_name:'Teacher',middle_name:null,email_address:'synthetic@example.test',contact_number:''}]}}));
 await page.clock.install();await page.goto('/teacher/students/1');await expect(page.getByRole('heading',{name:'Learner, Synthetic',exact:true})).toBeVisible();await expect(page.getByText('Synthetic Teacher',{exact:true})).toBeVisible();await ledger.successfulBatch(0,1);expect(reads()).toBe(1);
 return {reads,revoke:()=>{authorized=false;}};
}
async function leave(page:Page){await page.getByRole('link',{name:'Help & Support',exact:true}).click();await expect(page.getByRole('heading',{name:'Help & Support',exact:true})).toBeVisible();}
test('Teacher student profile: fresh reuse then stale authorization revalidation on navigation',async({page})=>{
 const f=await fixture(page);await leave(page);await page.goBack();await expect(page.getByRole('heading',{name:'Learner, Synthetic',exact:true})).toBeVisible();expect(f.reads()).toBe(1);await leave(page);await page.clock.fastForward(31_000);await page.goBack();await expect.poll(f.reads).toBe(2);await expect(page.getByRole('heading',{name:'Learner, Synthetic',exact:true})).toBeVisible();
});
test('Teacher student profile: stale navigation removes a no-longer-authorized student',async({page})=>{
 const f=await fixture(page);await leave(page);f.revoke();await page.clock.fastForward(31_000);await page.goBack();await expect.poll(f.reads).toBe(2);await expect(page.getByRole('heading',{name:'Learner, Synthetic',exact:true})).toHaveCount(0);await expect(page.getByText('Student Not Found',{exact:true})).toBeVisible();
});
