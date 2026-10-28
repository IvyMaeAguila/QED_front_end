import {test,expect,type Page} from '@playwright/test';
import {mockDirectory} from './fixtures/directory';
import {mockDashboard,dashboardEndpoints,type DashboardEndpoint} from './fixtures/dashboard';
import {waitForDataRoute} from './fixtures/routeReady';
const cases=[['total','totalStudents','overview'],['overview','overviewSummary','overview'],['today','todaysAttendance','attendance'],['attendance','attendanceByGrade','attendance'],['top','topSubjectPerGrade','subject'],['ranking','subjectRankingByTerm','subject'],['holistic','holisticDomains','holistic'],['grades','performanceByGrade','academic'],['trend','performanceTrend','academic']] as const;
async function fixture(page:Page){const release=await mockDirectory(page,'PRINCIPAL',false);release();return mockDashboard(page);}
const region=(page:Page,name:string)=>page.locator('[data-sk-region="principal-region-'+name+'"]');
for(const [endpoint,resource,group]of cases)test(`F03: ${endpoint} failure is isolated and Retry targets its own API`,async({page})=>{
 const f=await fixture(page);f.state[endpoint].status=503;await page.goto('/principal');await waitForDataRoute(page);
 await expect(region(page,group).getByRole('alert')).toBeVisible();await expect(region(page,group==='subject'?'attendance':'subject').getByRole('alert')).toHaveCount(0);
 if(group!=='subject')await expect(page.getByText('Fixture Mathematics',{exact:true}).first()).toBeVisible();
 const state=await page.evaluate(async resource=>{const {queryClient}=await import('/src/shared/query/queryClient.ts');const q=queryClient.getQueryCache().getAll().find((q:any)=>q.queryKey.includes('dashboard')&&q.queryKey.at(-1)===resource&&q.queryKey[7]!==null);return {status:q?.state.status,hasData:q?.state.data!==undefined};},resource);
 expect(state).toEqual({status:'error',hasData:false});const before=Object.fromEntries(dashboardEndpoints.map(e=>[e,f.state[e].calls]));
 f.state[endpoint].status=200;await region(page,group).getByRole('button',{name:'Retry',exact:true}).click();await expect(region(page,group).getByRole('alert')).toHaveCount(0);
 await expect(page.getByText('Fixture Mathematics',{exact:true}).first()).toBeVisible();
 for(const e of dashboardEndpoints)expect(f.state[e].calls,e).toBe(before[e]+Number(e===endpoint));
});
test('F03: failed background region keeps its last valid data and timestamp with a visible warning',async({page})=>{
 const f=await fixture(page);await page.goto('/principal');await waitForDataRoute(page);await expect(page.getByText('Fixture Mathematics',{exact:true}).first()).toBeVisible();
 const query=async()=>page.evaluate(async()=>{const {queryClient}=await import('/src/shared/query/queryClient.ts');const q=queryClient.getQueryCache().getAll().find((q:any)=>q.queryKey.includes('dashboard')&&q.queryKey.at(-1)==='topSubjectPerGrade'&&q.queryKey[7]!==null);return {status:q?.state.status,updated:q?.state.dataUpdatedAt,data:q?.state.data};});
 const before=await query();f.state.top.status=503;
 await page.evaluate(async()=>{const {queryClient}=await import('/src/shared/query/queryClient.ts');await queryClient.refetchQueries({predicate:(q:any)=>q.queryKey.includes('dashboard')&&q.queryKey.at(-1)==='topSubjectPerGrade'&&q.queryKey[7]!==null,type:'active'});});
 await expect(region(page,'subject').getByRole('alert')).toContainText('Previously retrieved data is shown.');await expect(page.getByText('Fixture Mathematics',{exact:true}).first()).toBeVisible();
 expect(await query()).toEqual({...before,status:'error'});f.state.top.status=200;await region(page,'subject').getByRole('button',{name:'Retry',exact:true}).click();await expect(region(page,'subject').getByRole('alert')).toHaveCount(0);
});
for(const endpoint of ['overview','holistic','top'] as DashboardEndpoint[])test(`F03: ${endpoint} authorization denial hides the entire protected dashboard without expiring the session`,async({page})=>{
 const f=await fixture(page);f.state[endpoint].status=403;await page.goto('/principal');await waitForDataRoute(page);await expect(page.locator('[data-sk-region="principal-dashboard-data"]').getByRole('alert')).toBeVisible();await expect(page.getByText('Fixture Mathematics',{exact:true})).toHaveCount(0);await expect(page).toHaveURL(/\/principal$/);
});
