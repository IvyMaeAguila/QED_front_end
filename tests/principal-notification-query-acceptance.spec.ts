import {test,expect,type Page} from '@playwright/test';
import {mockDirectory} from './fixtures/directory';
import {waitForDataRoute} from './fixtures/routeReady';
import {browserCalendarDate} from './fixtures/browserDate';
// Actual Notification Bell/provider; deterministic mocked APIs and blocked sockets.
async function fixture(page:Page,dark=false,role: "PRINCIPAL" | "ADMIN" | "TEACHER" | "PARENT" = "PRINCIPAL"){
 const release=await mockDirectory(page,role,dark);release();
 let status=0,read=false,hold:Promise<void>|undefined,unlock:(()=>void)|undefined;
 const gets:string[]=[],writes:string[]=[],completed:string[]=[];
 page.on('requestfinished',r=>{if(r.method()==='GET'&&new URL(r.url()).pathname.startsWith('/api/notification/'))completed.push(new URL(r.url()).pathname);});
 await page.route('**/api/notification/**',async route=>{
  const r=route.request(),p=new URL(r.url()).pathname;
  if(r.method()==='GET'){
   gets.push(p);if(hold)await hold;
   await route.fulfill({status:status||200,json:status?{success:false,message:'Synthetic notification failure'}:{success:true,data:[{id:51,user_id:1,title:'Synthetic notice',message:'Synthetic message',type:'info',student_id:null,student_name:null,ref_key:null,is_read:read,created_at:new Date().toISOString()}]}}).catch(()=>{});
  }else{
   writes.push(p);if(!status)read=true;
   await route.fulfill({status:status||200,json:{success:!status}});
  }
 });
 return{gets,writes,completed,fail:(code:number)=>{status=code;},hold:()=>{hold=new Promise<void>(r=>{unlock=r;});},release:()=>{hold=undefined;unlock?.();}};
}
async function open(page:Page){await page.goto('/principal/help');await waitForDataRoute(page);await expect(page.getByRole('heading',{name:'Help & Support',exact:true})).toBeVisible();await page.getByRole('button',{name:'Notifications',exact:true}).click();}
for(const width of [375,1280])for(const dark of [false,true])test('Principal notifications '+width+' '+(dark?'dark':'light')+' preserves Bell and confirmed mark-all',async({page})=>{
 await page.setViewportSize({width,height:1000});const f=await fixture(page,dark);await open(page);await expect(page.getByText('Synthetic notice',{exact:true})).toBeVisible();
 const before=f.gets.length;await expect(page.getByLabel('Unread',{exact:true})).toHaveCount(1);
 await page.getByRole('button',{name:'Mark all as read',exact:true}).click();await expect(page.getByLabel('Unread',{exact:true})).toHaveCount(0);
 expect(f.writes).toEqual(['/api/notification/user/1/read-all']);await expect.poll(()=>f.gets.length).toBe(before+1);
});
test('Principal notifications failed mark stays unread; successful explicit retry invalidates',async({page})=>{
 const f=await fixture(page);await open(page);await expect(page.getByText('Synthetic notice',{exact:true})).toBeVisible();const before=f.gets.length;f.fail(500);
 await page.getByRole('button',{name:'Mark all as read',exact:true}).click();await expect.poll(()=>f.writes.length).toBe(1);await expect(page.getByLabel('Unread',{exact:true})).toHaveCount(1);expect(f.gets).toHaveLength(before);
 f.fail(0);await page.getByRole('button',{name:'Mark all as read',exact:true}).click();await expect(page.getByLabel('Unread',{exact:true})).toHaveCount(0);expect(f.writes).toHaveLength(2);
});
for(const status of [401,403])test('Principal notifications '+status+' isolates cached records',async({page})=>{
 const f=await fixture(page);await open(page);await expect(page.getByText('Synthetic notice',{exact:true})).toBeVisible();f.fail(status);
 await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
 if(status===401)await expect(page.getByPlaceholder('e.g. TC_maria.delacruz')).toBeVisible();
 else{await expect(page.getByText('Synthetic notice',{exact:true})).toHaveCount(0);expect(page.url()).toContain('/principal/help');}
});
test('Principal notifications existing 30-second poll, focus refresh and offline cached recovery',async({page,context})=>{
 await page.clock.install();const f=await fixture(page);await open(page);await expect(page.getByText('Synthetic notice',{exact:true})).toBeVisible();const before=f.gets.length;
 await page.clock.fastForward(30_001);await page.clock.resume();await expect.poll(()=>f.gets.length).toBe(before+1);await expect.poll(()=>f.completed.length).toBe(2);
 await context.setOffline(true);await expect(page.getByText('Synthetic notice',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Mark all as read',exact:true}).click();expect(f.writes).toEqual([]);
 const restored=page.evaluate(()=>new Promise(resolve=>window.addEventListener('online',()=>queueMicrotask(()=>resolve(true)),{once:true})));
 await context.setOffline(false);await restored;await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await expect.poll(()=>f.gets.length).toBe(before+2);await expect(page.getByText('Synthetic notice',{exact:true})).toBeVisible();
});

test('Principal logout/login isolates Calendar and notifications; old write 401 cannot expire new account',async({page})=>{
 await fixture(page);
 const today=await browserCalendarDate(page);
 let account=1,releaseWrite!:()=>void;
 const pending=new Promise<void>(resolve=>{releaseWrite=resolve;});let oldWriteStarted=false;
 await page.route('**/api/auth/logout',route=>route.fulfill({json:{success:true}}));
 await page.route('**/api/auth/login',route=>{account=2;return route.fulfill({json:{user:{id:'2',role:'PRINCIPAL',name:'Synthetic Two',user_name:'synthetic_two',email:'two@example.test'}}});});
 await page.route('**/api/user-profile/**',route=>route.fulfill({json:{id:String(account),role:'PRINCIPAL',name:'Synthetic '+account,userName:'synthetic',email:'fixture@example.test'}}));
 await page.route('**/api/calendar/**',route=>route.fulfill({json:{success:true,data:[{id:account,title:'Calendar account '+account,date:today}]}}));
 await page.route('**/api/notification/**',async route=>{
  if(route.request().method()==='GET')return route.fulfill({json:{success:true,data:[{id:50+account,user_id:account,title:'Notice account '+account,message:'Synthetic',type:'info',is_read:false,created_at:new Date().toISOString()}]}});
  oldWriteStarted=true;await pending;await route.fulfill({status:401,json:{success:false,message:'Expired old fixture session'}}).catch(()=>{});
 });
 await page.goto('/principal/calendar');await waitForDataRoute(page);await expect(page.getByText('Calendar account 1',{exact:true}).first()).toBeVisible();await page.getByRole('button',{name:'Notifications',exact:true}).click();await expect(page.getByText('Notice account 1',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Mark all as read',exact:true}).click();await expect.poll(()=>oldWriteStarted).toBe(true);
 await page.getByRole('button',{name:'Notifications',exact:true}).click();await page.getByRole('button',{name:'Log Out',exact:true}).click();await page.getByRole('dialog',{name:'Confirm logout'}).getByRole('button',{name:'Log out',exact:true}).click();await expect(page.getByPlaceholder('e.g. TC_maria.delacruz')).toBeVisible();await expect(page.getByText('Notice account 1',{exact:true})).toHaveCount(0);
 await page.getByPlaceholder('e.g. TC_maria.delacruz').fill('synthetic_two');await page.getByPlaceholder('••••••••').fill('synthetic-fixture-only');await page.getByRole('button',{name:'Login',exact:true}).click();await expect(page.locator('.qed-account-ui')).toBeVisible();await page.getByRole('link',{name:'Calendar',exact:true}).click();await expect(page.getByText('Calendar account 2',{exact:true}).first()).toBeVisible();await expect(page.getByText('Calendar account 1',{exact:true})).toHaveCount(0);
 const oldFinished=page.waitForResponse(r=>r.request().method()==='PATCH'&&new URL(r.url()).pathname.endsWith('/read-all'));releaseWrite();await oldFinished;
 await page.getByRole('button',{name:'Notifications',exact:true}).click();await expect(page.getByText('Notice account 2',{exact:true})).toBeVisible();await expect(page.getByText('Notice account 1',{exact:true})).toHaveCount(0);expect(page.url()).toContain('/principal/calendar');
});

test('ADMIN retains its existing bell-free layout and legacy notification reader',async({page})=>{
 const modules:string[]=[];page.on('request',r=>{if(/Principal(?:Notification|Calendar)Queries/.test(r.url()))modules.push('Principal adapter');});
 const f=await fixture(page,false,'ADMIN');await page.goto('/admin/calendar');await waitForDataRoute(page);await expect(page.getByRole('heading',{name:'Calendar',exact:true})).toBeVisible();await expect.poll(()=>f.completed.length).toBeGreaterThan(0);await expect(page.getByRole('button',{name:'Notifications',exact:true})).toHaveCount(0);expect(modules).toEqual([]);
});
for(const role of ['TEACHER','PARENT'] as const)test(role+' Notification Bell remains functional without Principal Query adapters',async({page})=>{
 const modules:string[]=[];page.on('request',r=>{if(/Principal(?:Notification|Calendar)Queries/.test(r.url()))modules.push('Principal adapter');});
 const f=await fixture(page,false,role);await page.goto('/'+role.toLowerCase()+'/calendar');await waitForDataRoute(page);await expect(page.getByRole('heading',{name:'Calendar',exact:true})).toBeVisible();await page.getByRole('button',{name:'Notifications',exact:true}).click();await expect(page.getByText('Synthetic notice',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Mark all as read',exact:true}).click();await expect(page.getByLabel('Unread',{exact:true})).toHaveCount(0);await expect.poll(()=>f.writes).toEqual(['/api/notification/user/1/read-all']);expect(modules).toEqual([]);
});
