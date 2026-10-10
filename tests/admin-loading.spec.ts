import { waitForDataRoute } from "./fixtures/routeReady";
import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs";

async function mockAdmin(page: Page, dark: boolean, count = 3, long = false) {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.addInitScript(dark => localStorage.setItem("qed.settings", JSON.stringify({ darkMode: dark })), dark);
  await page.route("https://fonts.googleapis.com/**", route => route.abort());
  await page.route("**/socket.io/**", route => route.abort());
  await page.route("**/api/**", async route => {
    const path = new URL(route.request().url()).pathname;
    const name = long ? "Maria Alexandra Isabella Delos Santos Villanueva" : "Ana";
    let body: unknown = { success: true, data: [] };
    if (path === "/api/auth/me") body = { user: { id: "1", user_name: "admin", role: "ADMIN", name: "School Administrator", email: "admin@example.test" } };
    else if (path.startsWith("/api/user-profile")) body = { id: "1", userName: "admin", role: "ADMIN", name: "School Administrator", email: "admin@example.test" };
    else {
      await gate;
      if (path === "/api/user/totalUser") body = { totalUsers: count, totalTeachers: count, totalParents: count };
      else if (path === "/api/student/totalStudents") body = { success: true, total: count };
      else if (path === "/api/user/usersList") body = { success: true, data: Array.from({ length: count }, (_, id) => ({ id: String(id), firstName: name, lastName: "Cruz", middleName: "", role: "TEACHER", status: "Active", email: long ? "maria.alexandra.isabella@example.test" : "a@q.test", contactNumber: "09123456789", lastLogin: null })) };
      else if (path === "/api/academic-year/getAcademicYear") body = {status:"success",data:{id:1,label:"2026–2027",startDate:"2026-08-01",endDate:"2027-05-31",status:"Active"}};
      else if (path.startsWith("/api/academic-year/getTerms")) body = {status:"success",data:Array.from({length:count},(_, index) => ({id:index,termNumber:index+1,name:long ? "First academic grading period and reporting cycle" : "T1",startDate:"2026-08-01",endDate:"2026-10-31",status:"Active"}))};
      else if (path.startsWith("/api/subject/getSubjectSectionsByGrade/")) {
        const grade = Number(path.split("/").at(-1));
        body = {success:true,data:Array.from({length:count},(_, id) => ({id:grade*100+id,subject_id:id,subject_name:"Mathematics",grade_level_id:grade,section_name:"Maroon",is_graded:1,teacher_id:null,school_year:"2026–2027",status:"Active",weightDistribution:[]}))};
      }
      else if (path === "/api/student/allStudents") body = {success:true, data:Array.from({length:count},(_, id) => ({id, grade_level_id:1, section_id:1, student_number:`2026-${id}`, learner_reference_number:String(id), first_name:name, last_name:"Cruz", middle_name:"", gender:"Male", grade_level_name:"Grade 1", section_name:long ? "Maroon Primary School Section" : "Maroon"}))};
      else if (path === "/api/classes/" || path === "/api/classes") body = { success: true, data: Array.from({ length: count }, (_, id) => ({ id, gradeLevelId: 1, gradeLevel: "Grade 1", sectionId: 1, section: long ? "Maroon – Primary School Section" : "Maroon", room: "101", adviserId: 1, adviserName: name, studentCount: count, schedule: [] })) };
      else if (path === "/api/analytics/login-frequency") body = { period: "weekly", chart: ["Mon", "Tue", "Wed", "Thu", "Fri"].map(label => ({ label, count })), summary: { peakLabel: "Monday", peakCount: count, peakType: "Peak Day", averageDaily: count, averageLabel: "Avg. Daily Logins", growthPercent: 10, growthLabel: "Weekly Growth" } };
      else if (path === "/api/audit-logs") body = { success: true, data: { total: count, page: 1, limit: 20, entries: Array.from({ length: count }, (_, id) => ({ id, createdAt: "2026-10-08T02:00:00Z", actorFullName: name, actorUsername: "teacher", actorRole: "TEACHER", action: long ? "UPDATE_STUDENT_PROFILE_DETAILS" : "LOGIN", resource: "student", resourceId: "1", httpMethod: "GET", endpoint: "/api/students/1", statusCode: 200 })) } };
      else if (path.includes("notifications")) body = { notifications: [], unreadCount: 0 };
    }
    await route.fulfill({ json: body });
  });
  return release;
}

for (const route of ["/admin", "/admin/classes", "/admin/users", "/admin/students", "/admin/academic-year", "/admin/subjects"]) for (const width of [375, 1280]) for (const dark of [false, true]) test(`${route} ${width}px ${dark ? "dark" : "light"}: real shell and loading composition`, async ({ page }) => {
  await page.setViewportSize({ width, height: 1000 });
  const release = await mockAdmin(page, dark);
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.goto(route);await waitForDataRoute(page);
  const title = route === "/admin" ? "Login Frequency" : route.endsWith("users") ? "User Management" : route.endsWith("students") ? "Student Records" : route.endsWith("academic-year") ? "Academic Year" : route.endsWith("subjects") ? "Manage Subjects" : "Classes Management";
  await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
  await expect(page.locator(".qed-splash")).toHaveCount(0);
  await page.waitForFunction(() => [...document.querySelectorAll(".sk-region")].length > 0 && [...document.querySelectorAll(".sk-region")].every(e => e.getAttribute("data-sk-phase") === "revealed"));
  const before = await page.getByRole("heading", { name: title, exact: true }).boundingBox();
  fs.mkdirSync("loading-screenshots", { recursive: true });
  const prefix = `loading-screenshots/${route.slice(1).replaceAll("/", "-")}-${width}-${dark ? "dark" : "light"}`;
  await page.screenshot({ path: `${prefix}-skeleton.png`, fullPage: true });
  release(); await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0); await expect(page.locator("[data-sk-layer], [data-sk-frame]")).toHaveCount(0);
  expect(await page.getByRole("heading", { name: title, exact: true }).boundingBox()).toEqual(before);
  await expect(page.getByRole("alert")).toHaveCount(0);
  await page.screenshot({ path: `${prefix}-loaded.png`, fullPage: true });
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => document.getAnimations().filter(animation => animation.effect!.getTiming().iterations === Infinity).length)).toBe(0);
});

for (const directory of ["users", "students"]) test(`${directory} directory AUTO-COLUMN classification is supported by measured fixtures`, async ({ page }) => {
  const results: number[][] = [];
  for (const long of [false, true]) {
    const release = await mockAdmin(page, false, 1, long);
    await page.goto(`/admin/${directory}`);await waitForDataRoute(page);
    await expect(page.getByRole("heading", {name: directory === "users" ? "User Management" : "Student Records", exact:true})).toBeVisible();
    release(); await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0); await expect(page.locator("[data-sk-layer], [data-sk-frame]")).toHaveCount(0);
    await expect(page.getByRole("columnheader", { name: "Full Name", exact: true })).toBeVisible();
    results.push(await page.locator("thead th").evaluateAll(cells => cells.map(cell => cell.getBoundingClientRect().width)));
    await page.unroute("**/api/**");
  }
  expect(results[0].some((width, index) => Math.abs(width - results[1][index]) > 1)).toBe(true);
});

 test("academic term auto-column classification requires observed variation", async ({page}) => {
  const results:number[][]=[];
  for (const long of [false,true]) {
    const release=await mockAdmin(page,false,1,long);
    await page.goto("/admin/academic-year");await waitForDataRoute(page);
    await expect(page.getByRole("heading",{name:"Academic Year",exact:true})).toBeVisible();
    release(); await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0); await expect(page.locator("[data-sk-layer], [data-sk-frame]")).toHaveCount(0);
    results.push(await page.locator("thead th").evaluateAll(cells=>cells.map(cell=>cell.getBoundingClientRect().width)));
    await page.unroute("**/api/**");
  }
  expect(results[0].some((width,index)=>Math.abs(width-results[1][index])>1)).toBe(true);
});
