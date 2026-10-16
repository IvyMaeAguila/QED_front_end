import {test,expect} from '@playwright/test';
import {mockDirectory} from './fixtures/directory';
import {waitForDataRoute} from './fixtures/routeReady';
// Actual Directory UI, mocked APIs. A server denial must override cached/offline records.
for(const endpoint of ['teachers','year'])test('Principal Directory cached '+endpoint+' 403 stays private offline and recovers on explicit Retry',async({page,context})=>{
 const release=await mockDirectory(page,'PRINCIPAL',false);release();let denied=false;
 const pattern=endpoint==='teachers'?'**/api/teachers':'**/api/academic-year/getAcademicYear';
 await page.route(pattern,async route=>{if(denied)await route.fulfill({status:403,json:{message:'Synthetic permission denied'}});else await route.fallback();});
 await page.goto('/principal/teachers');await waitForDataRoute(page);await expect(page.getByText('Ana',{exact:true}).first()).toBeVisible();
 await page.getByRole('link',{name:'Help & Support',exact:true}).click();await expect(page.getByRole('heading',{name:'Help & Support',exact:true})).toBeVisible();await page.clock.install();await page.clock.fastForward(301_001);await page.clock.resume();denied=true;
 await page.getByRole('link',{name:'Teachers',exact:true}).click();await expect(page.getByRole('alert')).toBeVisible();await expect(page.getByText('Ana',{exact:true})).toHaveCount(0);
 await context.setOffline(true);await expect(page.getByRole('alert')).toContainText("You're offline");await expect(page.getByText('Ana',{exact:true})).toHaveCount(0);
 const restored=page.evaluate(()=>new Promise(resolve=>window.addEventListener('online',()=>queueMicrotask(()=>resolve(true)),{once:true})));await context.setOffline(false);await restored;denied=false;await page.getByRole('button',{name:'Retry',exact:true}).click();await expect(page.getByText('Ana',{exact:true}).first()).toBeVisible();
});
