# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: teacher-subjects.spec.ts >> teacher subjects 375px dark: real shell, card geometry and screenshots
- Location: tests\teacher-subjects.spec.ts:26:68

# Error details

```
Error: y

expect(received).toBeLessThanOrEqual(expected)

Expected: <= 1
Received:    6.671875
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - complementary [ref=e4]:
      - generic [ref=e5]:
        - img "QED Logo" [ref=e8]
        - generic [ref=e9]:
          - generic [ref=e10]: QED
          - generic [ref=e11]: Quality Education
        - button "Close menu" [ref=e12]
      - generic [ref=e16]: Main Menu
      - navigation [ref=e17]:
        - link "Dashboard" [ref=e18] [cursor=pointer]:
          - /url: /teacher
        - link "Attendance" [ref=e26] [cursor=pointer]:
          - /url: /teacher/attendance
        - link "My Subjects" [ref=e32] [cursor=pointer]:
          - /url: /teacher/subjects
        - link "Gradesheet" [ref=e38] [cursor=pointer]:
          - /url: /teacher/grades
        - link "Holistic" [ref=e43] [cursor=pointer]:
          - /url: /teacher/holistic
        - link "Calendar" [ref=e49] [cursor=pointer]:
          - /url: /teacher/calendar
      - generic [ref=e54]:
        - link "Help & Support" [ref=e55] [cursor=pointer]:
          - /url: /teacher/help
        - button "Log Out" [ref=e60] [cursor=pointer]
    - generic [ref=e65]:
      - banner [ref=e66]:
        - generic [ref=e67]: MSEUF-CI
        - generic [ref=e70]:
          - button "Open menu" [ref=e71]
          - paragraph [ref=e74]: Manuel S. Enverga University Foundation - Candelara, Inc.
          - generic [ref=e75]:
            - button "Notifications" [ref=e77]
            - button "Switch to light mode" [pressed] [ref=e81]
            - button [ref=e89]:
              - img "Teacher profile image unavailable" [ref=e91]
      - main [ref=e94]:
        - generic [ref=e96]:
          - generic [ref=e98]:
            - heading "Subjects" [level=1] [ref=e99]
            - paragraph [ref=e100]: Everything you teach, organized in one place.
          - generic [ref=e101]:
            - textbox "Search subject..." [ref=e103]
            - generic [ref=e104]:
              - paragraph [ref=e105]: 6 subjects shown
              - group "Subject view" [ref=e106]:
                - button "By Section" [pressed] [ref=e107]
                - button "All" [ref=e108]
          - generic [ref=e109]:
            - generic [ref=e110]:
              - generic [ref=e111]: Grade Level
              - combobox [ref=e113] [cursor=pointer]:
                - option "All Grades" [selected]
                - option "Grade 1"
                - option "Grade 2"
                - option "Grade 3"
                - option "Grade 4"
                - option "Grade 5"
                - option "Grade 6"
            - generic [ref=e117]:
              - generic [ref=e118]:
                - heading "Grade 1 · Section Maroon" [level=4] [ref=e120]
                - generic [ref=e121]: (6 subjects)
              - generic [ref=e123]:
                - article [ref=e124]:
                  - generic [ref=e126]:
                    - generic [ref=e129]:
                      - generic [ref=e130]:
                        - generic [ref=e131]: SY 2026–2027
                        - generic [aria-hidden] [ref=e132]: ·
                        - generic [ref=e133]: Active
                      - heading "Mathematics 1" [level=3] [ref=e134]
                      - paragraph [ref=e135]: Grade 1 · Maroon
                    - generic [ref=e138]:
                      - button "Record Grades" [ref=e139]
                      - button "View Class List" [ref=e140]
                - article [ref=e143]:
                  - generic [ref=e145]:
                    - generic [ref=e148]:
                      - generic [ref=e149]:
                        - generic [ref=e150]: SY 2026–2027
                        - generic [aria-hidden] [ref=e151]: ·
                        - generic [ref=e152]: Active
                      - heading "Mathematics 2" [level=3] [ref=e153]
                      - paragraph [ref=e154]: Grade 1 · Maroon
                    - generic [ref=e157]:
                      - button "Record Grades" [ref=e158]
                      - button "View Class List" [ref=e159]
                - article [ref=e162]:
                  - generic [ref=e164]:
                    - generic [ref=e167]:
                      - generic [ref=e168]:
                        - generic [ref=e169]: SY 2026–2027
                        - generic [aria-hidden] [ref=e170]: ·
                        - generic [ref=e171]: Active
                      - heading "Mathematics 3" [level=3] [ref=e172]
                      - paragraph [ref=e173]: Grade 1 · Maroon
                    - generic [ref=e176]:
                      - button "Record Grades" [ref=e177]
                      - button "View Class List" [ref=e178]
                - article [ref=e181]:
                  - generic [ref=e183]:
                    - generic [ref=e186]:
                      - generic [ref=e187]:
                        - generic [ref=e188]: SY 2026–2027
                        - generic [aria-hidden] [ref=e189]: ·
                        - generic [ref=e190]: Active
                      - heading "Mathematics 4" [level=3] [ref=e191]
                      - paragraph [ref=e192]: Grade 1 · Maroon
                    - generic [ref=e195]:
                      - button "Record Grades" [ref=e196]
                      - button "View Class List" [ref=e197]
                - article [ref=e200]:
                  - generic [ref=e202]:
                    - generic [ref=e205]:
                      - generic [ref=e206]:
                        - generic [ref=e207]: SY 2026–2027
                        - generic [aria-hidden] [ref=e208]: ·
                        - generic [ref=e209]: Active
                      - heading "Mathematics 5" [level=3] [ref=e210]
                      - paragraph [ref=e211]: Grade 1 · Maroon
                    - generic [ref=e214]:
                      - button "Record Grades" [ref=e215]
                      - button "View Class List" [ref=e216]
                - article [ref=e219]:
                  - generic [ref=e221]:
                    - generic [ref=e224]:
                      - generic [ref=e225]:
                        - generic [ref=e226]: SY 2026–2027
                        - generic [aria-hidden] [ref=e227]: ·
                        - generic [ref=e228]: Active
                      - heading "Mathematics 6" [level=3] [ref=e229]
                      - paragraph [ref=e230]: Grade 1 · Maroon
                    - generic [ref=e233]:
                      - button "Record Grades" [ref=e234]
                      - button "View Class List" [ref=e235]
  - dialog [ref=e238]:
    - generic [ref=e239]:
      - button "Close" [ref=e241]
      - generic [ref=e245]:
        - img "Profile image unavailable" [ref=e247]
        - paragraph [ref=e250]: Marie Dela Cruz
        - generic [ref=e251]: TEACHER
    - generic [ref=e252]:
      - paragraph [ref=e253]: Account details
      - generic [ref=e254]:
        - generic [ref=e260]:
          - paragraph [ref=e261]: Email
          - paragraph [ref=e262]: teacher@example.test
        - generic [ref=e267]:
          - paragraph [ref=e268]: Phone
          - paragraph [ref=e269]: Not provided
        - generic [ref=e274]:
          - paragraph [ref=e275]: Role
          - paragraph [ref=e276]: TEACHER
    - button "Edit Profile" [ref=e278]
```

# Test source

```ts
  1  | import { waitForDataRoute } from "./fixtures/routeReady";
  2  | import { expect, test, type Page } from "@playwright/test";
  3  | import fs from "node:fs";
  4  | 
  5  | async function subjectsFixture(page: Page, count: number, dark = false) {
  6  |   let release!: () => void;
  7  |   const gate = new Promise<void>(resolve => { release = resolve; });
  8  |   await page.addInitScript(dark => localStorage.setItem("qed.settings", JSON.stringify({ darkMode: dark })), dark);
  9  |   await page.route("**/socket.io/**", route => route.abort());
  10 |   await page.route("**/api/**", async route => {
  11 |     const path = new URL(route.request().url()).pathname;
  12 |     let body: unknown = [];
  13 |     if (path === "/api/auth/me") body = { user: { id: "1", user_name: "teacher", role: "TEACHER", name: "Marie Dela Cruz" } };
  14 |     else if (path.startsWith("/api/user-profile")) body = { id: "1", userName: "teacher", role: "TEACHER", name: "Marie Dela Cruz", email: "teacher@example.test" };
  15 |     else if (path.startsWith("/api/classes")) body = { success: true, data: [] };
  16 |     else if (path.includes("notifications")) body = { notifications: [], unreadCount: 0 };
  17 |     else if (path === "/api/mySubjects/subjects") {
  18 |       await gate;
  19 |       body = { data: Array.from({ length: count }, (_, i) => ({ subject_section_id: i + 1, subject_id: i + 1, subject_code: `S${i}`, subject_name: `Mathematics ${i + 1}`, grade_level_id: 1, grade_level: "Grade 1", section_id: 1, section_name: "Maroon" })) };
  20 |     }
  21 |     await route.fulfill({ json: body });
  22 |   });
  23 |   return release;
  24 | }
  25 | 
  26 | for (const width of [375, 1280]) for (const dark of [false, true]) test(`teacher subjects ${width}px ${dark ? "dark" : "light"}: real shell, card geometry and screenshots`, async ({ page }) => {
  27 |   await page.setViewportSize({ width, height: 1000 });
  28 |   const release = await subjectsFixture(page, 6, dark);
  29 |   await page.goto("/teacher/subjects");await waitForDataRoute(page);
  30 |   await expect(page.getByRole("heading", { name: "Subjects", exact: true })).toBeVisible();
  31 |   await expect(page.getByPlaceholder("Search subject...")).toBeVisible();
  32 |   await expect(page.getByRole("button", { name: "By Section" })).toBeVisible();
  33 |   await expect(page.getByText("Grade Level", { exact: true })).toBeVisible();
  34 |   await expect(page.locator(".qed-splash")).toHaveCount(0);
  35 |   const skeletonCard = page.locator("[data-sk-layer] article, [data-sk-frame] article").first();
  36 |   const before = await skeletonCard.boundingBox();
  37 |   expect(before).not.toBeNull();
  38 |   fs.mkdirSync("loading-screenshots", { recursive: true });
  39 |   const prefix = `loading-screenshots/teacher-subjects-${width}-${dark ? "dark" : "light"}`;
  40 |   await page.screenshot({ path: `${prefix}-skeleton.png`, fullPage: true });
  41 |   release(); await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0); await expect(page.locator("[data-sk-layer], [data-sk-frame]")).toHaveCount(0);
  42 |   const after = await page.locator("[data-sk-content] article").first().boundingBox();
> 43 |   for (const key of ["x", "y", "width", "height"] as const) expect(Math.abs(after![key] - before![key]), key).toBeLessThanOrEqual(1);
     |                                                                                                               ^ Error: y
  44 |   await page.screenshot({ path: `${prefix}-loaded.png`, fullPage: true });
  45 | });
  46 | 
  47 | for (const count of [0, 1, 9]) test(`teacher subjects variable result: ${count} rows, stable actions and filters`, async ({ page }) => {
  48 |   const release = await subjectsFixture(page, count);
  49 |   await page.goto("/teacher/subjects");await waitForDataRoute(page);
  50 |   const controls = page.getByRole("button", { name: "By Section" });
  51 |   await expect(controls).toBeVisible();
  52 |   const before = await controls.boundingBox();
  53 |   const heading = await page.getByRole("heading", { name: "Subjects", exact: true }).boundingBox();
  54 |   const loadingRegion = page.locator(".sk-region[data-sk-variable]");
  55 |   await expect(loadingRegion).toHaveAttribute("data-sk-phase", "revealed");
  56 |   release(); await expect(page.locator('.sk-region[aria-busy="true"]')).toHaveCount(0); await expect(page.locator("[data-sk-layer], [data-sk-frame]")).toHaveCount(0);
  57 |   expect(await controls.boundingBox()).toEqual(before);
  58 |   expect(await page.getByRole("heading", { name: "Subjects", exact: true }).boundingBox()).toEqual(heading);
  59 |   await expect(page.locator("[data-sk-content] article")).toHaveCount(count);
  60 |   if (!count) await expect(page.getByText("No subjects assigned to you yet.")).toBeVisible();
  61 | });
  62 | 
```