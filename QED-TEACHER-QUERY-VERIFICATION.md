# Teacher role TanStack Query migration — verified checkpoint

Date: 2026-10-13. All applicable Teacher page consumers are implemented and the automated role checkpoint passed: source1,018/1,018, fresh-production559/559, isolated backend1,043/1,043. Browser APIs are mocked; no real-backend/MySQL acceptance claim is made. All prior uncommitted work is preserved. Earlier stopped/in-progress sections below are historical checkpoints; the final verification section records the current outcome. Stopped for user review; no next-role migration started.

## Read-only entry audit

Inspected TeacherRoutes, TeacherViews, TeacherSection, TeacherLayout, all Teacher service declarations and reader/writer consumers, shared StudentDetail, Calendar and Notification boundaries, corresponding backend routes and ownership loaders, and existing Teacher browser tests. No Teacher-owned source imported useQuery/useMutation at entry.

| Boundary | Entry status | Dependencies and migration constraints |
| --- | --- | --- |
| Dashboard | Pending | Five active GETs: teacherDashboard summary, stats, attendance, upcoming(limit=5), schedule. Independent settled failures; events date mapping and schedule clock stay unchanged. Exported agenda reader has no active fetch consumer. |
| My Subjects | Pending | mySubjects/subjects; mapping/search local. |
| Subject class roster | Pending | mySubjects/subjects/:subjectSectionId/students; preserve ownership and section navigation. |
| Advisory roster/selection | Pending | Actual page uses teacherAttendance/advisory-sections through useSelectedAdvisorySection, shared with attendance and holistic pages. teacherAdvisory/roster service has no current static consumer; do not invent one. |
| Subject detail | Pending | teacherGrading/:section, items(allPeriods), scores, holistic, gradingPeriods, effective weights. Five-minute Map keyed only by subject; reader and cache-patching writers must migrate coherently. Draft scores remain local. |
| Subject assessment records | Pending | Term-filtered items, scores, effective weights, saves, subject submission, download/export; preserve draft and calculation boundaries. |
| Topics and interventions | Pending where used | Topic list/create modals are active. Other backend mastery/progress/intervention endpoints have no matching Teacher service consumers found; do not add features. |
| Advisory grades/submission/history | Pending | advisoryGrading sections, gradebook, submission, submission/logs; period/class parameters and confirmed-success invalidation. |
| Parent visibility controls | Pending | advisoryGrading/visibility GET/POST; preserve exact publication semantics, no optimistic release. |
| Attendance daily/records/month | Pending | Shared advisory selection, teacherAttendance/:class with termId/allPeriods; saved rows and totals remain unchanged. |
| Holistic overview/profile/domain trends | Pending | teacherHolistic overview, profile/:student, domain-trends with termNumber; domain-trends class filtering is client-side over server sections. Shared gradingPeriods prerequisite. |
| Weekly holistic records | Pending | teacherHolistic/:section with termNumber; save, weekend lock, week/date selections remain local. |
| Shared student profile | Pending | StudentDetail uses Admin Students/Classes/Teachers contexts mounted in TeacherSection; cannot remove these providers or shared caches without replacing actual Teacher consumers. |
| Calendar | Partially migrated shared boundary; Teacher pending | Teacher uses read-only CalendarPageView, not Principal CalendarPage; four GETs, no Teacher CRUD. |
| Notifications | Partially migrated shared boundary; Teacher pending | Teacher uses legacy facade, 30-second polling, focus/socket refresh and mark-read writes; ownership security already corrected. |
| Account profile/auth bootstrap | Shared, outside page migration | Auth-owned profile/bootstrap remains authoritative. Avoid a duplicate identity cache or eager Query import. |
| Help, theme, calculations, charts, drafts, exports | Not appropriate as Query state | Keep static content, pure transforms, unsaved changes and file-download actions outside Query cache. |

## Academic-management authorization correction

Root cause: verifyToken authenticated JWTs but six management routes lacked role authorization. Before correction an isolated actual-router/JWT/controller probe executed 24 cases: no cookie was rejected401; Admin, Principal, Teacher, Parent and unknown roles received successful writes for all four grading-period management operations. Activation dispatched two UPDATEs. This is a vulnerability characterization, not a security pass. No live DB was loaded.

User explicitly selected Admin-only management, with existing required authenticated reads retained for all roles. Minimum correction: reuse established requireAdmin after verifyToken on four gradingPeriods writes and academic-year addAcademicYear/saveTerms. No controllers, SQL, transaction, date, grade or response transformations changed.

Focused academicManagementAuthorization.test.js: 112/112 pass. Actual Express, JWT verification and controllers; isolated database/transaction double. Covers all four roles, lowercase Admin, unknown/missing/malformed roles, invalid/expired/missing credentials, client role spoofing, zero SQL/connection/write on denied requests, successful Admin controllers and retained four-role GET access. Full isolated backend after correction: 629/629 pass. No real MySQL persistence or authorized real-account verification claimed.

## Baseline and exploratory evidence

Teacher Dashboard baseline browser suite: 8/8, zero retries, mocked APIs, actual route; mobile/desktop light/dark geometry and long names. Previous Principal role totals 705 source /340 production /517 backend are inherited checkpoint evidence, not reruns in this increment.

The initial temporary vulnerability probe had a syntax error before execution; corrected locally, then all24 characterization cases executed. One apply_patch attempt was rejected atomically for duplicate target operations; reapplied separately. Neither event was an application test result.

Evidence directory: C:/Users/Mavys/AppData/Local/Temp/qed-teacher-phase2-20261013. Contains before hashes/status/HEAD for both repositories, sanitized authorization probe and logs. No credentials or live student data are captured.

## Current implementation

Dashboard, My Subjects, subject roster, read-only Calendar and Notifications are implemented and module-tested. Query stays behind lazy data controllers; preview compositions remain Query-free. Teacher role completion is blocked by the shared student authorization policy described below. Final checkpoint verification results follow; no full-role verification claim is made.

## Implemented Teacher modules and policies

- Dashboard: five independent queries preserve settled partial failures, original event/schedule transforms, local selections and layout. Same fiveGETs initially; fresh remount zero additional dashboardGETs; stale refresh five. No polling added.
- My Subjects / subject class roster: real lazy page controllers use the shared singleton; original lists, filtering, counts, navigation and exports remain local/presentational. Roster keys include subject-section target. AbortSignal and independent401 handling added to service requests without changing payloads.
- Read-only Calendar: four independent transports combined into the original all-or-error snapshot, preserving original behavior. Teacher-only lazy Query driver; other roles retain their existing implementations. Independent401 callbacks occur before parsing even when another request fails. No Calendar writes migrated. Cached offline snapshot stays visible. Fixed conditional useEffect ordering in shared preview composition by placing hooks before the existing theme guard; no visual redesign.
- Notifications: extracted the previously verified Principal Query driver into an authenticated role-parameterized lazy driver, preserving the Principal entrypoint/keys and all polling/socket/mutation behavior. Teacher now uses its own session/role/user resource keys. Admin/Parent retain legacy behavior. Failed mark-read remains unread; only confirmed success updates/invalidates.

Keys/policies are recorded in TANSTACK-QUERY-INVALIDATION-MAP.md. All these requests use auth readiness/route-preview guards, generation-scoped cancellation, expected-generation401 expiration and403 privacy. No calculations, academic writes, database schemas, endpoint contracts, API toggle or dependencies were changed. Automatic retries remain disabled. No newly introduced polling except preserving existing Notifications30-second behavior.

## Newly confirmed blocker: shared student-record authorization

Isolated characterization student-boundary-probe.json executed16 requests against actual local Express, JWT middleware and student controllers with a synthetic database double. Admin/Principal/Teacher/Parent all received200 for GETallStudents, GETviewStudent/902, GETallGrade and PUTdeleteStudent/902. Each delete reached oneUPDATE. This is vulnerability reproduction, NOT an authorization pass or real persistence verification. Response bodies/tokens/personal data are not logged.

Root cause: studentRecord.router.js verifies JWT but has no role guards; student controllers select school-wide/current-year data or delete by supplied studentID without authenticated ownership checks. Teacher student profiles depend on Admin Students/Classes/Teachers providers and school-wide data. Roles permitted to write and the assigned/advisory/linked-child read policy require confirmation; applying an inferred privacy policy would change shared cross-role behavior. User was asked to confirm a concrete policy. No student/class controller or router has been changed. Further Teacher migration stops here until policy and identity/assignment mapping are resolved. Production readiness is blocked by this independently confirmed issue.

Class-management endpoints also warrant authorization review (inspection only in this increment; not characterized as an executed exploit). Subject-score/holistic writes need explicit student-roster ownership checks during their own migration; current code inspection alone does not establish a test result.

## Module verification executed (mocked browser APIs, zero retries)

| Gate | Result | Evidence |
| --- | --- | --- |
| Teacher Dashboard entry baseline |8/8 pass|dashboard-baseline.log|
| Dashboard original responsive suite after migration |8/8 pass|dashboard-after.log|
| Dashboard new Query cases |16/16 pass|dashboard-query-third.log|
| Existing My Subjects/subject roster |15/15 pass|subjects-existing.log|
| Reader lifecycle/session/cancellation/error harness |11/11 pass|subjects-query-second.log|
| Teacher Calendar Query |18/18 pass|calendar-second.log|
| Existing four-role Calendar responsive checks |16/16 pass in exploratory combined run|calendar-first.log (new tests had failures below)|
| Principal+Teacher Notifications |25/25 pass|notifications-first.log|
| Academic management authorization |112/112 pass|academic-security-focused.log|
| Full isolated backend suite after six-route correction |629/629 pass|backend-security-checkpoint.log|
| Fresh tsc -b + Vite production build + fixed bundle guard |pass|checkpoint-build.log|
| Scoped changed Teacher/read-only Calendar/Query-driver lint |pass|checkpoint-lint.log|

These overlapping runs are not additive unique totals. Source/hook tests exercise actual components with deterministic intercepted APIs. Backend tests exercise actual routers/JWT/controllers with isolated DB doubles. No authorized real account, live MySQL persistence or production API verification was performed.

## Exploratory failures and corrections

- Dashboard first Query run15pass/1fail: browser offline before a hard navigation prevented loading the document (ERR_INTERNET_DISCONNECTED). Changed test setup to load the app online, then navigate offline within the SPA; no application assertion relaxed.
- Dashboard second run15pass/1fail: GC timer scheduled before clock.install was outside test-clock control. Install clock before navigation, then advance inactive-cache lifetime deterministically. Third16/16 pass.
- Reader first run11/11 passed but emitted React cross-component render warnings from synchronous cache-diagnostic subscription. Changed test instrumentation to notifyManager.batchCalls, added console/pageerror assertions; rerun11/11 clean.
- Calendar first combined run29pass/5fail: four selectors matched a hidden profile drawer as well as the actual Calendar dialog; named the actual modal. Cancellation test assumed production lifecycle in development StrictMode; now proves exactly four active requests (one/resource), at most one aborted StrictMode probe/resource, all surviving requests aborted on navigation and no successful old response. Production explicitly expects zero probes. Existing per-resource/active cancellation assertions retained; no sleeps/retries added. Rerun18/18 pass.
- Initial Dashboard/subject/Calendar scoped lint found export/dependency/conditional-hook issues, corrected minimally; final scoped lint passes. Temporary initial authorization probe syntax error prevented execution and was corrected before the successful characterization run. An apply_patch duplicate-target rejection was atomic, then reapplied separately.
- Fixed test-registration typo teacher-subject-class-list.spec.ts to actual subject-class-list.spec.ts before final production run; original roster assertions unchanged.

## Bundle checkpoint

Fresh measured gzip: public eager closure134093bytes (entry628), Admin eager beyond public145778, Teacher163530, Principal139567, Parent148348. Fixed budgets unchanged: public135349, entry112153, Admin151512. Principal checkpoint comparison public133995 (+98), Admin145834 (-56), Teacher161483 (+2047), Principal139615 (-48), Parent146833 (+1515). This is a build-size comparison, not measured real-network runtime performance. Shared presentational code moves across role chunks; no Teacher/Parent static Query import is permitted. Existing static role-layout and public Query-isolation guards pass.

Runtime role test now correctly expects authenticated lazy Query execution for Teacher and Principal, checks no duplicate Query chunk downloads, and retains Admin/Parent/public absence assertions. Static budgets/role-isolation checks and registry assertions are unchanged. Updated source/fresh-build test registries to include new Teacher cases.

Comprehensive Teacher role completion is not claimed; remaining modules and the shared authorization blocker prevent that checkpoint. Prior705/340 totals are historical Principal evidence, not results of a current full-suite rerun.

## Final stopped checkpoint verification

- Affected source acceptance:135/135 pass, plus separately registered original subject roster8/8 pass =143 distinct affected source cases, zero retries. Evidence checkpoint-source.log and checkpoint-source-roster.log.
- Fresh-production artifact affected acceptance:127/127 pass, zero retries, checkpoint-production.log. This used the fresh checkpoint-build.log artifact, not a retained build.
- tsc-b/build/fixed budget and role-isolation guards pass; scoped changed Teacher/Calendar/Query-driver lint passes. Backend syntax checks pass for both routers and new security test.
- NotificationContext.tsx separately retains one Fast Refresh only-export-components lint error. HEAD stdin lint reproduces the same error; no suppression or rule weakening. Evidence notification-context-lint.log and notification-context-head-lint.log. Repository-wide lint cleanliness is not claimed.
- Full isolated backend629/629 and focused academic-management112/112 pass. These overlap; do not sum them.
- Complete all-module source/production suites and comprehensive Teacher role completion gate were NOT run at this stopped checkpoint. Previous705/340 Principal results are inherited, not current whole-checkout evidence. Affected shared Principal Calendar/Notification and all-role bundle checks were rerun successfully.
- No live database/account or real-backend browser verification. All browser APIs are deterministic mocks; backend fixtures use actual local routers/JWT/controllers with DB doubles. No live records were created, modified or deleted.
- Entry hash audit: zero missing files, both HEADs unchanged, no staged files. Existing backend files other than the two approved academic-management routers remain unchanged. Frontend modifications are limited to the listed Teacher/shared adapters/tests/docs plus generated screenshots. API config, singleton QueryClient and fixed bundle-check script are byte-identical to entry; previous unrelated changes preserved. Screenshot outputs regenerated by existing tests are explicitly listed.

Resume requirements: confirm the shared student write/read ownership policy; establish exact auth-to-Teacher/advisory and auth-to-Parent/child joins using repository models; implement minimal server-side guards/scoped queries with four-role/ownership/zero-unauthorized-write regression fixtures; replace Teacher school-wide provider dependencies without changing legitimate counts/profile access; verify cross-role consumers. Then resume remaining Teacher modules and finish the full role-level suites. Do not infer a policy from UI visibility. Existing student authorization vulnerability blocks production readiness. Existing manual localhost/Render selection is preserved; this local artifact uses localhost and must not be treated as a Render deployment build. Existing xlsx security follow-up remains outside this increment.

No staging, commit, push, deployment, cleanup, reset, dependency installation or backend schema/calculation changes were performed. Stopped for policy clarification and review; Teacher migration is incomplete.

## Exact changed-file inventory relative to Phase 2 entry

Paths below are relative to the stated repository roots. This list excludes all byte-identical prior uncommitted work. Full preservation manifests and before hashes are in the evidence directory.

Frontend root: C:/Users/Mavys/Downloads/QED_System/QED_front_end

- `playwright.acceptance-build.config.ts` (modified)
- `playwright.acceptance.config.ts` (modified)
- `QED-API-MIGRATION-INVENTORY.md` (modified)
- `QED-TEACHER-QUERY-VERIFICATION.md` (new)
- `src/features/profiles/teacher/pages/dashboard/services/dashboard.service.ts` (modified)
- `src/features/profiles/teacher/pages/dashboard/TeacherDashboardData.ts` (new)
- `src/features/profiles/teacher/pages/dashboard/TeacherDashboardHome.loading-view.tsx` (modified)
- `src/features/profiles/teacher/pages/dashboard/TeacherDashboardHome.tsx` (modified)
- `src/features/profiles/teacher/pages/subjects/services/subjectClassList.service.ts` (modified)
- `src/features/profiles/teacher/pages/subjects/services/subjects.service.ts` (modified)
- `src/features/profiles/teacher/pages/subjects/SubjectClassListPage.loading-view.tsx` (modified)
- `src/features/profiles/teacher/pages/subjects/SubjectClassListPage.tsx` (modified)
- `src/features/profiles/teacher/pages/subjects/SubjectPage.loading-view.tsx` (modified)
- `src/features/profiles/teacher/pages/subjects/SubjectPage.tsx` (modified)
- `src/features/profiles/teacher/query/TeacherCalendarQueries.tsx` (new)
- `src/features/profiles/teacher/query/teacherQueryScope.ts` (new)
- `src/features/profiles/teacher/query/TeacherReader.ts` (new)
- `src/features/profiles/teacher/query/useTeacherReader.ts` (new)
- `src/shared/calendar/CalendarPageView.loading-view.tsx` (modified)
- `src/shared/calendar/CalendarPageView.tsx` (modified)
- `src/shared/notification/AuthenticatedNotificationQueries.tsx` (new)
- `src/shared/notification/NotificationContext.tsx` (modified)
- `src/shared/notification/PrincipalNotificationQueries.tsx` (modified)
- `TANSTACK-QUERY-INVALIDATION-MAP.md` (modified)
- `TANSTACK-QUERY-MIGRATION-ROADMAP.md` (modified)
- `tests/principal-notification-query-acceptance.spec.ts` (modified)
- `tests/principal-notification-query-harness.tsx` (modified)
- `tests/role-bundles.spec.ts` (modified)
- `tests/teacher-calendar-query-acceptance.spec.ts` (new)
- `tests/teacher-dashboard-query-acceptance.spec.ts` (new)
- `tests/teacher-notification-query-acceptance.spec.ts` (new)
- `tests/teacher-notification-query.spec.ts` (new)
- `tests/teacher-readers-query-harness.tsx` (new)
- `tests/teacher-readers-query.html` (new)
- `tests/teacher-readers-query.spec.ts` (new)

Backend root: C:/Users/Mavys/Downloads/QED_System/thesis_qed

- `src/modules/admin/subject-management/academicYear.router.js` (modified)
- `src/modules/settings/grading-periods/gradingPeriods.router.js` (modified)
- `test/academicManagementAuthorization.test.js` (new)

Generated browser screenshots (existing test outputs, not manually edited application files):

- `loading-screenshots/admin-calendar-1280-dark-skeleton.png`
- `loading-screenshots/admin-calendar-1280-light-skeleton.png`
- `loading-screenshots/admin-calendar-375-dark-skeleton.png`
- `loading-screenshots/admin-calendar-375-light-skeleton.png`
- `loading-screenshots/parent-calendar-1280-dark-skeleton.png`
- `loading-screenshots/parent-calendar-1280-light-skeleton.png`
- `loading-screenshots/parent-calendar-375-dark-loaded.png`
- `loading-screenshots/parent-calendar-375-dark-skeleton.png`
- `loading-screenshots/parent-calendar-375-light-skeleton.png`
- `loading-screenshots/principal-calendar-1280-dark-skeleton.png`
- `loading-screenshots/principal-calendar-1280-light-skeleton.png`
- `loading-screenshots/principal-calendar-375-dark-skeleton.png`
- `loading-screenshots/principal-calendar-375-light-skeleton.png`
- `loading-screenshots/teacher-calendar-1280-dark-skeleton.png`
- `loading-screenshots/teacher-calendar-1280-light-loaded.png`
- `loading-screenshots/teacher-calendar-1280-light-skeleton.png`
- `loading-screenshots/teacher-calendar-375-dark-skeleton.png`
- `loading-screenshots/teacher-calendar-375-light-skeleton.png`
- `loading-screenshots/teacher-dashboard-1280-dark-loaded.png`
- `loading-screenshots/teacher-dashboard-1280-dark-skeleton.png`
- `loading-screenshots/teacher-dashboard-1280-light-loaded.png`
- `loading-screenshots/teacher-dashboard-1280-light-skeleton.png`
- `loading-screenshots/teacher-dashboard-375-dark-loaded.png`
- `loading-screenshots/teacher-dashboard-375-dark-skeleton.png`
- `loading-screenshots/teacher-dashboard-375-light-loaded.png`
- `loading-screenshots/teacher-dashboard-375-light-skeleton.png`
- `loading-screenshots/teacher-subject-class-list-1280-dark-skeleton.png`
- `loading-screenshots/teacher-subject-class-list-1280-light-skeleton.png`
- `loading-screenshots/teacher-subject-class-list-375-dark-skeleton.png`
- `loading-screenshots/teacher-subject-class-list-375-light-skeleton.png`
- `loading-screenshots/teacher-subjects-1280-dark-loaded.png`
- `loading-screenshots/teacher-subjects-1280-dark-skeleton.png`
- `loading-screenshots/teacher-subjects-1280-light-loaded.png`
- `loading-screenshots/teacher-subjects-1280-light-skeleton.png`
- `loading-screenshots/teacher-subjects-375-dark-loaded.png`
- `loading-screenshots/teacher-subjects-375-dark-skeleton.png`
- `loading-screenshots/teacher-subjects-375-light-loaded.png`
- `loading-screenshots/teacher-subjects-375-light-skeleton.png`

## Student policy approval and correction — supersedes the stopped checkpoint above

User explicitly approved Admin-only core student create/update/delete; Principal school-wide read-only; Teacher assigned subject/advisory students read-only; Parent linked children read-only. Existing Teacher academic writes remain on their own module endpoints. This deployment has one school database and no school/tenant discriminator in the inspected models; Principal access is scoped to that database, not a fabricated tenant parameter.

Implemented studentRecord.authorization.js validates known role/positive safe auth userId, rejects reset-purpose/malformed identities, and supplies server-owned parameterized SQL predicates. All seven core student routes retain verifyToken; three writes additionally requireAdmin before controller/SQL. All four readers (including count/allGrade) apply ownership in their actual SELECT, not a client filter or check-then-fetch. Unknown roles fail403 before SQL; unrelated/missing detail returns404 without profile data. Admin/Principal contracts and existing active-year/deleted/graduated filters remain unchanged.

Teacher scope maps JWTuserId through teacher_table.user_id, then current-year subject-section assignments or Active advisory classes. Section-specific and sectionless whole-grade assignments match established roster semantics. Parent scope maps parent_table.user_id to parent_student.parent_id, not the JWT ID directly. Soft-deleted profiles are excluded. Query/body userId/role/teacherId/parentId never select the owner. No academic controller, schema, grade, attendance, holistic or intervention calculation changed.

217 focused tests execute actual Express/JWT/controllers and actual correlated SQL through an isolated in-memory SQLite-backed MySQL adapter double. Covers all four roles, two Teacher/Parent accounts, profile-ID/auth-ID confusion, deleted role profiles, assigned subjects/advisories/whole-grade/null sections, unrelated same-grade sections, historical relationships, rollover, malformed/invalid/expired/reset-purpose JWTs, spoofed parameters/body, Admin successful writes, zero SQL/mutations and unchanged synthetic rows after denied writes. Focused217/217 and full isolated backend846/846 pass. This is NOT real MySQL persistence or a live-backend claim. Initial new-test run stopped at a fixture template-literal syntax error; fixed fixture quoting, then all217 executed successfully.

Teacher student context now uses a lazy Query driver behind a stable lightweight facade, keeping the role shell mounted. The existing Admin StudentsProvider accepts an optional reader adapter; its Admin legacy fetch/write implementation stays authoritative when no adapter is supplied. Teacher no longer runs that competing manual fetch. Server returns only authorized class-scoped rows from the existing endpoint. Session/role/user/student-resource keys, stale30s/gc5min, no automatic retries/polling, AbortSignal,401 expiration and403 cache privacy are preserved. Optional service request options preserve existing Admin call signatures. Teacher profile Edit Student Record control is hidden and its Back action stays in Teacher; Admin edit/navigation remain unchanged.

Initial combined browser run35pass/3fail: two new retry tests incorrectly asked the success-only ledger for two200s although the expected flow was403/500 then200. Corrected to assert exactly [failure,200] and one successful retry. Account-switch test incorrectly counted the new driver's aborted StrictMode probe as an old request; now identifies the old Request IDs and proves exactly one old cancellation plus one successful new-session response and at most one development-only aborted remount probe. No original assertions/retries were weakened. Sanitized lifecycle JSON attaches to the new tests. Rerun new student Query tests10/10 pass; original student-detail10/10, existing readers11/11 and My Subjects7/7 passed in the first combined run. New Admin/Teacher profile controls and fresh-production/shared role guards are being verified separately.

The earlier student-policy blocker is resolved in code and isolated backend tests. Teacher migration will resume after the current student frontend checkpoint passes. Whole-role completion is still pending.

## Resumed modules and second ownership correction

Student frontend checkpoint: first fresh-production run28pass/1fail because a newly authored Admin test visited a commented-out route. Corrected the test to the actual existing Admin directory-to-edit navigation, without adding routes or weakening its edit permission expectation; second student profile/directory run12/12 pass. The other first-run role/bundle/My Subjects checks passed. All tests used the students-build.log fresh artifact. Teacher role remains incomplete; the earlier stopped-policy paragraphs are historical evidence, not the current status.

Advisory roster migration: TeacherAdvisoryQueries provides a shared Teacher-only advisory snapshot to the lightweight selection-hook context; actual roster page migrated, other callers retain legacy reads until their own boundary. Service supports optional AbortSignal/independent401 and preserves404 as successful[]. Keys session/role/user/advisory/sections, stale30s/gc5min, no automatic retries/polling. Class selection stays URL-local.14/14 source checks pass (nine new Query cases plus five existing roster cases), TypeScript and scoped lint pass. Includes requested/default class, fresh reuse/concurrent observers, stale context refresh, cached empty/404, offline/reconnect, retries,401/403 and old-session cancellation. Evidence advisory-browser-first.log, advisory-types.log, advisory-lint.log.

Next holistic reader audit reproduced unrelated student-name disclosure from teacherHolistic/profile/:studentId (200 with empty ratings), through actual local router/JWT/controller and inert DB double. Applied the verified student ownership predicate to that profile SELECT and Teacher identity middleware before its controller. No holistic calculations or authorized response schema changed. Expanded executed-SQL security suite298/298 (previous217 plus81 profile/academic golden cases); full isolated backend927/927 pass. Golden fixture proves exact cognitive4.5/emotional3/null domain averages, three evaluations, weekly3.5/5 ordering, Improving trend, NONE risk and unchanged rounding. All academic data are synthetic; no live database, real MySQL or real-account test claimed. Evidence holistic-profile-authorization-before.json, student-holistic-security.log, backend-holistic-security-checkpoint.log.

## Teacher progress — holistic, attendance, and academic ownership (2026-10-13)

- Teacher holistic overview, student holistic profile and domain trends now use session/role/user/resource/year/term Query readers (30-second freshness; 5-minute GC). Shared active-period metadata is reused. Domain data is fetched once per term and selected locally per advisory class; URL updates retain classId. Local UI/chart calculations remain unchanged. Session boundaries discard local server-data projections on account/role/logout changes.
- Existing holistic browser checks: 55/55 passed, zero retries (`holistic-after-second.log`). New mocked actual-page Query checks: 7/7 passed (`holistic-query-second.log`). Initial new tests had five strict-locator failures while skeleton rows were present; corrected by waiting for exactly one real row before asserting its name. No count assertion was weakened.
- Before migration, the existing domain fast-refetch fixture failed intermittently at 215.3/223.2ms. Replaced its artificial fast delay with the actual pending-state event; original <200ms assertion retained, repeated 3/3 passed. The overview repeated-term skeleton test now advances past 30-second freshness before expecting a stale refetch; all original geometry assertions remain.
- Attendance Today/Records/Month Summary now use Query reads, preserving local status projections, exact cycle and POST payloads. Confirmed-success mutations mark the originating account/class attendance and dashboard attendance queries stale without overwriting current local edits. Writes have retry:false and networkMode:always; offline writes reject rather than queue. Failed mutations preserve existing rollback behavior. Old class/term failures cannot roll back a newly selected class/term.
- Attendance baseline attempt was contaminated by an overlapping service edit that omitted the optional request parameter (ReferenceError: request is not defined): 23 passed/3 failed. This was an implementation mistake, not a pre-existing defect. Corrected service-only checkpoint: 26/26 passed. After Query migration: 26/26 existing mocked browser checks passed. New actual-page mocked Query/mutation checks: first 6/7 (incorrect Present selector; existing button label is P), corrected 7/7 passed. Scoped TypeScript passed. Scoped lint passed with one existing term-dependency warning; two newly introduced ref-render lint errors were corrected using layout effects, not suppressed.
- Academic writer audit reproduced missing target-student ownership checks through actual local Express/JWT/controllers and an isolated SQL-backed MySQL adapter double: new security suite before correction 34/80 passed, 46 failed. Some unrelated-target requests returned 200/201 and executed synthetic writes. No live database was used.
- Added a shared subject-roster membership check before score, both holistic write paths, and intervention creation. It matches the existing subject roster (named section or whole grade for sectionless subjects), requires active-year/nondeleted/nongraduated enrollment, and preserves payloads, rating/grade calculations and notifications. Subject ownership middleware now explicitly requires a valid Teacher identity and excludes deleted teacher profiles. Focused security after correction: 80/80. Combined existing gradebook workflow + student/profile security + new writer security: 422/422.
- New academic ownership files: backend src/modules/teacher/gradebook/subjectStudent.authorization.js and test/teacherStudentWriteAuthorization.test.js; modified subjectGrading.controller.js, topicTagging.controller.js and holistics.controller.js. No API/config/schema changes.
- All browser tests above use deterministic mocked APIs. Backend SQL executes in isolated SQLite as a MySQL adapter double; these results are not real MySQL persistence or live-account acceptance verification.
- Teacher role is IN PROGRESS. Comprehensive source/fresh-production/bundle/backend role-level gates remain pending until all applicable modules are completed. Advisory grades, subject detail/assessment records/templates/topics, and weekly holistic readers/writers still require migration. Do not interpret module checkpoints as role completion.

## Final role verification checkpoint — application frozen, gates not yet clean

- Fresh build and fixed public/Admin/role bundle guards pass. Public eager 134,064 gzip bytes; Admin beyond public146,277; Teacher168,044; Principal139,572; Parent148,699. Budget values are unchanged. API toggle/package files are byte-identical to entry.
- Complete isolated backend passes1,043/1,043. Ten changed backend source files pass node --check. The gradebook workflow test loader now injects the actual new ownership helper with its isolated DB double, avoiding an accidental native DB module dependency. Its original assertions remain unchanged.
- Latest focused actual-route browser checks21/21 (10 production-capable cache/offline/401/403 route cases +11 Teacher student-schedule cases). Earlier checkpoints: advisory grades32 existing +12 new; academic10 new; holistic55 existing +7 new; attendance26 existing +7 new; student detail12 existing. All mocked APIs.
- Complete source suite is running1,001 cases with zero retries. It has surfaced an application regression in teacher-academic-query: confirmed save -> assessment records can remain in loading. This arose after the additional stale-cache/edit protection was introduced. Do not claim the role gate clean. Collect sanitized request/cache evidence and correct the underlying application condition without changing the assertion.
- Additional lifecycle tests have been prepared but are NOT yet executed: teacher-writer-lifecycle (15 cases, unmounted writes/current401/new-account isolation/403/logout) and teacher-student-revalidation (2 actual-route cases, stale ownership revalidation). They are intentionally not in the current frozen1,001-case config. Execute them after the running suite completes, before finalizing the role. Potential concerns to investigate are the read-only active/unmount guard reused for uncancelled mutations, and the globally mounted student reader not being re-enabled/refreshed on navigation.
- Academic cache/edit protection currently uses imperative queryClient.getQueryState(...).isInvalidated in render. Investigate whether that nonreactive read is memoized by React Compiler and remains true after successful refetch. A reactive Query-cache subscription may be required; do not assume a test race.
- Preserve the full failed run and all exploratory logs. Application code should remain unchanged until this current run completes, then rerun affected focused cases and all affected final gates after any corrections. Fresh-production full suite has not yet run.

## Additional final-review findings and corrections (2026-10-13)

The first complete source run finished **999 passed /2 failed /1,001**, zero retries. Both failures are retained in teacher-final-source.log and source-first-results.json, with the original error contexts/screenshots copied into the private evidence directory before rerunning.

1. Confirmed-save -> assessment records was an application defect. Sanitized lifecycle evidence shows every active GET completed200, the score query contains17, fetchStatus is idle, and isInvalidated is false, while the view stays loading. The edit/cache guard read mutable Query state imperatively during render; React Compiler could retain that nonreactive result. Replaced those reads in subject detail, assessment records and weekly holistic with useSyncExternalStore over Query cache invalidation. Draft protection stays intact; no grade/calculation changes.
2. Visibility500 recovery was test synchronization: getByText(Hidden) matched both the real table and its temporary measurement clone. Added a wait for the actual visibility table's settled phase before the same exact Hidden assertion. Request counts and failed-write/no-invalidation assertions remain unchanged.
3. Extra lifecycle characterization ran18 cases:9 passed/9 failed. Three failures were a test setup omission (logout confirmation was not clicked); corrected to use the existing Confirm logout dialog. Four failures reproduced application defects: the records defect above and ignored unmounted mutation401 in three writers. The two student-navigation tests initially stopped at raw request counters that included a cancelled StrictMode probe; they had not reached the stale-navigation assertion. Corrected those new fixtures to correlate actual finished200 requests and cancellations using the existing request ledger. Running the corrected two tests against the retained pre-correction artifact then reproduced the application defect: stale navigation expected a second successful authorization-list read but received only one. That retained artifact run is characterization only, not final fresh-production verification.
4. An uncancelled mutation may finish after its page unmounts. Reusing the read-request active/unmount guard incorrectly suppressed a401 for the still-current session. Added a separate mutation request callback that checks AbortSignal and the existing expected session generation; it expires the originating current session after navigation while still ignoring late401 from an older account. Read cancellation guards and403 behavior are unchanged.
5. The Teacher student facade stays mounted across routes, so staleTime alone did not revalidate its authorization list on navigation. TeacherSection now supplies pathname; the reader performs one bounded stale revalidation when navigation reaches actual student consumers. Fresh cache reuse is retained; there is no polling or error retry loop. Backend ownership remains authoritative, and revoked student records disappear after revalidation.

Focused post-correction runs and final full gates are pending at this checkpoint. No new module is started; all corrections belong to the Teacher role and its approved student/security dependencies.

## Final Teacher-role verification (current checkpoint)

### Coverage and architecture

All currently consumed Teacher page readers and suitable writes are implemented. This is Teacher-role coverage, not a claim of system-wide completion. Authentication/bootstrap/account editing remain the existing shared authority; static Help, UI selections/drafts, calculations and binary exports are outside Query state. Unused service declarations and backend-only features were not invented or migrated.

- Central QueryClient remains unchanged. Teacher keys start `['session', generation, role, authUserId, 'teacher']`, followed by resource and actual subject/class/student/period/year/filter parameters. Raw active grading-period metadata is shared within the Teacher session. Endpoints without year parameters retain their active-context contract rather than sending invented parameters. Schedule metadata additionally keys the authorized student's grade/section and referenced teacher IDs.
- Default Teacher freshness is 30 seconds with five-minute garbage collection. Subject detail info/items/scores/current holistic/effective weights preserve five-minute freshness; records/topics/weekly reads use 30 seconds. No new polling: notifications retain the existing 30-second interval/focus/socket/reconnect behavior. Calendar remains read-only for Teacher.
- Query retries are disabled. Explicit Retry is bounded by readiness/online/in-flight/paused guards; reconnect resumes paused readers. AbortSignal is propagated; each endpoint handles its own401.403 removes the reader's cached projection without logging out. Existing session-generation cleanup plus local session/resource boundaries prevent account/role data reuse.
- Non-idempotent mutations have no automatic retries or offline queue. Original payloads and local drafts remain unchanged. Confirmed success invalidates only the originating session/resource: attendance class/history and dashboard attendance; advisory submission class/history; visibility only its settings; subject score/item/topic/holistic/submission dependencies and affected advisory/holistic aggregates. Pending grades are never optimistically published. Failed score saves retain the local draft and report failure rather than announcing success.
- Core student ownership is enforced in backend SQL using authenticated user identity and assignments/relationships. Admin-only student and academic-management writes are rejected before database access for other roles. Subject score/holistic/intervention target membership is checked against the owned current roster. No grading, transmutation, rounding, attendance status, holistic formula or intervention generation logic changed.

### Executed verification and evidence

Browser APIs below are **mocked**, exercising actual application routes/components and the central QueryClient. Backend tests execute actual local Express routers/JWT/controllers with isolated database doubles (including executed SQL via an in-memory SQLite adapter); they are **not real MySQL persistence or live-backend tests**. No production accounts/data were used.

| Gate | Current result | Evidence in private local evidence directory |
| --- | --- | --- |
| Complete isolated backend | **1,043/1,043 passed**, no skips/cancellations | `teacher-final-backend.log` |
| Focused student/core/academic-write/workflow security | **458/458 passed** (318 + 96 + 44) | Preserved focused security logs |
| Corrected academic/visibility/writer/student-navigation checks | **39/39 passed**, zero retries | `teacher-lifecycle-corrected.log` |
| Repeated lifecycle/recovery/student-navigation checks | **57/57 passed**, three executions per selected case, zero retries | `teacher-lifecycle-repeated.log` |
| Repeated confirmed-save -> assessment-records regression | **3/3 passed**, zero retries | `academic-confirmed-save-repeated.log` |
| TypeScript | Passed, including final table-ref correction | `teacher-final-types-table-ref.log`; also included in the fresh build |
| Fresh production build and static bundle guards | Passed, including final table-ref correction | `teacher-final-build-table-ref.log` |
| New Teacher Query code lint | Passed | `teacher-final-lint-corrected-third.log` |
| All 17 new TS/TSX test files and Teacher Query code lint | Passed after final corrections | `teacher-final-new-code-lint-stable.log` |
| Scoped lint of 72 changed source files | Eight existing errors/six existing warnings; all reproduced from HEAD | `teacher-final-source-lint-second.log`, `teacher-lint-head-provenance.log` |
| Complete source acceptance | **1,018/1,018 passed**, zero retries/skips/flaky/unexpected results;21.1min | `teacher-final-source-stable.log`, `source-final-stable-results.json` |
| Complete fresh-production acceptance | **559/559 passed**, zero retries/skips/flaky/unexpected results;15.0min | `teacher-final-production-stable.log`, `production-final-stable-results.json` |

The first complete source run was **999/1,001**, with both failures investigated above. Additional exploratory failures, including fixture problems, are retained rather than hidden. The corrected student tests failed **0/2** against the deliberately retained pre-correction artifact (expected stale revalidation request count2, received1); that run proves the original defect and is not counted as a fresh-artifact gate. Post-correction focused source tests pass. An initial lint invocation used an incorrect provider path; a second invocation found test-harness export lint issues. Corrected only test component exports, then all new tests passed lint. A broader npx lint invocation failed to dispatch; rerun directly through ESLint's Node entry point produced the scoped results above.

### Bundle and request impact

Final fresh build measures gzip using the unchanged guard's Node zlib policy: public eager closure **134,060 /135,349 bytes**, entry **627 /112,153**, Admin eager download beyond public **146,271 /151,512**. Teacher eager beyond public is **168,261 bytes**. Compared with the earlier partial-Teacher checkpoint (`checkpoint-build.log`), Teacher rose from163,530 by4,731 bytes; that checkpoint already included early Teacher work, so this is not a pre-migration baseline. The settled-table measurement correction adds24 aggregate Teacher eager bytes relative to the previous corrected build (some hash-dependent shared-chunk gzip sizes also shift slightly). No guard thresholds were changed. Runtime role/chunk isolation assertions remain in both full suites.

Deterministic actual-route checks require exact successful read batches: subject6, advisory grades5, attendance2, holistic3; fresh navigation adds zero, stale navigation adds one matching batch. Cancelled StrictMode probes are correlated separately rather than counted as successful duplicate reads. Student fresh navigation reuses one successful list read; stale navigation adds exactly one and removes revoked records. Existing chart/layout/loading geometry and grade/template goldens remain in the complete suites.

### Remaining verification boundaries

No authorized real-backend Teacher credentials, isolated representative MySQL server or email-delivery environment were available. Real MySQL SQL/persistence/transaction behavior, real account/assignment data, email delivery and live Socket.IO behavior require separate nonproduction acceptance. The single-school authorization model reflects the existing database; this work does not add multitenancy. Class/staff schedule metadata endpoints keep their existing contracts; frontend projection is not described as a new server authorization boundary. Existing xlsx vulnerability remains a separate security follow-up. Global lint is not clean due to the reproduced legacy issues.

The localhost/Render toggle is byte-preserved: local builds intentionally target localhost. Before a production deployment, the user must activate the existing Render URL and rebuild/verify that artifact. No production-ready API substitution was made. No staging, commit, push, deploy or next-role migration occurred.

### Second full-source investigation and final narrow corrections

The next complete source execution finished **1,016 passed /2 failed /1,018**, zero retries (`teacher-final-source-corrected.log`, `source-second-results.json`). The earlier academic handoff and visibility failures passed. New failures were the subject-record cached native-column geometry test and the Teacher holistic rollover test. Their original screenshots/error contexts are preserved in `source-corrected-column-failure` and `source-corrected-holistic-failure`.

- Holistic: instrumented native LoadingRegion timers were created before `page.clock.install()` (e.g. native performance338ms) and fired after the clock reset (88ms) without cleanup. Both API requests had finished200 and their queries were success/idle, while the term control stayed revealed/disabled. Installing the clock after navigation mixed native and fake timer owners; this is a test-environment defect. Install it before navigation and explicitly assert that the term selector is enabled. No application loading engine, timeout allowance, retry or request-count assertion changed. Instrumented characterization was3/5 passed; all timer evidence is sanitized and preserved in `teacher-holistic-native-timers-results.json`. The temporary timer wrappers were removed from final tests.
- Columns: direct read-only source cache probes showed that failing runs had no initial pixel reservation despite a settled, fully rendered15-column table. This refined the first handoff hypothesis: the reservation was missing, rather than overwritten. Outgoing and incoming animated record tables shared one ref; outgoing cleanup could clear it before onSettled measurement. Replaced only the Teacher assessment record's measurement target with the actual settled live table located through a stable outer section ref. Shared LoadingRegion/reservation implementations, academic computations and layout are unchanged. The original <=2px assertion is retained; an explicit revealed-state gate ensures the animated swap is exercised before release. Final tests attach synthetic widths/phases only and contain no source-module cache import.
- An exploratory year/term projection guard did not resolve the column failure (6/10 combined repeated cases passed); it was removed from this increment before the final correction. No prior preserved work was removed. Other characterization outcomes:4/6 passed (two column failures),0/3 column diagnostic passes,0/1 first cache-write probe pass,1/1 second measurement probe pass,1/3 direct-cache probe passes. These failures are retained in their named logs/results JSON; they are not hidden by final reruns. A temporary Vite transform-inspection process also reported ERR_CLOSED_SERVER on asynchronous dependency work during shutdown; it did not execute application APIs or change other-role source.
- After the stable section-ref correction and early clock setup, **10/10** repeated cases passed (five executions each), zero retries (`teacher-last-two-final-correction.log`). The final explicit animated-swap repeat also passed **6/6** (three executions each), zero retries (`teacher-last-two-deterministic-final.log`). Fresh rebuild/bundle guards passed (`teacher-final-build-table-ref.log`). TypeScript passes; focused changed-code lint has no errors and only the five reproduced existing assessment warnings (`teacher-final-types-table-ref.log`, `teacher-final-lint-table-ref.log`). Final frozen-code suites passed: source1,018/1,018 and fresh-production559/559.

A production test-discovery command was initially invoked from the backend working directory and failed to resolve the frontend configuration. Discovery was rerun with the frontend's installed Playwright CLI:559 cases in48 files. No repository dependency/lockfile change, backend API or database operation resulted from discovery.

### Final outcome and preservation audit

- Complete source: **1,018/1,018 passed**,21.1min. Complete fresh-production: **559/559 passed**,15.0min. Both used one worker/zero retries and reported zero skips, unexpected or flaky results. The source run includes the corrected holistic clock setup and cached-column regression. The production run includes the actual optimized Teacher routes, existing grading/template and Principal/Admin checks, responsive light/dark/loading/error views, and unchanged runtime bundle/role guards. Full isolated backend remains **1,043/1,043**; no backend code changed after that run. Syntax checks pass for all ten changed backend source files.
- Final artifact index/manifest SHA256 values match the artifact captured before the complete acceptance runs (`production-final-stable-artifact.json`, `final-preservation-key-files.json`). No application code changed during those runs. Only documentation was finalized afterward.
- Phase2 entry-to-final audit:106 frontend source/test/config/document paths added or modified, one accounted-for obsolete Teacher cache deleted,14 backend source/test paths added or modified, and322 regenerated/added screenshot artifacts. The complete relative-path inventory follows. Prior uncommitted changes are excluded from this delta unless a shared adapter/test was deliberately updated in this authorized increment.
- Both repository HEADs are unchanged (frontend174588a13cccdffa2fafc3bafccbbed214b192de; backend6e2ae01800e384029f83eb2819030e59a522980e); both indexes remain empty. No reset, clean, staging, commit, push or deployment occurred. API toggle, package/lockfile, central AuthProvider and bundle-guard script match entry hashes. No Principal or Parent page source changed. Previously completed Calendar, notification ownership, login-frequency and account-provisioning security files retain their entry contents; the backend delta consists only of the approved academic/student/Teacher-target authorization corrections and tests listed below.
- The **Teacher automated migration checkpoint is complete and ready for user review**. Whole-checkout source/production regression gates are clean; global lint still has the documented pre-existing issues. Production sign-off remains conditional on authorized nonproduction real-backend/MySQL acceptance, the preserved manual Render toggle/rebuild, and separate existing dependency/security follow-ups. No next account/module is started.

## Final exact Phase2 changed-file inventory

This is the delta against the preserved Phase2 entry snapshots, not the much larger pre-existing Git working tree. Earlier file lists above are historical checkpoints.

Frontend root: C:\Users\Mavys\Downloads\QED_System\QED_front_end

Backend root: C:/Users/Mavys/Downloads/QED_System/thesis_qed

### Frontend implementation, tests, configuration and documents

- modified: `playwright.acceptance-build.config.ts`
- modified: `playwright.acceptance.config.ts`
- modified: `QED-API-MIGRATION-INVENTORY.md`
- new: `QED-TEACHER-QUERY-VERIFICATION.md`
- modified: `src/features/profiles/admin/pages/classes/context/ClassesContext.tsx`
- modified: `src/features/profiles/admin/pages/classes/context/TeachersContext.tsx`
- modified: `src/features/profiles/admin/pages/classes/services/classes.service.ts`
- modified: `src/features/profiles/admin/pages/studentrecords/context/StudentsContext.tsx`
- modified: `src/features/profiles/admin/pages/studentrecords/services/student-record.service.ts`
- modified: `src/features/profiles/admin/pages/subjects/services/teacher.service.ts`
- modified: `src/features/profiles/teacher/pages/attendance/AttendanceCalendarSection.tsx`
- modified: `src/features/profiles/teacher/pages/attendance/AttendanceMonthSummarySection.tsx`
- modified: `src/features/profiles/teacher/pages/attendance/services/attendance.service.ts`
- modified: `src/features/profiles/teacher/pages/attendance/services/useSelectedAdvisorySection.service.ts`
- modified: `src/features/profiles/teacher/pages/attendance/TeacherAttendancePage.loading-view.tsx`
- modified: `src/features/profiles/teacher/pages/attendance/TeacherAttendancePage.tsx`
- modified: `src/features/profiles/teacher/pages/attendance/TeacherAttendanceRecordsPage.tsx`
- modified: `src/features/profiles/teacher/pages/dashboard/services/dashboard.service.ts`
- new: `src/features/profiles/teacher/pages/dashboard/TeacherDashboardData.ts`
- modified: `src/features/profiles/teacher/pages/dashboard/TeacherDashboardHome.loading-view.tsx`
- modified: `src/features/profiles/teacher/pages/dashboard/TeacherDashboardHome.tsx`
- modified: `src/features/profiles/teacher/pages/grades/GradePage.loading-view.tsx`
- modified: `src/features/profiles/teacher/pages/grades/GradePage.tsx`
- modified: `src/features/profiles/teacher/pages/grades/ParentVisibilitySection.tsx`
- modified: `src/features/profiles/teacher/pages/grades/services/gradePage.service.ts`
- modified: `src/features/profiles/teacher/pages/holistic/HolisticDomainTrendsPage.tsx`
- modified: `src/features/profiles/teacher/pages/holistic/HolisticOverviewPage.tsx`
- modified: `src/features/profiles/teacher/pages/holistic/services/holistic.service.ts`
- modified: `src/features/profiles/teacher/pages/holistic/services/holisticTrends.service.ts`
- modified: `src/features/profiles/teacher/pages/holistic/StudentHolisticProfilePage.tsx`
- modified: `src/features/profiles/teacher/pages/roster/AdvisoryRosterPage.tsx`
- modified: `src/features/profiles/teacher/pages/subjects/detail/AssessmentRecordsPage.tsx`
- modified: `src/features/profiles/teacher/pages/subjects/detail/components/AddItemModal.tsx`
- modified: `src/features/profiles/teacher/pages/subjects/detail/components/AssessmentTab.tsx`
- modified: `src/features/profiles/teacher/pages/subjects/detail/components/TopicManagerModal.tsx`
- modified: `src/features/profiles/teacher/pages/subjects/detail/HolisticRecordsPage.tsx`
- modified: `src/features/profiles/teacher/pages/subjects/detail/SubjectDetailPage.loading-view.tsx`
- modified: `src/features/profiles/teacher/pages/subjects/detail/SubjectDetailPage.tsx`
- modified: `src/features/profiles/teacher/pages/subjects/detail/SubjectRecordsPage.loading-view.tsx`
- modified: `src/features/profiles/teacher/pages/subjects/detail/SubjectRecordsPage.tsx`
- modified: `src/features/profiles/teacher/pages/subjects/services/subjectClassList.service.ts`
- modified: `src/features/profiles/teacher/pages/subjects/services/subjectGradeTemplate.service.ts`
- modified: `src/features/profiles/teacher/pages/subjects/services/subjectGrading.service.ts`
- modified: `src/features/profiles/teacher/pages/subjects/services/subjects.service.ts`
- modified: `src/features/profiles/teacher/pages/subjects/SubjectClassListPage.loading-view.tsx`
- modified: `src/features/profiles/teacher/pages/subjects/SubjectClassListPage.tsx`
- modified: `src/features/profiles/teacher/pages/subjects/SubjectPage.loading-view.tsx`
- modified: `src/features/profiles/teacher/pages/subjects/SubjectPage.tsx`
- new: `src/features/profiles/teacher/query/AttendanceQueryContext.ts`
- new: `src/features/profiles/teacher/query/TeacherAcademicQueries.tsx`
- new: `src/features/profiles/teacher/query/TeacherAcademicQueryContext.ts`
- new: `src/features/profiles/teacher/query/TeacherAdvisoryQueries.tsx`
- new: `src/features/profiles/teacher/query/TeacherAdvisoryReaderContext.ts`
- new: `src/features/profiles/teacher/query/TeacherAttendanceQueries.tsx`
- new: `src/features/profiles/teacher/query/TeacherCalendarQueries.tsx`
- new: `src/features/profiles/teacher/query/teacherGradeKeys.ts`
- new: `src/features/profiles/teacher/query/TeacherGradeQueries.tsx`
- new: `src/features/profiles/teacher/query/TeacherGradeQueryContext.ts`
- new: `src/features/profiles/teacher/query/teacherQueryScope.ts`
- new: `src/features/profiles/teacher/query/TeacherReader.ts`
- new: `src/features/profiles/teacher/query/TeacherScheduleProviders.tsx`
- new: `src/features/profiles/teacher/query/TeacherScheduleQueries.tsx`
- new: `src/features/profiles/teacher/query/TeacherSessionBoundary.tsx`
- new: `src/features/profiles/teacher/query/TeacherStudentQueries.tsx`
- new: `src/features/profiles/teacher/query/TeacherStudentsProvider.tsx`
- new: `src/features/profiles/teacher/query/teacherSubjectKeys.ts`
- new: `src/features/profiles/teacher/query/useTeacherQueryInvalidation.ts`
- new: `src/features/profiles/teacher/query/useTeacherReader.ts`
- new: `src/features/profiles/teacher/query/useTeacherRetryAttempt.ts`
- modified: `src/routes/TeacherSection.tsx`
- modified: `src/shared/calendar/CalendarPageView.loading-view.tsx`
- modified: `src/shared/calendar/CalendarPageView.tsx`
- modified: `src/shared/components/StudentDetailPage.loading-view.tsx`
- new: `src/shared/notification/AuthenticatedNotificationQueries.tsx`
- modified: `src/shared/notification/NotificationContext.tsx`
- modified: `src/shared/notification/PrincipalNotificationQueries.tsx`
- modified: `TANSTACK-QUERY-INVALIDATION-MAP.md`
- modified: `TANSTACK-QUERY-MIGRATION-ROADMAP.md`
- modified: `tests/domain-trends-loading.spec.ts`
- modified: `tests/holistic-overview-loading.spec.ts`
- modified: `tests/principal-notification-query-acceptance.spec.ts`
- modified: `tests/principal-notification-query-harness.tsx`
- modified: `tests/role-bundles.spec.ts`
- modified: `tests/student-details-loading.spec.ts`
- modified: `tests/subject-records-loading.spec.ts`
- new: `tests/teacher-academic-query.spec.ts`
- new: `tests/teacher-advisory-query.spec.ts`
- new: `tests/teacher-attendance-query.spec.ts`
- new: `tests/teacher-calendar-query-acceptance.spec.ts`
- new: `tests/teacher-dashboard-query-acceptance.spec.ts`
- modified: `tests/teacher-grades-loading.spec.ts`
- new: `tests/teacher-grades-query.spec.ts`
- new: `tests/teacher-holistic-query.spec.ts`
- new: `tests/teacher-notification-query-acceptance.spec.ts`
- new: `tests/teacher-notification-query.spec.ts`
- new: `tests/teacher-readers-query-harness.tsx`
- new: `tests/teacher-readers-query.html`
- new: `tests/teacher-readers-query.spec.ts`
- new: `tests/teacher-role-query-acceptance.spec.ts`
- new: `tests/teacher-student-revalidation.spec.ts`
- new: `tests/teacher-student-schedule-query.spec.ts`
- new: `tests/teacher-students-query.spec.ts`
- modified: `tests/teacher-subject-loading.spec.ts`
- new: `tests/teacher-writer-lifecycle-harness.tsx`
- new: `tests/teacher-writer-lifecycle.html`
- new: `tests/teacher-writer-lifecycle.spec.ts`
- deleted (authorized obsolete cache): `src/features/profiles/teacher/pages/subjects/services/subjectDetailCache.service.ts`

### Backend security corrections and isolated tests

- new: `src/modules/admin/student-record/studentRecord.authorization.js`
- modified: `src/modules/admin/student-record/studentRecord.controller.js`
- modified: `src/modules/admin/student-record/studentRecord.router.js`
- modified: `src/modules/admin/subject-management/academicYear.router.js`
- modified: `src/modules/settings/grading-periods/gradingPeriods.router.js`
- modified: `src/modules/teacher/gradebook/subjectGrading.controller.js`
- new: `src/modules/teacher/gradebook/subjectStudent.authorization.js`
- modified: `src/modules/teacher/gradebook/topicTagging.controller.js`
- modified: `src/modules/teacher/holistic/holistics.controller.js`
- modified: `src/modules/teacher/holistic/holistics.router.js`
- new: `test/academicManagementAuthorization.test.js`
- modified: `test/gradebookWorkflow.test.js`
- new: `test/studentRecordAuthorization.test.js`
- new: `test/teacherStudentWriteAuthorization.test.js`

### Generated visual verification artifacts

<details>
<summary>322 regenerated/added synthetic-fixture screenshot files</summary>

- modified: `loading-screenshots/admin-calendar-1280-dark-skeleton.png`
- modified: `loading-screenshots/admin-calendar-1280-light-skeleton.png`
- modified: `loading-screenshots/admin-calendar-375-dark-skeleton.png`
- modified: `loading-screenshots/admin-calendar-375-light-skeleton.png`
- modified: `loading-screenshots/admin-user-details-1280-dark-skeleton.png`
- modified: `loading-screenshots/admin-user-details-1280-light-skeleton.png`
- modified: `loading-screenshots/admin-user-details-375-dark-skeleton.png`
- modified: `loading-screenshots/admin-user-details-375-light-skeleton.png`
- modified: `loading-screenshots/attendance-records-1280-dark-loaded.png`
- modified: `loading-screenshots/attendance-records-1280-dark-skeleton.png`
- modified: `loading-screenshots/attendance-records-1280-light-loaded.png`
- modified: `loading-screenshots/attendance-records-1280-light-skeleton.png`
- modified: `loading-screenshots/attendance-records-375-dark-loaded.png`
- modified: `loading-screenshots/attendance-records-375-dark-skeleton.png`
- modified: `loading-screenshots/attendance-records-375-light-loaded.png`
- modified: `loading-screenshots/attendance-records-375-light-skeleton.png`
- modified: `loading-screenshots/attendance-summary-1280-dark-loaded.png`
- modified: `loading-screenshots/attendance-summary-1280-dark-skeleton.png`
- modified: `loading-screenshots/attendance-summary-1280-light-loaded.png`
- modified: `loading-screenshots/attendance-summary-1280-light-skeleton.png`
- modified: `loading-screenshots/attendance-summary-375-dark-loaded.png`
- modified: `loading-screenshots/attendance-summary-375-dark-skeleton.png`
- modified: `loading-screenshots/attendance-summary-375-light-loaded.png`
- modified: `loading-screenshots/attendance-summary-375-light-skeleton.png`
- modified: `loading-screenshots/diff/attendance-record-cells-1280-dark.json`
- modified: `loading-screenshots/diff/attendance-record-cells-1280-dark.png`
- modified: `loading-screenshots/diff/attendance-record-cells-1280-light.json`
- modified: `loading-screenshots/diff/attendance-record-cells-1280-light.png`
- modified: `loading-screenshots/diff/attendance-record-cells-375-dark.json`
- modified: `loading-screenshots/diff/attendance-record-cells-375-dark.png`
- modified: `loading-screenshots/diff/attendance-record-cells-375-light.json`
- modified: `loading-screenshots/diff/attendance-record-cells-375-light.png`
- modified: `loading-screenshots/diff/attendance-summary-1280-dark.json`
- modified: `loading-screenshots/diff/attendance-summary-1280-dark.png`
- modified: `loading-screenshots/diff/attendance-summary-1280-light.json`
- modified: `loading-screenshots/diff/attendance-summary-1280-light.png`
- modified: `loading-screenshots/diff/attendance-summary-375-dark.json`
- modified: `loading-screenshots/diff/attendance-summary-375-dark.png`
- modified: `loading-screenshots/diff/attendance-summary-375-light.json`
- modified: `loading-screenshots/diff/attendance-summary-375-light.png`
- modified: `loading-screenshots/diff/domain-trends-1280-dark.json`
- modified: `loading-screenshots/diff/domain-trends-1280-dark.png`
- modified: `loading-screenshots/diff/domain-trends-1280-light.json`
- modified: `loading-screenshots/diff/domain-trends-1280-light.png`
- modified: `loading-screenshots/diff/domain-trends-375-dark.json`
- modified: `loading-screenshots/diff/domain-trends-375-dark.png`
- modified: `loading-screenshots/diff/domain-trends-375-light.json`
- modified: `loading-screenshots/diff/domain-trends-375-light.png`
- modified: `loading-screenshots/diff/holistic-overview-1280-dark.json`
- modified: `loading-screenshots/diff/holistic-overview-1280-dark.png`
- modified: `loading-screenshots/diff/holistic-overview-1280-light.json`
- modified: `loading-screenshots/diff/holistic-overview-1280-light.png`
- modified: `loading-screenshots/diff/holistic-overview-375-dark.json`
- modified: `loading-screenshots/diff/holistic-overview-375-dark.png`
- modified: `loading-screenshots/diff/holistic-overview-375-light.json`
- modified: `loading-screenshots/diff/holistic-overview-375-light.png`
- modified: `loading-screenshots/diff/holistic-profile-1280-dark.json`
- modified: `loading-screenshots/diff/holistic-profile-1280-dark.png`
- modified: `loading-screenshots/diff/holistic-profile-1280-light.json`
- modified: `loading-screenshots/diff/holistic-profile-1280-light.png`
- modified: `loading-screenshots/diff/holistic-profile-375-dark.json`
- modified: `loading-screenshots/diff/holistic-profile-375-dark.png`
- modified: `loading-screenshots/diff/holistic-profile-375-light.json`
- modified: `loading-screenshots/diff/holistic-profile-375-light.png`
- modified: `loading-screenshots/diff/principal-grade-sheet-1280-dark.png`
- modified: `loading-screenshots/diff/principal-grade-sheet-375-dark.png`
- modified: `loading-screenshots/diff/principal-grade-sheet-375-light.json`
- modified: `loading-screenshots/diff/principal-grade-sheet-375-light.png`
- modified: `loading-screenshots/diff/principal-holistic-metrics-1280-dark.png`
- modified: `loading-screenshots/diff/principal-holistic-metrics-1280-light.png`
- modified: `loading-screenshots/diff/principal-subject-metrics-1280-dark.png`
- modified: `loading-screenshots/diff/teacher-grades-1280-dark.png`
- modified: `loading-screenshots/diff/teacher-grades-1280-light.png`
- modified: `loading-screenshots/diff/teacher-grades-375-light.png`
- modified: `loading-screenshots/domain-trends-1280-dark-loaded.png`
- modified: `loading-screenshots/domain-trends-1280-dark-skeleton.png`
- modified: `loading-screenshots/domain-trends-1280-light-loaded.png`
- modified: `loading-screenshots/domain-trends-1280-light-skeleton.png`
- modified: `loading-screenshots/domain-trends-375-dark-loaded.png`
- modified: `loading-screenshots/domain-trends-375-dark-skeleton.png`
- modified: `loading-screenshots/domain-trends-375-light-loaded.png`
- modified: `loading-screenshots/domain-trends-375-light-skeleton.png`
- modified: `loading-screenshots/holistic-overview-1280-dark-loaded.png`
- modified: `loading-screenshots/holistic-overview-1280-dark-skeleton.png`
- modified: `loading-screenshots/holistic-overview-1280-light-loaded.png`
- modified: `loading-screenshots/holistic-overview-1280-light-skeleton.png`
- modified: `loading-screenshots/holistic-overview-375-dark-loaded.png`
- modified: `loading-screenshots/holistic-overview-375-dark-skeleton.png`
- modified: `loading-screenshots/holistic-overview-375-light-loaded.png`
- modified: `loading-screenshots/holistic-overview-375-light-skeleton.png`
- modified: `loading-screenshots/holistic-profile-1280-dark-loaded.png`
- modified: `loading-screenshots/holistic-profile-1280-dark-skeleton.png`
- modified: `loading-screenshots/holistic-profile-1280-light-loaded.png`
- modified: `loading-screenshots/holistic-profile-1280-light-skeleton.png`
- modified: `loading-screenshots/holistic-profile-375-dark-loaded.png`
- modified: `loading-screenshots/holistic-profile-375-dark-skeleton.png`
- modified: `loading-screenshots/holistic-profile-375-light-loaded.png`
- modified: `loading-screenshots/holistic-profile-375-light-skeleton.png`
- modified: `loading-screenshots/parent-1280-dark-loaded.png`
- modified: `loading-screenshots/parent-1280-dark-skeleton.png`
- modified: `loading-screenshots/parent-1280-light-loaded.png`
- modified: `loading-screenshots/parent-1280-light-skeleton.png`
- modified: `loading-screenshots/parent-375-dark-loaded.png`
- modified: `loading-screenshots/parent-375-dark-skeleton.png`
- modified: `loading-screenshots/parent-375-light-loaded.png`
- modified: `loading-screenshots/parent-375-light-skeleton.png`
- modified: `loading-screenshots/parent-calendar-1280-dark-skeleton.png`
- modified: `loading-screenshots/parent-calendar-1280-light-skeleton.png`
- modified: `loading-screenshots/parent-calendar-375-dark-loaded.png`
- modified: `loading-screenshots/parent-calendar-375-dark-skeleton.png`
- modified: `loading-screenshots/parent-calendar-375-light-skeleton.png`
- modified: `loading-screenshots/parent-enrolled-children-1280-dark-skeleton.png`
- modified: `loading-screenshots/parent-enrolled-children-1280-light-skeleton.png`
- modified: `loading-screenshots/parent-enrolled-children-375-dark-skeleton.png`
- modified: `loading-screenshots/parent-enrolled-children-375-light-skeleton.png`
- modified: `loading-screenshots/phases/domain-trend-line-dark-0.png`
- modified: `loading-screenshots/phases/domain-trend-line-dark-25.png`
- modified: `loading-screenshots/phases/domain-trend-line-dark-50.png`
- modified: `loading-screenshots/phases/domain-trend-line-dark-75.png`
- modified: `loading-screenshots/phases/domain-trend-line-light-0.png`
- modified: `loading-screenshots/phases/domain-trend-line-light-25.png`
- modified: `loading-screenshots/phases/domain-trend-line-light-50.png`
- modified: `loading-screenshots/phases/domain-trend-line-light-75.png`
- modified: `loading-screenshots/phases/domain-trend-score-cognitive-dark-0.png`
- modified: `loading-screenshots/phases/domain-trend-score-cognitive-dark-25.png`
- modified: `loading-screenshots/phases/domain-trend-score-cognitive-dark-50.png`
- modified: `loading-screenshots/phases/domain-trend-score-cognitive-dark-75.png`
- modified: `loading-screenshots/phases/domain-trend-score-cognitive-light-0.png`
- modified: `loading-screenshots/phases/domain-trend-score-cognitive-light-25.png`
- modified: `loading-screenshots/phases/domain-trend-score-cognitive-light-50.png`
- modified: `loading-screenshots/phases/domain-trend-score-cognitive-light-75.png`
- modified: `loading-screenshots/phases/holistic-overview-dark-25.png`
- modified: `loading-screenshots/phases/holistic-overview-dark-50.png`
- modified: `loading-screenshots/phases/holistic-overview-dark-75.png`
- modified: `loading-screenshots/phases/holistic-overview-light-0.png`
- modified: `loading-screenshots/phases/holistic-overview-light-25.png`
- modified: `loading-screenshots/phases/holistic-overview-light-50.png`
- modified: `loading-screenshots/phases/holistic-overview-light-75.png`
- modified: `loading-screenshots/phases/holistic-profile-dark-75.png`
- modified: `loading-screenshots/phases/holistic-profile-light-0.png`
- modified: `loading-screenshots/phases/holistic-profile-light-25.png`
- modified: `loading-screenshots/phases/holistic-profile-light-50.png`
- modified: `loading-screenshots/phases/holistic-profile-light-75.png`
- modified: `loading-screenshots/phases/subject-records-dark-0.png`
- modified: `loading-screenshots/phases/subject-records-dark-50.png`
- modified: `loading-screenshots/phases/subject-records-dark-75.png`
- modified: `loading-screenshots/phases/subject-records-light-0.png`
- modified: `loading-screenshots/phases/subject-records-light-25.png`
- modified: `loading-screenshots/phases/subject-records-light-50.png`
- modified: `loading-screenshots/phases/subject-records-light-75.png`
- modified: `loading-screenshots/phases/teacher-score-dark-control-0.png`
- modified: `loading-screenshots/phases/teacher-score-dark-control-25.png`
- modified: `loading-screenshots/phases/teacher-score-dark-control-50.png`
- modified: `loading-screenshots/phases/teacher-score-dark-control-75.png`
- modified: `loading-screenshots/phases/teacher-score-light-control-0.png`
- modified: `loading-screenshots/phases/teacher-score-light-control-25.png`
- modified: `loading-screenshots/phases/teacher-score-light-control-50.png`
- modified: `loading-screenshots/phases/teacher-score-light-control-75.png`
- modified: `loading-screenshots/principal-calendar-1280-dark-skeleton.png`
- modified: `loading-screenshots/principal-calendar-1280-light-skeleton.png`
- modified: `loading-screenshots/principal-calendar-375-dark-skeleton.png`
- modified: `loading-screenshots/principal-calendar-375-light-skeleton.png`
- modified: `loading-screenshots/principal-grade-sheet-1280-dark-loaded.png`
- modified: `loading-screenshots/principal-grade-sheet-1280-dark-skeleton.png`
- modified: `loading-screenshots/principal-grade-sheet-1280-light-skeleton.png`
- modified: `loading-screenshots/principal-grade-sheet-375-dark-loaded.png`
- modified: `loading-screenshots/principal-grade-sheet-375-dark-skeleton.png`
- modified: `loading-screenshots/principal-grade-sheet-375-light-skeleton.png`
- modified: `loading-screenshots/principal-gradebooks-1280-dark-skeleton.png`
- modified: `loading-screenshots/principal-gradebooks-1280-light-loaded.png`
- modified: `loading-screenshots/principal-gradebooks-1280-light-skeleton.png`
- modified: `loading-screenshots/principal-gradebooks-375-dark-skeleton.png`
- modified: `loading-screenshots/principal-gradebooks-375-light-skeleton.png`
- modified: `loading-screenshots/principal-holistic-analytics-1280-dark-loaded.png`
- modified: `loading-screenshots/principal-holistic-analytics-1280-dark-skeleton.png`
- modified: `loading-screenshots/principal-holistic-analytics-1280-light-loaded.png`
- modified: `loading-screenshots/principal-holistic-analytics-1280-light-skeleton.png`
- modified: `loading-screenshots/principal-holistic-analytics-375-dark-skeleton.png`
- modified: `loading-screenshots/principal-holistic-analytics-375-light-skeleton.png`
- modified: `loading-screenshots/principal-students-1280-dark-loaded.png`
- modified: `loading-screenshots/principal-students-1280-dark-skeleton.png`
- modified: `loading-screenshots/principal-students-1280-light-loaded.png`
- modified: `loading-screenshots/principal-students-1280-light-skeleton.png`
- modified: `loading-screenshots/principal-students-375-dark-skeleton.png`
- modified: `loading-screenshots/principal-students-375-light-skeleton.png`
- modified: `loading-screenshots/principal-students-class-1-1280-dark-skeleton.png`
- modified: `loading-screenshots/principal-students-class-1-1280-light-skeleton.png`
- modified: `loading-screenshots/principal-students-class-1-375-dark-loaded.png`
- modified: `loading-screenshots/principal-students-class-1-375-dark-skeleton.png`
- modified: `loading-screenshots/principal-students-class-1-375-light-skeleton.png`
- modified: `loading-screenshots/principal-students-grade-1-1280-dark-loaded.png`
- modified: `loading-screenshots/principal-students-grade-1-1280-dark-skeleton.png`
- modified: `loading-screenshots/principal-students-grade-1-1280-light-skeleton.png`
- modified: `loading-screenshots/principal-students-grade-1-375-dark-skeleton.png`
- modified: `loading-screenshots/principal-students-grade-1-375-light-skeleton.png`
- modified: `loading-screenshots/principal-subject-analytics-1280-dark-loaded.png`
- modified: `loading-screenshots/principal-subject-analytics-1280-dark-skeleton.png`
- modified: `loading-screenshots/principal-subject-analytics-1280-light-skeleton.png`
- modified: `loading-screenshots/principal-subject-analytics-375-dark-skeleton.png`
- modified: `loading-screenshots/principal-subject-analytics-375-light-skeleton.png`
- modified: `loading-screenshots/principal-teachers-1-1280-dark-loaded.png`
- modified: `loading-screenshots/principal-teachers-1-1280-dark-skeleton.png`
- modified: `loading-screenshots/principal-teachers-1-1280-light-loaded.png`
- modified: `loading-screenshots/principal-teachers-1-1280-light-skeleton.png`
- modified: `loading-screenshots/principal-teachers-1-375-dark-skeleton.png`
- modified: `loading-screenshots/principal-teachers-1-375-light-loaded.png`
- modified: `loading-screenshots/principal-teachers-1-375-light-skeleton.png`
- modified: `loading-screenshots/principal-teachers-1280-dark-loaded.png`
- modified: `loading-screenshots/principal-teachers-1280-dark-skeleton.png`
- modified: `loading-screenshots/principal-teachers-1280-light-loaded.png`
- modified: `loading-screenshots/principal-teachers-1280-light-skeleton.png`
- modified: `loading-screenshots/principal-teachers-375-dark-skeleton.png`
- modified: `loading-screenshots/principal-teachers-375-light-skeleton.png`
- modified: `loading-screenshots/subject-template-1280-dark-loaded.png`
- modified: `loading-screenshots/subject-template-1280-dark-skeleton.png`
- modified: `loading-screenshots/subject-template-1280-light-loaded.png`
- modified: `loading-screenshots/subject-template-1280-light-skeleton.png`
- modified: `loading-screenshots/subject-template-375-dark-skeleton.png`
- modified: `loading-screenshots/subject-template-375-light-skeleton.png`
- modified: `loading-screenshots/teacher-advisory-roster-1280-dark-loaded.png`
- modified: `loading-screenshots/teacher-advisory-roster-1280-dark-skeleton.png`
- modified: `loading-screenshots/teacher-advisory-roster-1280-light-loaded.png`
- modified: `loading-screenshots/teacher-advisory-roster-1280-light-skeleton.png`
- modified: `loading-screenshots/teacher-advisory-roster-375-dark-loaded.png`
- modified: `loading-screenshots/teacher-advisory-roster-375-dark-skeleton.png`
- modified: `loading-screenshots/teacher-advisory-roster-375-light-loaded.png`
- modified: `loading-screenshots/teacher-advisory-roster-375-light-skeleton.png`
- modified: `loading-screenshots/teacher-attendance-1280-dark-loaded.png`
- modified: `loading-screenshots/teacher-attendance-1280-dark-skeleton.png`
- modified: `loading-screenshots/teacher-attendance-1280-light-loaded.png`
- modified: `loading-screenshots/teacher-attendance-1280-light-skeleton.png`
- modified: `loading-screenshots/teacher-attendance-375-dark-loaded.png`
- modified: `loading-screenshots/teacher-attendance-375-dark-skeleton.png`
- modified: `loading-screenshots/teacher-attendance-375-light-loaded.png`
- modified: `loading-screenshots/teacher-attendance-375-light-skeleton.png`
- modified: `loading-screenshots/teacher-calendar-1280-dark-skeleton.png`
- modified: `loading-screenshots/teacher-calendar-1280-light-loaded.png`
- modified: `loading-screenshots/teacher-calendar-1280-light-skeleton.png`
- modified: `loading-screenshots/teacher-calendar-375-dark-skeleton.png`
- modified: `loading-screenshots/teacher-calendar-375-light-skeleton.png`
- modified: `loading-screenshots/teacher-dashboard-1280-dark-loaded.png`
- modified: `loading-screenshots/teacher-dashboard-1280-dark-skeleton.png`
- modified: `loading-screenshots/teacher-dashboard-1280-light-loaded.png`
- modified: `loading-screenshots/teacher-dashboard-1280-light-skeleton.png`
- modified: `loading-screenshots/teacher-dashboard-375-dark-loaded.png`
- modified: `loading-screenshots/teacher-dashboard-375-dark-skeleton.png`
- modified: `loading-screenshots/teacher-dashboard-375-light-loaded.png`
- modified: `loading-screenshots/teacher-dashboard-375-light-skeleton.png`
- modified: `loading-screenshots/teacher-grades-1280-dark-loaded.png`
- modified: `loading-screenshots/teacher-grades-1280-dark-skeleton.png`
- modified: `loading-screenshots/teacher-grades-1280-light-loaded.png`
- modified: `loading-screenshots/teacher-grades-1280-light-skeleton.png`
- modified: `loading-screenshots/teacher-grades-375-dark-skeleton.png`
- modified: `loading-screenshots/teacher-grades-375-light-loaded.png`
- modified: `loading-screenshots/teacher-grades-375-light-skeleton.png`
- modified: `loading-screenshots/teacher-grades-Parent-Visibility-1280-dark-loaded.png`
- modified: `loading-screenshots/teacher-grades-Parent-Visibility-1280-dark-skeleton.png`
- modified: `loading-screenshots/teacher-grades-Parent-Visibility-1280-light-loaded.png`
- modified: `loading-screenshots/teacher-grades-Parent-Visibility-1280-light-skeleton.png`
- modified: `loading-screenshots/teacher-grades-Parent-Visibility-375-dark-skeleton.png`
- modified: `loading-screenshots/teacher-grades-Parent-Visibility-375-light-loaded.png`
- modified: `loading-screenshots/teacher-grades-Parent-Visibility-375-light-skeleton.png`
- modified: `loading-screenshots/teacher-grades-Submission-History-1280-dark-loaded.png`
- modified: `loading-screenshots/teacher-grades-Submission-History-1280-dark-skeleton.png`
- modified: `loading-screenshots/teacher-grades-Submission-History-1280-light-loaded.png`
- modified: `loading-screenshots/teacher-grades-Submission-History-1280-light-skeleton.png`
- modified: `loading-screenshots/teacher-grades-Submission-History-375-dark-skeleton.png`
- modified: `loading-screenshots/teacher-grades-Submission-History-375-light-loaded.png`
- modified: `loading-screenshots/teacher-grades-Submission-History-375-light-skeleton.png`
- modified: `loading-screenshots/teacher-student-details-1280-dark-loaded.png`
- modified: `loading-screenshots/teacher-student-details-1280-dark-skeleton.png`
- modified: `loading-screenshots/teacher-student-details-1280-light-loaded.png`
- modified: `loading-screenshots/teacher-student-details-1280-light-skeleton.png`
- modified: `loading-screenshots/teacher-student-details-375-dark-loaded.png`
- modified: `loading-screenshots/teacher-student-details-375-dark-skeleton.png`
- modified: `loading-screenshots/teacher-student-details-375-light-loaded.png`
- modified: `loading-screenshots/teacher-student-details-375-light-skeleton.png`
- modified: `loading-screenshots/teacher-subject-1280-dark-loaded.png`
- modified: `loading-screenshots/teacher-subject-1280-dark-skeleton.png`
- modified: `loading-screenshots/teacher-subject-1280-light-loaded.png`
- modified: `loading-screenshots/teacher-subject-1280-light-skeleton.png`
- modified: `loading-screenshots/teacher-subject-375-dark-skeleton.png`
- modified: `loading-screenshots/teacher-subject-375-light-skeleton.png`
- modified: `loading-screenshots/teacher-subject-class-list-1280-dark-loaded.png`
- modified: `loading-screenshots/teacher-subject-class-list-1280-dark-skeleton.png`
- modified: `loading-screenshots/teacher-subject-class-list-1280-light-loaded.png`
- modified: `loading-screenshots/teacher-subject-class-list-1280-light-skeleton.png`
- modified: `loading-screenshots/teacher-subject-class-list-375-dark-loaded.png`
- modified: `loading-screenshots/teacher-subject-class-list-375-dark-skeleton.png`
- modified: `loading-screenshots/teacher-subject-class-list-375-light-skeleton.png`
- modified: `loading-screenshots/teacher-subject-holistic-1280-dark-loaded.png`
- modified: `loading-screenshots/teacher-subject-holistic-1280-dark-skeleton.png`
- modified: `loading-screenshots/teacher-subject-holistic-1280-light-loaded.png`
- modified: `loading-screenshots/teacher-subject-holistic-1280-light-skeleton.png`
- modified: `loading-screenshots/teacher-subject-holistic-375-dark-loaded.png`
- modified: `loading-screenshots/teacher-subject-holistic-375-dark-skeleton.png`
- modified: `loading-screenshots/teacher-subject-holistic-375-light-loaded.png`
- modified: `loading-screenshots/teacher-subject-holistic-375-light-skeleton.png`
- modified: `loading-screenshots/teacher-subject-holistic-records-1280-dark-loaded.png`
- modified: `loading-screenshots/teacher-subject-holistic-records-1280-dark-skeleton.png`
- modified: `loading-screenshots/teacher-subject-holistic-records-1280-light-loaded.png`
- modified: `loading-screenshots/teacher-subject-holistic-records-1280-light-skeleton.png`
- modified: `loading-screenshots/teacher-subject-holistic-records-375-dark-loaded.png`
- modified: `loading-screenshots/teacher-subject-holistic-records-375-dark-skeleton.png`
- modified: `loading-screenshots/teacher-subject-holistic-records-375-light-loaded.png`
- modified: `loading-screenshots/teacher-subject-holistic-records-375-light-skeleton.png`
- modified: `loading-screenshots/teacher-subject-records-1280-dark-loaded.png`
- modified: `loading-screenshots/teacher-subject-records-1280-dark-skeleton.png`
- modified: `loading-screenshots/teacher-subject-records-1280-light-loaded.png`
- modified: `loading-screenshots/teacher-subject-records-1280-light-skeleton.png`
- modified: `loading-screenshots/teacher-subject-records-375-dark-loaded.png`
- modified: `loading-screenshots/teacher-subject-records-375-dark-skeleton.png`
- modified: `loading-screenshots/teacher-subject-records-375-light-loaded.png`
- modified: `loading-screenshots/teacher-subject-records-375-light-skeleton.png`
- modified: `loading-screenshots/teacher-subjects-1280-dark-loaded.png`
- modified: `loading-screenshots/teacher-subjects-1280-dark-skeleton.png`
- modified: `loading-screenshots/teacher-subjects-1280-light-loaded.png`
- modified: `loading-screenshots/teacher-subjects-1280-light-skeleton.png`
- modified: `loading-screenshots/teacher-subjects-375-dark-loaded.png`
- modified: `loading-screenshots/teacher-subjects-375-dark-skeleton.png`
- modified: `loading-screenshots/teacher-subjects-375-light-loaded.png`
- modified: `loading-screenshots/teacher-subjects-375-light-skeleton.png`

</details>
