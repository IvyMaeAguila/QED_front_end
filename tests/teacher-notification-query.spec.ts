import {test,expect} from '@playwright/test';
// Teacher variant of the verified shared socket/session harness, mocked HTTP/socket only.
test('Teacher notification readiness, socket merge, forbidden cache protection and successful recovery',async({page})=>{
 let status=0,gets=0;
 await page.route('**/api/notification/**',route=>{gets++;return route.fulfill({status:status||200,json:status?{success:false}:{success:true,data:[{id:1,title:'HTTP fixture',is_read:false,created_at:new Date().toISOString()}]}});});
 await page.goto('/tests/principal-notification-query.html?role=TEACHER');await expect(page.getByTestId('rows')).toHaveText('');expect(gets).toBe(0);await page.getByRole('button',{name:'Ready',exact:true}).click();await expect(page.getByTestId('rows')).toContainText('HTTP fixture');
 await page.getByRole('button',{name:'Socket event'}).click();await expect(page.getByTestId('rows')).toHaveText('Socket fixture,HTTP fixture');status=403;await page.getByRole('button',{name:'Invalidate',exact:true}).click();await expect(page.getByTestId('rows')).toHaveText('');
 await page.getByRole('button',{name:'Socket event'}).click();await expect(page.getByTestId('rows')).toHaveText('');await expect(page.getByTestId('expired')).toHaveText('0');status=0;await page.getByRole('button',{name:'Invalidate',exact:true}).click();await expect(page.getByTestId('rows')).toContainText('HTTP fixture');
});
test('Teacher notification pending reads cancel on account switch and old 401 cannot expire new session',async({page})=>{
 let release!:()=>void;const gate=new Promise<void>(r=>{release=r;});let started=0;const canceled:string[]=[];
 page.on('requestfailed',r=>{if(r.url().includes('/api/notification/101'))canceled.push('old');});
 await page.route('**/api/notification/**',async route=>{if(route.request().url().endsWith('/101')){started++;await gate;await route.fulfill({status:401,json:{success:false}}).catch(()=>{});}else await route.fulfill({json:{success:true,data:[{id:2,title:'New account',is_read:false}]}});});
 await page.goto('/tests/principal-notification-query.html?role=TEACHER');await page.getByRole('button',{name:'Ready',exact:true}).click();await expect.poll(()=>started).toBeGreaterThan(0);await page.getByRole('button',{name:'Switch account'}).click();await expect(page.getByTestId('rows')).toHaveText('New account');await expect.poll(()=>canceled.length).toBeGreaterThan(0);release();await expect(page.getByTestId('expired')).toHaveText('0');
 const keys=await page.evaluate(async()=>{const {queryClient}=await import('/src/shared/query/queryClient.ts');return queryClient.getQueryCache().getAll().map(q=>q.queryKey[3]);});expect(keys).toEqual(['202']);
});
