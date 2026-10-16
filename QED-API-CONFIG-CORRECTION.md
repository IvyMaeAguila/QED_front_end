# QED API configuration correction and fresh acceptance verification

Correction-stage record. See `QED-COMMIT-VERIFICATION.md` for the subsequent
final scope review, verification rerun and local commit preparation.

Date: 2026-10-11 (Asia/Manila). Scope: API configuration correction only;
no backend, authentication logic, database, dependency or UI changes.

## Investigation and correction

All frontend API_CONFIG service consumers expect `baseURL`. No consumer uses
`baseUrl`. The working tree had replaced the committed configuration with a
hardcoded `http://localhost:7400` and renamed the exported property to `baseUrl`.
Git establishes that this is an uncommitted override, not the canonical contract.
Git cannot identify which editor or person made that uncommitted change.

History:
- `417100a` used `baseURL` with localhost and a commented Render endpoint.
- `ae2d419` selected `https://thesis-qed-1.onrender.com`, still using `baseURL`.
- `d41cf52` introduced Vite mode selection with `VITE_API_BASE_URL`, trailing
  slash normalization, and the same Render endpoint as fallback. HEAD retains it.

The smallest correction restores `src/config/api.config.ts` to that exact
committed version. No aliases or consumer edits were introduced. The restored
file therefore has no diff against HEAD, despite being changed from the broken
starting working tree.

Endpoint verification:
- Vite development mode resolves `http://localhost:7400` from `.env.development`.
  This matches the backend's configured port 7400; the backend was not started.
- Vite production mode resolves `https://thesis-qed-1.onrender.com` from
  `.env.production`.
- The fallback is the established Render endpoint, never localhost. Explicit
  `VITE_API_BASE_URL` overrides remain supported by normal Vite configuration.
- Fresh compiled configuration in `assets/public-app-Dz-jnlBy.js` contains the
  Render endpoint and does not contain `http://localhost:7400`.
- Fresh build audit timestamp: 2026-10-11 11:02:46 Asia/Manila
  (2026-10-11T03:02:46.511Z). Tests below ran after that build completed.

## Verification approach

1. `npx tsc -b --pretty false`: passed independently.
2. `npm run build`: passed (TypeScript, production compilation, bundle guards).
3. `npx playwright test --config playwright.acceptance.config.ts`: complete
   78-test source/regression suite, including all pilot and blocker tests. Role
   and bundle checks in this run use the freshly generated dist.
4. `npx playwright test --config playwright.acceptance-build.config.ts`: all
   52 production-compatible workflows served directly from that fresh dist.
   No retained-build configuration is used.
5. Targeted ESLint on the corrected config and new production-test configuration
   passed. Git diff whitespace checks are recorded after testing.

The first corrected-source run passed the existing 74 regressions, but the four
new responsive tests stopped at an overly strict initial request-count assertion
written for production. Development StrictMode aborts its probe and remounts.
The test now requires exactly one completed request and verifies that every
additional attempt was explicitly aborted; stale refresh uses the same rule.
This checks cancellation rather than permitting arbitrary duplicate requests.
All four passed in a targeted development rerun. No application behavior was
changed for this test correction. Final full-suite results are recorded below.

The bootstrap and query hook harness tests import `/src/*.tsx` or
`/tests/query-pilot.html` directly. Those 26 tests require Vite's source server;
they cannot honestly be described as production-artifact tests. The separate
52-test production pass covers directory/profile/user-detail UI, responsive
acceptance, production roles and bundle guards. Both runs use the corrected
checkout, with no configuration interception or alternate application source.

## Coverage and backend distinction

All browser API responses are simulated. The tests execute the actual React
components and browser behavior, but do not authenticate with a real backend.
No authorized Principal test credentials/private fixture have been configured;
real cookie/CORS, actual account permissions and real API data remain unverified.
No backend was started and no account or database record was changed.

Coverage includes loading/error/Retry, both 401/500 response orders, 403 without
logout, old-session 401 protection, account/role switching, logout/login cache
isolation, abort/cancellation, auth readiness, route preview, five-minute
freshness, stale refresh, fresh navigation reuse, offline initial pause/recovery,
cached offline rows, retry deduplication, search/filter, teacher profiles,
schedules, and mobile/desktop light/dark presentation. New responsive tests
assert no page errors or unexpected console errors; intentional resource errors
from injected 500/offline conditions are excluded from that console assertion.

Fresh bundle guards pass:

| Measurement | Gzip bytes | Budget |
|---|---:|---:|
| Public entry eager closure | 133,397 | 135,349 |
| Admin eager download beyond public | 140,817 | 151,512 |

TanStack is absent from public and non-Principal eager dependency closures.
Production browser role tests also check that public/Admin/Teacher/Parent do
not request chunks containing TanStack. No performance-budget regression is
measured; no real-backend latency benchmark is claimed.

## Files changed during this correction

- `src/config/api.config.ts`: restored canonical property and Vite selection.
- `playwright.acceptance-build.config.ts`: new reproducible fresh-production
  workflow configuration, reusing existing static server and test suites.
- `tests/query-pilot-acceptance.spec.ts`: distinguish explicitly aborted
  StrictMode probes from completed requests; attach both counts to test metrics.
- This report, including the executed-result ledger below.

No package/lockfile edits, backend edits, other application changes, commits,
pushes, deployments or additional TanStack migrations. Existing unrelated
working-tree edits were preserved. Existing xlsx security findings remain a
separate follow-up.

This report supersedes the API-config release blocker in
`QED-QUERY-ACCEPTANCE.md`; that earlier report describes the broken pre-correction
checkout. Actual new results and remaining gates follow below.

## Final results and readiness

- Complete regression suite: **78 passed, 0 failed, 0 skipped**, 140.2 seconds.
- Fresh production browser suite: **52 passed, 0 failed, 0 skipped**, 72.2 seconds.
- Exact test-identifier comparison confirms **all previous 67 failed cases now pass**. No independent failing case remains.
- Ready for commit preparation within this scope. Real-backend deployment acceptance remains unverified until authorized Principal credentials and a suitable test environment are available. No claim of real-backend testing is made.
- Existing unrelated working-tree changes are outside this correction and were not rewritten. No commit, push or deployment was performed.

### Complete regression suite: executed ledger

JSON evidence: [results](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/acceptance-results.json).

| Scenario | Status | Target | Backend |
|---|---|---|---|
| bootstrap-loading.spec.ts:31 — bootstrap 60ms never shows the brand loader or status | Passed | Corrected source / Vite harness | Mocked API |
| bootstrap-loading.spec.ts:68 — revealed bootstrap animates only the real logo opacity, never rotation | Passed | Corrected source / Vite harness | Mocked API |
| bootstrap-loading.spec.ts:79 — bootstrap reduced motion has no running animation | Passed | Corrected source / Vite harness | Mocked API |
| bootstrap-loading.spec.ts:90 — bootstrap busy and status follow reveal, minimum duration, and DOM cleanup | Passed | Corrected source / Vite harness | Mocked API |
| bootstrap-loading.spec.ts:106 — protected components and page requests never render before auth resolves | Passed | Corrected source / Vite harness | Mocked API |
| bootstrap-loading.spec.ts:114 — lazy route 375: registered composition inside real shell with stable surroundings | Passed | Corrected source / Vite harness | Mocked API |
| bootstrap-loading.spec.ts:114 — lazy route 1280: registered composition inside real shell with stable surroundings | Passed | Corrected source / Vite harness | Mocked API |
| bundle-budget.spec.ts:4 — production entry and eager dependency closure stay within the fixed plus 10% budget | Passed | Fresh production dist | No API (static check) |
| bundle-budget.spec.ts:10 — registry guard rejects an eager page import and accepts the restored metadata | Passed | Fresh production dist | No API (static check) |
| directory-loading.spec.ts:8 — /principal/teachers 375px light: real controls and screenshots | Passed | Corrected source / Vite harness | Mocked API |
| directory-loading.spec.ts:8 — /principal/teachers 375px dark: real controls and screenshots | Passed | Corrected source / Vite harness | Mocked API |
| directory-loading.spec.ts:8 — /principal/teachers 1280px light: real controls and screenshots | Passed | Corrected source / Vite harness | Mocked API |
| directory-loading.spec.ts:8 — /principal/teachers 1280px dark: real controls and screenshots | Passed | Corrected source / Vite harness | Mocked API |
| directory-loading.spec.ts:8 — /principal/teachers/1 375px light: real controls and screenshots | Passed | Corrected source / Vite harness | Mocked API |
| directory-loading.spec.ts:8 — /principal/teachers/1 375px dark: real controls and screenshots | Passed | Corrected source / Vite harness | Mocked API |
| directory-loading.spec.ts:8 — /principal/teachers/1 1280px light: real controls and screenshots | Passed | Corrected source / Vite harness | Mocked API |
| directory-loading.spec.ts:8 — /principal/teachers/1 1280px dark: real controls and screenshots | Passed | Corrected source / Vite harness | Mocked API |
| directory-loading.spec.ts:8 — /principal/students 375px light: real controls and screenshots | Passed | Corrected source / Vite harness | Mocked API |
| directory-loading.spec.ts:8 — /principal/students 375px dark: real controls and screenshots | Passed | Corrected source / Vite harness | Mocked API |
| directory-loading.spec.ts:8 — /principal/students 1280px light: real controls and screenshots | Passed | Corrected source / Vite harness | Mocked API |
| directory-loading.spec.ts:8 — /principal/students 1280px dark: real controls and screenshots | Passed | Corrected source / Vite harness | Mocked API |
| directory-loading.spec.ts:8 — /principal/students/class/1 375px light: real controls and screenshots | Passed | Corrected source / Vite harness | Mocked API |
| directory-loading.spec.ts:8 — /principal/students/class/1 375px dark: real controls and screenshots | Passed | Corrected source / Vite harness | Mocked API |
| directory-loading.spec.ts:8 — /principal/students/class/1 1280px light: real controls and screenshots | Passed | Corrected source / Vite harness | Mocked API |
| directory-loading.spec.ts:8 — /principal/students/class/1 1280px dark: real controls and screenshots | Passed | Corrected source / Vite harness | Mocked API |
| directory-loading.spec.ts:8 — /principal/students/grade/1 375px light: real controls and screenshots | Passed | Corrected source / Vite harness | Mocked API |
| directory-loading.spec.ts:8 — /principal/students/grade/1 375px dark: real controls and screenshots | Passed | Corrected source / Vite harness | Mocked API |
| directory-loading.spec.ts:8 — /principal/students/grade/1 1280px light: real controls and screenshots | Passed | Corrected source / Vite harness | Mocked API |
| directory-loading.spec.ts:8 — /principal/students/grade/1 1280px dark: real controls and screenshots | Passed | Corrected source / Vite harness | Mocked API |
| directory-loading.spec.ts:8 — /parent/enrolled-children 375px light: real controls and screenshots | Passed | Corrected source / Vite harness | Mocked API |
| directory-loading.spec.ts:8 — /parent/enrolled-children 375px dark: real controls and screenshots | Passed | Corrected source / Vite harness | Mocked API |
| directory-loading.spec.ts:8 — /parent/enrolled-children 1280px light: real controls and screenshots | Passed | Corrected source / Vite harness | Mocked API |
| directory-loading.spec.ts:8 — /parent/enrolled-children 1280px dark: real controls and screenshots | Passed | Corrected source / Vite harness | Mocked API |
| directory-loading.spec.ts:8 — /parent 375px light: real controls and screenshots | Passed | Corrected source / Vite harness | Mocked API |
| directory-loading.spec.ts:8 — /parent 375px dark: real controls and screenshots | Passed | Corrected source / Vite harness | Mocked API |
| directory-loading.spec.ts:8 — /parent 1280px light: real controls and screenshots | Passed | Corrected source / Vite harness | Mocked API |
| directory-loading.spec.ts:8 — /parent 1280px dark: real controls and screenshots | Passed | Corrected source / Vite harness | Mocked API |
| directory-loading.spec.ts:40 — principal directory auto-column classification requires observed variation | Passed | Corrected source / Vite harness | Mocked API |
| query-pilot-acceptance.spec.ts:8 — simulated acceptance 375 light: filters, schedule, cache, offline and retry | Passed | Corrected source / Vite harness | Mocked API |
| query-pilot-acceptance.spec.ts:8 — simulated acceptance 375 dark: filters, schedule, cache, offline and retry | Passed | Corrected source / Vite harness | Mocked API |
| query-pilot-acceptance.spec.ts:8 — simulated acceptance 1280 light: filters, schedule, cache, offline and retry | Passed | Corrected source / Vite harness | Mocked API |
| query-pilot-acceptance.spec.ts:8 — simulated acceptance 1280 dark: filters, schedule, cache, offline and retry | Passed | Corrected source / Vite harness | Mocked API |
| query-pilot-blockers.spec.ts:38 — offline initial request stops loading and resumes once without queued retries | Passed | Corrected source / Vite harness | Mocked API |
| query-pilot-blockers.spec.ts:55 — offline cached directory keeps real rows and uses the existing error/retry UI | Passed | Corrected source / Vite harness | Mocked API |
| query-pilot-blockers.spec.ts:76 — a stale cached query paused offline retains data and refreshes once on reconnect | Passed | Corrected source / Vite harness | Mocked API |
| query-pilot-blockers.spec.ts:95 — late teachers 401 expires auth even after the other endpoint's 500 | Passed | Corrected source / Vite harness | Mocked API |
| query-pilot-blockers.spec.ts:108 — teachers 403 remains a permission error without expiring auth | Passed | Corrected source / Vite harness | Mocked API |
| query-pilot-blockers.spec.ts:95 — late year 401 expires auth even after the other endpoint's 500 | Passed | Corrected source / Vite harness | Mocked API |
| query-pilot-blockers.spec.ts:108 — year 403 remains a permission error without expiring auth | Passed | Corrected source / Vite harness | Mocked API |
| query-pilot-blockers.spec.ts:118 — both endpoint failures show an error and recover through one explicit retry | Passed | Corrected source / Vite harness | Mocked API |
| query-pilot-blockers.spec.ts:135 — old 401 after an early 500 cannot expire a new session during switch | Passed | Corrected source / Vite harness | Mocked API |
| query-pilot-blockers.spec.ts:135 — old 401 after an early 500 cannot expire a new session during logout-login | Passed | Corrected source / Vite harness | Mocked API |
| query-pilot.spec.ts:5 — real directory UI retries errors and reuses cache after schedule navigation | Passed | Corrected source / Vite harness | Mocked API |
| query-pilot.spec.ts:64 — authentication bootstrap must finish before requests start | Passed | Corrected source / Vite harness | Mocked API |
| query-pilot.spec.ts:74 — preview and auth readiness suppress requests; fresh navigation deduplicates; expiry refetches | Passed | Corrected source / Vite harness | Mocked API |
| query-pilot.spec.ts:96 — loading, errors, explicit retries and empty results | Passed | Corrected source / Vite harness | Mocked API |
| query-pilot.spec.ts:115 — account switching cancels old work and discards cached identity data | Passed | Corrected source / Vite harness | Mocked API |
| query-pilot.spec.ts:145 — teacher profile and schedule school-year caches remain independent | Passed | Corrected source / Vite harness | Mocked API |
| query-pilot.spec.ts:169 — logout and same-account login do not reuse directory data | Passed | Corrected source / Vite harness | Mocked API |
| query-pilot.spec.ts:183 — 401 expires the active session; 403 preserves auth and never retries automatically | Passed | Corrected source / Vite harness | Mocked API |
| query-pilot.spec.ts:197 — a different role cannot fetch the principal directory | Passed | Corrected source / Vite harness | Mocked API |
| role-bundles.spec.ts:11 — public login requests no protected role code | Passed | Fresh production dist | Mocked API |
| role-bundles.spec.ts:19 — TEACHER login requests only its own role code | Passed | Fresh production dist | Mocked API |
| role-bundles.spec.ts:19 — ADMIN login requests only its own role code | Passed | Fresh production dist | Mocked API |
| role-bundles.spec.ts:19 — PRINCIPAL login requests only its own role code | Passed | Fresh production dist | Mocked API |
| role-bundles.spec.ts:19 — PARENT login requests only its own role code | Passed | Fresh production dist | Mocked API |
| role-bundles.spec.ts:28 — a 1500ms role import uses bootstrap then the real shell and registered skeleton | Passed | Fresh production dist | Mocked API |
| role-bundles.spec.ts:50 — chart skeletons retain bars, line and radar while the heavy chart chunk is unavailable | Passed | Fresh production dist | Mocked API |
| user-details-loading.spec.ts:23 — user details 375 light: real field labels and actions | Passed | Corrected source / Vite harness | Mocked API |
| user-details-loading.spec.ts:23 — user details 375 dark: real field labels and actions | Passed | Corrected source / Vite harness | Mocked API |
| user-details-loading.spec.ts:23 — user details 1280 light: real field labels and actions | Passed | Corrected source / Vite harness | Mocked API |
| user-details-loading.spec.ts:23 — user details 1280 dark: real field labels and actions | Passed | Corrected source / Vite harness | Mocked API |
| user-details-loading.spec.ts:41 — ADMIN details preserve short and wrapping fields | Passed | Corrected source / Vite harness | Mocked API |
| user-details-loading.spec.ts:41 — PRINCIPAL details preserve short and wrapping fields | Passed | Corrected source / Vite harness | Mocked API |
| user-details-loading.spec.ts:41 — PARENT details preserve short and wrapping fields | Passed | Corrected source / Vite harness | Mocked API |
| user-details-loading.spec.ts:53 — user details error removes shapes and retries the account request | Passed | Corrected source / Vite harness | Mocked API |
| user-details-loading.spec.ts:65 — missing user uses the real not-found state only after the request | Passed | Corrected source / Vite harness | Mocked API |
| user-details-loading.spec.ts:73 — teacher user details wait for the teacher ID mapping and preserve real profile controls | Passed | Corrected source / Vite harness | Mocked API |
### Fresh production browser suite: executed ledger

JSON evidence: [results](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/fresh-build-results.json).

| Scenario | Status | Target | Backend |
|---|---|---|---|
| bundle-budget.spec.ts:4 — production entry and eager dependency closure stay within the fixed plus 10% budget | Passed | Fresh production dist | No API (static check) |
| bundle-budget.spec.ts:10 — registry guard rejects an eager page import and accepts the restored metadata | Passed | Fresh production dist | No API (static check) |
| directory-loading.spec.ts:8 — /principal/teachers 375px light: real controls and screenshots | Passed | Fresh production dist | Mocked API |
| directory-loading.spec.ts:8 — /principal/teachers 375px dark: real controls and screenshots | Passed | Fresh production dist | Mocked API |
| directory-loading.spec.ts:8 — /principal/teachers 1280px light: real controls and screenshots | Passed | Fresh production dist | Mocked API |
| directory-loading.spec.ts:8 — /principal/teachers 1280px dark: real controls and screenshots | Passed | Fresh production dist | Mocked API |
| directory-loading.spec.ts:8 — /principal/teachers/1 375px light: real controls and screenshots | Passed | Fresh production dist | Mocked API |
| directory-loading.spec.ts:8 — /principal/teachers/1 375px dark: real controls and screenshots | Passed | Fresh production dist | Mocked API |
| directory-loading.spec.ts:8 — /principal/teachers/1 1280px light: real controls and screenshots | Passed | Fresh production dist | Mocked API |
| directory-loading.spec.ts:8 — /principal/teachers/1 1280px dark: real controls and screenshots | Passed | Fresh production dist | Mocked API |
| directory-loading.spec.ts:8 — /principal/students 375px light: real controls and screenshots | Passed | Fresh production dist | Mocked API |
| directory-loading.spec.ts:8 — /principal/students 375px dark: real controls and screenshots | Passed | Fresh production dist | Mocked API |
| directory-loading.spec.ts:8 — /principal/students 1280px light: real controls and screenshots | Passed | Fresh production dist | Mocked API |
| directory-loading.spec.ts:8 — /principal/students 1280px dark: real controls and screenshots | Passed | Fresh production dist | Mocked API |
| directory-loading.spec.ts:8 — /principal/students/class/1 375px light: real controls and screenshots | Passed | Fresh production dist | Mocked API |
| directory-loading.spec.ts:8 — /principal/students/class/1 375px dark: real controls and screenshots | Passed | Fresh production dist | Mocked API |
| directory-loading.spec.ts:8 — /principal/students/class/1 1280px light: real controls and screenshots | Passed | Fresh production dist | Mocked API |
| directory-loading.spec.ts:8 — /principal/students/class/1 1280px dark: real controls and screenshots | Passed | Fresh production dist | Mocked API |
| directory-loading.spec.ts:8 — /principal/students/grade/1 375px light: real controls and screenshots | Passed | Fresh production dist | Mocked API |
| directory-loading.spec.ts:8 — /principal/students/grade/1 375px dark: real controls and screenshots | Passed | Fresh production dist | Mocked API |
| directory-loading.spec.ts:8 — /principal/students/grade/1 1280px light: real controls and screenshots | Passed | Fresh production dist | Mocked API |
| directory-loading.spec.ts:8 — /principal/students/grade/1 1280px dark: real controls and screenshots | Passed | Fresh production dist | Mocked API |
| directory-loading.spec.ts:8 — /parent/enrolled-children 375px light: real controls and screenshots | Passed | Fresh production dist | Mocked API |
| directory-loading.spec.ts:8 — /parent/enrolled-children 375px dark: real controls and screenshots | Passed | Fresh production dist | Mocked API |
| directory-loading.spec.ts:8 — /parent/enrolled-children 1280px light: real controls and screenshots | Passed | Fresh production dist | Mocked API |
| directory-loading.spec.ts:8 — /parent/enrolled-children 1280px dark: real controls and screenshots | Passed | Fresh production dist | Mocked API |
| directory-loading.spec.ts:8 — /parent 375px light: real controls and screenshots | Passed | Fresh production dist | Mocked API |
| directory-loading.spec.ts:8 — /parent 375px dark: real controls and screenshots | Passed | Fresh production dist | Mocked API |
| directory-loading.spec.ts:8 — /parent 1280px light: real controls and screenshots | Passed | Fresh production dist | Mocked API |
| directory-loading.spec.ts:8 — /parent 1280px dark: real controls and screenshots | Passed | Fresh production dist | Mocked API |
| directory-loading.spec.ts:40 — principal directory auto-column classification requires observed variation | Passed | Fresh production dist | Mocked API |
| query-pilot-acceptance.spec.ts:8 — simulated acceptance 375 light: filters, schedule, cache, offline and retry | Passed | Fresh production dist | Mocked API |
| query-pilot-acceptance.spec.ts:8 — simulated acceptance 375 dark: filters, schedule, cache, offline and retry | Passed | Fresh production dist | Mocked API |
| query-pilot-acceptance.spec.ts:8 — simulated acceptance 1280 light: filters, schedule, cache, offline and retry | Passed | Fresh production dist | Mocked API |
| query-pilot-acceptance.spec.ts:8 — simulated acceptance 1280 dark: filters, schedule, cache, offline and retry | Passed | Fresh production dist | Mocked API |
| role-bundles.spec.ts:11 — public login requests no protected role code | Passed | Fresh production dist | Mocked API |
| role-bundles.spec.ts:19 — TEACHER login requests only its own role code | Passed | Fresh production dist | Mocked API |
| role-bundles.spec.ts:19 — ADMIN login requests only its own role code | Passed | Fresh production dist | Mocked API |
| role-bundles.spec.ts:19 — PRINCIPAL login requests only its own role code | Passed | Fresh production dist | Mocked API |
| role-bundles.spec.ts:19 — PARENT login requests only its own role code | Passed | Fresh production dist | Mocked API |
| role-bundles.spec.ts:28 — a 1500ms role import uses bootstrap then the real shell and registered skeleton | Passed | Fresh production dist | Mocked API |
| role-bundles.spec.ts:50 — chart skeletons retain bars, line and radar while the heavy chart chunk is unavailable | Passed | Fresh production dist | Mocked API |
| user-details-loading.spec.ts:23 — user details 375 light: real field labels and actions | Passed | Fresh production dist | Mocked API |
| user-details-loading.spec.ts:23 — user details 375 dark: real field labels and actions | Passed | Fresh production dist | Mocked API |
| user-details-loading.spec.ts:23 — user details 1280 light: real field labels and actions | Passed | Fresh production dist | Mocked API |
| user-details-loading.spec.ts:23 — user details 1280 dark: real field labels and actions | Passed | Fresh production dist | Mocked API |
| user-details-loading.spec.ts:41 — ADMIN details preserve short and wrapping fields | Passed | Fresh production dist | Mocked API |
| user-details-loading.spec.ts:41 — PRINCIPAL details preserve short and wrapping fields | Passed | Fresh production dist | Mocked API |
| user-details-loading.spec.ts:41 — PARENT details preserve short and wrapping fields | Passed | Fresh production dist | Mocked API |
| user-details-loading.spec.ts:53 — user details error removes shapes and retries the account request | Passed | Fresh production dist | Mocked API |
| user-details-loading.spec.ts:65 — missing user uses the real not-found state only after the request | Passed | Fresh production dist | Mocked API |
| user-details-loading.spec.ts:73 — teacher user details wait for the teacher ID mapping and preserve real profile controls | Passed | Fresh production dist | Mocked API |

### Fresh-production request and console evidence

| Viewport | Theme | Teacher requests | Aborted | Successful responses | Page errors | Unexpected console errors |
|---|---|---:|---:|---:|---:|---:|
| 375 | Light | 4 | 0 | 3 | 0 | 0 |
| 375 | Dark | 4 | 0 | 3 | 0 | 0 |
| 1280 | Light | 4 | 0 | 3 | 0 | 0 |
| 1280 | Dark | 4 | 0 | 3 | 0 | 0 |

Four requests per workflow: initial success, stale success, injected 500, explicit successful retry. Fresh cache navigation and offline Retry clicks add no requests. Screenshots of loading, loaded, schedule, offline and error states are attached in the fresh-build JSON results and stored under `test-results/fresh-build/`.
