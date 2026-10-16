import {test,expect,type Page} from '@playwright/test';
import {mockParent} from './fixtures/parent';
import {waitForDataRoute} from './fixtures/routeReady';
import {waitForQueryReader,isReaderInvalidated} from './fixtures/queryLifecycle';
async function quiz(page:Page,status=200){
 await page.emulateMedia({reducedMotion:'reduce'});
 const parent=await mockParent(page);await page.addInitScript(()=>localStorage.setItem('ed-intro-seen:101:1','1'));
 const writes:{path:string;payload:unknown}[]=[];
 await page.route('**/api/pet/**',async route=>{const request=route.request(),path=new URL(request.url()).pathname;
  if(request.method()==='POST'){writes.push({path,payload:request.postDataJSON()});return route.fulfill({status,json:status===200?(path.endsWith('grade-single')?{isCorrect:true,correctAnswer:'A',explanation:'Synthetic explanation'}:{results:[{questionId:19,selected:'A',correctAnswer:'A',isCorrect:true,explanation:'Synthetic explanation'}],score:1,totalQuestions:1,fullyCleared:true,unlockedNext:'Medium',hungerFilled:1,hungerTotal:5}):{message:'Synthetic quiz write '+status}});}
  return route.fulfill({json:path.includes('/intervention/')?{levels:{easy:'available',medium:'locked',hard:'locked'},bonus:{match:false,memory:false},hungerFilled:0,hungerTotal:5,interventionCompleted:false}:{practiceSetId:17,title:'Synthetic quiz',difficulty:'Easy',gradeLevel:'Grade 1',questions:[{id:19,question_text:'Synthetic question',choice_a:'Correct synthetic answer',choice_b:'Other B',choice_c:'Other C',choice_d:'Other D',order_index:0}]}});
 });
 await page.goto('/parent/students/101/topics/1/quiz');await waitForDataRoute(page);await page.getByRole('button',{name:'Easy level, available',exact:true}).click();await expect(page.getByText('Synthetic question',{exact:true})).toBeVisible();
 return {parent,writes};
}
test('mocked Parent quiz mutation preserves default full payload and confirmed server results',async({page})=>{
 const f=await quiz(page);await page.getByRole('button',{name:/Correct synthetic answer/}).click();await page.getByRole('button',{name:'See Round Results',exact:true}).click();await expect.poll(()=>f.writes.length).toBe(2);
 expect(f.writes).toEqual([{path:'/api/pet/quiz/101/1/grade-single',payload:{practiceSetId:17,questionId:19,selected:'A'}},{path:'/api/pet/quiz/101/1/submit',payload:{practiceSetId:17,difficulty:'Easy',answers:[{questionId:19,selected:'A'}],mode:'full'}}]);
 await expect(page.getByText('Synthetic question',{exact:true})).toHaveCount(0);
});
test('mocked Parent failed non-idempotent answer is not automatically retried',async({page})=>{
 const f=await quiz(page,500);const answer=page.getByRole('button',{name:/Correct synthetic answer/});await answer.click();await expect(answer).toBeEnabled();expect(f.writes).toHaveLength(1);await expect(page.getByRole('button',{name:'See Round Results',exact:true})).toHaveCount(0);await expect(page).toHaveURL(/\/parent\/students\/101\/topics\/1\/quiz/);
});
test('mocked Parent answer403 clears the quiz body without expiring the session',async({page})=>{
 const f=await quiz(page,403);await page.getByRole('button',{name:/Correct synthetic answer/}).click();await expect(page.getByRole('alert')).toContainText('Synthetic quiz write 403');await expect(page.getByText('Synthetic question',{exact:true})).toHaveCount(0);await expect(page.getByRole('button',{name:'Retry',exact:true})).toBeVisible();expect(f.writes).toHaveLength(1);await expect(page).toHaveURL(/\/parent\/students\/101\/topics\/1\/quiz/);
});
async function form(page:Page){await page.getByLabel('ID Number',{exact:true}).fill(' S103 ');await page.getByLabel('First Name',{exact:true}).fill(' Synthetic ');await page.getByLabel('Last Name',{exact:true}).fill(' Child103 ');}
for(const status of [200,500])test(`mocked Parent mastery${status} invalidates flags only on confirmed success without automatic reader replay`,async({page})=>{
 const f=await mockParent(page);await page.emulateMedia({reducedMotion:'reduce'});await page.addInitScript(()=>localStorage.setItem('ed-intro-seen:101:1','1'));let writes=0;
 await page.route('**/api/pet/**',async route=>{if(route.request().method()==='POST'){writes++;return route.fulfill({status,json:{success:status===200,message:'Synthetic mastery failure'}});}return route.fulfill({json:{levels:{easy:'completed',medium:'completed',hard:'completed'},bonus:{match:true,memory:true},hungerFilled:5,hungerTotal:5,interventionCompleted:false}});});
 await page.goto('/parent/students/101?tab=academic');await waitForDataRoute(page);await expect(page.locator('[data-sk-region="parent-intervention"]')).toHaveAttribute('data-sk-phase','settled');await f.settled();const before=f.resources.flags.calls;expect(await isReaderInvalidated(page,'PARENT','flags')).toBe(false);
 await page.locator('[data-sk-region="parent-intervention"]').getByRole('button').click();await waitForDataRoute(page);await page.getByRole('button',{name:/Quiz/}).click();await waitForDataRoute(page);await page.getByRole('button',{name:'End Intervention',exact:true}).click();await page.getByRole('button',{name:'Yes, end intervention',exact:true}).click();
 await expect.poll(()=>writes).toBe(1);if(status===200)await expect(page.getByRole('button',{name:'Continue',exact:true})).toBeVisible();else await expect(page.getByText('Synthetic mastery failure',{exact:true})).toBeVisible();expect(await isReaderInvalidated(page,'PARENT','flags')).toBe(status===200);expect(f.resources.flags.calls).toBe(before);
});
test('mocked Parent link confirmation sends original payload once and refreshes authoritative readers only after success',async({page})=>{
 const f=await mockParent(page);await page.goto('/parent/enrolled-children');await waitForDataRoute(page);await waitForQueryReader(page,'PARENT',['children','list'],true);await f.settled();const children=f.resources.children.calls,daily=f.resources.daily.calls;
 await form(page);await page.getByRole('button',{name:'Connect Student',exact:true}).click();await expect(page.getByRole('button',{name:'Yes, this is correct',exact:true})).toBeVisible();expect(f.resources.children.calls).toBe(children);expect(f.resources.daily.calls).toBe(daily);
 f.state.writeGate=new Promise<void>(resolve=>{f.state.releaseWrite=resolve;});await page.getByRole('button',{name:'Yes, this is correct',exact:true}).click();await expect.poll(()=>f.state.writes.length).toBe(2);expect(f.resources.children.calls).toBe(children);f.state.releaseWrite();
 await expect(page.getByRole('button',{name:/Synthetic Child103/})).toBeVisible();await f.settled();expect(f.resources.children.calls).toBe(children+1);expect(f.resources.daily.calls).toBe(daily+1);
 expect(f.state.writes.map(w=>w.payload)).toEqual([{studentNumber:'S103',lastName:'Child103',firstName:'Synthetic'},{studentNumber:'S103',lastName:'Child103',firstName:'Synthetic'}]);expect(f.state.writes.map(w=>w.path)).toEqual(['/api/linkedChildren/','/api/linkedChildren/confirm']);
});
test('mocked Parent unmatched business401 preserves session, form draft and cache without automatic retries',async({page})=>{
 const f=await mockParent(page);await page.goto('/parent/enrolled-children');await waitForDataRoute(page);await waitForQueryReader(page,'PARENT',['children','list'],true);await f.settled();const before=f.resources.children.calls;f.state.writeStatus=401;
 await form(page);await page.getByRole('button',{name:'Connect Student',exact:true}).click();await expect(page.getByRole('alert')).toContainText('No information matched');await expect(page).toHaveURL(/\/parent\/enrolled-children/);await expect(page.getByLabel('ID Number',{exact:true})).toHaveValue(' S103 ');expect(f.state.writes).toHaveLength(1);expect(f.resources.children.calls).toBe(before);
 f.state.writeStatus=200;await page.getByRole('button',{name:'Connect Student',exact:true}).click();await expect(page.getByRole('button',{name:'Yes, this is correct',exact:true})).toBeVisible();expect(f.state.writes).toHaveLength(2);
});
test('mocked Parent offline linking preserves draft and performs zero writes',async({page,context})=>{
 const f=await mockParent(page);await page.goto('/parent/enrolled-children');await waitForDataRoute(page);await waitForQueryReader(page,'PARENT',['children','list'],true);await form(page);await context.setOffline(true);await page.getByRole('button',{name:'Connect Student',exact:true}).click();await expect(page.getByRole('alert').filter({hasText:"You're offline"}).last()).toBeVisible();expect(f.state.writes).toHaveLength(0);await expect(page.getByLabel('First Name',{exact:true})).toHaveValue(' Synthetic ');
 await context.setOffline(false);await page.getByRole('button',{name:'Connect Student',exact:true}).click();await expect(page.getByRole('button',{name:'Yes, this is correct',exact:true})).toBeVisible();expect(f.state.writes).toHaveLength(1);
});
