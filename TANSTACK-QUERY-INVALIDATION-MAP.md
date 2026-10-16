# Parent phase 4 invalidation boundary — 2026-10-14

P = ['session', generation, 'PARENT', String(authUserId), 'parent']. Child readers append ['student', String(studentId), 'year', activeYearId, resource, server parameters]. Year readiness precedes dependent reads. Courseware/intervention generation uses globally identified child/topic resources; no invented year parameter is sent to these endpoints. Calendar and linked-list keys are Parent session-scoped. Shared notifications retain their existing ownership key architecture.

- Confirmed child-link success invalidates P+children/list and P+dashboard/daily-updates. Verification, failed writes and unmatched-account business401 do not invalidate or expire the session.
- Confirmed quiz submission, bonus completion or mastery invalidates only current Parent/current-child intervention keys, with refetchType:none. This marks flags/state stale without silently replaying progress-reset or AI-generation GETs. HTTP failures and success:false do not invalidate.
- Logout/login/account/role changes reuse existing centralized auth cache cleanup. Independent 401 callbacks retain captured generation guards; 403 suppresses private data and remains a permission error.
- Child403/profile404 removes same-session sibling child projections, without cancelling peers that might independently return401. Requests started before denial cannot publish a delayed200 into that private cache.
- Parent profile has no write mutation: approved core student-record policy is Admin-only. Existing shared Admin/Teacher/Principal transports and service caches were not removed.
- Default freshness30s, profile/schedule/courseware5min, intervention flags0 (existing mount refresh), gc5min. Existing narrative and notification30s polling remain; no extra polling. Reads consume AbortSignal except side-effecting initialization/generation GETs, deliberately protected from cancel/replay.

# Admin phase 3 — 2026-10-14

A = ['session', generation, 'ADMIN', String(authUserId), 'admin']. All dependencies below stay within A; central auth cleanup clears the previous session. Confirmed writes only, retry:false, no offline write queue or optimistic grade publication. Inactive data GC is five minutes. Ordinary lists, sections, assignments, year/terms, Calendar and rosters are fresh for 30 seconds; grade metadata, assessments, Teacher profiles and template metadata are fresh for five minutes. Existing Dashboard login-frequency and Notifications retain their existing 30-second refresh behavior; no new polling.

| Confirmed Admin write | Same-session cache dependencies |
| --- | --- |
| Student create/update/delete/import | students, classes, dashboard/students, dashboard/audit; original UI performs authoritative refresh or publishes confirmed imported rows, never per-row speculative append |
| Class create/update/delete | classes, class-options, student-options/sections, students, teachers, sections, subjects, dashboard/audit; confirmed deletion patches class list |
| Teacher user edit (existing workflow) | class-options/teachers, teachers/profile, teachers/list, classes; explicit lookup refresh; a read-only Retry does not invalidate profiles |
| Section create/update/delete | sections, class-options/sections, student-options/sections; active subjects/assignments, classes and students refresh to synchronize section labels |
| Subject assignment/status | subjects, class-options/subjects, classes, teachers, templates, dashboard/audit; existing local confirmed projections and status-toggle behavior retained |
| Assessment create/update/delete | subjects/assessments, subjects/assignments, dashboard/audit; explicit coalesced default initialization is a mutation, never a queryFn |
| Template upload | replace templates/subjectId on confirmed success; subjects/assignments, class-options/subjects, dashboard/audit |
| Academic year create/activate | academic-year, subjects, class-options, templates, dashboard/audit; original full reload retained |
| Term dates | replace academic-year/terms/yearId, invalidate academic-year/active and dashboard/audit; original three-term payload retained |
| Calendar activity or holiday create/update/delete | only matching calendar kind and all-kind reader plus dashboard/audit |
| Notification receipts | existing role-scoped notification key, confirmed read flags and list invalidation |

Profile keys include actual active-year ID and Teacher ID; advisory roster keys include year ID/class ID. Class section options include grade and excludeClassId; all other endpoint parameters remain in their respective keys. No invented server term/year filters. Page reads use AbortSignal and independent generation-guarded 401 handling; 403 hides cached private projections. Local drafts and forms remain outside Query. Historical cross-role implementations and invalidation entries below are preserved.

# Principal Calendar and notifications — 2026-10-12

C = ['session',generation,role,String(authUserId),'principal','calendar'].
Four GET keys append activities, holidays, all-activities, all-holidays. No server
year/term/filter arguments exist. 30-second freshness, five-minute inactive GC;
no polling, retry false, reconnect true, focus false. Date/month selections and
modal drafts stay local. Each GET has its own signal and independent guarded 401
callback; 403 hides all private cached Calendar rows. Offline paused requests do
not keep loading forever; fully cached rows remain visible with the standard
LoadingRegion alert. Explicit Retry coalesces; offline writes are never queued.

Confirmed create/update/delete activity success invalidates C+activities and
C+all-activities only; holiday success invalidates corresponding holiday keys.
No optimistic writes; unchanged payloads; failed or old-session writes invalidate
nothing. Existing Admin/Teacher/Parent Calendar readers remain legacy and are not
invalidated by another session's cache. Their existing mount refresh is preserved.

N = ['session',generation,role,String(authUserId),'principal','notifications'].
GET /api/notification/:authUserId, 30-second freshness/five-minute GC. Preserve
30-second background polling, explicit focus/socket-connect refresh and socket
merge/deduplication by notification ID. No competing Principal Context fetch.
PATCH /:id/read and /user/:authUserId/read-all retry false; confirmed success
updates read flags and invalidates N. Failed/offline writes retain unread status;
no offline mutation queue. Old callbacks are guarded by unmounted identity and
session generation. 401 expires the matching session; 403 hides cached rows.

Other roles retain their existing notification implementation. Query remains
behind dynamic Principal adapters and absent from public/non-Principal eager
graphs. Authentication bootstrap/profile/local drafts remain outside Query.

Final checkpoint 2026-10-13: 705 source, 340 fresh-production and 517 isolated
backend tests passed. The global notification facade stays mounted across auth
handoff; only its Query driver is identity-keyed. Both legacy and Query Context
projections are owner-tagged. Directory teachers/year projections also withhold
cached data after 401/403, including offline navigation. These privacy/lifecycle
corrections add no invalidation family, retry, polling or freshness changes.

---

# Query dependencies and invalidation checkpoints

## Admin User Management — 2026-10-12

U = ['session', generation, role, String(userId), 'admin', 'users', 'list'].
GET /api/user/usersList has no request filters or pagination. Detail records match
role AND role-table ID; active-Principal conflict excludes the editing Principal.
Both derive from U. getUserById remains an unused legacy transport, not a new GET.
Freshness: 30 seconds; inactive GC: five minutes; retry false; focus refetch false;
reconnect true; explicit Retry coalesces with a pending request. Signals cancel
unmounted reads. 401 invokes generation-guarded expiry before response parsing;
403 hides cached private rows. Offline errors retain authorized cached data.

Let D = ['session', generation, role, String(userId), 'admin', 'dashboard'].

| Confirmed successful write | Invalidation / refresh |
| --- | --- |
| POST /api/user/addUser | U (list + derived detail/conflict); D + ['users']; D + ['audit'] prefix |
| PUT /api/user/editUser/:id, including status | Same |
| PATCH /api/user/deleteUser/:id | Same |
| Any of these for a Teacher | Also clear legacy Admin teacher-profile cache and refetch TeachersContext ID mapping |
| Failed/offline/old-session write | None; retain records and form drafts; report the failure |

Writes retry false and are not queued offline. Identical pending writes coalesce.
No optimistic records, split registration or changed payloads. Student counts and
login-frequency caches are not invalidated by user CRUD. School-year and schedule
payload caches are not removed; Principal uses its existing separate Query reader.
No cross-account invalidation is needed: auth cleanup cancels/clears Query state,
and UsersProvider identity remount clears the bootstrap facade and page drafts.
Other ClassesContext teacher-name projections remain on their existing legacy
refresh behavior; account/teacher assignment writers need mapping in that future
module. These links supersede the historical future-user-CRUD note below.

## Admin Dashboard read-only — 2026-10-12

Let A = ['session', generation, role, String(userId), 'admin', 'dashboard'].
All four readers: staleTime 30 seconds, inactive gcTime five minutes, no automatic
error retries, no focus refetch; stale/paused recovery on reconnect. Only login
frequency polls (30 seconds, including background, preserving the old timer).

| Endpoint | Key suffix | Explicit refresh |
| --- | --- | --- |
| GET /api/user/totalUser | ['users'] | Counts Retry refreshes both independent count readers |
| GET /api/student/totalStudents | ['students'] | Counts Retry refreshes both independent count readers |
| GET /api/analytics/login-frequency | ['frequency', weekly/monthly/yearly] | Chart Retry/Refresh |
| GET /api/audit-logs | ['audit', page, search, role, action, from, to, 20] | Audit Retry/Refresh |

No year/term parameter exists on these readers. No mutation was migrated and no
writer invalidation was added. Future confirmed user CRUD should invalidate the
current session's users count; enrollment changes the students count; successful
audited writes invalidate its audit prefix. Frequency's existing poll discovers
new login activity. Implement these links only with the owning writer migration.
Until then, counts/audit may reuse data for up to 30 seconds on navigation;
explicit Refresh/Retry remains available. Existing auth cleanup cancels and clears
all session data. 403 hides cached results; 401 is detected independently before
body parsing and guarded by request signal/session generation. No optimistic data.

## Previous Principal checkpoint

Latest approved increment: Principal Grade Sheets, 2026-10-11.
Let S = ['session', generation, role, userId], G = S + ['principal','gradebooks'].

| Resource | Key | Freshness / inactive GC |
| --- | --- | --- |
| Active year | Existing S + ['principal','students','roster-year','active'] | 30 seconds / five minutes |
| Period availability/default | G + ['periods',yearId,String(gradeId),sectionIdOrNull] | 30 seconds / five minutes |
| Sheet | G + ['sheet',yearId,String(gradeId),sectionIdOrNull,String(periodId)] | 30 seconds / five minutes |

Year ID is implicit server context, not an added API parameter. Resolve/revalidate
year before periods and sheet; periods GET sends gradeLevelId and optional
sectionId, sheet GET also sends gradingPeriodId. Server default is applied only
when the URL has no selected period, using replace navigation. Do not silently
substitute a new default when an explicit old-year term is rejected. Unavailable
term modal, local search/ranking/gender selections and all grade mappings stay
in their existing owners. Stale navigation/term changes and explicit Retry check
context first. An unchanged year refresh does not force fresh period/sheet reads.

Independent 401 checks precede body parsing at both sheet endpoints; shared year
errors use generation-scoped expiry. Abort and lifecycle guards suppress old
Retry continuations. A 403 hides private rows/options/header without logout.
LoadingRegion snapshots remount across session/year/grade/section; online term
transitions may retain rows only within that scope. Offline cached current-term
data (including empty/null) stays visible with the existing connection alert;
another term's placeholder is never offline cache. Repeated Retry while paused,
offline or pending queues nothing. No polling, automatic retries or persistence.

Future success-only writer dependencies (planned, NOT implemented):
- Subject scores/corrections/submission and adviser release/publication/revocation:
  affected sheet year/grade/section/period, period availability/default and overview.
- Enrollment/class/section, student or subject/adviser assignment changes: affected
  membership, columns, sheet results, periods and overview counts/status.
- Year/term configuration: re-resolve active year FIRST, then period/default
  context and current sheet keys; avoid refetching obsolete-year keys concurrently.
Parent visibility/history and Teacher grading/assessment caches remain separate.
No writer, socket/event contract or cross-browser synchronization was added.
There was no sheet/period service cache to remove. The sole legacy Principal year
wrapper now delegates to the stateless cancellable year transport; no Admin,
Teacher or Parent service/cache was removed. Separate backend GETs remain
non-atomic during rollover. Earlier checkpoints below are historical context.

Latest approved increment: Principal Gradebooks overview only, 2026-10-11.
Let S = ['session', generation, role, userId].

| Resource | Key | Freshness / inactive GC |
| --- | --- | --- |
| Active year | Existing S + ['principal','students','roster-year','active'] | 30 seconds / five minutes |
| Section summaries | S + ['principal','gradebooks','overview',yearId] | 30 seconds / five minutes |

GET /api/gradesheets/section-grade sends no parameters; active year and latest
submitted period per section are selected server-side. Search, grade/section
filters and grouping remain local. Stale navigation and Retry resolve year first.
A changed year enables its own key; old-session/year data cannot remain in the
LoadingRegion snapshot. Independent 401 expiry, 403 privacy protection, abort,
auth/preview gates and session cleanup reuse the existing infrastructure.
Offline cached arrays including empty remain visible with the existing alert;
paused work resumes once. No automatic retries, polling or persistence.

Future success-only invalidation dependencies (planned, NOT implemented):
- Subject-teacher submissions, score corrections and adviser submission/release:
  overview status/latest-period links; affected future sheet/period scores and
  availability need class/term/student/subject-scoped invalidation too.
- Enrollment/class/section and subject-teacher/adviser assignment changes:
  overview counts, membership/adviser and affected future sheet/period data.
- Year/term configuration: resolve active year FIRST before summary reads;
  future periods/default selection/sheets also depend on this context. Do not
  refetch obsolete-year keys concurrently with context resolution.
- Grade publication/visibility/revocation: overview availability and future
  sheet permissions; Parent visibility/term-performance readers remain separate.

No writer/cache patch, event/socket contract or cross-role/browser synchronization
was added. An unchanged open page does not refresh automatically. Separate year
and summary GETs remain non-atomic at rollover. The sheet's legacy readers/caches
and all other-role consumers remain untouched. Earlier checkpoints are historical.

Latest approved increment: Principal Analytics, 2026-10-11. Let
`S = ['session', generation, role, userId]`, `A = S + ['principal','analytics']`.

| Analytics resource | Key | Freshness / inactive GC |
| --- | --- | --- |
| Active year | Existing `S + ['principal','students','roster-year','active']` | 30 seconds / five minutes |
| Term options (shared views) | `A + [yearId,'terms']` | Five / ten minutes |
| Grade options | `A + [yearId,'grades']` | Five / ten minutes |
| View options | `A + [yearId,'views']` | Five / ten minutes |
| Subject ranking | `A + [yearId,'subjects',termLabel]` | 30 seconds / five minutes |
| Holistic rows | `A + [yearId,'holistic',termLabel,view]` | 30 seconds / five minutes |

The five existing `/api/reports` GETs accept only term label and holistic view.
Year is implicit on the server; grade filtering is local. No subject/domain/year
picker or speculative API argument is added. Resolve/revalidate active year before
stale navigation or server-filter reads. Explicit Retry resolves year then refreshes
all three original report reads for its view, including fresh lookups. New context
enables new keys; obsolete filter/session Retry continuations are suppressed.

Every request independently guards 401 through generation-scoped expiry. A 403,
including malformed error bodies, hides affected private data/options without
logout. Ordinary errors preserve the original page-level boundary, while the other
Analytics view's successful cache survives. Offline current-filter cached data or
empty results stay visible with the existing LoadingRegion alert; another filter's
placeholder is never relabeled as current offline data. Paused work resumes once.
No automatic retries, polling or completed-query focus/reconnect refetch were added.

Planned writer dependencies: scores/submission/visibility changes affect subject
rankings and dashboard aggregates; holistic ratings affect holistic rows/summaries;
subject/grade changes affect options/rankings; year/term configuration affects year,
term options and all year-scoped Analytics data. Future invalidation must re-resolve
year before refetching results. No writer/event or cross-browser synchronization
was added. Backend year/report reads remain separate and non-atomic at rollover.
Earlier checkpoints below remain historical context.

Latest increment: Principal Dashboard, 2026-10-11. Let
`S = ['session', generation, role, userId]` and `D = S + ['principal','dashboard']`.

| Dashboard resource | Key | Policy / dependency |
| --- | --- | --- |
| Active term/context | `D + ['active-term']` | 30-second freshness, five-minute inactive GC; backend returns active term and school-year IDs |
| Independent year header | `D + ['school-year','active']` | Same policy; ordinary failure leaves the main dashboard usable |
| Aggregate snapshot | `D + ['snapshot',schoolYearId,termId,termNumber,localDate]` | Same policy; resolve/revalidate context before starting nine aggregate HTTP reads |

The original fail-fast aggregate, static rubric/attention data, numeric conversion,
rank order and chart calculations are unchanged. All-term rankings arrive in the
same response; dropdown selection is not an API filter and does not refetch.
Top-level Retry revalidates term/year, then refreshes the current snapshot (a
changed context enables its own new key). Year Retry refreshes only the header.
Automatic retries, focus/reconnect refetch and polling remain disabled; paused
requests resume on reconnect. Offline/online status is reconciled on dashboard
mount because route-scoped providers can miss connectivity events while absent.

Each HTTP response checks 401 before joining any Promise.all, including nested
overview reads. Session-generation and abort guards protect newer logins. A 403
hides affected private dashboard data without logout. Cache cleanup on identity
changes reuses the existing auth bridge; no private persistence or second cache.

Planned writer dependencies: enrollment/user/class changes affect counts and
rankings; academic-year/term changes affect context/header/snapshot; grades,
attendance and holistic writes affect corresponding snapshot summaries. These
are future integrations, NOT new event subscriptions or cross-browser guarantees.
Future context invalidation must resolve term/year before refetching snapshots,
using the sequencing in dashboard Retry; avoid concurrently force-refetching the
entire dashboard prefix under a possibly stale context. No writer was modified.
Backend active-context reads remain separate/non-atomic; browser local date is a
cache boundary, not a backend date filter. No midnight timer was introduced.

Latest checkpoint: Principal teacher profile/schedule adapter, 2026-10-11.
The earlier roster checkpoint below remains historical context. Principal
profiles add `S + ['principal','teachers','profile',schoolYearId,teacherId]`.
That response owns identity, schedule and advisory assignments; 30-second
freshness and five-minute inactive GC match roster membership. The adapter reuses
the existing roster-year and per-class roster keys/transports, including null.
Initial year resolution precedes profile loading, then unique advisories enable
parallel class-list queries. Top-level Retry refreshes year/profile/known rosters;
class-list Retry refreshes the currently known roster queries. All retries are
explicit and suppressed while offline, paused or any request is pending.

Each endpoint independently guards 401 against its owning session generation.
Year/profile 403 hides profile metadata; any class-list 403 hides the advisory
rosters while preserving authentication. Ordinary class failures retain other
successful sections using the existing partial-failure presentation. Offline
alerts retain usable cached profile/schedule/roster data or cached Not Found.
No mutation, polling or event contract is introduced.

Admin continues importing `TeacherSchedulePage.tsx` and its original
`useTeacherSchedule`/`teachers.service.ts` caches. Principal imports
`PrincipalTeacherProfilePage.tsx` with an uncached profile transport instead.
The shared view contains no Query imports and never calls the legacy hook when
external Principal state is supplied. These are separate owners, not two cache
layers in the Principal reader. Keep Admin caches until that consumer and its
writers are migrated with separate approval. Teacher/Parent services are not
changed. No Principal student-profile reader exists to migrate in this checkout.

Future successful class/adviser/schedule/user writes and academic-year changes
must invalidate the new profile key prefix as well as the roster keys below.
That writer work is planned, not implemented synchronization. Backend endpoints
select active year themselves; client keys cannot make a year rollover between
separate GETs atomic.

Status: Principal class/unassigned-grade roster increment, 2026-10-11.
This map plans all roles; only the three Principal read boundaries listed below
are implemented. Later mutation integration requires separate approval.

## Implemented read graph

Let `S = ['session', generation, role, userId]`. No private cache persistence.

| Resource | Key after S | Dependencies / recovery |
| --- | --- | --- |
| Teachers Directory | `['principal-teachers-directory']` | Teacher list + year label, five-minute freshness; existing explicit retry |
| Students Overview | `['principal', 'students', 'overview']` | Grade summaries + year label, five-minute freshness; existing explicit retry |
| Roster active year | `['principal', 'students', 'roster-year', 'active']` | Existing active academic-year GET; 30-second freshness, five-minute inactive GC |
| Class roster | `['principal', 'students', 'roster', schoolYearId, 'class', classId]` | Requires resolved active-year ID; 30-second freshness, five-minute inactive GC |
| Unassigned-grade roster | `['principal', 'students', 'roster', schoolYearId, 'grade', gradeId]` | Same year dependency, separate class/grade namespace; same policy |

Roster Retry refetches the active year and current roster if its year is already
available. Initial year failures first recover the year, then enable the roster.
A different year ID switches the roster key without placeholder data from the old
year. Offline paused requests resume; repeated Retry cannot enqueue extra work.
A successful null (404) is Query data and reuses cache like an existing record.
Missing target is not a query error and causes no HTTP requests.

Logout/login/account/role changes cancel and clear the shared client's private
queries using the existing auth bridge. Each request has a session-generation
guard for 401; 403 hides the roster's cached private rows and metadata while
keeping the account signed in. Both endpoint requests consume cancellation.
Public and other-role bundles still do not eagerly load Query.

`principalStudentKeys.rosters(generation, role, userId)` is the typed prefix for
all roster resources in the current session. There are NO write mutations or
new event subscriptions in this increment. Existing teacher-profile class-list
reader keeps using the stateless service; its profile/year caches and effects
are not migrated. Do not import QueryClient into that shared service.

## Planned successful-write/event invalidation map

All actions below are plans, not implemented synchronization. Bind them only
when migrating the relevant writers. Preserve existing provider refresh calls,
cache patches, socket listeners and polling until equivalent coverage passes.

| Successful write / event | Affected readers to invalidate | Required safeguards |
| --- | --- | --- |
| Admin student create/edit/delete/import or section/grade assignment | Student directory/profile; affected class roster, former/new unassigned-grade roster; enrollment/grade/dashboard counts; relevant adviser roster | Success only; preserve Excel parsing and form drafts. Use precise old/new IDs where available, roster prefix otherwise. |
| Admin class/adviser/subject/section assignment | Affected class/advisory rosters, teacher profile/schedule, subject-section detail and directory counts | Preserve assignment constraints and related user/teacher ID mapping; do not invalidate every session query blindly. |
| Admin user/profile/status changes | User list/detail, matching role directory/profile and relevant assignments | Preserve single active-Principal checks; identity changes still use auth session cleanup. |
| Academic-year or term configuration | Roster active-year key, roster prefix, directory year-bearing data, year/term-filtered dashboards/reports/grades/holistic/attendance | Re-resolve year before roster key selection. Historical term/year reads must have actual filter IDs. No old-year placeholder data. |
| Teacher assessment item/score/template save or import | Subject detail, affected term grade sheets and summaries, adviser submission state | Keep dirty edits separate. Preserve weights/topic tagging. No automatic write retries. Invalidate only after successful save. |
| Teacher-to-adviser grade submission | Submission visibility, adviser grade sheet, permitted published summaries and parent report queries | Never duplicate submission. Visibility gate must fail closed, independently of cached numerical grades. |
| Attendance save | Advisory/date roster records, affected student/month/term attendance summaries and dashboard counts | Preserve statuses/totals and unsaved rows; precise date/year/section keys. |
| Holistic weekly rating save | Student/week ratings, term/domain summaries, trends and permitted parent holistic reports | Preserve Cognitive/Emotional/Behavioral/Social transforms and draft values; no background overwrite. |
| Intervention assignment/update/archive | Assignment list/detail, permitted student intervention state/courseware/progress and dashboards | Preserve permissions, archive/locked status distinctions and assignment identifiers. |
| Quiz submission, bonus completion, mastery or intervention completion | Assignment/student progress, hunger/completion indicators, permitted parent dashboards | Submission/generation are non-replayed mutations, even if transport uses GET. Never reuse a cached generated quiz for a new-set request. Preserve five types and progression. |
| Calendar create/update/delete | Recipient-authorized event lists/details and affected date ranges | Maintain existing routes/credentials and error behavior; no optimistic destructive assumptions. |
| Notification mark/read-all | Authenticated recipient list/unread count | Existing 30-second polling/focus and Socket.IO `connect`/`notification:new` must stay functional; replace timers/listeners only with equivalent tested behavior. |
| Account profile save | Account display and authorized profile readers | Keep form state and dirty fields outside Query; do not change auth bootstrap or public entry loading. |

## Cross-browser limits and verification gates

Local invalidation cannot update another user's browser. Existing notifications
use Socket.IO; parent holistic overview uses 30-second visible-page polling plus
visibilitychange; Admin login frequency refreshes every 30 seconds. Retain those
behaviors until their migration is approved and tested. Do not invent an academic
event contract or claim cross-account real-time consistency.

Each future writer migration requires deterministic fixtures for success,
failure, no duplicate writes, precise invalidation, dirty-draft protection,
year/term/subject/assignment separation, 401/403, account switching and cancellation.
Parent report migration additionally requires allSettled partial failures,
authorized linked-student isolation, and hiding stale grades after visibility or
permission failures. Grade/attendance/holistic golden fixtures must precede those
state migrations. Quiz generation and submission must not replay on reconnect.


## Teacher Phase 2 checkpoint — 2026-10-13

Implemented reader keys use [session, generation, role, authUserId, teacher, resource, ...actualParams]. Dashboard appends dashboard/resource/localDay and events limit5. Assigned subjects uses subjects/assigned; roster uses subjects/roster/subjectSectionId. Calendar uses calendar/snapshot/localDay. These endpoints derive active-year context server-side and accept no year parameter; no invented term/year filters are sent. Default freshness30seconds, gc5minutes, automatic retries disabled, focus refetch disabled for these readers, reconnect enabled. Explicit retry is bounded by online/fetching/paused state.

Notifications retain existing30-second polling, focus/socket/reconnect refresh, stale30seconds/gc5minutes. Principal keys remain unchanged; Teacher key is [session,generation,TEACHER,authUserId,teacher,notifications]. Mark/read-all use retry:false and confirmed-success cache update/invalidation only. Session transitions retain centralized synchronous cancellation/clear. Cached401/403 data are hidden. Unmigrated academic writers have not been connected to speculative invalidations; their migration remains pending with dirty-draft/publication protections required. No claim of cross-browser invalidation beyond the existing socket/polling mechanism.

Teacher role is incomplete at the shared student-authorization blocker documented in QED-TEACHER-QUERY-VERIFICATION.md. Do not remove shared Admin providers/caches or migrate academic writers until their real consumers and authorization dependencies are resolved.

### Teacher holistic and attendance dependencies
Teacher prefix remains [session, generation, role, authentication user ID, teacher]. Holistic: shared grading-periods/active metadata; holistic/overview/year/term; holistic/profile/year/student/term; holistic/domain-trends/year/term (all-class response, local class selection). 30s staleTime / 5m GC, no focus polling or automatic retries. Attendance: attendance/classId/(termId or active)/allPeriods; class IDs identify year-owned class records and explicit term IDs identify their periods. 30s/5m. Successful attendance saves invalidate all attendance projections for the originating class and dashboard/attendance within the originating session/user prefix, refetchType:none to preserve local optimistic edits. No invalidation on write failure. Cross-role consumers continue their existing implementations.

### Teacher academic and profile schedule invalidation (2026-10-13)

- `grading-periods/active` stores the original global period shape; consumers map labels locally. Shared Teacher reads use one metadata cache.
- `advisory-grades/year/period/class/{gradebook,history,submission,visibility}`; advisory section options have their own active-resource key. 30s stale / 5m GC. Confirmed advisory submission invalidates that originating account/year/period/class prefix; visibility saves invalidate only its visibility query. History is revalidated once by the existing post-submit workflow.
- `subject/year/subjectSection/{info,items(filters),scores,holistic(term,week),weights(period),topics,weekly-holistic(term,period,week)}`. Subject detail info/items/scores/current holistic and grading rules retain five-minute freshness; assessment records/topics/weekly reads use 30s where records change more frequently. All use 5m GC, bounded explicit retries, no added polling, and AbortSignal.
- Confirmed subject item writes invalidate appropriate item projections; deletes also scores/advisory views. Score writes invalidate that subject's score/submission reads and the current account's advisory grade views. Topic creation invalidates only topics. Subject submission invalidates submission/advisory views. Holistic writes invalidate current/weekly subject holistic reads and current-account holistic aggregate/profile/trend reads.
- These invalidations use captured originating session keys and refetchType:none, preserving local drafts/immediate projections. No pending/failed write is put into Query data. Failed working-score saves retain the draft and use the existing toast to report failure; successful handoff occurs after server confirmation.
- Teacher student schedules use `student-context/active-year/classes/[grade:section]` and `student-context/active-year/teachers/[referenced teacher IDs]`, 30s/5m. The existing GETs derive their year server-side and accept no year filter; no unsupported parameter is invented. These readers are disabled outside an authorized student profile. Admin providers do not use these keys.

### Teacher lifecycle corrections at role verification

- Subject detail, assessment records and weekly holistic subscribe reactively to Query invalidation state. An imperative mutable-cache read during render could remain memoized after confirmed-save refetch, leaving a local projection/loading handoff stuck. Draft and in-flight-write protections remain in place.
- The mounted Teacher student provider receives pathname changes. Navigation to actual profile/grade consumers revalidates the authorized list once when older than30 seconds; fresh navigation reuses it. Revoked students disappear after the backend-scoped revalidation. No new polling or error retry loop is introduced.
- Uncancelled Teacher academic, attendance and advisory mutations retain their originating session-generation unauthorized callback after page unmount. A401 expires that still-current session; an old account's response cannot expire a newer session. Read callbacks retain active/unmount plus AbortSignal guards.403 remains a permission failure.
