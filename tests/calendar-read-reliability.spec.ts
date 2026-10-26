import {test,expect,type Page} from '@playwright/test';
import {mockDirectory} from './fixtures/directory';
import {browserCalendarDate} from './fixtures/browserDate';
import {requestLedger} from './fixtures/requestLedger';
import {waitForDataRoute} from './fixtures/routeReady';
const resources=['activities','holidays','all-activities','all-holidays'] as const;
async function fixture(page:Page,role:'ADMIN'|'PRINCIPAL'|'TEACHER'|'PARENT'){
 const release=await mockDirectory(page,role,false);release();const today=await browserCalendarDate(page);
 const ledger=requestLedger(page,p=>p.startsWith('/api/calendar/')),writes:string[]=[];
 const state={status:200};await page.route('**/api/calendar/**',route=>{
  const req=route.request();if(req.method()!=='GET'){writes.push(req.method());return route.abort();}ledger.intercept(req);
  const resource=new URL(req.url()).pathname.split('/').pop()!,code=resource==='activities'?state.status:200;
  return route.fulfill({status:code,json:code===200?{success:true,data:[{id:71,title:'Synthetic '+resource,date:today,type:'regular'}]}:{success:false,message:'Synthetic Calendar failure'}});
 });return {state,ledger,writes};
}
async function refreshActivities(page:Page){await page.evaluate(async()=>{const {queryClient}=await import('/src/shared/query/queryClient.ts');await queryClient.refetchQueries({predicate:(q:any)=>q.queryKey.includes('calendar')&&q.queryKey.at(-1)==='activities',type:'active'});});}
for(const role of ['ADMIN','PRINCIPAL','TEACHER','PARENT'] as const){
 test(`F02 Calendar ${role}: failed activity read preserves holidays and retries only the failed query`,async({page})=>{
  const f=await fixture(page,role);f.state.status=503;await page.goto('/'+role.toLowerCase()+'/calendar');await waitForDataRoute(page);
  await expect(page.getByRole('alert').first()).toContainText('Synthetic Calendar failure');await expect(page.getByText('Synthetic holidays',{exact:true}).first()).toBeVisible();
  await expect.poll(()=>f.ledger.snapshot().every(r=>!!r.terminal)).toBe(true);const mark=f.ledger.mark();f.state.status=200;
  await page.getByRole('button',{name:'Retry',exact:true}).first().click();await expect(page.getByRole('alert')).toHaveCount(0);await expect(page.getByText('Synthetic activities',{exact:true}).first()).toBeVisible();
  await f.ledger.successfulBatch(mark,1);expect(f.ledger.snapshot(mark).filter(r=>r.terminal==='finished').map(r=>r.path)).toEqual(['/api/calendar/activities']);expect(f.writes).toEqual([]);
 });
 test(`F02 Calendar ${role}: cached activities remain visible with an explicit refresh warning`,async({page})=>{
  const f=await fixture(page,role);await page.goto('/'+role.toLowerCase()+'/calendar');await waitForDataRoute(page);await expect(page.getByText('Synthetic activities',{exact:true}).first()).toBeVisible();
  f.state.status=503;await refreshActivities(page);await expect(page.getByRole('alert').first()).toContainText('Synthetic Calendar failure');await expect(page.getByText('Synthetic activities',{exact:true}).first()).toBeVisible();await expect(page.getByText('Previously retrieved data is shown.',{exact:true}).first()).toBeVisible();
  const mark=f.ledger.mark();f.state.status=200;await page.getByRole('button',{name:'Retry',exact:true}).first().click();await expect(page.getByRole('alert')).toHaveCount(0);await f.ledger.successfulBatch(mark,1);expect(f.writes).toEqual([]);
 });
 test(`F02 Calendar ${role}: authorization denial hides cached calendar records without login redirection`,async({page})=>{
  const f=await fixture(page,role);await page.goto('/'+role.toLowerCase()+'/calendar');await waitForDataRoute(page);await expect(page.getByText('Synthetic activities',{exact:true}).first()).toBeVisible();
  f.state.status=403;await refreshActivities(page);await expect(page.getByRole('alert').first()).toContainText('Synthetic Calendar failure');
  for(const resource of resources)await expect(page.getByText('Synthetic '+resource,{exact:true})).toHaveCount(0);
  await expect(page).toHaveURL(new RegExp('/'+role.toLowerCase()+'/calendar$'));expect(f.writes).toEqual([]);
 });
}
for(const status of [503,403])test(`F02 Parent dashboard events: ${status} preserves only permitted calendar groups`,async({page})=>{
 const f=await fixture(page,'PARENT');await page.route('**/api/linkedChildren/',r=>r.fulfill({json:{success:true,students:[]}}));f.state.status=status;await page.goto('/parent');await waitForDataRoute(page);
 const events=page.locator('[data-sk-region="parent-school-events"]');await expect(events.getByRole('alert').first()).toContainText('Synthetic Calendar failure');
 if(status===503)await expect(events.getByText('Synthetic holidays',{exact:true})).toBeVisible();else await expect(events.getByText('Synthetic holidays',{exact:true})).toHaveCount(0);
 const before=f.ledger.mark();f.state.status=200;await events.getByRole('button',{name:'Retry',exact:true}).first().click();await expect(events.getByText('Synthetic activities',{exact:true})).toBeVisible();await expect(events.getByRole('alert')).toHaveCount(0);await f.ledger.successfulBatch(before,1);expect(f.writes).toEqual([]);
});
test('F02 Parent dashboard events: cached activities remain visible after a failed refresh',async({page})=>{
 const f=await fixture(page,'PARENT');await page.route('**/api/linkedChildren/',r=>r.fulfill({json:{success:true,students:[]}}));await page.goto('/parent');await waitForDataRoute(page);const events=page.locator('[data-sk-region="parent-school-events"]');await expect(events.getByText('Synthetic activities',{exact:true})).toBeVisible();f.state.status=503;await refreshActivities(page);await expect(events.getByRole('alert')).toContainText('Previously retrieved data is shown.');await expect(events.getByText('Synthetic activities',{exact:true})).toBeVisible();await expect(events.getByText('Synthetic holidays',{exact:true})).toBeVisible();expect(f.writes).toEqual([]);
});
