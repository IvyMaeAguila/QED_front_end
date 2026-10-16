import type { Page } from "@playwright/test";
export async function mockTeacher(page: Page, dark: boolean, name = "Marie Dela Cruz", empty = false, count = 21) {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.addInitScript(dark => localStorage.setItem("qed.settings", JSON.stringify({ darkMode: dark })), dark);
  await page.route("**/socket.io/**", route => route.abort());
  await page.route("**/api/**", async route => {
    const path = new URL(route.request().url()).pathname;
    let body: unknown = [];
    if (path === "/api/auth/me") body = { user: { id: "1", user_name: "teacher", role: "TEACHER", name, email: "teacher@example.test", gender: "female" } };
    else if (path.startsWith("/api/user-profile")) body = { id: "1", userName: "teacher", role: "TEACHER", name, email: "teacher@example.test", gender: "female" };
    else if (path.startsWith("/api/teacherDashboard")) {
      await gate;
      if (path.endsWith("/summary")) body = { success: true, name };
      else if (path.endsWith("/stats")) body = { success: true, advisoryClassCount: empty ? 0 : count, totalStudents: empty ? 0 : count, totalClasses: empty ? 0 : count };
      else if (path.endsWith("/attendance")) body = { success: true, hasAdvisory: !empty, present: empty ? 0 : 10, absent: 0, late: 0 };
      else if (path.endsWith("/schedule")) body = { success: true, data: empty ? [] : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((dayOfWeek, i) => ({ id: i + 1, dayOfWeek, subjectName: "Mathematics", className: "Grade 1 – Maroon", room: "101", startTime: "09:00", endTime: "10:00", timeLabel: "9:00 AM – 10:00 AM" })) };
      else if (path.endsWith("/upcoming")) body = { success: true, data: empty ? [] : [{ id: 1, title: "School assembly", type: "activity", date: "2026-10-12" }, { id: 2, title: "School holiday", type: "holiday", date: "2026-10-30" }] };
    } else if (path.includes("notifications")) body = { notifications: [], unreadCount: 0 };
    else if (path.startsWith("/api/classes")) body = { success: true, data: [] };
    await route.fulfill({ json: body });
  });
  return release;
}


