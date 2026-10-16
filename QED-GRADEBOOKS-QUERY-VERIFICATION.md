# Principal Gradebooks overview — TanStack Query verification

Date: 2026-10-11. Repository: C:/Users/Mavys/Downloads/QED_System/QED_front_end.
Scope: read-only Principal Gradebooks overview only. Grade sheets, their term
reader, other accounts and all writers remain unmigrated. No packages installed,
API toggle changed, backend/database edited, or files staged/committed/pushed.

## Boundary and dependency analysis

Reviewed the migration roadmap, invalidation map and Analytics verification
report, then inspected actual routes, compositions, hooks, service imports,
summary transforms, card locking/navigation, sheet term lookup, student cell
mapping, average/ranking utilities and Teacher/Parent dependencies. Baselines
were executed before changing application fetching.

The overview route /principal/gradebooks owns usePrincipalGradebooks and the
section-summary reader. Its indefinite module cache and lastSchoolYear variable
had only this runtime consumer; no writer or other-role consumer imports either
summary cache API. The sole competing overview cache was therefore removed.

The separate /principal/gradebooks/:grade route owns usePrincipalGradeSheet,
fetchGradingPeriods, fetchPrincipalGradebook and fetchSchoolYear. Its grade,
section and grading-period URL parameters, server default term and unavailable
term modal form a separate boundary. Student cells expose only submitted numeric
values and use server overallAverage or the unchanged fallback. No Principal
export control exists in either actual route. These sheet readers and presentation
components are unchanged, including null/not-found semantics.

Teacher assessment scores/submissions use subjectGrading.service.ts
(/api/teacherGrading); adviser grades, submissions, parent visibility and history
use gradePage.service.ts (/api/advisoryGrading). Parent academic reads use
studentTermPerformance.service.ts (/api/termPerformance) with their own Maps and
in-flight promises. Admin academic-year transport remains imported by the legacy
sheet year reader. These services share backend domain dependencies, not the
Principal overview's frontend cache. None of their caches, writers, calculations,
permissions or consumers was migrated or removed.

This increment deliberately selects the smallest coherent overview boundary.
Migrating the sheet simultaneously would require coordinating period availability,
latest-submission links, requested/default terms, null sheets, scores and retained
student tables. Those deserve a separately approved reader migration; Teacher
writers and Parent release/visibility migration remain separate higher-risk work.

## Query architecture and request mapping

S = ['session', generation, role, userId]. The existing singleton and auth cleanup
bridge are reused through the overview composition's route-scoped provider.

| GET after /api | Query key | Freshness / inactive GC |
| --- | --- | --- |
| /academic-year/getAcademicYear | S + ['principal','students','roster-year','active'] | 30 seconds / five minutes |
| /gradesheets/section-grade | S + ['principal','gradebooks','overview',yearId] | 30 seconds / five minutes |

The overview sends no year/term/class/student/subject server parameters. The
backend chooses active year and each section's latest submitted period. Year is
a cache partition, not an invented API parameter. Grade/section filters, search
and grouping remain local. The sheet's existing query arguments are unchanged.

Initial and stale navigation resolve year before summaries. Explicit Retry
resolves year first, then refreshes the current summary or enables the new-year
key. Lifecycle/identity guards suppress obsolete Retry continuations. No automatic
retry, polling, focus refresh, completed-query reconnect refetch or persistence
was added. The 30-second policy bounds freshness checks on navigation; an unchanged
open page does not automatically synchronize with another browser.

Both requests support AbortSignal. Same-tick StrictMode cancellation is checked
before transport dispatch. Each endpoint independently guards 401 through the
existing generation-scoped expireSession; the sequential dependency cannot mask
a later 401 behind a sibling error. 403 remains a permission error, hides cached
private cards/year, and does not log out. The existing hook fields and summary error fallback
are retained; the shared year transport uses its existing generic failure text. cachedOffline and dataScope add presentation safeguards. Session/
year changes remount LoadingRegion's retained-content subtree. No cross-session/
year placeholder can keep old cards in that snapshot.

Offline/paused initial work settles to the existing connection alert and Retry
control. Cached arrays, including empty, remain visible with a separate existing
LoadingRegion alert. Repeated Retry while offline/paused/fetching enqueues nothing;
paused work resumes once on reconnect. Connection state is reconciled on mount
because route-scoped providers may miss browser events while absent.

Ordinary errors preserve the original page-level card failure boundary; neither
successful endpoint produces a new partial-card UI. The shared legacy sheet year
transport remains untouched; the overview uses the stateless roster-year transport.
There is no competing summary cache. Cache cleanup on logout/login/account/role
changes reuses the existing auth bridge.

## Academic and visibility evidence

New deterministic golden fixtures were run against the original application
source and original production artifact BEFORE the fetching changes (3/3 in each).
They protect:
- Submitted card with a valid period opens the exact original grade/section/term
  URL; pending, missing-period and empty-grade cards stay locked.
- Submitted 89.94 overrides its legacy average alias; a pending synthetic 100
  stays hidden; own-advisory missing grades say No grades yet; submitted-null
  says em dash; fallback overall average is 89.9.
- Unsubmitted Term 2 keeps the unavailable modal and selected Term 1.
- Missing subjects are excluded, zero is retained, empty average is zero, and
  rounding/color thresholds stay unchanged (56.6 for the mixed fixture).

Existing grade-sheet tests preserve default-term selection, three independent
error/retry paths, empty/short/long rows, term refetches, native columns, skeleton
geometry and light/dark mobile/desktop rendering. Existing Teacher grade tests
preserve visibility/history, independent error recovery and term navigation.
No grade calculation, table/transform component or backend implementation changed.

The existing isolated backend tests gradebookWorkflow, gradeTemplateAdaptive and
templateStorage also exercise grading weights/categories, incomplete-grade
publication, transmutation, advisory isolation, visibility and OOXML/template
preservation. These use controller database/notification doubles and isolated
local/storage fixtures, NOT a live backend or production database. They do not
establish real-account authorization or cross-browser synchronization.

## Verification results

Baseline:
- TypeScript, fresh production build and unchanged bundle/role guards passed.
- Existing source suite: 342/344. Dashboard stale-remount request-count assertion
  failed (expected 3, received 2); Analytics fixed-overlay PNG write failed with
  Windows UNKNOWN filesystem error. Both occurred before any Gradebooks fetching
  changes. Dashboard repeated baseline: 1/3 passed, 2/3 failed. Analytics repeated
  baseline: 3/3 passed. Existing assertions/application code were left unchanged.
- Existing production suite: 135/135.
- Added goldens plus existing Principal list/sheet tests: 29/29 against source and
  29/29 against baseline production artifact.
- Existing Teacher grade suite: 32/32 source.
- Existing isolated grading/template/workflow/storage tests: 77/77.

Targeted implementation verification:
- Initial run 46/47: one new test opened the logout modal without confirming it.
  Corrected the test to use the existing Log out confirmation; no auth code fix.
- Added pending logout/login cases and reran: 51/51 (32 hook, 10 actual-route,
  three golden and six existing overview UI tests).
- New hook ESLint: passed. Service lint retains its pre-existing unused _signal
  in fetchActiveGradingPeriodId, verified in HEAD; unrelated code left untouched.
- Final npm run build: passed (tsc -b, Vite and fixed bundle/role guards).
- Final complete source suite: 446/447 (10.9 minutes), no skipped tests.
  All 71 Gradebooks/sheet checks and 32 Teacher-grade checks passed. The sole
  failure was unchanged query-pilot-acceptance.spec.ts:113, the 1280/light stale
  directory cancellation/request-count assertion (expected 2, received 1).
- Final fresh-production suite: 205/206 (6.0 minutes), no skipped tests.
  All 39 Gradebooks/sheet checks and 32 Teacher-grade checks passed. The sole
  failure was unchanged dashboard-query-acceptance.spec.ts:122: after awaiting
  the overview request, another endpoint count was 1 instead of 2.
- Source follow-up: directory case 3/3 passed; baseline-intermittent Dashboard
  stale-remount case 2/3 passed, 1/3 failed with expected 3 / received 2.
  These follow-ups do not turn the original full-suite failures into passes.
- Production Dashboard follow-up: 3/3 passed on the same new dist artifact.

The original request-count assertions and application code for those older tests
were not modified or weakened. The Dashboard assertions wait for overview count,
then immediately assert all independently completing endpoint counts. The
Directory assertion combines intercepted-request counts with browser abort events;
a probe may abort before interception. These are unresolved measurement/timing
concerns pending a separately scoped review, not confirmed Gradebooks defects.
The complete checkout's regression gates are therefore not clean.

All HTTP-dependent browser tests use deterministic intercepted synthetic APIs and
mocked authentication. No real-backend or real-account verification is claimed.
Unsafe tests/live and gradebook-two-advisories remote-fixture tests were excluded.
Source harnesses exercise real hooks, singleton QueryClient and AuthProvider;
production tests exercise the newly built dist, not the baseline artifact.

Coverage includes initial/empty/loading/error, both endpoint 500/401/403, malformed
403 after cached success, fresh/stale/GC, year rollover/navigation/Retry, multiple
observers, offline initial/cached/empty/reconnect, bounded explicit retries,
transport cancellation, pending 200/401 account switching and logout/login,
role/auth/preview guards, local filters, locked-card/navigation behavior, golden
outputs and mobile/desktop light/dark rendering. Student/subject/term switching
are not overview controls; unchanged sheet term navigation is regression-tested,
and full sheet query races remain a next-boundary requirement.

## Bundle and network impact

Unchanged node:zlib level-6 budgets and role-isolation checks:

| Gzip bytes | Baseline | Final | Change |
| --- | ---: | ---: | ---: |
| Public entry | 628 | 628 | 0 |
| Public eager closure | 133387 | 133382 | -5 |
| Admin beyond public | 141043 | 141055 | +12 |
| Principal beyond public | 136901 | 138126 | +1225 (about 0.9%) |
| Teacher beyond public | 160850 | 160860 | +10 |
| Parent beyond public | 145835 | 145837 | +2 |

Public/non-Principal raw sizes are unchanged; their small gzip differences are
hashed-reference compression changes. Principal raw increase: 2542 bytes. Fixed
entry/public/Admin caps remain 112153/135349/151512. Query remains absent from
public and all non-Principal eager graphs; charts/Excel/PDF dependencies stay lazy.

Cold overview: two GETs, as before, now sequential for year correctness. Existing
fresh shared year may reduce this to one; fresh navigation needs zero summary/year
GETs. Stale navigation normally revalidates year + summary once. Explicit Retry
has the same context-first pair. Local filters/group/search make zero requests.
There are no duplicate observers, uncontrolled retries or request loops in the
passed targeted workflows. The unchanged sheet still uses its own legacy year
reader and may make an extra year GET when entered; consolidating it belongs to
the next boundary. Real backend latency and production Web Vitals were not measured.

## Invalidation dependencies

The updated invalidation map documents future success-only invalidation after
subject-teacher submission/score corrections, adviser submission/publication,
enrollment/class/section and subject-teacher/adviser assignment changes,
year/term configuration and grade publication/visibility/revocation. Year must be
resolved before affected overview refetches. Future sheets/periods/Parent readers
need their own affected student/class/subject/term invalidations. No writer,
socket/event listener, cross-role/browser sync or optimistic grade update is added.

## Exact files changed in this increment

Application (four):
- [src/shared/query/queryClient.ts](C:/Users/Mavys/Downloads/QED_System/QED_front_end/src/shared/query/queryClient.ts) (overview key only; prior keys preserved)
- [src/features/profiles/principal/pages/gradebooks/hooks/usePrincipalGradebooks.ts](C:/Users/Mavys/Downloads/QED_System/QED_front_end/src/features/profiles/principal/pages/gradebooks/hooks/usePrincipalGradebooks.ts)
- [src/features/profiles/principal/pages/gradebooks/services/gradebooks.service.ts](C:/Users/Mavys/Downloads/QED_System/QED_front_end/src/features/profiles/principal/pages/gradebooks/services/gradebooks.service.ts)
- [src/features/profiles/principal/pages/gradebooks/PrincipalGradebooksPage.loading-view.tsx](C:/Users/Mavys/Downloads/QED_System/QED_front_end/src/features/profiles/principal/pages/gradebooks/PrincipalGradebooksPage.loading-view.tsx)

Tests/configuration (ten):
- [playwright.acceptance.config.ts](C:/Users/Mavys/Downloads/QED_System/QED_front_end/playwright.acceptance.config.ts)
- [playwright.acceptance-build.config.ts](C:/Users/Mavys/Downloads/QED_System/QED_front_end/playwright.acceptance-build.config.ts)
- [tests/principal-gradebooks.spec.ts](C:/Users/Mavys/Downloads/QED_System/QED_front_end/tests/principal-gradebooks.spec.ts) (fresh revisit must settle with exactly one
  summary request; original geometry/controls/flow assertions retained)
- [tests/fixtures/gradebooks.ts](C:/Users/Mavys/Downloads/QED_System/QED_front_end/tests/fixtures/gradebooks.ts) (new golden inputs)
- [tests/fixtures/gradebooks-query.ts](C:/Users/Mavys/Downloads/QED_System/QED_front_end/tests/fixtures/gradebooks-query.ts) (new controlled read-only API fixture)
- [tests/gradebooks-golden.spec.ts](C:/Users/Mavys/Downloads/QED_System/QED_front_end/tests/gradebooks-golden.spec.ts) (new)
- [tests/gradebooks-query.spec.ts](C:/Users/Mavys/Downloads/QED_System/QED_front_end/tests/gradebooks-query.spec.ts) (new)
- [tests/gradebooks-query-acceptance.spec.ts](C:/Users/Mavys/Downloads/QED_System/QED_front_end/tests/gradebooks-query-acceptance.spec.ts) (new)
- [tests/gradebooks-query-harness.tsx](C:/Users/Mavys/Downloads/QED_System/QED_front_end/tests/gradebooks-query-harness.tsx) (new)
- [tests/gradebooks-query.html](C:/Users/Mavys/Downloads/QED_System/QED_front_end/tests/gradebooks-query.html) (new)

Documentation (three):
- [TANSTACK-QUERY-MIGRATION-ROADMAP.md](C:/Users/Mavys/Downloads/QED_System/QED_front_end/TANSTACK-QUERY-MIGRATION-ROADMAP.md)
- [TANSTACK-QUERY-INVALIDATION-MAP.md](C:/Users/Mavys/Downloads/QED_System/QED_front_end/TANSTACK-QUERY-INVALIDATION-MAP.md)
- [QED-GRADEBOOKS-QUERY-VERIFICATION.md](C:/Users/Mavys/Downloads/QED_System/QED_front_end/QED-GRADEBOOKS-QUERY-VERIFICATION.md) (new)

A transient baseline-only config was removed after use. Baseline evidence is
retained outside Playwright's output cleanup until the final suite completes.
The preservation audit hashed all 63 previously changed/untracked files before
application edits. Exactly five were intentionally extended: shared keys, the
two curated configs, roadmap and invalidation map. The other 58 remain byte-for-
byte unchanged, including prior migrations, API toggle, base/live config and
unsafe fixtures. Grade-sheet service/legacy-year functions and the summary
flattening transform match their prior implementation; grade-sheet presentation,
calculation utilities and bundle guards are unchanged. The Git index stays empty.

Evidence is retained in ignored test-results/gradebooks-verification: baseline/
final JSON results, repeated-case results, source/artifact hashes, bundle metrics,
build log, isolated grading test log, scope list and preservation audit. Full-suite
JSON outputs are restored at test-results/acceptance-results.json and
test-results/fresh-build-results.json; rerun JSON is stored separately so failed
full runs are not concealed. Screenshots and sanitized request counts remain in
test-results and test-results/fresh-build. Screenshot review confirmed mobile
light/dark cached-offline cards and alerts preserve the existing presentation.
Tracked generated loading-screenshots were initially clean and restored afterward.

## Remaining risks and next boundary

- Real credentials/backend, cookies/CORS, actual database grades, real permission
  enforcement and backend latency remain unverified. Browser APIs are mocked.
- Separate active-year/summary GETs cannot make server rollover atomic.
- Freshness applies on read/navigation; no open-page polling or cross-browser
  writer invalidation is added. Cached offline cards may become stale; server
  remains responsible for enforcing sheet/submission/visibility permissions.
- Offline recovery assumes JavaScript has loaded; no service-worker asset cache.
- API configuration remains the user's localhost:7400/Render manual toggle.
  This is a local production-mode test artifact. Selecting Render and rebuilding
  remains separate production preparation; no toggle change was authorized here.
- Existing Dashboard request-count baseline intermittency remains an independent
  verification concern. Existing xlsx security and unrelated lint follow-ups are
  outside scope, as is the pre-existing mobile Analytics heatmap clipping issue.
- No new Gradebooks failure was observed: all scoped source/artifact tests passed.
  Ready for scoped implementation review; NOT a clean whole-checkout release gate.
  Resolve the existing Dashboard/Directory test intermittency before treating the
  complete regression suite as deployment approval. No unrelated fixes were made.

Recommended next boundary: separately approve Principal grade sheet plus its
class/section-scoped grading-period reader together, preserving server default
terms, submitted/pending/null semantics, retained tables and the golden outputs.
Do not migrate Teacher writers, Parent visibility or other modules automatically.

STOP after final verification/report for user approval. No staging/commit/push/deploy.
