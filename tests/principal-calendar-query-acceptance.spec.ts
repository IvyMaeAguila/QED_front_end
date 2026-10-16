import { test, expect, type Page, type Request } from '@playwright/test';
import { mockDirectory } from './fixtures/directory';
import { waitForDataRoute } from './fixtures/routeReady';
import { browserCalendarDate } from './fixtures/browserDate';
// Actual application routes, deterministic mocked HTTP only; no live accounts.
const resources=['activities','holidays','all-activities','all-holidays'];
test.describe('Calendar local-day fixture',()=>{
 test.use({timezoneId:'Asia/Manila'});
 test('mocked dates match the selected local day across UTC midnight',async({page})=>{
  await page.clock.setFixedTime(new Date('2026-10-12T16:30:00Z'));
  expect(await page.evaluate(()=>new Date().toISOString().slice(0,10))).toBe('2026-10-12');
  expect(await browserCalendarDate(page)).toBe('2026-10-13');
 });
});
async function fixture(page: Page,dark=false) {
 const release=await mockDirectory(page,'PRINCIPAL',dark);release();
 const today=await browserCalendarDate(page);
 let status=0, failedResource='', writeStatus=0;
 let rows=[{id:71,title:'Synthetic assembly',date:today,type:'regular'}];
 const completed:string[]=[], failed:string[]=[], writes:{method:string;path:string;body:unknown}[]=[];
 let gate:Promise<void>|undefined,unlock:(()=>void)|undefined;
 page.on('requestfinished',(r:Request)=>{const p=new URL(r.url()).pathname;if(p.startsWith('/api/calendar/')&&r.method()==='GET')completed.push(p.split('/').pop()!);});
 page.on('requestfailed',(r:Request)=>{if(new URL(r.url()).pathname.startsWith('/api/calendar/'))failed.push(r.method());});
 await page.route('**/api/calendar/**',async route=>{
  const r=route.request(),path=new URL(r.url()).pathname,resource=path.split('/').pop()!;
  if(r.method()==='GET'){
   if(gate)await gate;
   const code=resource===failedResource?status:0;
   await route.fulfill({status:code||200,json:code?{success:false,message:'Synthetic Calendar failure'}:{success:true,data:rows}}).catch(()=>{});
  }else{
   const body=r.postDataJSON();writes.push({method:r.method(),path,body});
   if(writeStatus){await route.fulfill({status:writeStatus,json:{success:false,message:'Synthetic write failure'}});return;}
   if(r.method()==='POST')rows=[...rows,...body.entries.map((e:{title:string;date:string})=>({...e,id:72}))];
   if(r.method()==='PUT')rows=rows.map(e=>e.id===Number(resource)?{...e,...body}:e);
   if(r.method()==='DELETE')rows=rows.filter(e=>e.id!==Number(resource));
   await route.fulfill({json:{success:true,data:rows}});
  }
 });
 return {today,completed,failed,writes,fail:(resource:string,code:number)=>{failedResource=resource;status=code;},writeFail:(code:number)=>{writeStatus=code;},empty:()=>{rows=[];},hold:()=>{gate=new Promise<void>(r=>{unlock=r;});},release:()=>{gate=undefined;unlock?.();},settled:async(n:number)=>{await expect.poll(()=>Object.fromEntries(resources.map(r=>[r,completed.filter(x=>x===r).length]))).toEqual(Object.fromEntries(resources.map(r=>[r,n])));}};
}
async function open(page:Page){await page.goto('/principal/calendar');await waitForDataRoute(page);await expect(page.getByRole('heading',{name:'Calendar',exact:true})).toBeVisible();}
async function settled(page:Page){await expect(page.locator('main [aria-busy="true"]')).toHaveCount(0);}
async function nav(page:Page,name:string){const menu=page.getByRole('button',{name:'Open menu',exact:true});if(await menu.isVisible())await menu.click();await page.getByRole('link',{name,exact:true}).click();}
for(const width of [375,1280])for(const dark of [false,true])test('Principal Calendar '+width+' '+(dark?'dark':'light')+': loading, fresh cache, offline cached recovery',async({page,context})=>{
 await page.setViewportSize({width,height:1000});const f=await fixture(page,dark);f.hold();await open(page);
 await expect(page.locator('main [aria-busy="true"]').first()).toBeAttached();f.release();await settled(page);await f.settled(1);
 await expect(page.getByText('Synthetic assembly',{exact:true}).first()).toBeVisible();
 await nav(page,'Help & Support');await expect(page.getByRole('heading',{name:'Help & Support',exact:true})).toBeVisible();await nav(page,'Calendar');await settled(page);await f.settled(1);
 await context.setOffline(true);await expect(page.getByRole('alert').filter({hasText:'offline'})).toBeVisible();await expect(page.getByText('Synthetic assembly',{exact:true}).first()).toBeVisible();
 await page.getByRole('button',{name:'Retry',exact:true}).click();expect(f.completed).toHaveLength(4);
 await context.setOffline(false);await expect(page.getByRole('alert')).toHaveCount(0);await f.settled(1);
});
for(const resource of resources)for(const status of [401,403,500])test('Principal Calendar independent '+resource+' '+status,async({page})=>{
 const f=await fixture(page);f.fail(resource,status);f.hold();await open(page);f.release();
 if(status===401){await expect(page.getByPlaceholder('e.g. TC_maria.delacruz')).toBeVisible();return;}
 await expect(page.getByRole('alert').first()).toContainText('Synthetic Calendar failure');await settled(page);await f.settled(1);expect(page.url()).toContain('/principal/calendar');
 f.fail(resource,0);await page.getByRole('button',{name:'Retry',exact:true}).first().click();await expect(page.getByRole('alert')).toHaveCount(0);await settled(page);await f.settled(2);
});
test('Principal Calendar empty and stale revalidation after navigation',async({page})=>{
 const f=await fixture(page);f.empty();await open(page);await settled(page);await f.settled(1);await expect(page.getByText('No activities on this date.')).toBeVisible();
 await page.clock.install();await nav(page,'Help & Support');await expect(page.getByRole('heading',{name:'Help & Support',exact:true})).toBeVisible();await page.clock.fastForward(31_000);await nav(page,'Calendar');await page.clock.resume();await settled(page);await f.settled(2);
});
test('Principal Calendar cancels pending requests when navigating away',async({page})=>{
 const f=await fixture(page);f.hold();await open(page);await expect(page.locator('main [aria-busy="true"]').first()).toBeAttached();
 await nav(page,'Help & Support');await expect(page.getByRole('heading',{name:'Help & Support',exact:true})).toBeVisible();await expect.poll(()=>f.failed.length).toBeGreaterThanOrEqual(4);f.release();expect(f.completed).toEqual([]);
});
test('Principal Calendar offline initial requests recover without Retry queue',async({page,context})=>{
 const f=await fixture(page);await open(page);await settled(page);await f.settled(1);
 await nav(page,'Help & Support');await expect(page.getByRole('heading',{name:'Help & Support',exact:true})).toBeVisible();
 await page.clock.install();await page.clock.fastForward(301_000);await page.clock.resume();await context.setOffline(true);await nav(page,'Calendar');
 await expect(page.getByRole('alert').first()).toContainText('offline');await settled(page);await page.getByRole('button',{name:'Retry',exact:true}).first().click();expect(f.completed).toHaveLength(4);
 await context.setOffline(false);await expect(page.getByRole('alert')).toHaveCount(0);await f.settled(2);
});
for(const kind of ['Activities','Holidays'])test('Principal Calendar '+kind+' create failure preserves draft then successful invalidation',async({page})=>{
 const f=await fixture(page);await open(page);await settled(page);await f.settled(1);
 await page.getByRole('button',{name:'Manage School Calendar'}).click();await page.getByRole('button',{name:kind,exact:true}).click();
 const dialog=page.getByRole('dialog',{name:'Add '+kind});await dialog.locator('input:not([type=date])').fill('Synthetic created');await dialog.locator('input[type=date]').fill(f.today);
 f.writeFail(500);await dialog.getByRole('button',{name:/Save/}).click();await expect(dialog.getByText('Synthetic write failure')).toBeVisible();expect(f.writes).toHaveLength(1);expect(f.completed).toHaveLength(4);await expect(dialog.locator('input:not([type=date])')).toHaveValue('Synthetic created');
 f.writeFail(0);await dialog.getByRole('button',{name:/Save/}).click();await expect(dialog).toHaveCount(0);await expect.poll(()=>f.completed.filter(r=>r.endsWith(kind.toLowerCase())).length).toBe(4);expect(f.completed.filter(r=>!r.endsWith(kind.toLowerCase()))).toHaveLength(2);expect(f.writes).toHaveLength(2);await expect(page.getByText('Synthetic created',{exact:true}).first()).toBeVisible();
});

for(const kind of ['Activities','Holidays'])test('Principal Calendar '+kind+' edit and delete invalidate only their readers',async({page})=>{
 const f=await fixture(page);await open(page);await settled(page);await f.settled(1);
 await page.getByRole('button',{name:'Expand '+kind.toLowerCase()}).click();
 const list=page.getByRole('dialog',{name:'All '+kind});await list.getByRole('button',{name:'Edit entry'}).click();
 const edit=page.getByRole('dialog',{name:'Edit '+(kind==='Activities'?'Activity':'Holiday')});await edit.locator('input:not([type=date])').fill('Synthetic edited');await edit.getByRole('button',{name:/Save/}).click();await expect(edit).toHaveCount(0);await expect(list.getByText('Synthetic edited',{exact:true})).toBeVisible();
 await expect.poll(()=>f.completed.filter(r=>r.endsWith(kind.toLowerCase())).length).toBe(4);expect(f.completed.filter(r=>!r.endsWith(kind.toLowerCase()))).toHaveLength(2);
 await list.getByRole('button',{name:'Delete entry'}).click();const remove=page.getByRole('alertdialog',{name:'Delete this entry?'});f.writeFail(500);await remove.getByRole('button',{name:'Delete',exact:true}).click();await expect(remove.getByText('Synthetic write failure')).toBeVisible();expect(f.completed).toHaveLength(6);
 f.writeFail(0);await remove.getByRole('button',{name:'Delete',exact:true}).click();await expect(remove).toHaveCount(0);await expect(list.getByText('Synthetic edited',{exact:true})).toHaveCount(0);await expect.poll(()=>f.completed.filter(r=>r.endsWith(kind.toLowerCase())).length).toBe(6);expect(f.completed.filter(r=>!r.endsWith(kind.toLowerCase()))).toHaveLength(2);
 expect(f.writes.map(w=>w.method)).toEqual(['PUT','DELETE','DELETE']);
});
