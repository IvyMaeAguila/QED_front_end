import { waitForDataRoute } from "./fixtures/routeReady";
import { test, expect, type Page } from "@playwright/test";
import { mockDirectory } from "./fixtures/directory";
import { assertNoDataSpinner, captureFixedOverlay } from "./design-pixels";
import fs from "node:fs";

async function studentFixture(page: Page, dark: boolean, count = 3, long = false, missing = false, role: "ADMIN" | "TEACHER" = "TEACHER") {
  const context = await mockDirectory(page, role, dark);
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  let failed = false, requests = 0;
  await page.route("**/api/student/allStudents", async route => {
    requests++; await gate;
    if (failed) { await route.fulfill({ status: 500, json: { message: "Student data unavailable" } }); return; }
    await route.fulfill({ json: { data: missing ? [] : [{ id: 1, grade_level_id: 1, section_id: 1, student_number: "2026-01", learner_reference_number: "123456789001", first_name: long ? "Maria Alexandra Isabella ".repeat(8) : "Ana", last_name: "Cruz", middle_name: "", gender: "Female", grade_level_name: "Grade 1", section_name: "Maroon" }] } });
  });
  await page.route("**/api/classes/", async route => {
    await gate; await route.fulfill({ json: { success: true, data: [{ id: 1, gradeLevelId: 1, gradeLevel: "Grade 1", sectionId: 1, section: "Maroon", room: "101", adviserId: 1, adviserName: "Teacher Cruz", studentCount: 1, schedule: Array.from({ length: count }, (_, index) => ({ id: index + 1, subject: long ? "Mathematics and reasoning for elementary learners ".repeat(8) : "Mathematics", teacherId: "1", startTime: "07:30", endTime: "08:30", days: ["Monday"] })) }] } });
  });
  await page.route("**/api/section/getTeachers", async route => {
    await gate; await route.fulfill({ json: { status: "success", data: [{ id: 1, user_id: 1, first_name: long ? "Maria Alexandra Isabella ".repeat(8) : "Teacher", last_name: "Cruz", middle_name: null, email_address: "teacher@example.test", contact_number: "09123456789", gender: "Female" }] } });
  });
  await page.route('**/api/gradingPeriods',route=>route.fulfill({json:{success:true,data:[{id:'1',schoolYearId:'1',termNumber:1,termLabel:'Term 1',startDate:'2026-09-01',endDate:'2026-10-31',isActive:true},{id:'2',schoolYearId:'1',termNumber:2,termLabel:'Term 2',startDate:'2026-11-01',endDate:'2026-12-31',isActive:false}]}}));
  await page.route('**/api/teacherAttendance/advisory-sections',route=>route.fulfill({json:[{classId:'1',schoolYearId:'1',sectionId:'1',sectionName:'Maroon',gradeLevel:'Grade 1',roster:[{id:'1',name:'Ana Cruz',gender:'Female'}],terms:[]}]}));
  await page.route('**/api/teacherAttendance/1?allPeriods=true',route=>route.fulfill({json:{data:{'1':{'2026-10-01':'P','2026-10-02':'P','2026-10-05':'P','2026-10-06':'P','2026-10-07':'L','2026-10-08':'A','2026-10-09':'E','2026-09-01':'A'},'2':{'2026-10-12':'P'}}}}));
  await page.route('**/api/teacherHolistic/profile/1?termNumber=*',route=>route.fulfill({json:{success:true,data:{studentId:'1',studentName:'Ana Cruz',isAdvisory:true,overall:{domainAverages:route.request().url().endsWith('=2')?{cognitive:2,emotional:2,behavioral:2,social:2}:{cognitive:5,emotional:5,behavioral:4,social:5},evaluationCount:4,lastEvaluation:'2026-10-01'},highestRiskLevel:'NONE',subjects:[]}}}));
  return Object.assign(() => { context(); release(); }, { fail: () => { failed = true; }, recover: () => { failed = false; }, requests: () => requests });
}

test('Teacher student profile is read-only and returns to its own advisory route', async ({page}) => {
  const release=await studentFixture(page,false);release();await page.goto('/teacher/students/1');await waitForDataRoute(page);
  await expect(page.getByRole('heading',{name:'Cruz, Ana',exact:true})).toBeVisible();
  await expect(page.getByRole('link',{name:'Edit Student Record',exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'Back to Students',exact:true}).click();await expect(page).toHaveURL(/\/teacher\/advisory/);
});
test('Admin student directory retains its existing edit navigation', async ({page}) => {
  const release=await studentFixture(page,false,3,false,false,'ADMIN');release();await page.goto('/admin/students');await waitForDataRoute(page);
  await expect(page.getByRole('heading',{name:'Student Records',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Row actions',exact:true}).first().click();
  await page.getByRole('button',{name:'Edit',exact:true}).click();await expect(page).toHaveURL(/\/admin\/students\/1\/edit$/);
});

for (const width of [375, 1280]) for (const dark of [false, true]) test(`student details ${width} ${dark ? "dark" : "light"}: compact profile labels and controls`, async ({ page }) => {
  await page.setViewportSize({ width, height: 1000 });
  const release = await studentFixture(page, dark);
  await page.goto("/teacher/students/1");await waitForDataRoute(page);
  await expect(page.getByRole("button", { name: "Back to Students", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Student information", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Attendance Overview", exact: true })).toBeVisible();
  await expect(page.locator('.sk-region[aria-busy="true"]').first()).toHaveAttribute("data-sk-phase", "revealed");
  await assertNoDataSpinner(page);
  fs.mkdirSync("loading-screenshots", { recursive: true });
  const prefix = `loading-screenshots/teacher-student-details-${width}-${dark ? "dark" : "light"}`;
  await page.screenshot({ path: `${prefix}-skeleton.png`, fullPage: true });
  release(); await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Cruz, Ana", exact: true })).toBeVisible();
  await expect(page.locator('[data-sk-region="student-performance-row"]')).toHaveCount(1);
  await page.screenshot({ path: `${prefix}-loaded.png`, fullPage: true });
  for(const title of ['Attendance Overview','Term Snapshot']){
    const card=page.getByRole('region',{name:title,exact:true});
    expect(await card.evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
    await card.screenshot({path:`${prefix}-${title.replaceAll(' ','-')}.png`});
  }
});
for (const count of [0, 1, 9]) test(`student details ${count} scheduled subjects preserve native rows and known status`, async ({ page }) => {
  const release = await studentFixture(page, false, count, count === 9);
  await page.goto("/teacher/students/1");await waitForDataRoute(page);
  await expect(page.getByRole("heading", { name: "Student information", exact: true })).toBeVisible();
  release(); await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0);
  await expect(page.locator('[data-sk-region="student-performance-row"]')).toHaveCount(count ? 1 : 0);
  if (!count) await expect(page.getByText(/No subjects assigned or scheduled for/)).toBeVisible();
  else await expect(page.getByRole("columnheader", { name: "Teacher", exact: true })).toBeVisible();
});

test("student details failure removes all placeholders and retries the original context request", async ({ page }) => {
  const release = await studentFixture(page, false); release.fail();
  await page.goto("/teacher/students/1");await waitForDataRoute(page);
  await expect(page.locator('.sk-region[aria-busy="true"]').first()).toHaveAttribute("data-sk-phase", "revealed");
  release(); await expect(page.getByRole("alert")).toBeVisible();
  expect(await page.locator("[data-sk-primitive]").count()).toBe(0);
  const before = release.requests(); release.recover();
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Cruz, Ana", exact: true })).toBeVisible();
  expect(release.requests()).toBe(before + 1);
});

test("student details not-found state waits for the student request", async ({ page }) => {
  const release = await studentFixture(page, false, 3, false, true);
  await page.goto("/teacher/students/1");await waitForDataRoute(page);
  await expect(page.getByRole("heading", { name: "Student information", exact: true })).toBeVisible();
  release(); await expect(page.getByRole("heading", { name: "Student Not Found", exact: true })).toBeVisible();
  await expect(page.locator("[data-sk-primitive]")).toHaveCount(0);
});

test("student subject columns remain aligned with long names", async ({ page }) => {
  const widths: number[][] = [];
  for (const long of [false, true]) {
    const release = await studentFixture(page, false, 1, long);
    await page.goto("/teacher/students/1");await waitForDataRoute(page);
    await expect(page.getByRole("heading", { name: "Student information", exact: true })).toBeVisible();
    release(); await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0);
    widths.push(await page.locator("thead th").evaluateAll(elements => elements.map(element => element.getBoundingClientRect().width)));
    await page.unroute("**/api/**"); await page.unroute("**/api/student/allStudents"); await page.unroute("**/api/classes/"); await page.unroute("**/api/section/getTeachers");
  }
  expect(widths[0].every((width, index) => Math.abs(width - widths[1][index]) <= 1)).toBe(true);
});

test('Advisory profile follows the compact reference and lists distinct subjects and teachers',async({page})=>{
 const release=await studentFixture(page,false);release();
 await page.route('**/api/classes/',route=>route.fulfill({json:{success:true,data:[{id:1,gradeLevelId:1,gradeLevel:'Grade 1',sectionId:1,section:'Maroon',room:'101',adviserId:1,adviserName:'Teacher Cruz',schedule:['Language','Reading and Literacy','Mathematics','Mathematics'].map((subject,id)=>({id:id+1,subject,teacherId:'1',startTime:'07:30',endTime:'08:30',days:['Monday']}))}]}}));
 await page.goto('/teacher/students/1');await waitForDataRoute(page);await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0);
 for(const title of ['Student summary','Student information','Guardian','Attendance Overview','Term Snapshot','Subjects and teachers'])await expect(page.getByRole('region',{name:title,exact:true})).toBeVisible();
 await expect(page.getByRole('columnheader',{name:'Quarter Grade',exact:true})).toHaveCount(0);await expect(page.getByRole('button',{name:'Notify Parent',exact:true})).toHaveCount(0);
 await expect(page.getByRole('region',{name:'Term Snapshot'})).toContainText('Excellent');
 await expect(page.locator('[data-sk-region="student-performance-row"]')).toHaveCount(3);
 const info=await page.getByRole('region',{name:'Student information',exact:true}).boundingBox();const attendance=await page.getByRole('region',{name:'Attendance Overview',exact:true}).boundingBox();expect(info!.y).toBeLessThan(attendance!.y);
 fs.mkdirSync('monthly-report-review',{recursive:true});await page.screenshot({path:'monthly-report-review/advisory-student-profile-desktop.png',fullPage:true});
});

test('Advisory profile uses the system back button and fills available screen width',async({page})=>{
 const release=await studentFixture(page,false);release();await page.goto('/teacher/students/1');await waitForDataRoute(page);
 await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0);
 const back=page.getByRole('button',{name:'Back to Students',exact:true});await expect(back).toHaveClass(/system-back-button/);await expect(back).toHaveText('');
 await expect(page.getByRole('heading',{name:'Student Profile',exact:true})).toHaveClass(/qed-type-page-title/);
 let previousWidth=0;
 for(const width of [375,1280,1920,2560]){
  await page.setViewportSize({width,height:1100});
  const geometry=await page.locator('[data-advisory-student-profile]').evaluate(element=>{
   const parent=element.parentElement!,style=getComputedStyle(parent),box=element.getBoundingClientRect();
   return {width:box.width,available:parent.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight),viewport:window.innerWidth,right:box.right,scroll:document.documentElement.scrollWidth};
  });
  expect(Math.abs(geometry.width-geometry.available)).toBeLessThanOrEqual(2);expect(geometry.right).toBeLessThanOrEqual(width);expect(geometry.scroll).toBeLessThanOrEqual(width);
  expect(geometry.width).toBeGreaterThan(previousWidth);previousWidth=geometry.width;
  if(width>=1920)expect(geometry.width).toBeGreaterThan(1400);
  const info=await page.getByRole('region',{name:'Student information',exact:true}).boundingBox();const attendance=await page.getByRole('region',{name:'Attendance Overview',exact:true}).boundingBox();
  expect(info!.y).toBeLessThan(attendance!.y);
  const guardian=await page.getByRole('region',{name:'Guardian',exact:true}).boundingBox();
  const holistic=await page.getByRole('region',{name:'Term Snapshot',exact:true}).boundingBox();
  if(width>=1280){
   expect(Math.abs(info!.width-guardian!.width)).toBeLessThan(2);expect(Math.abs(info!.height-guardian!.height)).toBeLessThan(2);
   expect(Math.abs(attendance!.width-holistic!.width)).toBeLessThan(2);expect(Math.abs(attendance!.height-holistic!.height)).toBeLessThan(2);
   expect(Math.abs(attendance!.y-holistic!.y)).toBeLessThan(2);
   const attendanceSection=page.getByRole('region',{name:'Attendance Overview',exact:true});
   const holisticSection=page.getByRole('region',{name:'Term Snapshot',exact:true});
   const attendanceHeader=await attendanceSection.locator(':scope > div > div').first().boundingBox();
   const holisticHeader=await holisticSection.locator(':scope > div > div').first().boundingBox();
   expect(Math.abs(attendanceHeader!.y+attendanceHeader!.height-holisticHeader!.y-holisticHeader!.height)).toBeLessThanOrEqual(1);
   const attendanceTitle=await attendanceSection.getByRole('heading',{name:'Attendance Overview',exact:true}).boundingBox();
   const holisticTitle=await holisticSection.getByRole('heading',{name:'Term Snapshot',exact:true}).boundingBox();
   expect(Math.abs(attendanceTitle!.y-holisticTitle!.y)).toBeLessThanOrEqual(1);

  }
  if(width===1920)await page.screenshot({path:'monthly-report-review/advisory-profile-system-wide.png',fullPage:true});
 }
 await back.click();await expect(page).toHaveURL(/\/teacher\/advisory/);
});


test('Advisory progress fetches student-specific data and switches months and terms without parent APIs or writes',async({page})=>{
 const release=await studentFixture(page,false);release();const unexpected:string[]=[];
 page.on('request',request=>{const url=new URL(request.url());if(request.method()!=='GET'||/^\/api\/(attendance|sy_term)(?:$|\/)/.test(url.pathname))unexpected.push(request.url());});
 await page.goto('/teacher/students/1');await waitForDataRoute(page);
 const attendance=page.getByRole('region',{name:'Attendance Overview',exact:true});const snapshot=page.getByRole('region',{name:'Term Snapshot',exact:true});
 await expect(attendance.getByText('67%',{exact:true})).toBeVisible();await expect(attendance).toContainText('8 school days in October 2026');
 await expect(attendance).toContainText('1 excused');await expect(attendance).toContainText('1 unmarked');
 await attendance.getByRole('button',{name:/Late/}).click();await expect(attendance.getByText('17%',{exact:true})).toBeVisible();
 await page.getByLabel('Select attendance month').selectOption('2026-09');
 await attendance.getByRole('button',{name:/Absent/}).click();await expect(attendance.getByText('100%',{exact:true})).toBeVisible();
 await expect(snapshot).toContainText('Excellent');await expect(snapshot).toContainText('Generally disciplined with minor issues');
 await page.getByLabel('Select holistic term').selectOption('2');await expect(snapshot).toContainText('Needs Improvement');await expect(snapshot).not.toContainText('Excellent');
 expect(unexpected).toEqual([]);
});

test('Advisory progress errors recover independently and no-records stays honest',async({page})=>{
 const release=await studentFixture(page,false);release();let fail=true;
 await page.route('**/api/teacherAttendance/1?allPeriods=true',route=>route.fulfill(fail?{status:503,json:{message:'Unavailable'}}:{json:{data:{}}}));
 await page.goto('/teacher/students/1');await waitForDataRoute(page);
 const attendance=page.getByRole('region',{name:'Attendance Overview',exact:true});
 await expect(attendance.getByRole('alert')).toBeVisible();await expect(page.getByRole('region',{name:'Term Snapshot',exact:true})).toContainText('Excellent');
 fail=false;await attendance.getByRole('button',{name:'Retry',exact:true}).click();await expect(attendance.getByRole('alert')).toHaveCount(0);
 await expect(attendance.getByText('\u2014',{exact:true})).toBeVisible();await expect(attendance).toContainText('No attendance records');
});



test('Advisory progress waits for the authorized student before reading records',async({page})=>{
 const release=await studentFixture(page,false);const reads:string[]=[];
 page.on('request',request=>{if(/\/api\/(teacherAttendance|teacherHolistic|gradingPeriods)/.test(request.url()))reads.push(request.url());});
 await page.goto('/teacher/students/1');await waitForDataRoute(page);
 await expect(page.getByRole('heading',{name:'Attendance Overview',exact:true})).toBeVisible();expect(reads).toEqual([]);
 release();await expect(page.getByRole('region',{name:'Term Snapshot',exact:true})).toContainText('Excellent');expect(reads.length).toBeGreaterThan(0);
});

test('Advisory progress denies attendance outside the owned advisory and never fetches its marks',async({page})=>{
 const release=await studentFixture(page,false);release();let marks=0;
 await page.route('**/api/teacherAttendance/advisory-sections',route=>route.fulfill({json:[]}));
 page.on('request',request=>{if(request.url().includes('allPeriods=true'))marks++;});
 await page.goto('/teacher/students/1');await waitForDataRoute(page);
 await expect(page.getByRole('region',{name:'Attendance Overview',exact:true})).toContainText('Attendance is available only');expect(marks).toBe(0);
});

for(const status of [401,403])test(`Advisory progress HTTP ${status} does not show protected records`,async({page})=>{
 const release=await studentFixture(page,false);release();
 await page.route('**/api/teacherAttendance/1?allPeriods=true',route=>route.fulfill({status,json:{message:'Forbidden'}}));
 await page.route('**/api/teacherHolistic/profile/1?termNumber=*',route=>route.fulfill({status,json:{success:false,message:'Forbidden'}}));
 await page.goto('/teacher/students/1');await waitForDataRoute(page);
 if(status===401){await expect(page).toHaveURL(/login/);return;}
 const attendance=page.getByRole('region',{name:'Attendance Overview',exact:true}),snapshot=page.getByRole('region',{name:'Term Snapshot',exact:true});
 await expect(attendance.getByRole('alert')).toBeVisible();await expect(snapshot.getByRole('alert')).toBeVisible();await expect(attendance.getByText('67%',{exact:true})).toHaveCount(0);await expect(snapshot).not.toContainText('Excellent');
});


test('Guardian card displays saved linked-parent name and phone, with no relationship field',async({page})=>{
 const release=await studentFixture(page,false);release();
 await page.route('**/api/student/allStudents',route=>route.fulfill({json:{data:[{id:1,grade_level_id:1,section_id:1,student_number:'2026-01',first_name:'Ana',last_name:'Cruz',middle_name:'',gender:'Female',grade_level_name:'Grade 1',section_name:'Maroon',parent_guardian_name:'Legacy name',guardian_first_name:'Mara',guardian_middle_name:'D.',guardian_last_name:'Cruz',guardian_contact_number:'09123456789'}]}}));
 await page.goto('/teacher/students/1');await waitForDataRoute(page);
 const guardian=page.getByRole('region',{name:'Guardian',exact:true});
 await expect(guardian).toContainText('Mara D. Cruz');await expect(guardian).toContainText('09123456789');await expect(guardian).not.toContainText('Relationship');await expect(guardian).not.toContainText('Legacy name');
});

test('Guardian card falls back to the saved guardian name when no linked parent exists',async({page})=>{
 const release=await studentFixture(page,false);release();
 await page.route('**/api/student/allStudents',route=>route.fulfill({json:{data:[{id:1,grade_level_id:1,section_id:1,student_number:'2026-01',first_name:'Ana',last_name:'Cruz',middle_name:'',gender:'Female',grade_level_name:'Grade 1',section_name:'Maroon',parent_guardian_name:'Saved guardian',guardian_contact_number:null}]}}));
 await page.goto('/teacher/students/1');await waitForDataRoute(page);
 const guardian=page.getByRole('region',{name:'Guardian',exact:true});await expect(guardian).toContainText('Saved guardian');await expect(guardian).toContainText('No phone on file');await expect(guardian).not.toContainText('Relationship');
});
