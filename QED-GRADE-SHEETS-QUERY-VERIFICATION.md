# Principal Grade Sheets — TanStack Query verification

Date: 2026-10-11. Scope: existing read-only Principal Grade Sheet and its owned
period/year readers only. Repository: C:/Users/Mavys/Downloads/QED_System/QED_front_end.
Complete source and fresh-production suites, repeated checks and preservation
audit passed. Ready for implementation review; real-backend acceptance and
production endpoint selection/rebuild remain separate release preparation.

## Dependency analysis and preserved boundaries

Reviewed the roadmap, invalidation map, Gradebooks verification and completed
regression stabilization checkpoint before implementation. Complete baseline
suites ran against unchanged application code. Inspected routes, compositions,
all reader consumers, transport errors, cancellation, LoadingRegion snapshots,
student mappings, grading utilities, period/default selection and backend reader
semantics (inspection only; no backend edits or database requests).

The only runtime consumers of fetchGradingPeriods and fetchPrincipalGradebook
from the Principal gradebooks service were this page's effect and hook. The
legacy fetchSchoolYear wrapper was owned by that hook and delegated to Admin's
uncached year transport without forwarding cancellation. The new hook shares
the existing Principal roster-year query/transport; the retained compatibility
wrapper delegates to that stateless cancellable transport. No shared service
cache was removed: sheet/period readers had none. Manual effect/state ownership
was replaced by Query rather than retained as a second cache.

Teacher uses different /api/teacherGrading and /api/advisoryGrading services for
scores, submissions, adviser visibility/history and writing. Parent uses its
separate /api/termPerformance readers/caches. Admin's academic-year service has
other consumers and remains unchanged. Domain dependencies are shared at the
backend, not via this Principal sheet cache. No grade writer or Principal export
control exists in this route; other writer/export boundaries remain untouched.

The backend selects active year internally for both periods and sheet. Period
availability depends on grade and optional section; the default is the latest
submitted period for that target, with the server's active/first-period fallback.
The frontend continues trusting defaultGradingPeriodId. Only an absent URL period
is replaced with that default, preserving grade/section and replace navigation.
An explicit period is never silently changed, including after year rollover.
Selecting an unsubmitted period keeps the existing modal and current URL.

Successful gradeLevel:null remains Not Found and is cacheable null data. HTTP
404/400 remain errors, distinct from successful null. No invented historical-year
argument or client availability/submission rule was added.

## Query keys, dependency graph and policies

S = ['session', generation, role, userId], G = S + ['principal','gradebooks'].

| GET after /api | Key | Policy |
| --- | --- | --- |
| /academic-year/getAcademicYear | Existing S + ['principal','students','roster-year','active'] | 30-second freshness / five-minute inactive GC |
| /gradesheets/grading-period?gradeLevelId=…&sectionId=… | G + ['periods',yearId,String(gradeId),sectionIdOrNull] | Same |
| /gradesheets/?gradeLevelId=…&gradingPeriodId=…&sectionId=… | G + ['sheet',yearId,String(gradeId),sectionIdOrNull,String(periodId)] | Same |

Optional section is omitted from HTTP arguments and normalized to null in keys.
Year is a cache partition, not an extra server parameter. Local search, gender,
ranking, unavailable-modal state and URL selection stay outside Query.

Auth readiness + Principal role + no route preview -> year -> target periods ->
explicit/default URL period -> sheet. Stale navigation and term changes resolve
stale year/availability context first. Fresh navigation and revisiting a fresh
term issue no redundant requests. Retry revalidates year, then periods, then
sheet; changed year enables new keys instead of refreshing obsolete-year keys.
Lifecycle/request-scope checks stop obsolete Retry continuations. Repeated Retry
while offline, paused or fetching is ignored; a synchronous per-scope lock also
prevents duplicate Retry chains. Automatic retries, polling, focus refresh,
completed-query reconnect refetch and persistence remain disabled. Paused work
resumes on reconnect, with online state reconciled at mount.

Both sheet endpoints consume AbortSignal and check cancellation before dispatch
and after headers. Each detects 401 before parsing its error body, independently
calling the existing generation-scoped expiry. Shared year failures likewise
guard expiry. 403, including malformed bodies, hides private rows/options/header
without logout. New sessions cannot borrow another session's placeholders.

The original hook fields remain available. Added context/period state replaces
manual period setters. Year errors use the existing shared transport's generic
failure text; period/sheet errors retain server messages and original fallbacks.
Cached current-term data, empty arrays and null sheets
remain usable offline with the existing LoadingRegion connection alert and Retry.
Another term's placeholder is never treated as current offline cache. Online
slow-term transitions retain prior rows only within the same session/year/grade/
section. That scope keys the presentation subtree so retained LoadingRegion
snapshots cannot leak across identities, years or targets. Existing styles and
table/header/summary/modal components are unchanged.

## Academic and visibility evidence

Reused the existing Gradebooks goldens and synthetic fixtures BEFORE migration:
3/3 source and 3/3 baseline production. The baseline also passed all 20 existing
Grade Sheet loading/presentation checks. The same goldens are included in final
source and artifact suites; four new viewport/theme workflows assert the exact
displayed row:

Fixture, Synthetic A. | 89.94 | Pending | No grades yet | — | 89.9

This covers termGrade precedence over the legacy average, hidden pending 100,
missing own-advisory grades, submitted null, ordered columns and fallback average.
Existing numerical goldens preserve zero, missing-subject exclusion, rounding
and color boundaries. Byte comparison confirms toMiddleInitial/toStudent are
unchanged. Grade-sheet utilities, StudentGroupTable, weights, transmutation,
aggregation, assessment/template/writer logic and backend code were not edited.

The isolated gradebookWorkflow, gradeTemplateAdaptive and templateStorage suites
passed 77/77 before and after. They exercise grading weights/categories,
incomplete publication, transmutation, advisory isolation, visibility and template
preservation using database/notification doubles and isolated local fixtures.
They do not verify a real account/database or cross-browser synchronization.

## Verification results and exploratory failures

| Gate | Baseline | Final |
| --- | --- | --- |
| Complete source acceptance/regression | 450/450 passed | 523/523 passed (12.1 minutes) |
| Complete production-artifact acceptance | 208/208 passed | 227/227 passed (6.1 minutes, fresh build) |
| Scoped source hook + actual routes + goldens + existing sheet UI | Existing checks passed in baseline | 96/96 passed |
| Isolated grading/template/workflow/storage | 77/77 passed | 77/77 passed |
| TypeScript | Passed | Passed |
| Production build + fixed bundle/role guards | Passed | Passed |

Seven production responsive/cache/offline/rollover workflows were repeated three
times against the same fresh artifact: 21/21 passed (53.6 seconds).
Ten source cancellation/context/rollover/account-switch/retained-row cases were
repeated three times: 30/30 passed (1.1 minutes). Both complete suites have zero
skips, unexpected failures or flaky results, with Playwright retries set to zero.

Final suites use zero Playwright retries. Added coverage: 54 hook/source cases
and 19 actual-route cases, also run on fresh dist. Cases cover independent
500/401/403, malformed 403 after cached success, all-failure recovery, HTTP error
versus null, default/explicit/unavailable periods, missing target, grade/section
navigation, rapid terms/cancellation, year rollover/remount/Retry, fresh/stale/GC,
offline initial/cached/empty/null/uncached-term/reconnect, bounded Retry, shared
year refresh counts, logout/login, pending old 200/401 responses at every
endpoint, populated cache with pending 401, account and role isolation.

Exploratory failures retained, not concealed by reruns:
- First old-UI run: 22/23. Slow-return test expected a new request for a now-fresh
  previously visited term; it remained settled. The test now advances virtual
  time 31 seconds before that revisit. Every original dimming, retained-row,
  placeholder, native-width and no-spinner assertion remains. Fresh reuse has
  separate exact-count coverage. Corrected slow test passed in the 96/96 run.
- First expanded run: 77/89. Twelve pending-account cases failed because the
  shared loaded helper demanded the original Synthetic name after the fixture
  deliberately renamed it New identity. Received data already showed New
  identity. Helper now checks the invariant Fixture surname; every case still
  explicitly requires the new marker, correct account, cleared data while pending
  and current-session cache keys. All twelve passed in the 96/96 run.
- Focused new-adapter diagnostic: 0/1. A completed period-refresh flag forced an
  extra period GET when a later shared-year refresh resolved: year/period/sheet
  counts 3/3/2 instead of 3/2/2. Refresh effects now gate on unresolved timestamp
  checks, rather than the historical refresh flag. The exact-count regression
  passed in the 96/96 run. No count assertion was loosened.

Focused hook and view lint passed. The page wrapper lint still reports the
pre-existing react-refresh/only-export-components export-star rule; the same
export-star is present in HEAD. No unrelated lint rewrite was made.
Directory/Dashboard stabilized assertions, fixtures and hooks were not edited.

All HTTP-dependent browser tests intercept synthetic API/auth responses.
Source harnesses run the real hook, QueryClient and AuthProvider in StrictMode;
artifact cases exercise newly built dist. No real-backend credentials, cookies,
CORS or database grade verification is claimed. Unsafe live/remote-fixture suites
were excluded. Screenshot evidence covers mobile/desktop light/dark loading,
loaded, offline and error states. Reviewed mobile light and desktop dark images:
existing maroon/gold layout and horizontally scrolling grade table remain intact.
The new main workflows assert no page errors, unexpected console errors or page
overflow, and exact request counts; deliberate HTTP failures remain expected.
Additional final-artifact image review confirmed mobile dark and desktop light
cached-offline presentation alongside the earlier mobile light/desktop dark review.

## Bundle and network impact

Unchanged node:zlib level-6 budgets and role-isolation guards:

| Gzip bytes | Baseline | Final | Delta |
| --- | ---: | ---: | ---: |
| Public entry | 628 | 628 | 0 |
| Public eager closure | 133382 | 133384 | +2 |
| Admin beyond public | 141055 | 141051 | -4 |
| Principal beyond public | 138126 | 138521 | +395 (about 0.3%) |
| Teacher beyond public | 160860 | 160854 | -6 |
| Parent beyond public | 145837 | 145839 | +2 |

Non-Principal raw sizes are unchanged; tiny gzip deltas come from hashed-reference
compression. Principal raw increase: 1875 bytes. Fixed public-entry/closure/Admin
caps remain 112153/135349/151512. Query remains absent from public and all
non-Principal eager graphs; heavy chart/Excel/PDF libraries remain lazy.

Cold sheet uses three existing GETs, now sequenced for prerequisite correctness.
A fresh shared year can reduce that to two. Fresh return to the same grade/
section/term uses zero GETs; a new term within fresh context uses one sheet GET.
Stale context/navigation and explicit Retry normally use one context-first triple.
Local search/rank/gender and unavailable modal issue no requests. Cancelling an
uncached term and returning to a fresh term uses no replacement GET for the
cached term. No polling/loops or extra successful requests appeared in passing
exact-count workflows. The diagnostic extra period GET was fixed as above.
Sequencing may increase cold-load latency versus the old parallel reads; no real
backend latency or production Web Vitals measurement is claimed.

## Cache invalidation and remaining limitations

Updated invalidation map documents future success-only invalidation of affected
sheet year/grade/section/period, period availability/default and overview after
score corrections/submissions, adviser release/publication/revocation, membership
or subject/adviser assignment changes. Year/term changes must resolve year first.
No writer, socket contract or cross-role/browser synchronization was introduced.
An unchanged open page does not poll; freshness is checked on reads/navigation.
Offline cached data can be stale and does not replace backend authorization.
Separate year/period/sheet GETs cannot make a server rollover atomic.

Real-account authorization, actual grades, CORS/cookies and cross-browser writer
updates remain unverified. Offline recovery assumes application JavaScript has
loaded; no service-worker asset cache was added. User's localhost:7400/Render
manual API toggle is unchanged. The test artifact uses localhost; selecting
Render and rebuilding remains separate production preparation. Existing xlsx
security follow-up and unrelated lint issues remain out of scope.

## Exact files changed in this increment

Application (five):
- src/shared/query/queryClient.ts
- src/features/profiles/principal/pages/gradebooks/hooks/usePrincipalGradeSheet.ts
- src/features/profiles/principal/pages/gradebooks/services/gradebooks.service.ts
- src/features/profiles/principal/pages/gradebooks/PrincipalGradeSheetPage.tsx
- src/features/profiles/principal/pages/gradebooks/PrincipalGradeSheetPage.loading-view.tsx

Tests/configuration (eight):
- playwright.acceptance.config.ts
- playwright.acceptance-build.config.ts
- tests/principal-grade-sheet-loading.spec.ts
- tests/fixtures/grade-sheets-query.ts (new)
- tests/grade-sheets-query.spec.ts (new)
- tests/grade-sheets-query-acceptance.spec.ts (new)
- tests/grade-sheets-query-harness.tsx (new)
- tests/grade-sheets-query.html (new)

Documentation (three):
- TANSTACK-QUERY-MIGRATION-ROADMAP.md
- TANSTACK-QUERY-INVALIDATION-MAP.md
- QED-GRADE-SHEETS-QUERY-VERIFICATION.md (new)

Preservation audit: all 78 pre-existing changed/untracked files were hashed at
task start. Only six were intentionally extended: shared keys, Principal service,
the two curated configs and two migration documents. The other 72 remain
byte-for-byte unchanged, including all stabilized Directory/Dashboard files,
prior migrations, API toggle, base/live config and unsafe remote fixtures.
Final audit confirms no unexpected changed/new files. Initially clean generated
loading-screenshots were restored; no tracked screenshot diff remains.
The Git index is empty and HEAD remains 174588a13cccdffa2fafc3bafccbbed214b192de.
No stage, commit, push, deploy, dependency install or backend/database change.

Evidence: ignored test-results/sheets-* directories retain screenshots and
request counts. test-results/grade-sheets-verification retains baseline,
diagnostic, scoped, full and repeated JSON separately, plus build/grading logs,
initial hashes, scope list and bundle deltas. Final full-suite JSON is restored at
test-results/acceptance-results.json and test-results/fresh-build-results.json;
repeats do not overwrite the full-suite evidence. Temporary evidence also remains
in the task's qed-grade-sheets-20261011 folder.

Recommended next boundary: separately approve dependency analysis for the
Principal Calendar's read-only event list. Its shared-role presentation and
event writers require an explicit boundary; do not migrate shared consumers or
writers automatically. This increment has no remaining demonstrated automated
regression blocker. Review readiness does not establish real-backend deployment
acceptance or authorize committing/deploying/another module.

STOP for review after this increment; no further module is authorized here.
