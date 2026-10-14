# Parent role phase 4 — automated checkpoint verified (2026-10-14)

Historical Admin baseline: source 1256/1256, production 685/685, backend 1307/1307. Phase 4 baseline: TypeScript and 51 existing mocked Parent-detail tests passed.

| Actual Parent boundary | Status | Scope |
| --- | --- | --- |
| Dashboard / Enrolled Children / linking | Migrated | Shared list/daily readers; explicit verification/confirmation mutations; successful authoritative invalidation |
| Student profile | Migrated and secured | Linked-child read; Admin-only core profile editing enforced on server |
| Overview / narrative / attendance | Migrated | Year prerequisite; preserved narrative refresh and local month/year selection |
| Academic schedule / missed activities / intervention flags | Migrated | Cancellable reads; no competing service Maps |
| Progress report / visibility / holistic / attendance summary | Migrated | Four independent readers; local term selection and existing transforms preserved |
| Weekly holistic | Migrated | Child/year/term-scoped reader |
| Courseware / Pet quiz | Migrated with side-effect safeguards | Content/state Query reads; explicit generation/submission mutations; no automatic write retries or background generation replay |
| Calendar / Dashboard events | Migrated | Four independent GETs; shared event keys; Parent remains read-only |
| Notifications | Existing implementation reused | Same centralized Query driver, ownership, sockets, 30-second polling, focus and receipts |
| Help / theme / drafts / calculations / PDF export / support choices | Not appropriate | Local/static/imperative behavior retained |
| Authentication / account bootstrap | Auth-owned | Existing architecture retained; not a fabricated Query module |

The query-free Parent facade hands bootstrap timestamps/data to lazy Query readers and retires bootstrap requests. No independent Notification cache exists. Full results and exact file inventory are recorded in QED-PARENT-ROLE-QUERY-VERIFICATION.md. Parent checkpoint passed: source 1,384/1,384; fresh-production 813/813; isolated backend 1,657/1,657. Zero browser retries, failures, skips or flaky outcomes. This current checkpoint supersedes older Parent pending entries retained below as history. STOPPED FOR REVIEW; no release phase or additional migration begun.

# Admin role phase 3 — verified checkpoint 2026-10-14

The authorized remaining Admin boundaries are implemented: Student Records and sequential Excel imports; Classes and form options; Subjects, Sections, assessments and template metadata/upload; Academic Year/Terms; Calendar; background Notifications; and the previously deferred Admin Teacher profile/schedule/advisory reader. Existing Dashboard and User Management Query implementations are retained. Auth/bootstrap, Help, local drafts/calculations, and imperative binary exports remain outside Query. Parent is not included.

Automated role checkpoint PASSED: source 1,256/1,256; fresh-production 685/685; isolated backend 1,307/1,307, zero browser retries/skips/flaky results. TypeScript, fresh build and unchanged bundle/role guards passed. Two acceptance synchronization races were corrected without changing application behavior or weakening assertions. Four Admin management routers received narrowly scoped authentication/Admin authorization guards backed by 264 focused isolated tests; controller contracts, schemas and academic calculations are unchanged. Browser APIs/auth/sockets are mocked; real-backend release acceptance, existing lint/xlsx debt, cold lazy-asset recovery and manual API-toggle requirements remain documented in QED-ADMIN-ROLE-QUERY-VERIFICATION.md. Historical checkpoints below are preserved. STOPPED FOR USER REVIEW; Parent has not started.

# Teacher role phase 2 — checkpoint 2026-10-13

All applicable Teacher page readers and suitable writes are implemented and the automated role checkpoint passed: source1,018/1,018, fresh-production559/559, isolated backend1,043/1,043; zero browser retries/skips/flaky results. This includes authorized shared student/profile schedule adapters, Calendar reads and notifications. The explicitly approved academic-management and student-record authorization policies are implemented with isolated backend coverage. See QED-TEACHER-QUERY-VERIFICATION.md for exact scope, exploratory failures, cache policies, file inventory and real-backend limitations. No Parent or further Admin migration has started; all previous migrations remain preserved. STOPPED FOR USER REVIEW.

The Principal-only scope and stopped checkpoints below are historical, superseded by this authorized Teacher increment.

# Principal role completion increment — 2026-10-12

Current scope: Principal only, with authorized notification ownership and
verified privacy/lifecycle corrections. Final checkpoint 2026-10-13: source
705/705, fresh-production 340/340, isolated backend 517/517. Browser APIs are
mocked; real-backend acceptance remains unverified. Stopped for role review.
Historical verification totals below are not new runs. See
QED-PRINCIPAL-COMPLETION-VERIFICATION.md for current results and limitations.

| Actual Principal route/boundary | Inventory status | Evidence / scope |
| --- | --- | --- |
| Dashboard | Completed; prior verified implementation retained | usePrincipalDashboardData |
| Teachers directory/profile/schedule/advisory roster | Completed and verified; cached-403 projection hardened | useTeachersDirectory/usePrincipalTeacherProfile; profile/schedule implementation retained |
| Students overview/class/unassigned-grade roster | Completed; prior implementation retained | usePrincipalStudentsOverview/useClassList; no separate student-profile route |
| Academic/holistic reports | Completed; prior implementation retained | useSubjectAnalytics/useHolisticAnalytics; no additional report route |
| Gradebooks/Grade Sheets/year/periods | Completed; prior implementation retained | existing Query hooks and goldens |
| Calendar | Migrated and verified | Principal-only lazy adapter, four GETs/six mutations; shared UI retained |
| Notification Bell | Migrated and verified | Principal-only lazy driver; stable global facade; other roles retain legacy provider |
| Help & Support | Not applicable | static composition; no API transport |
| Account profile/bootstrap/password/session actions | Not appropriate for an independent cached reader | Auth remains authority; ProfileMenu uses auth state; shared auth-owned writes retained |
| Legacy Admin providers formerly under PrincipalSection | Removed unused Principal wrappers | No reachable Principal consumer uses Students/Teachers/Classes contexts; Admin implementations retained |

Notification ownership: authentication user ID, not role-table profile ID. Three
HTTP endpoints and Socket authentication now enforce that boundary. Backend
regressions use isolated doubles; no live database or accounts. Do not proceed to
Teacher until Principal role checkpoint review/approval.

---

# Admin User Management checkpoint — 2026-10-12

The actual lazy User Management list, form and detail routes now own a single
session/role/user-scoped Query list. Details and active-Principal conflict checks
derive from that list. Local search, role/status selections and backend order are
unchanged; this UI has no sort or pagination controls. Create/update/delete use
non-retried mutations with success-only invalidation; provisioning remains one
server-owned POST. Form drafts remain local and there are no optimistic writes.

The eager UsersProvider remains Query-free for Dashboard startup. Its completed
bootstrap data and original timestamp hand off to the lazy Query driver, after
which the legacy user cache is retired. No second user-record cache is maintained.
Teacher writes refresh the existing Admin teacher lookup/profile cache without
migrating that shared reader. No Principal or backend implementation changed.

See QED-ADMIN-USERS-QUERY-VERIFICATION.md for gates, request counts, exact files
and limitations. Next independent candidate: Admin Student Records, after mapping
enrollment/class/count invalidation and its shared readers. This checkpoint does
not authorize or implement that migration. Historical checkpoints follow.

# Admin Dashboard read-only checkpoint — 2026-10-12

The four Dashboard GET readers now use the centralized QueryClient behind the
lazy Admin Dashboard boundary. Counts and audit logs use 30-second freshness;
login frequency retains its existing 30-second polling. All resources have
five-minute inactive collection, session/role/user keys, cancellation, independent
401 handling and 403 data hiding. Existing Admin layout providers, bootstrap,
notifications and writers remain on their current implementation.

See QED-ADMIN-DASHBOARD-QUERY-MIGRATION-VERIFICATION.md for the final gates,
request counts, bundle costs and limitations. The older blocked Dashboard report
is historical; the separate authorization correction remains unchanged.
Next recommended independent boundary: Admin users, after mapping successful
mutation invalidation and preserving form drafts; no additional migration is
authorized by this checkpoint.

# Calendar authorization / roster stabilization checkpoint — 2026-10-11

The two blockers from the accelerated inventory were corrected under the
user's explicit authorization. The six Calendar write routes now use the existing
JWT middleware and an Admin/Principal check; controllers, SQL, public Calendar
reads and the Calendar UI/Query implementation are unchanged. Calendar writes
include credentials so the existing cross-origin workflow remains functional.
Token logging was removed without changing authentication status semantics.

The roster reload failure was reproduced with authentication held: the old test
expected a roster error before any new roster request could start. It now waits
for auth/lazy-route readiness after reload, retaining existing assertions, default
timeouts and zero retries. Controlled session/profile reload tests cover class
and unassigned-grade routes. No Query cache/application lifecycle change was needed.

Verification checkpoint: complete source passed 530/530 twice; fresh production
passed 231/231; affected roster cases passed 25/25 in both source and production.
Calendar UI passed 16/16 in each mode; isolated backend tests passed 165/165 three
times. TypeScript, fresh build, bundle and role guards passed. Browser APIs were
mocked; backend HTTP/JWT/controller tests used a database double, not live data.
See QED-MIGRATION-BLOCKERS-VERIFICATION.md for evidence and exact changed files.
No additional account/shared module is being migrated. The remaining inventory
and priorities below remain valid; earlier authorization-gap and unresolved-test
entries describe the historical discovery, not the corrected implementation.
The original roadmap is preserved verbatim below this checkpoint.

---

# Accelerated migration checkpoint — 2026-10-11

The latest authorization covers remaining accounts continuously, superseding the
per-module approval requirements in the historical entries below. Deadline:
2026-10-12. Completed Principal migrations must not be repeated. No application
migration was implemented in this checkpoint: the first remaining shared Calendar
boundary exposed a material backend authorization risk and triggered the user's
explicit stop condition. See QED-SYSTEM-WIDE-QUERY-VERIFICATION.md. Backend changes
require separate authorization; no backend or database modification was made.

Baseline checkpoint: TypeScript/build/bundle guards and 77 isolated grading tests
passed; fresh-production acceptance passed 227/227. Complete source acceptance
returned 522 passed / 1 failed (unassigned-grade roster reload error assertion).
Three unchanged targeted reruns passed, but the whole-checkout regression gate
remains unresolved. No application code or test assertions were changed.

## Current completion matrix (supersedes historical inventory)

Status labels: **MV** migrated and verified in prior checkpoints; **NM** not
migrated; **PM** partially migrated; **NA** not appropriate for cached server-state
reads. Verification of unchanged code in this checkpoint is recorded separately;
these labels do not claim new real-backend verification.

| Account | API-backed module / boundary | Status | Remaining dependency or work |
| --- | --- | --- | --- |
| Principal | Teachers Directory + year | MV | Retain five-minute freshness and regression assertions |
| Principal | Students overview | MV | Retain session isolation |
| Principal | Class and unassigned-grade rosters | MV | Preserve cached missing/null semantics |
| Principal | Teacher profile, schedule, advisory class list | MV | Principal adapter only; Admin legacy cache remains |
| Principal | Dashboard and dashboard term/year readers | MV | Preserve independent failures and calculations |
| Principal | Subject Performance / Holistic Analytics | MV | Preserve analytics goldens and server filters |
| Principal | Gradebooks overview | MV | Preserve visibility and section summary goldens |
| Principal | Grade Sheet, periods, active year | MV | Preserve server-default term and Grade Sheet goldens |
| Principal | Calendar read/manage | NM | Shared Calendar authorization checkpoint; do not migrate writes yet |
| Principal | Shared profile / notifications / account actions | NM | Shared contracts below; no separate student-profile route exists |
| Admin | Dashboard counts | MV | Two independent session-scoped queries; independent 401 detection |
| Admin | Login frequency | MV | Period-scoped query; existing 30-second refresh retained |
| Admin | Audit logs | MV | Page/search/role/action/from/to/limit keys; independent permission protection |
| Admin | Users list/detail/create/update/delete | MV | Lazy users Query list; details/conflict derived; non-retried success-only mutations; Query-free startup handoff |
| Admin | Students list/detail/create/update/delete | NM | StudentsContext, enrollment/grade-section lookups and class/count invalidation |
| Admin | Classes/advisers/schedules | NM | ClassesContext plus shared teacher profile/schedule legacy readers; exact day/assignment semantics |
| Admin | Subjects, sections, grade levels, teacher choices | NM | Five contexts, subject/section relationships, year cache; migrate all writers with invalidation |
| Admin | Subject grade templates | NM | Upload/read/reset and parser boundary; retain grading/template tests |
| Admin | Academic year / grading-period settings | NM | Rollover invalidates all active-year resource families; preserve existing readers until writer mapped |
| Admin | Calendar read/manage | NM | Same shared Calendar authorization checkpoint |
| Teacher | Dashboard/counts/today agenda/weekly schedule | NM | Six transport sites; date/year/teacher keys and separate dependent readers |
| Teacher | Subject catalog and subject class lists | NM | Subject detail cache also contains editable scores/terms; separate server data from drafts |
| Teacher | Subject grade items, scores, submission | NM | Read/write boundary; no automatic retries or optimistic publication; preserve adviser synchronization |
| Teacher | Advisory roster/student details | NM | Multiple advisory selection consumers; shared StudentDetail presentation |
| Teacher | Advisory grades/submission/status | NM | Preserve submission visibility, defaults, calculations and writer payloads |
| Teacher | Attendance today/records/month summary | NM | Class/student/date/month/year keys; preserve writes and monthly totals |
| Teacher | Holistic overview/weekly evaluations/domain trends | NM | Shared aggregators and editable evaluations; preserve exact four-domain values |
| Teacher | Calendar read-only | NM | Shared Calendar readers; keep independent from management authorization |
| Parent | Dashboard/daily updates/linked children | NM | Authenticated parent/student identities; child switches must cancel previous reads |
| Parent | Student profile | NM | StudentProfileContext, separate from Principal teacher profile |
| Parent | Academic term performance/overview | NM | Student Maps + in-flight cache; preserve parent release gating |
| Parent | Attendance overview / school-year month options | NM | Student/month/year keys, in-flight deduplication and shared month cache |
| Parent | Holistic overview/weekly records | NM | Existing 30-second/visibility refresh and student/term cache must be preserved |
| Parent | Progress report: academic/holistic/attendance/visibility | NM | Independent settled responses, fail-closed visibility, three terms, download transforms |
| Parent | Missed activities / class schedule | NM | Student/subject/date keys and completion-related invalidation |
| Parent | Intervention flags / courseware | NM | Progress dependency; reader versus generation/completion boundary must be mapped |
| Parent | Quiz generation / grading / submit / bonus / mastery | NM | Mutations for effectful operations, including any effectful GET; never reusable query generation |
| Parent | Calendar read-only | NM | Shared Calendar readers |
| Shared | teachers.service.ts | PM | Principal list migrated; Admin profile/year cache retained until all consumers migrate |
| Shared | Calendar service + two page compositions + CRUD | NM | Four reads and six write operations; material authorization stop described in report |
| Shared | Account profile | NM | Bootstrap and role account consumers share transport; no public Query import |
| Shared | Notifications | NM | Poll/focus/socket refresh and read/mark mutations; avoid duplicate event subscriptions |
| Shared | Authentication bootstrap/session transitions | NA | Keep auth as authority for session generation; password/profile/register writes can later use guarded mutations |
| Shared | Calculations/parsers/export transformations | NA | Pure computation stays outside Query; export network readers classified with owning account |
| Shared | Form drafts, filters, modal/theme/animation state | NA | Local state; never migrate merely because located next to an API reader |

For a file-level transport/service catalog with resolved direct consumers, see
QED-API-MIGRATION-INVENTORY.md. It covers every direct fetch site and every named
service module, including indirect transport helpers. Module-level Maps containing
editable state or calculations must not be mechanically replaced.

## Priority after the authorization checkpoint is resolved

1. Calendar: establish server authentication and Admin/Principal write authorization
   first, then migrate shared reads and successful CRUD invalidation together.
2. Admin dashboard readers (counts, login frequency, audit log) form the next
   independent low-risk module; preserve existing polling and independent failures.
3. Admin users, students, classes, subjects and year/template writes, with explicit
   cross-module invalidation and draft-preserving contracts before replacing caches.
4. Teacher dashboard/catalog/roster readers, then coherent attendance/holistic/grade
   writer boundaries with existing academic goldens and synchronization tests.
5. Parent profile/schedule/activity readers before grade visibility, progress
   reports, holistic refresh and intervention/quiz completion boundaries.
6. Shared notifications/profile and cross-account mutation invalidation after all
   direct consumers are accounted for. Query invalidation affects only this browser;
   retain existing sockets/polling for other users.

## Required architecture for the accelerated scope

Reuse the singleton and auth cleanup bridge. Keys begin with session generation,
role and user, followed by resource and every applicable server parameter (active
year identity, term, class/section, subject/student, dates and filters). Query does
not provide authorization. Keep preview/auth readiness gates, independent 401
callbacks guarded by session generation, 403 privacy, cancellation and bounded
explicit retry/offline recovery. Successful cached null/404 semantics are resource
specific. No private cache persistence.

For writes, use retry:false, preserve exact payloads and unsaved edits, and
invalidate only after confirmed success. Never optimistically publish grades.
Target class/student/profile/schedule resources and dependent summaries after
roster/assignment edits; year rollover targets all dependent year scopes; grade
submission/visibility targets authorized grade and report readers; attendance and
holistic writes target their date/term/student summaries; Calendar CRUD targets
all Calendar reads and any dashboard Calendar readers actually shared. Guard late
mutation callbacks so old sessions cannot patch or refetch new-session data.
These are required future contracts, not implemented invalidation claims.

Keep Query out of public bundles. Existing guards also reject it in non-Principal
eager preview graphs. Lazy actual-page adapters can preserve those guards; a role
provider restructure requires deliberate analysis and new isolation evidence,
never a silent budget increase or weakened assertion.

---

## Historical checkpoints (preserved verbatim below)

# Progressive TanStack Query migration roadmap

Latest approved increment (2026-10-11): ONLY the Principal Grade Sheet and its
grading-period/active-year readers. See QED-GRADE-SHEETS-QUERY-VERIFICATION.md.
Year resolution precedes class-scoped periods, then the URL-selected sheet.
Server default selection and unavailable-term modal remain outside Query.
All three resources use 30-second freshness/five-minute inactive GC and the
existing singleton/session cleanup. Keys partition by session/role/user, year,
grade, optional section and selected period. No calculations, writers, exports,
other-role consumers or API toggle were changed. Successful null sheets cache as
Not Found; HTTP errors keep their error semantics. Stale term changes resolve
context first; fresh terms/navigation reuse cache. Earlier checkpoints below are
historical. Further migrations require separate approval.

Latest approved increment (2026-10-11): Principal Gradebooks OVERVIEW only.
The read-only section-summary cards use the existing singleton QueryClient and
shared Principal roster-year context. See QED-GRADEBOOKS-QUERY-VERIFICATION.md.
Year/overview freshness is 30 seconds, inactive GC five minutes. No polling,
automatic retry or writer/event synchronization was added. Search, grade/section
filters and grouping remain local. Only the overview's sole-consumer summary
cache and lastSchoolYear variable were removed. The sheet's shared legacy year
reader, term selection, scores and all other-account services/caches stay intact.
Golden fixtures passed against the old source and old production artifact before
fetching changes. The separately owned sheet/period boundary is the recommended
next increment; it requires approval. Earlier checkpoints below are historical.

Latest approved increment (2026-10-11): ONLY the existing Principal Subject
Performance and Holistic Development Analytics routes now use the shared
QueryClient. See `QED-ANALYTICS-QUERY-VERIFICATION.md`. These linked views form
the Analytics boundary; unrelated reports and Gradebooks remain unmigrated.
The reports service has no other-role consumers or service caches. Year context
reuses the Principal roster-year query and stateless transport. Analytics/year
freshness is 30 seconds with five-minute inactive GC; year-scoped filter options
use five-minute freshness/ten-minute inactive GC. Term and holistic view are server
filters; grade is local. No subject/domain/year picker exists. Stale navigation,
explicit Retry and server-filter changes resolve active year before result reads.
No calculations, charts, backend or writers were changed. Golden outputs were
verified against the prior implementation before fetching changes. All earlier
checkpoints below are historical; prior work is preserved. Further modules require
approval, particularly Gradebooks with calculation and visibility fixtures.

Latest increment (2026-10-11): ONLY the Principal Dashboard now uses the shared
QueryClient for active term, independent school-year header, and dashboard
snapshot reads. See `QED-DASHBOARD-QUERY-VERIFICATION.md`. The older checkpoints
below are historical and their work is preserved. The existing dashboard service
has no other runtime consumers; no shared-role service cache was removed.
Thirty-second freshness/five-minute inactive GC replace the hook's in-flight
promise ref. All server-selected year/term identity and the local calendar date
scope the snapshot; the ranking-term dropdown remains local. No polling or
writers were added. Analytics/reports and other accounts still require approval.

Latest checkpoint (2026-10-11): Principal teacher profile, combined schedule,
and advisory class-list readers now use a Principal-only Query adapter. See
`QED-PROFILES-QUERY-VERIFICATION.md` for dependency analysis and verification.
There is no Principal student-profile route/reader in the current route tree;
the existing student-detail consumers belong to Teacher and Parent and remain
outside this increment. Admin embeds the teacher page and retains its legacy
reader/caches, with the shared presentation accepting externally supplied state.
No other module is authorized by this checkpoint.

Current checkpoint (2026-10-11): the subsequent Principal class and
unassigned-grade roster increment is implemented for review. See
`QED-ROSTERS-QUERY-VERIFICATION.md` and `TANSTACK-QUERY-INVALIDATION-MAP.md`.
The original overview audit below is historical; no Admin, Teacher, Parent,
or later Principal module is being implemented in this checkpoint.

Audit date: 2026-10-11. Baseline: commit `174588a13cccdffa2fafc3bafccbbed214b192de`.
The committed Teachers Directory pilot remains intact. This increment selects
only the read-only Principal Students Overview (grade/section cards and totals).
Class rosters, student/teacher profiles, schedules and academic records are NOT
part of this increment. Each later increment needs review and approval.

## Architecture and current limitations

Most services use credentialed fetch; hooks/providers manually coordinate
loading, errors, retry counters and cancellation flags. Flags prevent late React
updates but generally do not cancel HTTP work. Context lifetimes act as caches;
module Maps frequently have no expiry or authenticated-session dimension.
Mutation handlers variously patch local state, reload lists or patch service
caches, so migrating a reader without its writers can create competing state.
Not every Map is a cache: aggregation/deduplication Maps must remain unchanged.

Reuse the stable shared QueryClient, lightweight QueryHttpError and auth cleanup
bridge. Keys start with session generation, role and user ID, followed by feature,
resource and all server filters (year, term, student, class, section, subject,
week/date range). Never key solely by a student/subject ID. No persisted private
cache. Keep route-preview/auth readiness gates and independently handle each
request's 401; 403 remains a permission error. Aborted/old requests cannot expire
new sessions. Query cancellation is not a substitute for server authorization.

Keep separate route-scoped providers sharing the singleton for this increment.
Moving the provider to the public root would pull Query into public bundles.
Before Phase 2, introduce a lazy authenticated role boundary if useful, remove
nested providers only after route tests, and deliberately revise role bundle
guards for the newly authorized role. Current guards still reject Query in public
and all non-Principal eager graphs; do not weaken them in Phase 1.

Default pilot policy: five-minute freshness, ten-minute inactive GC, explicit
retries, no focus/reconnect refetch of completed queries; offline paused work can
resume. Decide per-resource overrides before migration. Read-only lookup data
can use five minutes; grades, attendance, visibility and quiz progression require
explicit mutation/event invalidation and shorter policy where justified.
Background refresh must never replace form drafts. Local selection, search,
theme, modal state, dirty flags and calculation functions stay outside Query.

## Module inventory, order and risk

Paths below are relative to `src/features/profiles` unless explicitly shared.
These are migration boundaries, not permission to implement later phases.

| Phase/module | Existing owners and fetch/cache pattern | Risk and migration/invalidation plan |
| --- | --- | --- |
| 1 Students Overview — this increment | `principal/pages/students/hooks/usePrincipalStudentsOverview.ts`, `services/students.service.ts`, `PrincipalStudentsPage.loading-view.tsx`; Promise.all plus indefinite grade-level cache and shared school-year cache | Low: two GETs, no mutations. Remove only overview grade cache; dedicated uncached overview year request. Preserve hook interface, totals, filters/cards and class links. Five-minute session-scoped overview key. |
| 1 Class and unassigned-grade rosters | Same service; `hooks/useClassList.ts`; class/grade Maps plus fetched-ID Sets distinguish cached null/404 | Medium: keys need classId or gradeId, year and session; preserve 404/not-found semantics, navigation and existing year cache until all consumers migrate. Next recommended increment. |
| 1 Student profiles and teacher profiles/schedules | Teacher `services/teachers.service.ts` has profile Map and year cache; `hooks/useTeacherSchedule.ts`; shared profile services/components also used by other roles | Medium: identify every shared consumer before removing caches; role/resource keys and cancellation. Never remove profile/schedule caches just because directory is migrated. |
| 1 Dashboard | `principal/pages/dashboard/hooks/usePrincipalDashboardData.ts`, `services/principalDashboard.service.ts`; ref-indexed promise deduplication, local ranking-term state | Medium: preserve aggregate transforms and term selection; queries must represent all server filters; no accidental partial-success UI changes. |
| 1 Subject/holistic analytics and reports | `principal/pages/reports/hooks/useSubjectAnalytics.ts`, `useHolisticAnalytics.ts`, `services/reports.service.ts`; effect fetch/retry and term-dependent analytics | Medium/high: key year/term/subject/domain filters; preserve four holistic domains and report/export transforms. Test switching filters during pending requests. |
| 1 Gradebook viewing | `principal/pages/gradebooks/hooks/usePrincipalGradebooks.ts`, `usePrincipalGradeSheet.ts`, `services/gradebooks.service.ts`; cached grade summaries and fetched sheets | High: preserve submission visibility, term/assessment weights and exported values. Golden grade/visibility fixtures required before migration. |
| 2 Admin users | `admin/pages/usermanagement/context/UsersContext.tsx`, `services/user-record.service.ts`; add reloads, update/delete patch context | Medium: queries plus success-only list/detail invalidation; keep active-Principal conflict rules. Identity mutations may affect session boundaries; preserve errors/forms. |
| 2 Admin students | `admin/pages/studentrecords/context/StudentsContext.tsx`, `student-record.service.ts`, `grade-section.service.ts`; context list and manual refetch | Medium/high: invalidate list/detail and affected class/grade counts after assignment edits; preserve draft forms/import handling. |
| 2 Admin classes/sections | `admin/pages/classes/context/ClassesContext.tsx`, `TeachersContext.tsx`, `services/classes.service.ts`; effect reload counter, delete patches list; subject Sections/SubjectSections contexts | Medium/high: invalidate class roster/counts, schedule and subject-section relationships. Preserve day mapping and adviser constraints. |
| 2 Admin subjects | `admin/pages/subjects/context/{SubjectsCatalog,SubjectSections,Sections,Teachers,gradeLevels}Context.tsx`; subject/section/teacher services plus grade templates | High: dependent selects and imports, multiple provider copies. Canonical server keys without merging UI contexts; precise invalidation after writes. Preserve template parsing and weights. |
| 2 Academic year/terms/settings | `admin/pages/settings/services/schoolYear.service.ts`, subjects `academicyear.service.ts`, settings `SettingsContext.tsx` | High: year/term writes invalidate affected school-year data across all migrated roles. Theme/storage synchronization remains local. Do not share unscoped private caches. |
| 2 Admin dashboard | `admin/pages/dashboard/services/{totalCounts,loginFrequency,auditLogs}.service.ts`, components | Low/medium: independent counts/log keys, date/filter dimensions; retain LoginFrequency's existing 30-second refresh without duplicate timers. |
| 3 Teacher dashboard and subject lists | `teacher/pages/dashboard/services/dashboard.service.ts`, subjects `subjects.service.ts`; effect-based aggregation | Medium: adviser/subject permissions and upcoming activities; distinguish clock-driven WeeklySchedule UI timer from server polling. |
| 3 Advisory rosters | `teacher/pages/roster/services/advisory.service.ts`, attendance `useSelectedAdvisorySection.service.ts` | Medium: session + advisory/section + year keys; keep advisory selection/localStorage as UI state. Assignment writes invalidate rosters explicitly. |
| 3 Subject detail/grades/submissions | `teacher/pages/subjects/services/{subjectDetailCache,subjectGrading,subjectGradeTemplate,subjectClassList}.service.ts`, grades `gradePage.service.ts`; TTL subject Map with patch/invalidate operations | Very high: migrate readers and cache-patching writers together. Keep unsaved edits separate; invalidate only after successful saves/submissions; preserve weights, topic tags, teacher-to-adviser release rules. No focus refresh over drafts. |
| 3 Attendance | `teacher/pages/attendance/services/attendance.service.ts` and editing components | High: key advisory/date/year, preserve statuses/totals, retain dirty rows, no retry of writes by default. Save success invalidates summaries and parent views for affected students. |
| 3 Holistic evaluations | `teacher/pages/holistic/services/{holistic,holisticTrends,advisoryholisticdevelopment}.service.ts` | High: student/week/term/year keys; preserve domain transforms and trend statuses; drafts isolated from background reads. |
| 3 Intervention assignments | Teacher subject/academic consumers and shared intervention endpoint consumers | High: trace assignment mutation consumers before implementation; success invalidation must include linked-student progress without changing completion rules. |
| 4 Linked students/profiles/dashboard | `parent/pages/EnrollledStudent/services/enrolledStudent.service.ts`, dashboard service/context, StudentProfile service/context | High privacy: authenticated parent + linked student keys; keep saveProfile forms and loading/isSaving interfaces; account-switch and unauthorized-child tests required. |
| 4 Academic overview | `parent/pages/Student/Overview/service/studentTermPerformance.service.ts`, `context/PerformanceAnalyticsContext.tsx`, SchoolYear service/context | High: Map plus in-flight request cache must be removed only with all migrated consumers. Include year/term/student/session; preserve release gating and local selected term. |
| 4 Attendance | Overview attendance service/context; ProgressReport AttendanceSummary service | High: reconcile duplicated readers without altering absence/status totals, calendar/date ranges or partial-failure presentation. |
| 4 Holistic overview/weekly records | Overview holistic service/context; `Student/Holistic/service/weeklyHolistic.service.ts` | High: overview currently force-refreshes every 30 seconds while visible and on visibilitychange. Replace timer only when equivalent Query polling is enabled; preserve four domains/release rules/week and term filters. |
| 4 Progress reports | `Student/ProgressReport/context/ProgressReportContext.tsx`, services TermPerformance, GradeVisibility, HolisticPerformance, AttendanceSummary | Very high: Promise.allSettled intentionally allows partial failure; grade visibility fails closed. Separate visibility query must gate grades; no stale successful visibility after failure. Student Maps/in-flight requests need session scoping. Preserve user-selected term and download transforms. |
| 4 Daily activities/class schedule | `Student/Academic/context/{missedActivities,classSchedule}.context.tsx`, corresponding services | Medium/high: student/subject/date keys; preserve activity completion and navigation. Keep local UI selection independent. |
| 4 Intervention progress/notifications | Academic intervention/petQuiz services; shared notification infrastructure below | High: progress changes invalidate parent summaries; migration depends on assignment and quiz mutation contracts. Do not cache new generated quiz requests as reusable reads. |
| 5 Quiz, AI and courseware | `parent/pages/Student/Academic/service/{petQuiz,intervention,courseware}.service.ts` and consumers | Very high: generation/submission are mutations, never automatically replay; new-set generation needs explicit new request identity. Preserve five quiz types, ED progression, completion and scoring; courseware reads keyed by allowed student/assignment. |
| 5 Shared calendar | `src/shared` calendar services/components and consumers across roles | Medium/high: preserve existing fetch/credential contracts; session + event/range keys, successful CRUD invalidation. No API changes. |
| 5 Shared account profile | `src/shared/profile/service/profile.service.ts`, role profile hooks and account controls | Medium/high: shared authenticated identity data; reconcile callers before introducing a lazy authenticated provider. Profile edits must invalidate account displays without changing auth readiness or public bootstrap. |
| 5 Shared notifications | `src/shared/notification/NotificationContext.tsx`, `Notification.service.ts` | High: existing 30-second polling + focus refresh and Socket.IO `connect`/`notification:new`. Retain event subscription/cleanup and target invalidation for authenticated recipient. Query does not provide cross-browser real-time synchronization. Avoid polling twice. |

## Synchronization contract for later phases

After successful writes, invalidate only affected session resources and dependent
summaries. Do not retry non-idempotent writes automatically. Cancel affected reads
before intentional cache patches; guard optimistic rollback against newer sessions.
Cross-role data in other browsers still requires existing sockets/polling or fresh
navigation; local Query invalidation cannot update another browser's cache.
Admin edits must not be wired into unmigrated caches speculatively this increment.

## Verification and approval gates

Run baseline and post-change TypeScript/build, existing teacher pilot tests,
directory loading/profile/schedule regressions and public/non-Principal bundle
guards. Add targeted overview loading/error/empty/retry, five-minute reuse/stale
refresh, auth/preview/role gating, both independent 401 paths, 403, session switch,
logout, cancellation, offline initial/cached/recovery and responsive UI tests.
All synthetic fixtures must be labeled mocked; real-backend tests require an
authorized account and must not write production data. None is configured for
this increment. Academic/mutation tests are gates for later phases, not claims of
coverage for unchanged business logic now.

Preserve pre-existing local modifications: API config manual localhost/Render
toggle, base Playwright config, live config and gradebook/live tests. Do not run
live tests that create database fixtures. The current manually selected localhost
URL means a normal build is a local test artifact; the user must select Render
before production deployment. Existing xlsx advisory remains a separate security
follow-up. No commit, push, deployment or dependency upgrade in this increment.

## Adoption assessment

Incremental adoption is justified: the read-only directories gain bounded
freshness, reliable explicit retry, request cancellation and session isolation
with one shared runtime. The benefit does not justify a bulk replacement of
gradebook, attendance, holistic, parent visibility or quiz state. Those phases
need their own mutation contracts and business-rule fixtures before approval.


## Phase 2 Teacher audit — 2026-10-13

All 15 registered Teacher routes and the 76 Teacher-owned source files were inventoried. Teacher-owned Query migration was pending at entry; shared Calendar/Notification migration applies only to Principal. See QED-TEACHER-QUERY-VERIFICATION.md for the module/dependency matrix and ongoing evidence. No existing Teacher migrations will be repeated.

The grading-period dependency audit reproduced authenticated non-Admin management writes with a local Express/JWT/controller plus database double. User confirmed Admin-only academic-year and grading-period management; six write routes now reuse requireAdmin after verifyToken. Four-role GET access remains intact. Focused security: 112/112; isolated backend: 629/629. Teacher migration resumes after this correction.

## Phase 2 implementation checkpoint — blocked shared student authorization boundary

Completed Teacher-owned Query boundaries: Dashboard (five independent GETs), My Subjects, subject class roster, read-only Calendar snapshot (four GETs), and Notifications (GET plus confirmed mark/read-all mutations). These are implemented and module-tested; Teacher role completion is NOT claimed. The remaining advisory, attendance, assessment, grades/submission/visibility, holistic, topic/intervention and shared student-profile boundaries remain on their existing implementations.

Shared authorization blocker reproduced with actual local Express/JWT/student controllers and a synthetic database double: all four roles received200 from allStudents, viewStudent/:id and allGrade; Teacher and Parent also executed the soft-delete UPDATE successfully. No live DB or real records were accessed. Router has verifyToken without role guards; controllers do not enforce student ownership. TeacherSection currently relies on Admin Students/Classes/Teachers providers, including the school-wide student list. A narrow page migration cannot safely establish the missing cross-role policy. Asked user to confirm write policy and Teacher/Parent read ownership before changing this boundary. Existing vulnerable routes are unchanged; production readiness is blocked.

Calendar/academic management/notification security corrections and all prior migrations are preserved. The six academic management routes now enforce the explicitly approved Admin-only policy;112 focused and629 complete isolated backend tests pass. Pending shared student policy is separate from that completed correction.

Phase2 resumed after explicit student-policy confirmation. Core student ownership correction is implemented and verified with217 executed-SQL isolated tests/full846; Teacher authorized student reader now Query-backed. Advisory roster is Query-backed and14focused checks pass; dependent attendance/holistic callers migrate individually, preserving their legacy readers meanwhile. Holistic profile name-disclosure correction adds81 focused cases (298combined student security/full927backend). Teacher Dashboard, subjects/roster, student facade, advisory roster, read-only Calendar and Notifications are implemented; holistic reader migration is next. Prior stopped student-policy checkpoint is superseded; no role-completion claim yet.

### Teacher phase 2 subsequent progress
Holistic overview/profile/domain trends and attendance Today/Records/history readers are migrated. Attendance saves use confirmed-success scoped invalidation with no queued/retried non-idempotent writes. All existing holistic 55 and attendance 26 browser checks pass; new mocked actual-page Query checks 7+7 pass. Academic target-student ownership correction passes 80 focused and 422 combined backend checks. Advisory grade/submission/visibility and subject assessment/weekly-holistic boundaries remain pending. Role-wide verification is not yet complete; see QED-TEACHER-QUERY-VERIFICATION.md for exploratory failures and exact evidence.

## Current Teacher role implementation status (supersedes earlier blocked checkpoints)

As of 2026-10-13, the user-approved student-record policy is implemented and the Teacher-owned migrations below are implemented. Earlier "blocked shared student authorization" entries describe the historical audit, not an unresolved policy question. Role-level automated verification passed: source1,018/1,018, fresh-production559/559 and isolated backend1,043/1,043. Browser APIs are mocked; real-backend/MySQL acceptance remains unverified. Stopped for user review.

| Teacher boundary | Current implementation |
| --- | --- |
| Dashboard; My Subjects; subject class roster | Query readers, scoped auth/cancellation/offline handling |
| Advisory roster and selection | Shared Teacher Query reader; URL selection retained |
| Student profiles and schedules | Authorized student Query facade; lazy Teacher-only class/staff Query adapters; Admin default providers unchanged |
| Attendance Today, records, calendar, monthly summary | Query readers and save mutations; confirmed-success origin-scoped invalidation; existing cycles/rollback/calculations retained |
| Advisory grades, submission/history, parent visibility controls | Independent Query readers; submission and visibility mutations; pending grades remain hidden; no optimistic visibility release |
| Holistic overview, student profile, domain trends | Shared period metadata and year/term/student-scoped readers; local chart transforms unchanged |
| Subject detail, assessment records, grading rules | Query readers; obsolete five-minute unscoped Map removed; score drafts remain local; confirmed score saves publish locally only after success |
| Topic list/create and weekly holistic records/save | Query readers and mutations within lazy subject boundary |
| Calendar; notifications | Teacher read-only Calendar Query snapshot; notification Query reader and confirmed mark-read mutations |
| Authentication/bootstrap/account profile, theme, help | Shared identity/global UI boundaries retained; no duplicate Query identity cache |
| Calculations, form drafts, chart transforms, file exports/downloads | Not appropriate as Query state; unchanged |
| Backend-only mastery/intervention/status readers with no frontend consumers | Not migrated or invented; retained existing endpoints |

Approved backend policies verified: academic-year and grading-period writes Admin-only; core student writes Admin-only; Principal school-wide reads in the current single-school database; Teacher assigned/advisory student reads; Parent linked-child reads. Student identity uses authenticated user IDs joined to role-profile IDs. Related subject score/holistic/intervention writes verify current owned roster membership before writes. Current complete isolated backend: 1,043/1,043. No live MySQL/account verification claimed.

Fresh build passes unchanged bundle guards: public eager 134,064/135,349 gzip bytes; Admin 146,277/151,512. Teacher eager beyond public 168,044 bytes. Query remains outside public/Admin/Teacher static eager closures and executes behind lazy authenticated modules.
