import {test,expect,type Page} from '@playwright/test';
import {mockParent,parentPaths,type ParentResource} from './fixtures/parent';
import {waitForDataRoute} from './fixtures/routeReady';
const report=(page:Page)=>page.locator('[data-sk-region="parent-progress-report"]');
async function open(page:Page){await page.goto('/parent/students/101?tab=progressReport');await waitForDataRoute(page);}
for(const resource of ['holistic','attendance'] as const)test(`F04: ${resource} failure is unavailable, preserves academics and blocks incomplete PDF`,async({page})=>{
 const f=await mockParent(page);f.resources[resource].status=503;await open(page);
 await expect(report(page).getByRole('alert')).toContainText(resource==='holistic'?'holistic':'attendance');
 await expect(page.getByText('Mathematics 101',{exact:true}).first()).toBeVisible();
 await expect(page.getByRole('button',{name:'Download PDF',exact:true})).toBeDisabled();
 await expect(page.locator('#formal-progress-report')).toHaveCount(0);
 const before=Object.fromEntries(['academic','visibility','holistic','attendance'].map(r=>[r,f.resources[r as ParentResource].calls]));
 f.resources[resource].status=200;await report(page).getByRole('button',{name:'Retry',exact:true}).click();
 await expect(report(page).getByRole('alert')).toHaveCount(0);await expect(page.getByRole('button',{name:'Download PDF',exact:true})).toBeEnabled();
 for(const r of ['academic','visibility','holistic','attendance'] as const)expect(f.resources[r].calls).toBe(before[r]+Number(r===resource));
 expect(f.state.writes).toEqual([]);
});

for(const status of [500,503,404])test(`F04: visibility ${status} is unknown rather than an unreleased term`,async({page})=>{
 const f=await mockParent(page);f.resources.visibility.status=status;await open(page);
 await expect(report(page).getByRole('alert')).toContainText(`Synthetic visibility ${status}`);
 await expect(page.getByText('This progress report is not available yet.',{exact:true})).toHaveCount(0);
 await expect(page.getByText('Mathematics 101',{exact:true})).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Download PDF',exact:true})).toBeDisabled();
 const before=f.resources.academic.calls;f.resources.visibility.status=200;await report(page).getByRole('button',{name:'Retry',exact:true}).click();
 await expect(page.getByText('Mathematics 101',{exact:true}).first()).toBeVisible();expect(f.resources.academic.calls).toBe(before);
});

for(const resource of ['holistic','attendance','visibility'] as const)test(`F04: malformed ${resource} success is not valid empty data`,async({page})=>{
 const f=await mockParent(page);f.resources[resource].body={success:true};await open(page);
 await expect(report(page).getByRole('alert')).toBeVisible();await expect(page.getByRole('button',{name:'Download PDF',exact:true})).toBeDisabled();
 await expect(page.locator('#formal-progress-report')).toHaveCount(0);
});

for(const resource of ['holistic','attendance','visibility'] as const)test(`F04: network ${resource} failure is recoverable without replay`,async({page})=>{
 const f=await mockParent(page);let failed=true;await page.route('**'+parentPaths[resource],route=>failed?route.abort('internetdisconnected'):route.fallback());
 await open(page);await expect(report(page).getByRole('alert')).toBeVisible();await expect(page.getByRole('button',{name:'Download PDF',exact:true})).toBeDisabled();
 failed=false;await report(page).getByRole('button',{name:'Retry',exact:true}).click();await expect(report(page).getByRole('alert')).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Download PDF',exact:true})).toBeEnabled();expect(f.state.writes).toEqual([]);
});

async function refresh(page:Page,resource:ParentResource){await page.evaluate(async resource=>{
 const {queryClient}=await import('/src/shared/query/queryClient.ts');
 await queryClient.refetchQueries({predicate:(q:any)=>q.queryKey.includes('progress')&&q.queryKey.at(-1)===resource,type:'active'});
},resource);}

for(const resource of ['holistic','attendance'] as const)test(`F04: cached ${resource} failure retains permitted data with a warning until targeted recovery`,async({page})=>{
 const f=await mockParent(page);await open(page);await expect(page.getByRole('button',{name:'Download PDF',exact:true})).toBeEnabled();
 await report(page).getByRole('button',{name:'1st Term',exact:true}).click();
 await expect(report(page)).toHaveAttribute('data-sk-phase','settled');
 const section=page.getByRole('region',{name:resource==='holistic'?'Holistic assessments':'Attendance records',exact:true});
 await expect(section).toContainText(resource==='holistic'?'Cognitive':'October 2026');
 if(resource==='holistic'){await expect(section.getByText('4.0 / 5.0',{exact:true})).toHaveCount(2);await expect(section.getByText('3.0 / 5.0',{exact:true})).toHaveCount(2);}
 const before=await section.locator(':scope > :last-child').textContent();f.resources[resource].status=503;await refresh(page,resource);
 await expect(section.getByRole('alert')).toContainText('Previously retrieved data is shown.');
 await expect(section.locator(':scope > :last-child')).toHaveText(before!);
 await expect(page.getByRole('button',{name:'Download PDF',exact:true})).toBeDisabled();
 f.resources[resource].status=200;await section.getByRole('button',{name:'Retry',exact:true}).click();await expect(section.getByRole('alert')).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Download PDF',exact:true})).toBeEnabled();expect(f.state.writes).toEqual([]);
});

test('F04: cached visibility failure hides grades and the formal report until verified again',async({page})=>{
 const f=await mockParent(page);await open(page);await expect(page.getByRole('button',{name:'Download PDF',exact:true})).toBeEnabled();
 f.resources.visibility.status=503;await refresh(page,'visibility');await expect(report(page).getByRole('alert')).toBeVisible();
 await expect(page.getByText('Mathematics 101',{exact:true})).toHaveCount(0);await expect(page.locator('#formal-progress-report')).toHaveCount(0);
 f.resources.visibility.status=200;await report(page).getByRole('button',{name:'Retry',exact:true}).click();await expect(page.getByRole('button',{name:'Download PDF',exact:true})).toBeEnabled();
});

test('F04: academic failure preserves independently retrieved attendance and holistic sections',async({page})=>{
 const f=await mockParent(page);f.resources.academic.status=500;await open(page);
 await expect(page.getByRole('region',{name:'Academic results',exact:true}).getByRole('alert')).toContainText('Synthetic academic 500');
 await expect(page.getByRole('region',{name:'Attendance records',exact:true})).toContainText('October 2026');
 await expect(page.getByRole('region',{name:'Holistic assessments',exact:true})).toContainText('Cognitive');
 await expect(page.getByRole('button',{name:'Download PDF',exact:true})).toBeDisabled();
});

test('F04: genuine empty sections remain successful and exportable for a released term',async({page})=>{
 const f=await mockParent(page);f.resources.holistic.body={success:true,data:[]};f.resources.attendance.body={student:{id:101},gradingPeriods:[]};await open(page);
 await expect(report(page)).toHaveAttribute('data-sk-phase','settled');await expect(report(page).getByRole('alert')).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Download PDF',exact:true})).toBeEnabled();await expect(page.locator('#formal-progress-report')).toHaveCount(1);
});
