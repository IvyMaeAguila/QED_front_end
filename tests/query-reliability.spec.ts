import {test,expect,type Page} from '@playwright/test';
import {mockTeacher} from './fixtures/teacher';
import {mockDirectory} from './fixtures/directory';
import {mockDashboard} from './fixtures/dashboard';
import {waitForDataRoute} from './fixtures/routeReady';
const endpoints=['summary','stats','attendance','upcoming','schedule'] as const;
async function teacher(page:Page){
 const release=await mockTeacher(page,false);release();
 const state={fail:false,failuresLeft:0,calls:Object.fromEntries(endpoints.map(e=>[e,0])) as Record<typeof endpoints[number],number>};
 for(const e of endpoints)await page.route(`**/api/teacherDashboard/${e}*`,route=>{
  state.calls[e]++;const failed=e==='stats'&&(state.fail||state.failuresLeft>0);if(e==='stats'&&state.failuresLeft>0)state.failuresLeft--;
  const body=e==='summary'?{success:true,name:'Synthetic Teacher'}:e==='stats'?{success:true,advisoryClassCount:21,totalStudents:42,totalClasses:3}:e==='attendance'?{success:true,hasAdvisory:true,present:18,absent:2,late:1}:{success:true,data:[]};
  return route.fulfill({status:failed?503:200,json:failed?{message:'Synthetic statistics unavailable'}:body});
 });return state;
}
const stats=(page:Page)=>page.locator('[data-sk-region="stat-value-Total Students"]');
test('F01: a transient pure dashboard read recovers once without replaying healthy reads',async({page},info)=>{
 const f=await teacher(page);await page.goto('/teacher');await waitForDataRoute(page);await expect(stats(page)).toContainText('42');
 await expect.poll(()=>page.evaluate(async()=>{const {queryClient}=await import('/src/shared/query/queryClient.ts');return queryClient.getQueryCache().getAll().filter((q:any)=>q.queryKey.includes('dashboard')).every((q:any)=>q.state.fetchStatus==='idle');})).toBe(true);
 const policy=await page.evaluate(async()=>{const {queryClient}=await import('/src/shared/query/queryClient.ts');const q=queryClient.getQueryCache().getAll().find((q:any)=>q.queryKey.includes('statistics'));const source=await fetch('/src/features/profiles/teacher/pages/dashboard/TeacherDashboardHome.tsx').then(r=>r.text());return {retryType:typeof q?.options.retry,sourceUsesSafeRead:source.includes('safeReadOptions')};});
 await info.attach('sanitized-read-policy-source',{body:JSON.stringify(policy),contentType:'application/json'});expect(policy).toEqual({retryType:'function',sourceUsesSafeRead:true});
 const before={...f.calls};f.failuresLeft=1;
 await page.evaluate(async()=>{const {queryClient}=await import('/src/shared/query/queryClient.ts');await queryClient.refetchQueries({predicate:(q:any)=>q.queryKey.includes('dashboard')&&q.queryKey.includes('statistics')});});
 await expect(stats(page)).toContainText('42');for(const e of endpoints)expect(f.calls[e]).toBe(before[e]+(e==='stats'?2:0));
});
test('F02: a failed background statistics refresh preserves permitted cached cards',async({page})=>{
 const f=await teacher(page);await page.goto('/teacher');await waitForDataRoute(page);await expect(stats(page)).toContainText('42');f.fail=true;
 await page.evaluate(async()=>{const {queryClient}=await import('/src/shared/query/queryClient.ts');await queryClient.refetchQueries({predicate:(q:any)=>q.queryKey.includes('dashboard')&&q.queryKey.includes('statistics')});});
 await expect(page.getByRole('alert')).toContainText('statistics');await expect(stats(page)).toContainText('42');
});
test('F02: explicit Retry refreshes only the failed Teacher section',async({page})=>{
 const f=await teacher(page);f.fail=true;await page.goto('/teacher');await waitForDataRoute(page);await expect(page.getByRole('alert')).toContainText('statistics');
 const before={...f.calls};f.fail=false;await page.getByRole('button',{name:'Retry',exact:true}).click();await expect(stats(page)).toContainText('42');
 for(const e of endpoints)expect(f.calls[e]).toBe(before[e]+Number(e==='stats'));
});
test('F03: a failed Principal overview does not hide successful subject and holistic regions',async({page})=>{
 const release=await mockDirectory(page,'PRINCIPAL',false);release();const f=await mockDashboard(page);f.state.overview.status=500;
 await page.goto('/principal');await waitForDataRoute(page);await expect(page.getByRole('alert').first()).toContainText(/failed|error|unavailable/i);
 await expect(page.getByText('Fixture Mathematics',{exact:true}).first()).toBeVisible();await expect(page.getByRole('heading',{name:'Holistic Development Overview',exact:true})).toBeVisible();
});
test('F08: authoritative notification reads remove deleted entries',async({page})=>{
 let removed=false;await page.route('**/api/notification/**',r=>r.fulfill({json:{success:true,data:removed?[{id:1,title:'Keep',is_read:false}]:[{id:1,title:'Keep',is_read:false},{id:2,title:'Deleted',is_read:false}]}}));
 await page.goto('/tests/principal-notification-query.html');await page.getByRole('button',{name:'Ready',exact:true}).click();await expect(page.getByTestId('rows')).toContainText('Deleted');
 removed=true;await page.getByRole('button',{name:'Invalidate',exact:true}).click();await expect(page.getByTestId('rows')).toHaveText('Keep');await expect(page.getByTestId('unread')).toHaveText('1');
});
