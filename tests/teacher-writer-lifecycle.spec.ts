import {test,expect,type Page} from '@playwright/test';
import {mockTeacher} from './fixtures/teacher';
// Mocked APIs; actual mutation drivers, QueryClient and auth generation guards.
async function fixture(page:Page,kind:string,status:number){
 const done=await mockTeacher(page,false);done();let release!:()=>void;const gate=new Promise<void>(r=>{release=r;});let started=0,finished=0;
 await page.route('**/api/gradingPeriods',r=>r.fulfill({json:{success:true,data:[]}}));
 await page.route(/\/api\/(teacherGrading|teacherAttendance|advisoryGrading)\//,async r=>{
  if(r.request().method()==='GET'){await r.fulfill({json:{success:true,data:{subjectName:'Synthetic',gradeLevel:'Grade 1',roster:[]}}});return;}
  started++;await gate;await r.fulfill({status,json:{success:status===200,message:'Synthetic mutation response'}});finished++;
 });
 await page.goto(`/tests/teacher-writer-lifecycle.html?kind=${kind}`);await expect(page.getByTestId('auth')).toHaveText('TEACHER:1');await page.getByRole('button',{name:'Save synthetic record',exact:true}).click();await expect.poll(()=>started).toBe(1);
 return {release,finished:()=>finished,started:()=>started};
}
for(const kind of ['academic','attendance','advisory']){
 test(`${kind} mutation: mounted401 expires the current session`,async({page})=>{const f=await fixture(page,kind,401);f.release();await expect(page.getByTestId('outcome')).toHaveText('error:401');await expect(page.getByTestId('auth')).toHaveText('signed-out');expect(f.started()).toBe(1);});
 test(`${kind} mutation: unmounted uncancelled401 still expires the same session`,async({page})=>{const f=await fixture(page,kind,401);await page.getByRole('button',{name:'Leave writer',exact:true}).click();f.release();await expect(page.getByTestId('outcome')).toHaveText('error:401');await expect(page.getByTestId('auth')).toHaveText('signed-out');expect(f.started()).toBe(1);});
 test(`${kind} mutation: late401 cannot expire a newer account`,async({page})=>{const f=await fixture(page,kind,401);await page.getByRole('button',{name:'Switch account',exact:true}).click();await expect(page.getByTestId('auth')).toHaveText('TEACHER:2');f.release();await expect(page.getByTestId('outcome')).toHaveText('error:401');await expect(page.getByTestId('auth')).toHaveText('TEACHER:2');expect(f.started()).toBe(1);});
 test(`${kind} mutation: unmounted403 remains a permission error`,async({page})=>{const f=await fixture(page,kind,403);await page.getByRole('button',{name:'Leave writer',exact:true}).click();f.release();await expect(page.getByTestId('outcome')).toHaveText('error:403');await expect(page.getByTestId('auth')).toHaveText('TEACHER:1');expect(f.started()).toBe(1);});
 test(`${kind} mutation: logout is not reversed by a late success`,async({page})=>{const f=await fixture(page,kind,200);await page.getByRole('button',{name:'Leave writer',exact:true}).click();await page.getByRole('button',{name:'Logout',exact:true}).click();await page.getByRole('dialog',{name:'Confirm logout'}).getByRole('button',{name:'Log out',exact:true}).click();await expect(page.getByTestId('auth')).toHaveText('signed-out');f.release();await expect(page.getByTestId('outcome')).toHaveText('success');await expect(page.getByTestId('auth')).toHaveText('signed-out');expect(f.started()).toBe(1);});
}
