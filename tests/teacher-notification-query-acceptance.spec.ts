import {test,expect,type Page} from '@playwright/test';
import {mockDirectory} from './fixtures/directory';
import {waitForDataRoute} from './fixtures/routeReady';

// Actual Notification Bell/provider; deterministic mocked APIs and blocked sockets.
async function fixture(page:Page,dark=false,role: "PRINCIPAL" | "ADMIN" | "TEACHER" | "PARENT" = "TEACHER"){
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
async function open(page:Page){await page.goto('/teacher/help');await waitForDataRoute(page);await expect(page.getByRole('heading',{name:'Help & Support',exact:true})).toBeVisible();await page.getByRole('button',{name:'Notifications',exact:true}).click();}
for(const width of [375,1280])for(const dark of [false,true])test('Teacher notifications '+width+' '+(dark?'dark':'light')+' preserves Bell and confirmed mark-all',async({page})=>{
 await page.setViewportSize({width,height:1000});const f=await fixture(page,dark);await open(page);await expect(page.getByText('Synthetic notice',{exact:true})).toBeVisible();
 const before=f.gets.length;await expect(page.getByLabel('Unread',{exact:true})).toHaveCount(1);
 await page.getByRole('button',{name:'Mark all as read',exact:true}).click();await expect(page.getByLabel('Unread',{exact:true})).toHaveCount(0);
 expect(f.writes).toEqual(['/api/notification/user/1/read-all']);await expect.poll(()=>f.gets.length).toBe(before+1);
});
test('Teacher notifications failed mark stays unread; successful explicit retry invalidates',async({page})=>{
 const f=await fixture(page);await open(page);await expect(page.getByText('Synthetic notice',{exact:true})).toBeVisible();const before=f.gets.length;f.fail(500);
 await page.getByRole('button',{name:'Mark all as read',exact:true}).click();await expect.poll(()=>f.writes.length).toBe(1);await expect(page.getByLabel('Unread',{exact:true})).toHaveCount(1);expect(f.gets).toHaveLength(before);
 f.fail(0);await page.getByRole('button',{name:'Mark all as read',exact:true}).click();await expect(page.getByLabel('Unread',{exact:true})).toHaveCount(0);expect(f.writes).toHaveLength(2);
});
for(const status of [401,403])test('Teacher notifications '+status+' isolates cached records',async({page})=>{
 const f=await fixture(page);await open(page);await expect(page.getByText('Synthetic notice',{exact:true})).toBeVisible();f.fail(status);
 await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
 if(status===401)await expect(page.getByPlaceholder('e.g. TC_maria.delacruz')).toBeVisible();
 else{await expect(page.getByText('Synthetic notice',{exact:true})).toHaveCount(0);expect(page.url()).toContain('/teacher/help');}
});
test('Teacher notifications existing 30-second poll, focus refresh and offline cached recovery',async({page,context})=>{
 await page.clock.install();const f=await fixture(page);await open(page);await expect(page.getByText('Synthetic notice',{exact:true})).toBeVisible();const before=f.gets.length;
 await page.clock.fastForward(30_001);await page.clock.resume();await expect.poll(()=>f.gets.length).toBe(before+1);await expect.poll(()=>f.completed.length).toBe(2);
 await context.setOffline(true);await expect(page.getByText('Synthetic notice',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Mark all as read',exact:true}).click();expect(f.writes).toEqual([]);
 const restored=await page.evaluateHandle(()=>({online:new Promise<boolean>(resolve=>window.addEventListener('online',()=>queueMicrotask(()=>resolve(true)),{once:true}))}));
 await context.setOffline(false);await restored.evaluate(({online})=>online);await restored.dispose();await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await expect.poll(()=>f.gets.length).toBe(before+2);await expect(page.getByText('Synthetic notice',{exact:true})).toBeVisible();
});
