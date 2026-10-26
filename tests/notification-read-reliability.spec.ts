import {test,expect,type Page} from '@playwright/test';
import {NotificationSnapshot} from '../src/shared/notification/notificationSnapshot';
import type {Notification} from '../src/shared/notification/Notification.service';
const row=(id:number,title:string)=>({id,title,is_read:false,created_at:new Date().toISOString()});
async function ready(page:Page,role:string){await page.goto('/tests/principal-notification-query.html?role='+role);await page.getByRole('button',{name:'Ready',exact:true}).click();if(role==='PARENT')await page.getByRole('button',{name:'Activate queries'}).click();await expect(page.getByTestId('rows')).toContainText('Keep');}
const refresh=(page:Page)=>page.evaluate(()=>window.dispatchEvent(new Event('focus')));
for(const role of ['ADMIN','PRINCIPAL','TEACHER','PARENT']){
 test(`F08 ${role}: full snapshot removes deleted rows and adjusts unread count`,async({page})=>{
  let deleted=false;await page.route('**/api/notification/**',r=>r.fulfill({json:{success:true,data:deleted?[row(1,'Keep')]:[row(1,'Keep'),row(2,'Deleted')]}}));
  await ready(page,role);await expect(page.getByTestId('rows')).toContainText('Deleted');deleted=true;await refresh(page);await expect(page.getByTestId('rows')).toHaveText('Keep');await expect(page.getByTestId('unread')).toHaveText('1');
 });
 test(`F08 ${role}: read failure remains visible after a socket event and explicit Retry restores the snapshot`,async({page})=>{
  let status=200,writes=0;await page.route('**/api/notification/**',r=>{if(r.request().method()!=='GET')writes++;return r.fulfill({status,json:status===200?{success:true,data:[row(1,'Keep')]}:{success:false}});});
  await ready(page,role);status=503;await refresh(page);await expect(page.getByTestId('read-error')).toContainText('503');await expect(page.getByTestId('rows')).toHaveText('Keep');await page.getByRole('button',{name:'Socket event'}).click();await expect(page.getByTestId('rows')).toContainText('Socket fixture');await expect(page.getByTestId('read-error')).toContainText('503');
  // Wait for the bounded query read attempt, never replay a write.
  await expect.poll(()=>page.evaluate(async()=>{const {queryClient}=await import('/src/shared/query/queryClient.ts');return queryClient.getQueryCache().getAll().every(q=>q.state.fetchStatus==='idle');})).toBe(true);
  status=200;await page.getByRole('button',{name:'Retry notifications'}).click();await expect(page.getByTestId('read-error')).toBeEmpty();await expect(page.getByTestId('rows')).toHaveText('Keep');expect(writes).toBe(0);await expect(page.getByTestId('expired')).toHaveText('0');
 });
 test(`F08 ${role}: authorization denial hides cached rows without session expiration`,async({page})=>{
  let status=200;await page.route('**/api/notification/**',r=>r.fulfill({status,json:{success:status===200,data:[row(1,'Keep')]}}));await ready(page,role);status=403;await refresh(page);await expect(page.getByTestId('read-error')).toContainText('403');await expect(page.getByTestId('rows')).toBeEmpty();await page.getByRole('button',{name:'Socket event'}).click();await expect(page.getByTestId('rows')).toBeEmpty();await expect(page.getByTestId('expired')).toHaveText('0');
 });
}
test('F08: a socket event during a full snapshot survives once, then a later authoritative deletion removes it',()=>{
 const snapshot=new NotificationSnapshot();const original={id:1,title:'Original'} as Notification,newer={id:99,title:'Concurrent'} as Notification;
 const started=snapshot.start();snapshot.push(newer);expect(snapshot.reconcile([original],started)).toEqual([newer,original]);expect(snapshot.reconcile([original],snapshot.start())).toEqual([original]);expect(snapshot.reconcile([],snapshot.start())).toEqual([]);
});
for(const role of ['ADMIN','PRINCIPAL','TEACHER','PARENT']){
 test(`F08 ${role}: a socket arrival during a snapshot survives and its later deletion reconciles`,async({page})=>{
  let calls=0,hold=false,deleted=false,release=()=>{};let gate=Promise.resolve();
  await page.route('**/api/notification/**',async r=>{calls++;const data=deleted?[row(1,'Keep')]:[row(1,'Keep'),row(2,'Deleted')];if(hold)await gate;return r.fulfill({json:{success:true,data}});});
  await ready(page,role);await expect(page.getByTestId('rows')).toContainText('Deleted');const before=calls;deleted=true;hold=true;gate=new Promise<void>(resolve=>{release=resolve;});await refresh(page);await expect.poll(()=>calls).toBe(before+1);await page.getByRole('button',{name:'Socket event'}).click();await expect(page.getByTestId('rows')).toContainText('Socket fixture');hold=false;release();await expect(page.getByTestId('rows')).toHaveText('Socket fixture,Keep');await refresh(page);await expect(page.getByTestId('rows')).toHaveText('Keep');
 });
 test(`F08 ${role}: a failed mark-all write is reported once without optimistic success or replay`,async({page})=>{
  let writes=0;await page.route('**/api/notification/**',r=>{if(r.request().method()!=='GET'){writes++;return r.fulfill({status:503,json:{success:false}});}return r.fulfill({json:{success:true,data:[row(1,'Keep')]}});});await ready(page,role);await page.getByRole('button',{name:'Mark all',exact:true}).click();await expect(page.getByText('Could not mark notifications as read. Please try again.',{exact:true})).toBeVisible();await expect(page.getByTestId('unread')).toHaveText('1');expect(writes).toBe(1);await refresh(page);await expect(page.getByTestId('rows')).toHaveText('Keep');expect(writes).toBe(1);
 });
}
test('F08 Admin activated Query: authoritative reads remove rows from the legacy seed',async({page})=>{
 let deleted=false;await page.route('**/api/notification/**',r=>r.fulfill({json:{success:true,data:deleted?[row(1,'Keep')]:[row(1,'Keep'),row(2,'Deleted')]}}));await ready(page,'ADMIN');await expect(page.getByTestId('rows')).toContainText('Deleted');await page.getByRole('button',{name:'Activate queries'}).click();deleted=true;await page.getByRole('button',{name:'Invalidate',exact:true}).click();await expect(page.getByTestId('rows')).toHaveText('Keep');await expect(page.getByTestId('unread')).toHaveText('1');
});
test('F08 Admin activation retains the failed legacy refresh warning and cached rows until a successful Query read',async({page})=>{
 let status=200;await page.route('**/api/notification/**',r=>r.fulfill({status,json:{success:status===200,data:[row(1,'Keep')]}}));await ready(page,'ADMIN');status=503;await refresh(page);await expect(page.getByTestId('read-error')).toContainText('503');await page.getByRole('button',{name:'Activate queries'}).click();await expect(page.getByTestId('read-error')).toContainText('503');await expect(page.getByTestId('rows')).toHaveText('Keep');await expect.poll(()=>page.evaluate(async()=>{const {queryClient}=await import('/src/shared/query/queryClient.ts');return queryClient.getQueryCache().getAll().every(q=>q.state.fetchStatus==='idle');})).toBe(true);status=200;await page.getByRole('button',{name:'Retry notifications'}).click();await expect(page.getByTestId('read-error')).toBeEmpty();await expect(page.getByTestId('rows')).toHaveText('Keep');
});
