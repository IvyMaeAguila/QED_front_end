import type { Page } from "@playwright/test";
export async function mockDirectory(page: Page, role: "ADMIN" | "PRINCIPAL" | "TEACHER" | "PARENT", dark: boolean, count = 3, long = false) {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.addInitScript(dark => localStorage.setItem("qed.settings", JSON.stringify({ darkMode: dark })), dark);
  await page.route("https://fonts.googleapis.com/**", route => route.abort());
  await page.route("**/socket.io/**", route => route.abort());
  await page.route("**/api/**", async route => {
    const path = new URL(route.request().url()).pathname;
    const name = long ? "Maria Alexandra Isabella Delos Santos Villanueva" : "Ana";
    let body: unknown = { success: true, data: [], students: [], dailyUpdates: [] };
    if (path === "/api/auth/me") body = { user: { id: "1", user_name: "user", role, name: "School User", email: "user@example.test" } };
    else if (path.startsWith("/api/user-profile")) body = { id: "1", userName: "user", role, name: "School User", email: "user@example.test" };
    else if (path.startsWith("/api/teachers") || path.startsWith("/api/student/") || path.startsWith("/api/calendar/") || path.startsWith("/api/parent-dashboard/") || path.startsWith("/api/academic-year") || path.startsWith("/api/linkedChildren")) {
      await gate;
      if (path === "/api/teachers") body = Array.from({ length: count }, (_, index) => ({ teacherId: String(index), fullName: name, gender: "Female", advisorySection: long ? "Maroon Primary School Section" : "Maroon", gradeLevel: "Grade 1", room: "101", advisories: [] }));
      else if (path.startsWith("/api/teachers/")) body = { teacherId: "1", fullName: name, gender: "Female", room: "101", gradeLevel: "Grade 1", advisorySection: "Maroon", advisories: [{ classId: 1, gradeLevel: "Grade 1", section: "Maroon", room: "101" }], schedule: [{ classId: 1, day: "Monday", time: "8:00 AM – 9:00 AM", subject: "Mathematics", gradeSection: "Grade 1 · Maroon", room: "101" }] };
      else if (path.startsWith("/api/student/grade-levels")) body = Array.from({ length: count }, (_, index) => ({ gradeId: index + 1, grade: "Grade 1", section: "Maroon", classId: index + 1, totalStudents: count }));
      else if (path.startsWith("/api/student/")) body = { classId: 1, grade: "Grade 1", sectionInfo: { section: "Maroon", adviser: name, room: "101" }, roster: Array.from({ length: count }, (_, index) => ({ studentId: String(index), firstName: name, lastName: "Cruz", middleInitial: "A", gender: index % 2 ? "Female" : "Male" })) };
      else if (path.startsWith("/api/calendar/")) body = { success: true, data: [{ id: 1, title: "School assembly", date: new Date().toISOString().slice(0, 7) + "-12" }] };
      else if (path.startsWith("/api/parent-dashboard/")) body = [{ id: "1", studentId: "1", studentName: name, time: "8:00 AM", message: "Your child is present today." }];
      else if (path.startsWith("/api/academic-year")) body = { status: "success", data: { id: 1, label: "2026–2027", status: "Active" } };
      else body = { success: true, students: Array.from({ length: count }, (_, id) => ({ id, student_number: `2026-${id}`, first_name: name, last_name: "Cruz", gender: "Male", grade_level: "Grade 1", section_name: "Maroon", adviser_name: "Teacher One" })) };
    } else if (path.includes("notifications")) body = { notifications: [], unreadCount: 0 };
    else if (path.startsWith("/api/profile")) body = { success: true, data: { id: "1", full_name: "School User" } };
    await route.fulfill({ json: body });
  });
  return release;
}


