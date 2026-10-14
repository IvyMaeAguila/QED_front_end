# Principal Analytics TanStack Query verification

Date: 2026-10-11. Git baseline: `174588a13cccdffa2fafc3bafccbbed214b192de`.
Repository: `C:/Users/Mavys/Downloads/QED_System/QED_front_end`.
Scope: existing Principal Subject Performance and Holistic Development Analytics
routes and directly owned readers. Earlier uncommitted migrations are preserved.
No packages, backend/database, other-account modules, Gradebooks or unrelated
reports were changed. No staging, commit, push or deployment.

## Outcome and dependency analysis

The two linked routes `/principal/reports` and
`/principal/holistic-performance-analytics` now use the existing singleton
QueryClient through Principal-only route composition providers. The roadmap,
invalidation map and Dashboard verification report were reviewed before changes.
Actual routes, compositions, hooks, services, ranking utilities, heatmap and
metric rendering, existing loading tests and backend request contracts were read.

`reports.service.ts` has only two runtime consumers: `useSubjectAnalytics` and
`useHolisticAnalytics`. No Admin, Teacher or Parent reader imports this service.
Previously each hook fetched its options with Promise.all, its results in a
separate effect, and repeated all three requests on explicit retry. Cancellation
was a boolean flag rather than HTTP cancellation. There was no service cache,
cross-navigation cache, request deduplication, offline settlement, or status-aware
401/403 handling. Local term/grade/view selections remain local state.

The only reused data dependency is the existing Principal roster-year Query key
and stateless `getRosterAcademicYear` transport. Profile and roster consumers keep
their implementation and policies; no shared cache was removed. Admin's legacy
teacher-profile/schedule caches and every other-role reader remain unchanged.
The Admin theme dependency in these compositions is type-only.

Within each view, any result/options error originally hides its analytics content
and exposes one LoadingRegion error/Retry. This boundary is preserved. There is
no existing within-page partial-section fallback to invent. The two views have
independent result/filter queries and successful caches; an ordinary failure in
one does not discard the other. Shared term/year failures affect both as expected.

## API and key mapping

Let `S = ['session', generation, role, userId]`,
`A = S + ['principal','analytics']`. All requests include cookies and AbortSignal.

| GET after `/api` | Key | Server parameters | Freshness / inactive GC |
| --- | --- | --- | --- |
| `/academic-year/getAcademicYear` | Existing `S + ['principal','students','roster-year','active']` | None; active year | 30 seconds / five minutes |
| `/reports/term-options` | `A + [yearId,'terms']` | None; active year | Five / ten minutes |
| `/reports/grade-options` | `A + [yearId,'grades']` | None | Five / ten minutes |
| `/reports/view-options` | `A + [yearId,'views']` | None | Five / ten minutes |
| `/reports/subject-ranking` | `A + [yearId,'subjects',termLabel]` | `term` | 30 seconds / five minutes |
| `/reports/holistic` | `A + [yearId,'holistic',termLabel,view]` | `term`, `view` | 30 seconds / five minutes |

The backend selects active school year internally. No year parameter was added.
Grade filtering is local; the actual pages have no subject/domain filter or year
picker. Holistic domains arrive together in the existing response. Term comparison
trends are returned by the backend, not recalculated in this migration.

Initial/stale navigation and stale-context server-filter changes resolve active
year before result dispatch. Explicit Retry resolves year, then refreshes all
three original report requests for that view, including fresh lookup queries.
A changed year enables new keys instead of refreshing old keys. Async continuation
checks mounted/auth state and the session/filter identity. Same-tick StrictMode
cancellation is checked before fetch dispatch. Old-year data cannot become a
new-year placeholder or remain in LoadingRegion's retained presentation snapshot.

The shared defaults remain: no automatic retry, focus/reconnect refetch of
completed queries, polling, or private persistence. Paused work resumes on
reconnect; repeated Retry while offline/paused/pending does not enqueue requests.
Fresh current-filter cached data (including empty arrays) remains readable offline
with the existing alert styling. Uncached offline filters do not relabel another
term/view's placeholder. Connectivity is reconciled on route mount.

Each endpoint independently detects 401 before sibling errors can mask it and
uses the existing generation-guarded expiration mechanism. Aborted/old-session
requests cannot expire newer logins. 403, including a malformed response body,
hides the affected view's cached private data/options without logout. Ordinary
Retry restores loading while context revalidation is pending; permission failures
remain protected during recovery. Auth bridge cancellation/cache cleanup is reused.

Future score/submission/visibility writes affect academic rankings; holistic
rating writes affect holistic rows; subject/grade configuration affects relevant
options/rankings; year/term changes affect context and year-scoped resources.
These dependencies are documented in the invalidation map. No writer/event or
cross-browser synchronization was introduced in this read-only increment.

## Golden calculations and presentation

Synthetic golden fixtures were created and passed against the original readers
before application fetching changes. The final UI fixture uses unique
subject/grade pairs; its corrected grade-filter expectation was additionally
verified against the retained pre-migration production artifact (3/3) before the
new build. Duplicate-row counting is covered in the pure utility assertion.

Unchanged academic outputs: subject averaging with Math.round, dominant trend
ties (up/down/flat insertion order), stable score ties, row-based gradeCount,
descending ranks, ascending priority focus, local grade ordering, zero scores,
empty results, and green/gold/red thresholds. The golden subject means are
85, 85, 70, 0; the displayed mean of those rounded means is 60%.

Unchanged holistic outputs: Cognitive/Emotional/Behavioral/Social ordering, null
cells and null exclusion, raw recorded-cell mean (not a mean of domain means),
one-decimal display, strongest-domain comparison, score counts, rating bands and
rounded/clamped interpretations. The golden overall display is 3.2 / 5, strongest
Cognitive is 4.8 / 5, and seven of twelve ratings are recorded. The 4.49 Social
sample still displays 4.5 but remains in Good, preserving the original boundary.

No ranking utility, data type, chart, heatmap, metric card, interpretation table,
navigation component, theme class or business calculation was modified. The two
composition diffs add only providers, scoped presentation identity, and the
existing LoadingRegion alert when cached data is usable offline.

## Verification

Baseline before fetching changes:
- `npm run build`: TypeScript, production compilation and bundle guards passed.
- Complete configured source acceptance/regression suite: 268/268 (6.7 minutes),
  including 25 existing Analytics tests and three new golden checks.
- Prior production artifact suite: 116/116 (3.4 minutes).
- Final unique-pair golden fixture checked again against that prior artifact: 3/3.

Targeted development runs:
- First run: 86/92. Six new assertions needed correction: existing year-error
  text omits the numeric status, and retry counts must await asynchronous recovery.
  Existing assertions/guards were not weakened. Subsequent targeted suite: 76/76.
- Added stale-context/filter/offline regressions and reran hook plus unchanged
  Analytics loading suites: 82/82 (57 hook tests plus 25 existing UI tests).
- Targeted application ESLint: zero errors/warnings after dependency cleanup.

Final full-suite results (no failed, skipped or flaky tests):

| Check | Baseline | Final |
| --- | --- | --- |
| TypeScript / fresh production build | Passed | Passed (`npm run build`, including `tsc -b`) |
| Complete configured source suite | 268/268 | 344/344 (8.9 minutes) |
| Production-artifact suite | 116/116 | 135/135 (4.4 minutes) |
| Bundle budgets / role isolation | Passed | Passed, unchanged guards |
| Golden checks | 3/3 | 3/3 in both source and fresh-artifact suites |

The final suite contains 57 new Analytics hook checks, 19 route acceptance checks,
and three golden checks, plus the existing configured regressions. The production
suite exercises the final newly built artifact, not the retained baseline build;
artifact timestamps/hashes were recorded and checked against all Analytics source
files. Successful monitored Analytics workflows recorded no unexpected page or
console errors; expected HTTP resource errors occur in intentional failure tests.

All HTTP-dependent tests use intercepted deterministic synthetic responses and
mocked authentication. This is not real-backend verification. No authorized live
account was used; cookie/CORS behavior, real permission enforcement, database
results and backend latency remain unverified. Unsafe live/remote-fixture tests
were excluded, including `tests/live` and `gradebook-two-advisories.spec.ts`.

Coverage includes initial loading/empty results, each independent endpoint 500,
complete failure and recovery, original API-envelope errors, fresh reuse/stale
refresh/GC, term/view and local-grade filters, rapid switching, year rollover on
navigation/Retry/filter changes, offline initial/cached/uncached-filter recovery,
explicit retry counts, cancellation, independent 401 including delayed siblings,
403/malformed bodies, logout/login/account/role isolation, golden outputs,
responsive light/dark rendering and role/bundle/network guards.

Evidence (generated/ignored outputs): `test-results/acceptance-results.json`,
`test-results/fresh-build-results.json`, fresh-build Analytics screenshots and
sanitized request-count attachments. Temporary baseline JSON/hash/bundle records
were retained separately before edits. No credentials or student data were logged.

## Bundle and network impact

Final-build measurements use the unchanged node:zlib level-6 guard:

| Gzip bytes | Baseline | Final | Change |
| --- | ---: | ---: | ---: |
| Public entry | 627 | 628 | +1 |
| Public eager closure | 133380 | 133387 | +7 |
| Admin beyond public | 141032 | 141043 | +11 |
| Principal beyond public | 134470 | 136901 | +2431 (~1.81%) |
| Teacher beyond public | 160839 | 160850 | +11 |
| Parent beyond public | 145820 | 145835 | +15 |

Public/non-Principal raw byte sizes are unchanged; small gzip variations arise
from rewritten hashed asset references. Principal adds 4777 raw bytes. Fixed
entry/public/Admin budgets remain 112153/135349/151512 bytes. Query stays out of
public and other-role eager graphs; heavy charts/Excel/PDF dependencies remain
lazy. No guard threshold or assertion was weakened.

A cold single Analytics view now has four GETs instead of three: the additional
year context adds a context-first round trip. Visiting both views cold costs six
GETs total, as before, because year and term options are shared. Fresh revisits
need zero Analytics GETs; stale result revisits normally need year + result only,
while fresh options are reused. Local grade changes need zero; fresh-context
term/view changes need one result request. Explicit Retry refreshes year + the
view's three readers. Request-count tests enforce deduplication; no polling was
introduced. Real-backend latency and production Web Vitals were not measured.

## Exact files changed in this increment

Application (eight):
- [src/shared/query/queryClient.ts](C:/Users/Mavys/Downloads/QED_System/QED_front_end/src/shared/query/queryClient.ts) (Analytics keys only; previous keys preserved)
- [src/features/profiles/principal/pages/reports/AnalyticsPage.loading-view.tsx](C:/Users/Mavys/Downloads/QED_System/QED_front_end/src/features/profiles/principal/pages/reports/AnalyticsPage.loading-view.tsx)
- [src/features/profiles/principal/pages/reports/HolisticPerformanceAnalyticsPage.loading-view.tsx](C:/Users/Mavys/Downloads/QED_System/QED_front_end/src/features/profiles/principal/pages/reports/HolisticPerformanceAnalyticsPage.loading-view.tsx)
- [src/features/profiles/principal/pages/reports/hooks/useSubjectAnalytics.ts](C:/Users/Mavys/Downloads/QED_System/QED_front_end/src/features/profiles/principal/pages/reports/hooks/useSubjectAnalytics.ts)
- [src/features/profiles/principal/pages/reports/hooks/useHolisticAnalytics.ts](C:/Users/Mavys/Downloads/QED_System/QED_front_end/src/features/profiles/principal/pages/reports/hooks/useHolisticAnalytics.ts)
- [src/features/profiles/principal/pages/reports/hooks/useAnalyticsReads.ts](C:/Users/Mavys/Downloads/QED_System/QED_front_end/src/features/profiles/principal/pages/reports/hooks/useAnalyticsReads.ts) (new)
- [src/features/profiles/principal/pages/reports/hooks/analyticsOfflineError.ts](C:/Users/Mavys/Downloads/QED_System/QED_front_end/src/features/profiles/principal/pages/reports/hooks/analyticsOfflineError.ts) (new)
- [src/features/profiles/principal/pages/reports/services/reports.service.ts](C:/Users/Mavys/Downloads/QED_System/QED_front_end/src/features/profiles/principal/pages/reports/services/reports.service.ts)

Tests/config (eight):
- [playwright.acceptance.config.ts](C:/Users/Mavys/Downloads/QED_System/QED_front_end/playwright.acceptance.config.ts)
- [playwright.acceptance-build.config.ts](C:/Users/Mavys/Downloads/QED_System/QED_front_end/playwright.acceptance-build.config.ts)
- [tests/fixtures/analytics.ts](C:/Users/Mavys/Downloads/QED_System/QED_front_end/tests/fixtures/analytics.ts) (new)
- [tests/analytics-golden.spec.ts](C:/Users/Mavys/Downloads/QED_System/QED_front_end/tests/analytics-golden.spec.ts) (new)
- [tests/analytics-query-harness.tsx](C:/Users/Mavys/Downloads/QED_System/QED_front_end/tests/analytics-query-harness.tsx) (new)
- [tests/analytics-query.html](C:/Users/Mavys/Downloads/QED_System/QED_front_end/tests/analytics-query.html) (new)
- [tests/analytics-query.spec.ts](C:/Users/Mavys/Downloads/QED_System/QED_front_end/tests/analytics-query.spec.ts) (new)
- [tests/analytics-query-acceptance.spec.ts](C:/Users/Mavys/Downloads/QED_System/QED_front_end/tests/analytics-query-acceptance.spec.ts) (new)

Documentation (three):
- [TANSTACK-QUERY-MIGRATION-ROADMAP.md](C:/Users/Mavys/Downloads/QED_System/QED_front_end/TANSTACK-QUERY-MIGRATION-ROADMAP.md)
- [TANSTACK-QUERY-INVALIDATION-MAP.md](C:/Users/Mavys/Downloads/QED_System/QED_front_end/TANSTACK-QUERY-INVALIDATION-MAP.md)
- [QED-ANALYTICS-QUERY-VERIFICATION.md](C:/Users/Mavys/Downloads/QED_System/QED_front_end/QED-ANALYTICS-QUERY-VERIFICATION.md) (new)

Preservation audit: SHA-256 comparison covered all 49 initially modified/untracked
files. Exactly five were intentionally extended: shared Query keys, both curated
test configurations, roadmap and invalidation map. The other 44 remain byte-for-
byte unchanged, including prior Dashboard/profile/roster/overview work, API toggle,
base/live test configurations and unsafe live fixtures. Removing only the new
Analytics additions from QueryClient and both curated test configs reproduces
their exact initial hashes. Calculation/component files and fixed guards remain
unchanged. Tracked test-generated loading screenshots were initially clean and
restored after both suites; screenshots/attachments remain in ignored test outputs.
The index is unchanged and empty. Nineteen scope files are listed above.

No new automated migration blocker remains. Ready for migration acceptance/review,
subject to the existing UI and environment limitations below. This is not approval
or preparation to deploy the current localhost artifact.

## Remaining limits and next checkpoint

- No real-backend credentials were used; the browser coverage is mocked.
- Separate active-year/report GETs cannot guarantee an atomic server rollover.
  The client resolves observed context first but cannot change the backend contract.
- Freshness is checked on reads/navigation/filter changes; an indefinitely open
  unchanged view does not poll or receive new cross-browser mutation events.
- Offline navigation requires already-loaded JavaScript; no asset/service-worker
  caching was added. Empty query-cache recovery with loaded code is tested.
- API config remains the user's manual localhost:7400/Render toggle, byte-for-byte.
  This build is a local production-mode test artifact. Selecting Render and
  rebuilding remains a separate production-preparation step, not performed here.
- Existing xlsx security and unrelated lint follow-ups remain separate tasks.
- Screenshot review confirmed a pre-existing mobile heatmap limitation: at
  375 px, the fixed 140px label column plus intrinsic domain-header widths and
  overflow-hidden container clip the later domain columns. The committed
  `loading-screenshots/principal-holistic-analytics-375-light-loaded.png` shows
  the same clipping as the final mocked route screenshot. The heatmap component
  is byte-for-byte unchanged. Responsive tests cover existing rendering/styles,
  not a claim that all four mobile columns are accessible. Fix this in a separately
  approved UI/accessibility task; no layout change is included in this migration.

Recommended next Principal boundary: analyze the read-only Gradebooks list and
visibility/submission dependencies first; require calculation/visibility golden
fixtures before any separately approved migration. Do not expand automatically
into grade sheets, exports, other accounts, intervention or unrelated reports.

STOP for user approval after final verification. No files were staged or committed.
