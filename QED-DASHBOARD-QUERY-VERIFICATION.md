# Principal Dashboard TanStack Query verification

Date: 2026-10-11. Checkout baseline: `174588a13cccdffa2fafc3bafccbbed214b192de`.
Scope: Principal Dashboard readers only. No dependency installation, backend/database
changes, other-account migration, staging, commit, push or deployment.

## Outcome

The dashboard uses the existing singleton QueryClient with a Principal-only
route-scoped provider. Its manual state/effect/promise-ref fetch lifecycle is
removed. Existing components, layout, theme tokens, chart transforms, rankings,
KPI values, static rubric/attention items and navigation are preserved.

Verification: TypeScript and fresh production build passed; full source suite
240/240 passed. Production-artifact suite: 88 passed; zero failed/skipped/flaky.
All HTTP-dependent acceptance tests use deterministic intercepted synthetic
responses. No real-backend authentication, authorization or latency verification
is claimed; no authorized live account was used and no database was changed.

## Pre-implementation dependency analysis

Reviewed the migration roadmap, invalidation map and profile verification report.
The dashboard hook and school-year effect were the only runtime consumers of
principalDashboard.service.ts. Admin academic-year imports are type-only.
The shared Parent TodayDateCard is unchanged. No shared service cache was removed.

Previously the main hook deduplicated a single aggregate Promise through a ref;
it had no cross-navigation cache or AbortSignal. The school-year banner fetched
independently. The aggregate uses Promise.all and intentionally fails as a whole:
one failed section produces the dashboard error UI. A year-header failure can
coexist with successful main content. These ordinary partial/complete failure
boundaries are preserved; no per-section fallback was introduced.

The only existing numeric assembly is Number(total) || 0, spreading the overview
summary and needsIntervention: 0. All backend-derived scores, trends, nulls,
attendance records, rank order and chart payloads retain their original shape.
The service's existing optional performance-trend Bearer header and credentialed
requests remain intact.

## Query keys, lifecycle and policies

Let S = ['session', generation, role, userId] and D = S + ['principal','dashboard'].

| Resource | Query key | Dependencies |
| --- | --- | --- |
| Active term | D + ['active-term'] | Auth ready, PRINCIPAL role, real route |
| Year header | D + ['school-year','active'] | Independent authenticated reader |
| Dashboard snapshot | D + ['snapshot',schoolYearId,termId,termNumber,localDate] | Resolved/revalidated active term; no context/header 403 |

All three queries use 30-second freshness and five-minute inactive garbage
collection. Shared defaults still disable automatic retries, focus refetch and
reconnect refetch. No polling or persistence was added. Paused work resumes on
reconnect, while repeated Retry during pending/paused/offline work is suppressed.

The server endpoints accept no year/term/filter query arguments from this page:
they select active context internally. Snapshot keys include the observed active
year and term IDs, term number and browser calendar date. There is no selected
ranking-term key because the response contains all three terms and the dropdown
is a local filter. User selection survives refreshes within the same year and
resets to the returned current term for a new session/year; navigation remount
starts with the current term as before. Modal visibility remains local.

A stale visit resolves active term before dispatching the nine snapshot reads.
No old-year placeholder is copied into a new context key. Top-level Retry
revalidates term/year first, then refreshes the current snapshot; changed context
automatically enables the new key instead of also refreshing the old snapshot.
Year Retry affects only the banner request. Async retry continuation checks
mounted state, auth readiness and session generation.

Every HTTP response independently checks 401 before Promise.all aggregation or
JSON parsing. AbortSignal and the existing expireSession(expectedGeneration)
protect newer logins. All eleven endpoints have 401 and 403 regression coverage.
403 preserves authentication and hides private cached dashboard data; malformed
term/year 403 responses retain HTTP status. Identity changes reuse the existing
central cancellation/cache-cleanup bridge.

Transport checks cancellation before dispatch after a microtask, preventing
same-tick StrictMode cleanup from starting redundant HTTP calls. All pending
context and aggregate requests consume AbortSignal. Dashboard mount reconciles
onlineManager with navigator.onLine, including connectivity events missed while
route-scoped providers were unmounted. Offline cached content remains visible
with the existing LoadingRegion alert/retry presentation; empty-cache offline
state stops loading and resumes after reconnect.

## API request graph

All paths below are GETs under the unchanged API_CONFIG.baseURL + '/api'.

| Query | Endpoint(s) |
| --- | --- |
| Active term | /principal-dashboard/active-term |
| Independent year header | /academic-year/getAcademicYear |
| Snapshot overview | /student/total-student; /principal-dashboard/overview-summary |
| Snapshot attendance | /principal-dashboard/getTodaysAttendance; /principal-dashboard/getAttendanceByGrade |
| Snapshot academic summaries | /principal-dashboard/performanceByGrade; /principal-dashboard/performanceTrend |
| Snapshot subjects/rankings | /principal-dashboard/topSubjectPerGrade; /principal-dashboard/subjectRankingByTerm |
| Snapshot holistic summary | /principal-dashboard/holisticDomain |

Cold successful dashboard load remains eleven HTTP reads: two context/header
reads and nine snapshot reads. No duplicate active-term request is issued inside
the snapshot. Static rubric/attention data do not issue HTTP requests. Fresh
dashboard navigation through the static Help route and back issues zero additional
dashboard requests. Stale navigation performs one bounded refresh per endpoint.
Changing ranking dropdown/modal terms issues no HTTP requests.

## Invalidation dependencies

No writers, sockets or cross-browser synchronization contracts were changed.
Future enrollment/user/class writes affect overview counts and rankings;
year/term writes affect context/header/snapshot; grades, attendance and holistic
writes affect snapshot summaries. The roadmap/map document these planned edges.
Future context invalidation must resolve context before refreshing snapshots,
rather than concurrently forcing the whole prefix under a stale active context.
Successful writes in other browsers currently rely on later reads/navigation;
this increment does not promise immediate cross-account synchronization.

## Verification results and evidence

| Check | Baseline | Final |
| --- | --- | --- |
| TypeScript (tsc -b) | Passed through baseline build | Passed separately and through build |
| Production build + fixed bundle guard | Passed | Passed, fresh artifact |
| Complete source acceptance/regression suite | 172 passed | 240 passed; zero failed/skipped/flaky |
| Fresh production-artifact browser suite | 76 passed | 88 passed; zero failed/skipped/flaky |
| New dashboard source cases | None | 56 hook cases + 12 actual-route UI cases, all passed |
| Targeted hook/transport/query-key ESLint | Not a baseline gate | Passed |

Commands executed:

- npx tsc -b
- npm run build
- npx playwright test --config playwright.acceptance.config.ts
- npx playwright test --config playwright.acceptance-build.config.ts
- node scripts/check-bundle-budget.mjs
- Targeted ESLint for dashboard hook/offline error/service and shared query keys.

Targeted lint also inspected the page/view once: the hook ref access warnings
were corrected. PrincipalDashboardHome.tsx retains its pre-existing export-star
react-refresh/only-export-components lint finding, confirmed in HEAD. Full-repo
lint was not used as a passing gate and no unrelated lint cleanup was performed.

New deterministic coverage includes initial/empty/loading states; header-only,
individual and complete failures; explicit retry and retry-loading behavior;
fresh/stale reuse; duplicate observers and StrictMode dispatch; term/year and
calendar-day boundaries; rapid local term selection; inactive GC; offline initial,
cached, stale and reconnect behavior; missed connectivity events while unmounted;
every endpoint's 401/403; late 401 after sibling 500; malformed context 403;
logout/login/account/role/preview isolation; cancellation of both context requests
and all nine aggregate requests; exact aggregate/rubric/ranking/null correctness;
mobile/desktop light/dark UI, modal and navigation; console errors and bounded
request counts. Existing profile/schedule/advisory, roster, directory, bootstrap,
loading and role-bundle guards passed in the complete suite.

The actual-route cases exercise the fresh production build as well as source.
Viewport sizes are 375 and 1280 pixels. Loading, loaded, cached-offline and error
screenshots are attached to each responsive dashboard workflow. Screenshot
inspection covered mobile dark offline and desktop light rendering; DOM checks
cover four chart SVGs, golden KPIs, holistic mean 3.6, ranking limits/full modal,
theme classes and no horizontal overflow. No pixel-baseline comparison or claim
of a real-backend business-calculation test is made.

Evidence (generated, ignored test outputs):
- test-results/acceptance-results.json
- test-results/fresh-build-results.json
- test-results/fresh-build/dashboard-query-acceptance-*/ screenshots/attachments
- Temporary baseline JSON and SHA-256 preservation records were captured before edits.

## Bundle and performance impact

Measured with the unchanged node:zlib level-6 guard:

| Gzip bytes | Baseline | Final | Change |
| --- | ---: | ---: | ---: |
| Public entry eager closure | 133383 | 133380 | -3 |
| Admin eager download beyond public | 141053 | 141032 | -21 |
| Principal eager download beyond public | 133702 | 134470 | +768 (~0.57%) |
| Teacher eager download beyond public | 160856 | 160839 | -17 |
| Parent eager download beyond public | 145832 | 145820 | -12 |

Entry gzip is 627 bytes. Fixed budgets remain 112153 entry, 135349 public
closure and 151512 Admin download bytes. Public and all non-Principal eager
graphs remain free of TanStack Query. Heavy charts/Excel/PDF libraries remain
lazy; existing runtime role/network guards are unchanged and passed.

The same eleven cold HTTP reads now include a context-first waterfall: snapshot
reads wait for active term. This trades one possible context round-trip on cold
load for correct year/term key selection. Real-backend latency impact is not
measured. Fresh navigation saves the former repeated reads. No polling, request
loops or unexpected page/console errors were observed in the successful mocked
dashboard workflows (expected HTTP resource errors occur in failure scenarios).

## Files changed in this increment

Application (six):
- [Dashboard hook](C:/Users/Mavys/Downloads/QED_System/QED_front_end/src/features/profiles/principal/pages/dashboard/hooks/usePrincipalDashboardData.ts)
- [Offline error](C:/Users/Mavys/Downloads/QED_System/QED_front_end/src/features/profiles/principal/pages/dashboard/hooks/dashboardOfflineError.ts) (new)
- [Dashboard transport](C:/Users/Mavys/Downloads/QED_System/QED_front_end/src/features/profiles/principal/pages/dashboard/services/principalDashboard.service.ts)
- [Dashboard page](C:/Users/Mavys/Downloads/QED_System/QED_front_end/src/features/profiles/principal/pages/dashboard/PrincipalDashboardHome.tsx)
- [Dashboard composition](C:/Users/Mavys/Downloads/QED_System/QED_front_end/src/features/profiles/principal/pages/dashboard/PrincipalDashboardHome.loading-view.tsx)
- [Central query keys](C:/Users/Mavys/Downloads/QED_System/QED_front_end/src/shared/query/queryClient.ts)

Tests/config (seven):
- [Dashboard fixture](C:/Users/Mavys/Downloads/QED_System/QED_front_end/tests/fixtures/dashboard.ts) (new)
- [Hook harness](C:/Users/Mavys/Downloads/QED_System/QED_front_end/tests/dashboard-query-harness.tsx) (new)
- [Harness entry](C:/Users/Mavys/Downloads/QED_System/QED_front_end/tests/dashboard-query.html) (new)
- [Hook regression suite](C:/Users/Mavys/Downloads/QED_System/QED_front_end/tests/dashboard-query.spec.ts) (new)
- [Route acceptance suite](C:/Users/Mavys/Downloads/QED_System/QED_front_end/tests/dashboard-query-acceptance.spec.ts) (new)
- [Source acceptance config](C:/Users/Mavys/Downloads/QED_System/QED_front_end/playwright.acceptance.config.ts)
- [Production acceptance config](C:/Users/Mavys/Downloads/QED_System/QED_front_end/playwright.acceptance-build.config.ts)

Documentation (three):
- [Roadmap](C:/Users/Mavys/Downloads/QED_System/QED_front_end/TANSTACK-QUERY-MIGRATION-ROADMAP.md)
- [Invalidation map](C:/Users/Mavys/Downloads/QED_System/QED_front_end/TANSTACK-QUERY-INVALIDATION-MAP.md)
- [This verification report](C:/Users/Mavys/Downloads/QED_System/QED_front_end/QED-DASHBOARD-QUERY-VERIFICATION.md) (new)

SHA-256 comparison of the 38 pre-existing modified/untracked files found no
unexpected changes. Five existing files were intentionally extended (shared
query keys, two acceptance configs, roadmap and invalidation map); other prior
migrations and unrelated work remain byte-for-byte unchanged. Test-generated
tracked loading screenshots were initially clean and restored after verification.
No application component/chart/calculation file outside the dashboard boundary
was modified. No files were staged.

## Remaining limits and next approval

- No authorized real-backend session was tested. Live cookie/CORS permissions,
  actual data and backend latency remain unverified by these mocked suites.
- Cold navigation to JavaScript that has never loaded cannot work offline;
  asset/service-worker caching is outside this increment. Empty-query-cache
  recovery with already-loaded application code is verified.
- Backend active-year/term/date GETs are separate and non-atomic. A server rollover
  during those requests can still mix contexts. Browser local date is a cache
  boundary and does not change the server's CURDATE/timezone semantics.
- No midnight timer, background polling or cross-browser invalidation was added.
  Time-based freshness is checked on subsequent reads; an indefinitely open
  page retains existing non-polling behavior.
- The unchanged manual API toggle is currently localhost:7400. This is a local
  production-mode test artifact. Select the existing Render URL and rebuild
  during separately approved production preparation; no deployment readiness
  claim is made for the current localhost artifact.
- Existing xlsx security follow-up and unrelated lint findings are not addressed.

No automated migration blocker remains in the executed suites. The
increment is ready for review/acceptance approval, not an instruction to deploy.
Recommended next boundary: inspect the read-only Principal AnalyticsPage reader
and its year/term/filter dependencies, golden calculations and shared consumers
before migrating it. Do not include gradebooks or reports automatically.

STOP: no additional module work is authorized by this report.
