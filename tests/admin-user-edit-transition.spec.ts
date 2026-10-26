import {test,expect} from '@playwright/test';
import {mockAdminUsers} from './fixtures/adminUsers';
import {waitForDataRoute} from './fixtures/routeReady';

test('Admin edit crossfade exposes one editable control and preserves its draft',async({page},info)=>{
 const f=await mockAdminUsers(page);f.hold();
 await page.goto('/admin/users/parent/1/edit');await waitForDataRoute(page);
 const firstName=page.locator('[data-sk-region="user-form-firstName"]');
 const status=page.locator('[data-sk-region="user-form-status"]');
 await expect(firstName).toHaveAttribute('data-sk-phase','revealed');
 await expect(firstName.locator('input')).toBeDisabled();
 await expect(page.getByRole('button',{name:'Save Changes',exact:true})).toBeDisabled();
 // Hold the actual Web Animations crossfade at its boundary, rather than
 // guessing how long network/rendering/animation will take under suite load.
 await firstName.evaluate(element=>{
  const observe=new MutationObserver(()=>{
   if(element.getAttribute('data-sk-phase')!=='swapping')return;
   for(const name of ['firstName','status']){
    const region=document.querySelector(`[data-sk-region="user-form-${name}"]`);
    region?.getAnimations({subtree:true}).forEach(animation=>animation.pause());
   }
  });
  observe.observe(element,{attributes:true,attributeFilter:['data-sk-phase']});
 });
 f.release();
 await expect(firstName).toHaveAttribute('data-sk-phase','swapping');
 await expect(firstName.locator('input')).toHaveCount(2);
 await expect(firstName.locator('[data-sk-outgoing]')).toHaveAttribute('aria-hidden','true');
 await expect(firstName.locator('[data-sk-outgoing]')).toHaveCSS('pointer-events','none');
 await expect(firstName.locator('[data-sk-outgoing] input')).toBeDisabled();
 await expect(firstName.getByRole('textbox')).toHaveCount(1);
 await expect(firstName.getByRole('textbox')).toHaveValue('Parent');
 await expect(page.getByRole('button',{name:'Save Changes',exact:true})).toBeEnabled();
 const snapshot=await firstName.evaluate(element=>({phase:element.getAttribute('data-sk-phase'),inputs:[...element.querySelectorAll('input')].map(input=>({value:input.value,disabled:input.disabled,outgoing:!!input.closest('[data-sk-outgoing]'),hidden:!!input.closest('[aria-hidden="true"]')}))}));
 await info.attach('actual-crossfade-controls',{body:Buffer.from(JSON.stringify(snapshot)),contentType:'application/json'});
 let originalError='';try{await firstName.locator('input').fill('Ambiguous');}catch(error){originalError=String(error);}
 expect(originalError).toContain('strict mode violation');
 expect(f.state.mutations).toEqual([]);
 await firstName.getByRole('textbox').fill('TransitionDraft');
 await expect(firstName.getByRole('textbox')).toHaveValue('TransitionDraft');
 await firstName.evaluate(element=>element.getAnimations({subtree:true}).forEach(animation=>animation.play()));
 await status.evaluate(element=>element.getAnimations({subtree:true}).forEach(animation=>animation.play()));
 await expect(firstName).toHaveAttribute('data-sk-phase','settled');
 await expect(status).toHaveAttribute('data-sk-phase','settled');
 await expect(firstName.locator('input')).toHaveCount(1);
 await expect(firstName.getByRole('textbox')).toHaveValue('TransitionDraft');
 await status.getByRole('combobox').selectOption('Active');
 await page.getByRole('button',{name:'Save Changes',exact:true}).click();
 await expect(page.getByText('User updated.',{exact:true})).toBeVisible();
 expect(f.state.mutations).toHaveLength(1);
 expect(f.state.mutations[0]).toMatchObject({method:'PUT',path:'/api/user/editUser/1',payload:{firstName:'TransitionDraft',role:'PARENT',status:'Active'}});
 await expect(page.getByRole('row').filter({hasText:'parent@example.invalid'})).toContainText('TransitionDraft');
});
