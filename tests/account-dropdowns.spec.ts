import { test, expect } from '@playwright/test';
import { mockDirectory } from './fixtures/directory';
import { waitForDataRoute } from './fixtures/routeReady';
const cases = [
 {role:'ADMIN',url:'/admin/users',label:'All Roles',button:true},
 {role:'TEACHER',url:'/teacher/subjects',label:'All Grades',button:true},
 {role:'PRINCIPAL',url:'/principal/students',label:'Grade level filter',button:false},
 {role:'PARENT',url:'/parent/students/1',label:'Select attendance month',button:false},
] as const;
for(const scenario of cases)for(const dark of [false,true])test(`${scenario.role} shared dropdown ${dark?'dark mobile':'light desktop'}`,async({page})=>{
 await page.setViewportSize({width:dark?375:1440,height:900});
 const release=await mockDirectory(page,scenario.role,dark);release();
 await page.route('**/api/mySubjects/subjects',route=>route.fulfill({json:{data:[]}}));
 await page.route('**/api/sy_term',route=>route.fulfill({json:{success:true,data:{months:[{month:9,year:2026},{month:10,year:2026}]}}}));
 await page.route('**/api/attendance/**',route=>route.fulfill({json:{success:true,data:{student:{id:1,full_name:'Ana Cruz',student_number:'2026-01'},school_days:20,status_summary:{present:18,absent:1,late:1,excused:0}}}}));
 await page.goto(scenario.url);await waitForDataRoute(page);
 let control=page.getByRole(scenario.button?'button':'combobox',{name:scenario.label,exact:true});
 await expect(control).toBeEnabled();
 await control.evaluate(element=>element.setAttribute("data-testid","tested-dropdown"));control=page.getByTestId("tested-dropdown");
 const wrapper=control.locator('..');await expect(wrapper).toHaveCSS('height','32px');await expect(wrapper).toHaveCSS('border-radius','8px');
 await control.click();
 const menu=page.getByRole('listbox');await expect(menu).toBeVisible();
 await expect(menu).toHaveCSS('border-radius','8px');
 await expect(wrapper).not.toHaveAttribute("data-keyboard-focus","true");
 const box=(await menu.boundingBox())!;expect(box.y).toBeGreaterThanOrEqual(0);expect(box.y+box.height).toBeLessThanOrEqual(900);expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(dark?375:1440);
 await expect(menu).toHaveCSS('background-color',dark?'rgb(17, 24, 39)':'rgb(255, 255, 255)');
 await page.screenshot({path:`test-results/dropdown-open-${scenario.role}-${dark?"dark-mobile":"light-desktop"}.png`});
 const choices=menu.getByRole('option');const count=await choices.count();expect(count).toBeGreaterThan(1);
 const choice=choices.nth(1);await choice.click();await expect(menu).toHaveCount(0);
 await expect(control).toBeFocused();
 await control.press('Enter');await expect(menu).toBeVisible();await expect(wrapper).toHaveAttribute('data-keyboard-focus','true');await expect(menu.getByRole('option',{selected:true})).toHaveCount(1);
 await control.press('Escape');await expect(menu).toHaveCount(0);
 await control.press('Enter');await control.press('Home');await control.press('Enter');await expect(menu).toHaveCount(0);
 await control.click();await page.getByRole('main').click({position:{x:5,y:5}});await expect(menu).toHaveCount(0);
 await page.screenshot({path:`test-results/dropdown-${scenario.role}-${dark?'dark-mobile':'light-desktop'}.png`});
});
