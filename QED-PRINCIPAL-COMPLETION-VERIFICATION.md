# Principal role completion and notification security verification

Implementation: 2026-10-12; final verification: 2026-10-13 (Asia/Manila).
Current status: applicable Principal migration completed and verified; stopped
for review. Final source 705/705, fresh-production 340/340, isolated backend
517/517. No failed, flaky or skipped cases in the final complete browser gates.
Prior 646/646 source, 286/286 production and 452/452 backend totals are historical,
not newly executed baselines. No live accounts, remote database or email accessed.

## Audit and implemented scope

PrincipalRoutes has Dashboard; Teachers directory/profile/schedule; Students
overview/class/unassigned-grade roster; academic/holistic analytics; Gradebooks/
Grade Sheets; Calendar; Help. Existing Query migrations and goldens are retained.
No additional student-profile, attendance, intervention or report route exists.
Help and Settings are local presentation. Account profile is AuthProvider-owned
bootstrap and ProfileMenu derives auth state; shared auth/password/profile writes
remain under that authority. No independent profile cache was introduced.

Principal Calendar now uses a lazy Query adapter for four GETs and six mutations.
NotificationProvider uses a lazy Principal driver, without remounting the app when
the driver finishes loading. Other roles retain their existing notification and
Calendar implementations. PrincipalSection no longer mounts unused Admin
Students/Teachers/Classes providers: static consumer tracing found no reachable
Principal consumer. The shared StudentDetail component is not a Principal route.
Admin providers themselves are unchanged.

Two additional confirmed regressions were corrected during final acceptance:
the initial notification facade keyed the ancestor of AppRouter by account,
remounting the router at authentication handoff and truncating the visible
bootstrap minimum. The facade is now stable; only the lazy Query driver is keyed,
and both legacy and Query projections are tagged with their owning identity.
The existing Directory hook also returned cached records after a 403; going
offline could reveal those records through its cached-offline rendering branch.
Its return projection now withholds teachers/year after 401/403. Request keys,
retry policies, original counts and existing 401 handling are unchanged.

## Notification ownership security

Root cause: JWT authentication was present, but list/mark-all trusted path userId
and mark-one updated by notification ID alone. JWT userId is qed_authentication.id;
role-table id is different. Login, /auth/me and profile responses expose the auth
ID; notification producers resolve role-table user_id before inserting
notifications.user_id. No role-profile-ID fallback or database schema change.

The router validates supported role and a positive safe authentication ID from
the verified JWT. User-targeted routes must match it. Controllers use the
server-owned identity; mark-one SQL includes both notification ID and owner.
Request body/query values cannot override ownership. Socket rooms were already
JWT-owned; handshake now also rejects recovery-purpose/malformed identities.

| Request | Before | After |
| --- | --- | --- |
| No authentication | 401 | 401, no SQL |
| Invalid/expired token | 403 | Existing 403 contract, no SQL |
| Legitimate owner, any supported role | 200 | 200, unchanged schema |
| Other user list/mark-all | Could read/update | 403 before SQL |
| Other owner notification mark-one | Could update | 200 idempotent no-op; one owner-scoped UPDATE, no changed row |
| Unknown/malformed identity | Insufficient checks | 403 before SQL |
| Recovery JWT socket handshake | Could authenticate | Denied |

Focused backend: 65/65, actual Express/JWT/controller with isolated DB double;
socket authentication callbacks use an inert transport. Complete isolated backend
suite: 517/517. All four modified backend runtime files pass node --check. These
are not live MySQL, deployed HTTP or real WebSocket transport verification.

## Query and invalidation policies

| Transport | Query/mutation owner | Dependency / invalidation |
| --- | --- | --- |
| GET /api/calendar/activities, /holidays, /all-activities, /all-holidays | Four independent Principal Calendar queries | Authentication readiness only; no year/term prerequisite |
| POST /api/calendar/activities and /holidays | Two bulk-create mutations | Confirmed success invalidates matching current/all readers |
| PUT and DELETE /api/calendar/activities/:id and /holidays/:id | Four edit/delete mutations | Confirmed success invalidates matching current/all readers |
| GET /api/notification/:authUserId | Principal notification query | Auth identity; poll/focus/socket reconnect refresh |
| PATCH /api/notification/:id/read and /user/:authUserId/read-all | Two Principal notification mutations | Confirmed success updates flags and invalidates own list |

Ownership evidence: authentication.controller.js signs user.id into JWT userId
and resolves role profiles by user_id; notification.service.js resolves Parent
pt.user_id, Teacher adviser.user_id and Principal principal_table.user_id before
inserting notifications.user_id. The notification controller uses direct SQL;
there is no separate notification ORM model requiring a schema migration.
The direct intervention-completion insert in petquiz.controller.js likewise
resolves parent_table.user_id; it was inspected and left unchanged.

C = [session,generation,role,String(authUserId),principal,calendar]. Four resources
append activities, holidays, all-activities, all-holidays. No server year/term/
filter exists. Freshness 30 seconds; inactive GC five minutes; retry false; no
polling or focus refresh; reconnect true. Each GET consumes AbortSignal and has
its own generation/lifecycle-guarded 401 callback. 403 hides cached rows.
Offline initial loading settles into standard LoadingRegion errors; fully cached
rows stay visible with its alert. Retry while offline/pending queues nothing.

All six Calendar writes preserve payloads/credentials, retry false, networkMode
always with explicit offline rejection. No optimistic writes or automatic replay.
Confirmed activity success invalidates only its two readers; holiday success only
its two readers. Failed/old-session writes invalidate nothing. Local dates, month
selection and modal drafts stay local. Writes are not aborted after transmission,
to avoid implying an already accepted server write was rolled back.

N = [session,generation,role,String(authUserId),principal,notifications]. GET list
has 30-second freshness/five-minute GC, existing 30-second background refresh,
focus and socket-connect refresh, reconnect recovery, canceled reads and no
automatic error retry. Query owns Principal records; Context is only a projection.
Socket rows merge/deduplicate in Query; successful fetches retain unmatched socket
rows as before. Mark-one/all use non-retried, nonqueued mutations; confirmed
success updates read flags and invalidates N. Failures retain unread state. A 403
cannot be cleared by socket data/mark callbacks to reveal cached records. Existing
session cleanup remains authoritative; old responses cannot populate another
session or expire it. No cross-browser invalidation mechanism was invented.

## Verification and exploratory results

- Focused browser + shared Calendar transports/layouts: 51/51.
- Notification privacy/cancellation and Calendar edit/delete repeats: 12/12, zero retries.
- Notification polling/reconnect repeats: 3/3, zero retries.
- Bootstrap/account-switch/Directory denial checks: 30/30 zero-retry repeats.
- Final bootstrap single-instance and legacy-role/provider checks: 21/21
  zero-retry repeats. Admin's existing layout intentionally has no Bell; its
  legacy provider read/socket/mark behavior is exercised through the source
  harness. Teacher and Parent retain their actual Bell UI checks.
- Calendar/notification/privacy/local-midnight checks: **123/123**, three repeats
  of 41 cases with zero retries, after correcting UTC-based fixture dates.
- TypeScript and fresh production build/budget guards passed.
- Scoped new/adapter/test lint passes. Two legacy Fast Refresh lint errors and one
  legacy effect-dependency warning remain in CalendarPage.tsx/NotificationContext;
  HEAD stdin lint reproduces them. The touched Calendar composition now keeps all
  hooks before its missing-theme guard. No suppression or assertion weakening.
- Complete source acceptance: **704/704**, zero retries, 15.8 minutes,
  source-verified.log/source-verified.json before the date-only fixture update.
- Final complete source acceptance: **705/705**, zero retries, 18.1 minutes,
  source-final-705.log/source-final-705.json after the fixture correction.
- Final complete fresh-production acceptance: **340/340**, zero retries,
  9.9 minutes, production-final-340.log/production-final-340.json. Both final
  browser JSON reports have zero errors, unexpected, flaky and skipped cases.
- Final commands: npx tsc -b --pretty false; npm run build; npx playwright test
  --config playwright.acceptance.config.ts --retries=0; npx playwright test
  --config playwright.acceptance-build.config.ts --retries=0. Scoped ESLint and
  all four backend runtime syntax checks passed. Backend tests ran with
  node --test test/*.test.js; focused security tests covered the two new
  notification test files. Full browser suites include unchanged bundle/role
  guards and grading/analytics goldens.

Coverage in the passing source gate includes: all four Calendar readers failing
independently with 401/403/500; initial/empty/loading states; fresh reuse/stale
navigation; read cancellation; initial and cached offline recovery; create draft
retention and success-only invalidation; edit/delete and failure recovery; mobile
and desktop light/dark layouts; notification polling/focus/reconnect, failed
marks, forbidden cached-data protection, synthetic socket merge and account
switching while a write remains pending. Existing Directory, rosters, profiles,
Dashboard, analytics, gradebook and Grade Sheet assertions/goldens remain intact.
The complete backend run also includes existing manual grading weight/template
regressions, Calendar authorization, Admin analytics authorization, provisioning
and recovery security checks. Browser API responses are mocked throughout;
backend SQL is doubled. This is not real student-data acceptance.

Exploratory failures are retained in the Temp evidence directory:
calendar-focused-1: 12 failed/9 passed (fixture returned error bodies for status
200 and the 401 test waited on a heading after legitimate login redirect).
Initial Retry now also waits for all independently finishing request completions;
the exploratory run did not establish an application retry defect. focused-2 and focused-3 each:
31 passed/1 failed polling case. First clock installation occurred after interval
creation; then reconnect/focus raced response completion/online notification.
Install clock before navigation and synchronize finished requests/online event;
original exact poll/count expectations retained. writes-isolation-1: 1 passed/2
failed because delete uses alertdialog, not dialog; corrected accessible-role
locator. Initial TypeScript checks caught omitted optional bulk-write options and
a transient mutation-object syntax error; corrected before final checks. Initial
lint caught new exports/dependencies/harness ref writes; corrected.
A final route-local middleware edit introduced a transient closing-token syntax
error: backend-final-3 returned 462 passed/1 module-load failure (55 cases could
not load). node --check identified it; corrected before backend-final-4 passed
517/517. No failure was suppressed or retried automatically.

The first complete source run returned 695 passed/1 failed (696 total): the
bootstrap minimum assertion measured 122.1ms instead of >=390ms. A warm-code
reproduction with the old facade also failed at 157.3ms. This was an application
router-remount defect, not an assumed timing flake. The stable facade correction
retains the original minimum-duration assertion and adds a WeakMap-based
loader-instance assertion. Initial Directory privacy exploration returned two
failures: the teacher endpoint reproduced retained private rows; the year case
stopped at an incorrect test expectation (its existing message is "Failed to
fetch academic year."). A repeated run then had 25 passes/5 failures, all the
same incorrect year-message expectation. The exact original message is now
asserted, and all 30 repeated cases passed after the privacy correction.

The first final facade repeat returned 9 passed/3 failed: the new Admin test
expected a Notifications button that AdminLayout does not render. It now
asserts the actual bell-free layout and legacy GET; a separate actual-provider
harness covers Admin writes/socket behavior. Lint also caught unused loader
instance variables: the sampler had omitted assigning the IDs. The corrected
sampler genuinely records IDs, and the final 21 repeats passed. The source run
started before these findings was intentionally interrupted after 227 passed
cases; it is not counted as a successful complete gate. An intermediate
TypeScript check caught an unused identity setter from an incomplete edit; the
setter was restored before the passing final check. All exploratory logs remain
available; no retries, counts, privacy assertions or budgets were relaxed.

The first complete fresh-production run returned **332 passed/7 failed** (339
total, 9.7 minutes). It crossed Manila midnight: new mock records used Node UTC
ISO date October 12 while the UI correctly selected browser-local October 13.
Failures were the four Calendar layout/cache/offline cases, two create/recovery
cases and the Calendar-based notification account-switch case, each stopping at
the missing current-day fixture row. A shared browser-local date fixture now
aligns records and create inputs with Calendar's unchanged selected day. A
controlled Asia/Manila clock regression proves UTC October 12 maps to local
October 13. All 123 repeated cases passed. Application code and assertions did
not change for this fixture correction; complete final gates then passed
with 705 source and 340 production cases. The failed run's log/JSON is retained
as production-verified.log/production-verified.json, not reported as a passing
gate. Failure screenshots from that run are copied into the Temp evidence
directory before later test output cleanup.

## Bundle and network impact

Gzip bytes vs saved prior Admin Users checkpoint: public eager 133425 -> 133995
(+570; cap 135349); Admin eager beyond public 143232 -> 145834 (+2602; cap151512);
Principal 139964 -> 139615 (-349); Teacher 160970 -> 161483 (+513); Parent145951
->146833 (+882). Public and non-Principal eager graphs contain no Query runtime.
New Principal adapters remain lazy. No dependency/version or budget change.
Calendar fresh navigation reuses four cached resources (zero new GETs); stale
re-entry refetches four once. Successful writes refetch two affected readers;
failed writes refetch none. Notification polling remains 30 seconds; overlapping
refreshes coalesce. Unused Principal legacy bootstrap reads are eliminated. No
claim of measured live latency/CPU improvement.

## Exact source/document files changed

Frontend (relative to QED_front_end):

- `src/routes/PrincipalSection.tsx`
- `src/shared/calendar/CalendarPage.tsx`
- `src/shared/calendar/CalendarPage.loading-view.tsx`
- `src/shared/calendar/PrincipalCalendarQueries.tsx`
- `src/shared/calendar/services/calendar.service.ts`
- `src/shared/notification/NotificationContext.tsx`
- `src/shared/notification/Notification.service.ts`
- `src/shared/notification/PrincipalNotificationQueries.tsx`
- `tests/principal-calendar-query-acceptance.spec.ts`
- `tests/principal-notification-query-acceptance.spec.ts`
- `tests/principal-notification-query.spec.ts`
- `tests/principal-notification-query.html`
- `tests/principal-notification-query-harness.tsx`
- `src/features/profiles/principal/pages/teachers/hooks/useTeachersDirectory.ts`
- `tests/query-pilot-blockers.spec.ts`
- `tests/bootstrap-loading.spec.ts`
- `tests/principal-directory-privacy-acceptance.spec.ts`
- `tests/fixtures/browserDate.ts`
- `playwright.acceptance.config.ts`
- `playwright.acceptance-build.config.ts`
- `TANSTACK-QUERY-MIGRATION-ROADMAP.md`
- `TANSTACK-QUERY-INVALIDATION-MAP.md`
- `QED-API-MIGRATION-INVENTORY.md`
- `QED-PRINCIPAL-COMPLETION-VERIFICATION.md`

Backend (relative to thesis_qed):

- `socket.js`
- `src/modules/notification/notification.identity.js`
- `src/modules/notification/notification.router.js`
- `src/modules/notification/notification.controller.js`
- `test/notificationAuthorization.test.js`
- `test/notificationSocketAuthorization.test.js`

Generated browser screenshots/diffs are listed separately in the preservation
audit; they are verification artifacts, not application changes.

The saved initial hash manifest is compared against every tracked and nonignored
untracked file. The current audit finds only the 24 frontend and six backend
files above plus regenerated loading-screenshots artifacts; no unexpected
source changes or deletions. Both HEADs and empty staging areas are unchanged.
API configuration and package/lock files match their initial hashes. Prior
Calendar/Admin Analytics/provisioning security files, previous migrations outside
the explicitly listed Directory projection, and existing Vite test-watch
configuration are preserved. Exact generated paths and hashes/evidence are
recorded under C:/Users/Mavys/AppData/Local/Temp/qed-principal-completion-20261012
(preservation-audit.json, frontend-before.json, backend-before.json,
task-files.json and individual verification logs/JSON).

## Limits and checkpoint

All browser APIs are deterministic mocks; source notification socket events and
backend transport/database are isolated doubles. Authorized real-backend
acceptance, MySQL persistence, deployed cookies/CORS and real socket reconnection
remain unverified. No real accounts or live school records were accessed.
Cold unavailable lazy code cannot load offline without an existing PWA strategy;
offline tests warm code. An ambiguous lost write response is never automatically
replayed. Prior release follow-ups (credentials/JWT rotation and xlsx security)
remain separate. API localhost/Render manual toggle is preserved.
The current active API is http://localhost:7400 and the Render line remains
commented, exactly as at task entry. The optimized production artifact tested
here is therefore a local-API build, with intercepted synthetic responses.
It must not be deployed as-is: select the intended Render URL, rebuild and
perform authorized deployed cookie/CORS/socket acceptance before release.

Final preservation audit passed: no unexpected source changes, deletions, HEAD
changes or staged files in either repository; all runtime hashes match the
verified build provenance. Exact regenerated screenshot/diff paths are listed
in preservation-audit.json. Prior security corrections and unrelated work are
preserved. No dependency, schema, academic calculation or API-toggle changes.

There is no remaining confirmed implementation/regression blocker within this
Principal increment. It is ready for review, not deployment as-is: the active
localhost API and unverified real-backend/cookie/CORS/socket behavior remain
release limitations. Existing lint debt and separately documented credential/
JWT rotation and xlsx follow-ups were not expanded into this task.
Teacher is the next role for review/authorization, beginning with its Dashboard
dependency audit. No Teacher, remaining Admin or Parent migration was started.
No staging/commit/push/deploy. Stop here for user review.
