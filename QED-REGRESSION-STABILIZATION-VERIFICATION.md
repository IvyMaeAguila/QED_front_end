# QED regression stabilization verification

Date: 2026-10-11. Scope: existing Principal Directory and Dashboard tests only.
This checkpoint follows QED-GRADEBOOKS-QUERY-VERIFICATION.md. No further migration,
application code, API configuration, backend/database, dependency, or Git index
changes are part of this correction.

## Findings and corrections

1. Dashboard stale-remount source test: the test awaited an intercepted overview
   request and cached UI readiness, then unmounted and advanced the browser clock
   while the explicit refresh could still be fetching. Its final overview-only
   barrier also asserted sibling counts synchronously. Cached content readiness
   is intentionally independent of refresh completion. The test now waits for
   all eleven exact dispatch/finished counts and Query fetchStatus=idle before
   advancing the freshness clock, and again before final assertions. The selected
   term, 30-second policy and exact 1/2/3 request counts are unchanged.
2. Dashboard offline/remount acceptance test: a completed UI and one overview
   dispatch were incorrectly treated as completion of the independent year and
   section requests. The fixture now correlates requestfinished events by Request
   identity and awaits the exact endpoint count map. The original eleven-endpoint
   count assertions remain. The same barrier replaces the old 500-ms Retry sleep
   and covers expired-cache recovery and responsive stale navigation.
3. Directory stale-remount acceptance test: response headers were counted as
   completed GETs, although that same request can subsequently abort during body
   consumption. The completion and cancellation counters were therefore not
   disjoint. Fixture dispatch counts and global browser abort counts also measured
   different populations without identities or settled phase boundaries. A
   cancelled request need not reach the fixture dispatch counter. The new ledger verifies one completed successful GET per load/refresh,
   every additional browser attempt explicitly aborted, and every intercepted
   attempt either that success or an identified intercepted cancellation. Fresh
   navigation/offline Retry still require zero additional dispatches; production
   still requires zero cancellations and exactly four teacher GETs for the full
   workflow. The existing one-second no-loop observation uses browser virtual
   time instead of a real sleep.

No application caching/lifecycle defect was demonstrated. Hooks, services,
StrictMode, Query policies, auth generation guards, cancellation, independent
401/403 handling and offline behavior are unchanged. Dashboard service defers
same-tick cancelled transport; Directory transport dispatches immediately, so
its development StrictMode probe may generate a browser cancellation. Both are
intentional existing behaviors, not extra successful requests.

## Deterministic coverage added

- Held overview refresh: cached content is ready while snapshot fetchStatus is
  fetching; repeated Retry still deduplicates; release and settle before stale
  remount; exactly three dispatches per endpoint, no refresh cancellations.
- Delayed second year dispatch: snapshot refresh and cached content can be ready
  while year is still at one request; after explicit release all eleven finish
  exactly twice. Runs against source and production.
- Cancellation before the fixture counter: an actual browser GET is held before
  fixture dispatch, aborted with AbortController, then replaced once. Exactly two
  browser attempts, one identified pre-counter abort, one successful dispatch.
  The old mixed-counter equation would incorrectly require two dispatches.
  This is controlled mocked scheduling, not evidence that the historical run's
  exact browser event order was captured. Original Directory failed artifact had
  no identities; the unchanged case passed all 20 new baseline/diagnostic repeats.

An additional actual Chromium/isolated streaming-HTTP probe deterministically
reproduced the historical arithmetic: one intercepted GET, HTTP 200 headers,
then net::ERR_ABORTED while body JSON was still pending. Old "completed" = 1,
cancelled = 1, calls = 1, incorrectly expected calls = 2. After one replacement,
the ledger identified exactly one aborted 200 and one finished 200 and passed
successfulBatch(). Evidence: headers-before-cancellation.json. This is a synthetic
local HTTP fixture, NOT the QED backend. It proves the old completion barrier and
counter assumptions are invalid; the historical trace cannot distinguish this
ordering from a pre-interception cancellation. None of the 40 corrected natural
Directory repeated workflows required pre-interception cancellation accounting.

All new synchronization uses request terminal events, Query state, controlled
promise gates or Playwright state assertions. No arbitrary delay was added, no
count was widened, no cancellation assertion removed, and no bundle guard changed.

## Executed runs (including exploratory failures)

Evidence is preserved in the task's TEMP evidence directory and copied into
ignored test-results/regression-stabilization after the full gates finish.

- Unchanged affected cases, ten repeats each: 25/30 passed. Dashboard source stale
  remount failed 4/10; Dashboard missed-online-events case failed 1/10; Directory
  desktop/light passed 10/10.
- Diagnostic instrumentation, original assertions, ten repeats each: 28/30.
  Dashboard source stale remount failed 2/10; the other two cases passed 10/10.
  Diagnostic query state and sanitized request identities are attached to JSON.
- Exploratory corrected-test collection: failed before tests ran because of an
  extra parenthesis in the new fixture helper. Corrected immediately.
- Corrected complete affected files before the ledger regression was added: 74/74.
- Controlled ledger regression source repetition: 3/3.
- Isolated streaming-HTTP Chromium diagnostic: passed; one 200-header/body-aborted GET plus one finished replacement; old arithmetic reproduced exactly.
- TypeScript baseline: passed.
- Fresh production build (tsc -b, Vite, fixed budget/role guards): passed.
- Isolated grading/template/workflow/storage tests: 77/77; local doubles only.
- Repeated source checks: 90/90 (ten repeats of all nine affected/adversarial cases; zero retries/skips).
- Repeated fresh-production checks: 70/70 (ten repeats of all seven route/ledger cases; zero retries/skips).
- Complete source acceptance/regression suite: 450/450 (15.1 minutes), zero skipped/retried/flaky tests. All 71 Gradebooks/sheet and 32 Teacher-grade checks passed.
- Complete fresh-production acceptance suite: 208/208 (6.2 minutes), zero skipped/retried/flaky tests. All 39 Gradebooks/sheet and 32 Teacher-grade checks passed.

## Bundle impact and scope protection

Rebuilt bundle measurements are byte-identical to the artifact at task start:
public entry gzip 628; public eager closure 133382; Admin additional eager gzip
141055; Principal 138126; Teacher 160860; Parent 145837 bytes. Entry/public/Admin
caps remain 112153/135349/151512 bytes. TanStack Query remains absent from public,
Admin, Teacher and Parent eager closures. No runtime performance change is expected
from test-only edits; no real-backend latency/Web Vitals claim is made.

Exact increment files:
- tests/query-pilot-acceptance.spec.ts
- tests/dashboard-query-acceptance.spec.ts
- tests/dashboard-query.spec.ts
- tests/fixtures/dashboard.ts
- tests/fixtures/requestLedger.ts (new)
- QED-REGRESSION-STABILIZATION-VERIFICATION.md (new)

The previous migration report is preserved as historical evidence. Task-start
SHA-256 audit covered all 75 initially dirty/untracked files: three previously
uncommitted Dashboard test/fixture files were intentionally extended; the other
72 remain byte-for-byte unchanged, including every application migration and the
API toggle. The Directory acceptance spec was initially clean and has only this
task's test changes. The ledger and this report are new. No other tracked file was
changed by this increment. Initially clean generated tracked loading screenshots
were restored after both full suites. Git HEAD is unchanged and the index is empty.

## Limits and checkpoint

All HTTP browser tests use synthetic intercepted APIs/authentication. The built
React application, hooks, QueryClient and navigation are real; backend accounts,
actual permissions/cookies/CORS, remote data and real latency remain unverified.
Unsafe live/remote database fixture tests are excluded. The 77 isolated backend
unit tests do not access the actual database. Existing localhost/Render manual
toggle is preserved; the production-mode artifact intentionally targets localhost
for local verification. Render selection/rebuild is separate release preparation.

Final gate status: CLEAN for the complete curated source/fresh-production
regression gates and the 160 repeated affected/adversarial checks. No intermittent
failure was observed after correction. This does not establish live-backend
acceptance or authorize deployment. No staging, commit, push or deployment. Stop
for review. No next migration is started.

## Reproduction and verification commands

```powershell
npx tsc -b
npm run build
npx playwright test --config playwright.acceptance.config.ts tests/query-pilot-acceptance.spec.ts tests/dashboard-query-acceptance.spec.ts tests/dashboard-query.spec.ts --grep "stale remount|events missed|simulated acceptance|request accounting|cached content readiness" --repeat-each=10 --output=test-results/stabilization-source-repeated
npx playwright test --config playwright.acceptance-build.config.ts tests/query-pilot-acceptance.spec.ts tests/dashboard-query-acceptance.spec.ts --grep "events missed|simulated acceptance|independently delayed|request accounting" --repeat-each=10 --output=test-results/stabilization-production-repeated
npx playwright test --config playwright.acceptance.config.ts --output=test-results/stabilization-full-source
npx playwright test --config playwright.acceptance-build.config.ts --output=test-results/stabilization-full-production
node --test ../thesis_qed/test/gradebookWorkflow.test.js ../thesis_qed/test/gradeTemplateAdaptive.test.js ../thesis_qed/test/templateStorage.test.js
node scripts/check-bundle-budget.mjs
```

Each full/repeated config uses one worker and retries=0. Source and production
servers used distinct ports. Repetition runs overlapped across environments; the
full production suite began first and the full source suite began later, after
production Analytics screenshot cases had finished. Role-bundle server phases
did not overlap. No same-feature tracked screenshot writes were concurrent.
Full-suite JSON remains at test-results/acceptance-results.json and
test-results/fresh-build-results.json. Evidence copies, including exploratory
failures, original affected tests, build/bundle/preservation logs and controlled
HTTP diagnostic records, are in test-results/regression-stabilization. Screenshot
evidence remains under the four stabilization source/production output folders.
