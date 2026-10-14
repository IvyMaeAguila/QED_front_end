# Admin Dashboard read-only TanStack Query verification

Date: 2026-10-12. Scope: the four existing Dashboard GET readers only.
Status: implementation complete; source 581/581 and fresh production 251/251
passed. Ready for review. Live-backend and release limitations remain below.

## Boundary and preservation

Reviewed the roadmap, invalidation map, API inventory, historical blocked
Dashboard report, Admin analytics authorization report and migration-blocker
report. The approved security corrections were not changed. No backend file,
Principal implementation, grading calculation, Calendar implementation, layout
provider, notification reader, writer, dependency version or API toggle changed.

The Dashboard's only service consumers were its three presentation components.
Counts previously used a manual combined Promise.all; frequency used an effect
and 30-second interval; audit used an effect driven by filters/page/refresh.
There was no shared service cache to delete. The combined count wrapper remains
available for compatibility, but Dashboard Query uses its two independent reads.

The route composition and JSX styling remain intact. A lightweight React data
context supplies the existing cards/chart/table. Local period/applied filters
remain React state; the audit search draft remains local component state.
The existing four Admin providers are observed for startup readiness without
changing their requests or behavior. Dashboard Query is loaded after they settle
on success OR failure; later provider refreshes do not reset drafts or the page.
This preserves the unchanged Query-free Admin shell/preview bundle contract.
It also means an indefinitely pending existing provider delays initial Dashboard
reads: no new timeout policy was added to unrelated providers.

## Keys, transports and cache policy

Prefix A = ['session', generation, role, String(userId), 'admin', 'dashboard'].

| GET endpoint | Key suffix | Policy |
| --- | --- | --- |
| /api/user/totalUser | ['users'] | 30-second freshness; five-minute inactive GC |
| /api/student/totalStudents | ['students'] | Same; independent from users request |
| /api/analytics/login-frequency?period=... | ['frequency', selectedPeriod] | Same; existing 30-second refresh including background |
| /api/audit-logs | ['audit', page, search, role, action, from, to, 20] | Same; all existing server filters and pagination |

No academic-year or grading-term request/key parameter was invented. All four
queries use the singleton client, cookie credentials and AbortSignal. They are
disabled during auth initialization, preview or any non-Admin role. No automatic
error retry, focus refresh or new polling. Explicit retries coalesce while a
request is pending. Reconnect resumes paused reads and revalidates stale reads.

Each endpoint detects 401 before parsing its error body and invokes the existing
expiration mechanism with captured session generation, unless its signal was
cancelled. The auth bridge cancels and clears cached data on identity changes.
403 hides prior cached data and resets the affected LoadingRegion snapshot
without logging out. One failing count endpoint cannot mask the other's 401.

Offline requests settle to the existing error/Retry presentation; cached rows,
counts and chart remain visible with a connection alert. Retry while offline does
not multiply requests. Returning online resumes once; unsuccessful responses
remain independently recoverable. No optimistic data or persistent query cache.

This increment has no mutations. Future successful user/enrollment/audited writes
must invalidate the appropriate current-session count/audit prefixes when their
owners migrate. Until then, navigation may reuse counts/audit for 30 seconds;
the existing explicit Refresh/Retry controls and frequency poll remain available.
Invalidation does not synchronize other browsers; no socket behavior was removed.

## Exact changed files in this increment

Paths relative to QED_front_end (24 files; earlier uncommitted migrations excluded):

```text
src/features/profiles/admin/pages/dashboard/AdminDashboardHome.tsx
src/features/profiles/admin/pages/dashboard/AdminDashboardDataContext.ts
src/features/profiles/admin/pages/dashboard/AdminDashboardQueries.tsx
src/features/profiles/admin/pages/dashboard/hooks/useAdminDashboardQueries.ts
src/features/profiles/admin/pages/dashboard/components/StatCards.tsx
src/features/profiles/admin/pages/dashboard/components/LoginFrequency.tsx
src/features/profiles/admin/pages/dashboard/components/AuditLogs.tsx
src/features/profiles/admin/pages/dashboard/services/totalCounts.service.ts
src/features/profiles/admin/pages/dashboard/services/loginFrequency.service.ts
src/features/profiles/admin/pages/dashboard/services/auditLogs.service.ts
vite.config.ts
playwright.acceptance.config.ts
playwright.acceptance-build.config.ts
tests/admin-dashboard-query.spec.ts
tests/admin-dashboard-query-harness.tsx
tests/admin-dashboard-query.html
tests/admin-dashboard-acceptance.spec.ts
tests/admin-dashboard-golden.spec.ts
tests/fixtures/adminDashboard.ts
tests/dashboard-query.spec.ts
TANSTACK-QUERY-MIGRATION-ROADMAP.md
TANSTACK-QUERY-INVALIDATION-MAP.md
QED-API-MIGRATION-INVENTORY.md
QED-ADMIN-DASHBOARD-QUERY-MIGRATION-VERIFICATION.md
```

## Executed baseline and network evidence

The supplied verified whole-checkout baseline is source 530/530, production
231/231 and isolated backend 236/236. This increment executed TypeScript and
bundle baseline checks, four existing Admin-home loading cases, and four new
real-page numeric/layout goldens against the implementation BEFORE migration.
All passed. A first command's incorrect grep selected zero tests; the corrected
selection executed and passed all four existing Admin-home cases.

Baseline source StrictMode ledger: users and students each completed twice;
frequency and audit each had one cancelled probe and one completion. Migrated
source real-page goldens complete once per endpoint, with at most one identified
StrictMode cancellation probe per endpoint. The controlled enabled-once hook
test asserts exactly four initial GETs, including concurrent observers/remounts.

Fresh-production assertions require exactly one initial GET per endpoint, zero
additional GETs for a fresh return, and one successful GET per stale return.
The polling test requires no read before its 30-second boundary, one frequency
read afterward, no count/audit polling, and a single in-flight explicit refresh
despite repeated Retry clicks. Filter/period switches cancel obsolete requests;
search drafts do not request until applied. Pagination/filter payloads are exact.

## Regression coverage and exploratory failures

Added 31 source hook/lifecycle cases, 16 actual-page workflows and four goldens
(375/1280 pixels, light/dark). APIs and authentication are deterministic mocks;
the browser, components, auth lifecycle and Query runtime are real. Four goldens
preserve card values 120/240/12/100, chart counts 7/14, Mon/Sun ordering, summary
Sun/3/+50%, bar heights 28%/56%, and the audit row/footer. Screenshots include the
chart/cards and scrolled audit controls. No application calculations changed.

Coverage includes readiness/preview, initial/empty/null/failure states,
independent failures, retries, stale/fresh reuse, observer deduplication, polling,
GC, all audit filters/page, period cancellation, offline initial/cached recovery,
401/403 per endpoint, late count 401 after peer 500, logout/login, all role changes,
account switches with pending 200/401, and late response isolation.

Exploratory failures were retained, not hidden:

- First focused run: 27 passed, four failed. Raw interception counts confused
  StrictMode's cancelled probes with completed reads, and old-session cancellation
  was asserted as an aggregate rather than by Request identity. Ledger assertions
  now retain exact successful counts and bound/identify cancelled probes.
- Intermediate focused run: 45/45 passed. Expanded run: 48 passed, two timer
  tests failed. A five-repeat timer run failed all ten cases; the next setup
  revision passed four and failed two. A separate timer diagnostic failed once.
- GC had mixed native/fake timers because the clock was installed after Query
  initialization; the test also counted only four populated resources despite
  four disabled pre-auth entries. It now installs the clock before navigation,
  requires exactly four populated resources and zero observers, then asserts the
  ENTIRE cache is empty after five minutes. No GC assertion was relaxed.
- Polling diagnostics showed the final interval deadline was later than the
  captured deadline: React post-commit effects can re-arm it after the loading DOM
  settles. Freeze virtual time before refetch, await actual request completion
  and flush the zero-delay notification tick before advancing across the real
  interval deadline. Both timer tests then passed five repeats (10/10).
- Initial production build role guard: six passed, one failed. A later focused
  production run passed 22, failed two. Static chunk coalescing put shared Query
  runtime and the lightweight auth hook in Principal chunks. Vite now keeps them
  separate; no guard assertion or budget changed. Full suites were interrupted
  when this evidence required a different build, rather than reported as passes.
- An additional production navigation run found one cancelled extra request.
  The shared readiness helper could observe the shell before the outgoing
  Dashboard disappeared. Awaiting that actual unmount before advancing stale time
  preserves the exact production count (one initial, one stale request). The
  corrected navigation case passed five production repeats (5/5).
- The full source run later exposed the unchanged Principal calendar-day test
  (snapshot request count 1 instead of 2). Ten exact replays failed. Its clock
  was installed AFTER fixture navigation, so the first hook render memoized the
  actual date (now October 12), despite subsequent virtual time beginning on
  October 11. A temporary control copy moved only clock installation before the
  fixture; all ten control runs passed with unchanged assertions. The repository
  test now makes that same ordering correction. Principal application code and
  all request-count/date assertions remain unchanged. The source run was stopped
  after 446 executed cases (one failure); the final complete rerun passed below.
  The first temporary control command had a module-resolution error before test
  execution; its corrected command executed all ten controls successfully.
- Additional scoped production edge coverage reproduced an application defect:
  navigate to Classes, go offline while the Dashboard Query provider is unmounted,
  return to cached Dashboard data. The offline alert was missing. The hook now
  reconciles onlineManager with navigator.onLine in a layout effect before Query
  observers subscribe. Its new regression passed five production repeats after
  a fresh rebuild; the complete focused source suite passed 51/51. No cache,
  retry, UI or shared-provider policy changed. Earlier source runs were interrupted
  when this final scoped correction required a new build. Both complete suites
  passed against that build.

## Final gates

Final source: 581/581 passed (11.4 minutes; zero skipped, failed or flaky cases;
retries zero). Fresh production:
251/251 passed (6.3 minutes; zero skipped, failed or flaky cases; retries zero).
The previous artifact passed 250/250 production before the additional offline-return
correction. Final production rendering goldens also passed 4/4 again; captured
mobile/desktop light/dark cards, chart and audit views were visually inspected.
Focused final source: 51/51 passed. Existing Admin
loading/layout tests: 27/27 passed. Corrected Principal day test: 10/10 passed
under the original source-run configuration, in addition to the ten controls.
Focused coverage is also included in those complete runs.
TypeScript and fresh build: passed. Isolated backend suite: 236/236 passed again
with inert database/notification/storage doubles; no real database or account used.
Scoped ESLint, including the corrected existing test: passed. Whole-checkout
ESLint: 203 errors and 49 warnings outside this increment; hash/status inspection
confirmed those files were preserved from the starting checkout.
This task does not claim whole-checkout lint is clean.

Unchanged bundle/role-isolation guards passed in both complete suites. The source
total increased from 530 to 581; production increased from 231 to 251. The complete
source/production runs include all prior Principal migrations, Calendar transport,
roster synchronization, grading visibility and gradebook golden coverage.
Existing Admin loading/layout coverage passed separately (27/27).

Preservation audit: of 96 pre-existing modified/untracked frontend files, 90 are
byte-for-byte unchanged. Six were extended within this task (the three inventory
documents, two acceptance configs and the existing clock-setup test). No unexpected
source file changed. All 27 pre-existing backend changes retain their original
hashes and status. HEAD and the empty index are unchanged in both repositories.
Generated tracked screenshots were restored after testing; new verification
screenshots and logs remain in ignored evidence storage.

Evidence logs, JSON, initial hashes, final preservation audit, exploratory failures
and final production screenshots are retained in ignored
test-results/admin-dashboard-query-verification/.

## Bundle and performance

| Gzip metric (bytes) | Before | After | Fixed cap |
| --- | ---: | ---: | ---: |
| Public eager closure | 133384 | 133455 | 135349 |
| Admin eager download beyond public | 141045 | 141633 | 151512 |

The Query-enabled boundary's closure beyond public/Admin eager chunks is 14934
gzip bytes (Dashboard reader 3229, shared Query runtime 11458, auth hook 247).
Including the route wrapper (928), the complete active Dashboard lazy closure is
15862 bytes across four chunks. The auth hook is already used by that wrapper;
after the wrapper loads, the Query reader/runtime add 14687 bytes. This is an
absolute post-migration lazy-closure measurement, not a measured net difference
from the previous lazy wrapper (only its eager baseline was archived).
Public/Admin eager closures contain no TanStack Query. Active Admin must load
only Admin role views; the new production assertion complements the unchanged
startup, public and role-isolation guards. Chart transformations and labels are
unchanged. These are measured bundle/request costs, not a real-user CPU/latency
benchmark; no real-backend performance claim is made.

## Limitations and recommendation

All browser backend/auth responses are mocked. Authorized real-backend Admin
cookie/CORS/session behavior and live data remain unverified; no credentials or
student records were accessed. Backend regression uses actual Express/JWT and
controllers with database doubles. The manual localhost/Render API toggle remains
byte-for-byte unchanged; this build uses the existing development selection and
is not a verified Render-targeted release artifact.
The previously documented xlsx security finding remains a separate follow-up;
no dependency upgrade or new live security investigation was performed here.

No staging, commit, push or deployment. No additional module was migrated.
No unresolved functional regression was found in the final automated gates.
Whole-checkout lint remains a pre-existing failing gate. Approve this increment
for review rather than treating the localhost-targeted artifact as deploy-ready.
Recommended next independent increment, only after approval: Admin user readers
and their owning successful mutation invalidation, with draft/conflict tests.
Do not expand automatically.
