# QED Principal Teachers Directory automated acceptance

Historical report of the pre-correction checkout. The API blocker and failed
tests below were resolved subsequently; see `QED-API-CONFIG-CORRECTION.md` and
`QED-COMMIT-VERIFICATION.md` for the corrected configuration and final results.

Date: 2026-10-11. Browser: Playwright Chromium. No application source, backend,
database records, dependencies, or production data were changed during this task.
No accounts were created. No commit, push, deployment, or other-module migration.

## Release decision

Final combined run: **78 executed, 11 passed, 67 failed, 0 skipped** in 9.2 minutes.
Nine passes are retained-artifact bundle/role checks; two are current-source
bootstrap animation checks. All 67 failures stop at authentication/protected-page
prerequisites (46 missing account shell, 17 auth-state failures, four missing
protected headings/skeletons). A separate retained-build acceptance run passed
**4/4** new responsive workflows. The initial short diagnostic run additionally
executed two failing mobile acceptance tests and stopped before the desktop
tests; the final 78-test run subsequently executed all four.

**Do not commit/deploy the current checkout as a verified release.** The API
configuration currently exports `baseUrl`, while consumers use `baseURL`.
Independent TypeScript compilation and the production build both fail with
TS2551. Browser authentication bootstrap is also affected: simulated protected
routes return to the login screen rather than reaching the account shell.

Reproduce: run `npx tsc -b --pretty false` or `npm run build`; inspect
`src/config/api.config.ts:5` and `src/features/auth/services/authentication.service.ts:5`.
Reproduce in browser: run `npx playwright test --config playwright.acceptance.config.ts`.
The protected-route tests fail waiting for `.qed-account-ui`. This mismatch was
already present when inspected; it was not introduced or repaired in this task.
The file also hardcodes localhost rather than honoring VITE_API_BASE_URL, so
the existing live configuration cannot select its integration API correctly.

The retained dist from the preceding successful verification remains testable,
but it is not a fresh build of the current checkout. Its successes below cannot
clear the current-source release blocker.

## Environment and authorized accounts

- Frontend dependencies and Chromium are available; Vite starts successfully.
- Backend Express/MySQL dependencies and database configuration are available.
- An actual direct database `SELECT 1` succeeded. Only connectivity was checked;
  this was not browser/API/authentication verification. No records were read.
- The configured database is non-loopback. No Principal credentials or private
  fixture are configured in the inspected environment, project .env files,
  Playwright configuration, test fixtures, or development documentation.
- The existing QED_LIVE_FIXTURE harness requires a private generated fixture;
  its documentation records that prior fixture and accounts were cleaned up.
  Setup/cleanup and the gradebook live test perform database writes, so neither
  was run. Normal backend startup initializes an audit table; real login writes
  login/audit records. Those paths were left untouched under the no-write scope.
- No passwords, cookies, tokens, account lists, or student records were logged.

| Real-backend scenario | Status | Evidence / remaining requirement |
|---|---|---|
| Database connectivity | Passed (real, direct SQL) | SELECT 1 only; no browser involved |
| Principal credential login and cookie/CORS flow | Blocked | No authorized test account configured |
| Real teacher directory/search/filter | Blocked | No authorized browser session |
| Real profile and schedule API navigation | Blocked | No authorized browser session |
| Real cookie expiration / endpoint permissions | Blocked | No authorized browser session |
| Real account switching / logout | Blocked | No authorized test identities |
| Real-backend latency/performance | Blocked | No authenticated real-API measurements |

## New responsive acceptance coverage (retained dist, mocked APIs)

Command: `npx playwright test --config playwright.acceptance-retained-build.config.ts`.
All **4/4** tests passed: 375px light, 375px dark, 1280px light, 1280px dark.
These use the real compiled React app and routes with synthetic network data.
They do not log in to an actual backend. Existing fixture auth restores a mocked
Principal identity; that is not a credential-login test.

Each test executed and passed every step below:

| Scenario | Status | Evidence |
|---|---|---|
| Directory loading, teacher rows and selected theme | Passed, mocked | Loading/loaded screenshots and DOM assertions |
| Case-insensitive name, section and room search | Passed, mocked | Three searches matched only Ana |
| No matching records | Passed, mocked | Existing empty-result message visible |
| Gender and assigned/unassigned advisory filters | Passed, mocked | Ben/Ana selected correctly; gender menu clicked |
| Profile navigation and Class schedule tab | Passed, mocked | Profile heading and Mathematics schedule asserted |
| Return navigation within five-minute freshness window | Passed, mocked | Teacher endpoint remained at one request |
| Cached offline rows/error/Retry | Passed, mocked | Both rows retained; no busy region; screenshot captured |
| Three offline Retry clicks | Passed, mocked | No additional teacher requests |
| Reconnect with fresh cache | Passed, mocked | Alert removed; no refetch |
| Stale data after 301 seconds | Passed, mocked | Browser-only clock; one additional teacher request |
| Empty-cache reload with 500 and explicit retry | Passed, mocked | Existing error/Retry; one successful recovery request |
| Uncontrolled request loops | Passed, mocked | Stable request count during one-second observation |
| Browser page errors / unexpected console errors | Passed, mocked | Zero page errors; zero unexpected console errors |

Each viewport/theme test made four teacher requests in total: initial load,
stale refresh, deliberate reload failure, explicit recovery. Expected browser
resource-error console messages from controlled failures/offline conditions are
excluded from the unexpected-console assertion. No network latency or CPU
benchmark claim is made. Load observations include screenshots and are not
comparable production performance benchmarks.

Screenshots cover loading, loaded, schedule, cached offline, and errors in all
four viewport/theme combinations under `test-results/retained-build/`.
Mobile and desktop light cached-offline screenshots were visually inspected:
the alert, Retry and cached rows remain visible; mobile uses the existing wide
table/scrolling layout. These are evidence images, not automated pixel-baseline
comparisons. No claim of exhaustive pixel equivalence is made.

## Bundles and performance

`node scripts/check-bundle-budget.mjs` passed against **retained dist only**.
Public eager closure is 133,397 gzip bytes against 135,349; Admin eager download
beyond public is 140,817 against 151,512. Dependency guards found no TanStack
in public or non-Principal eager closures. The existing production role tests
also run against retained dist, regardless of the current source build failure.
No fresh-build performance conclusion is possible until the config is corrected.

## Changes made for testing

- `tests/query-pilot-acceptance.spec.ts`: four simulated responsive workflows.
- `playwright.acceptance.config.ts`: existing 74 regressions plus four new tests,
  per-test JSON results and failure screenshots; no credential traces/video.
- `playwright.acceptance-retained-build.config.ts`: separately labeled retained
  production artifact run, isolated server/output directory.
- This report. Generated screenshots/results remain in ignored test-results.

Targeted ESLint for these new test/config files passed. Existing xlsx security
findings remain an independent follow-up; no dependency changes were attempted.

## Remaining gates

Correct the API configuration only after user authorization, rerun compilation,
build and browser suites against the corrected source, and then run actual
read-only Principal browser workflows when an authorized test environment/account
is available. Cookie/CORS and real backend permission behavior remain unverified.
Chromium automation does not certify other browser engines or physical devices.

The following per-test ledger records actual execution results, not earlier
74-test results. A failed prerequisite does not count as passing its downstream
cache/auth/offline assertions. Retained-build tests are explicitly distinguished.

## Executed results and per-test ledger

### Current-source regression run

11 passed; 67 failed; 0 skipped; 552.5 seconds. JSON evidence: [results](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/acceptance-results.json).

| Test scenario | Status | Target / backend | Evidence | Remaining risk |
|---|---|---|---|---|
| bootstrap-loading.spec.ts:31 — bootstrap 60ms never shows the brand loader or status | Failed | Current source / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/bootstrap-loading-bootstra-8e2ef--the-brand-loader-or-status/test-failed-1.png) | Prerequisite failed; downstream assertions unverified |
| bootstrap-loading.spec.ts:68 — revealed bootstrap animates only the real logo opacity, never rotation | Passed | Current source / mocked API | Assertions and JSON result | Real backend unverified |
| bootstrap-loading.spec.ts:79 — bootstrap reduced motion has no running animation | Passed | Current source / mocked API | Assertions and JSON result | Real backend unverified |
| bootstrap-loading.spec.ts:90 — bootstrap busy and status follow reveal, minimum duration, and DOM cleanup | Failed | Current source / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/bootstrap-loading-bootstra-b3c52-um-duration-and-DOM-cleanup/test-failed-1.png) | Prerequisite failed; downstream assertions unverified |
| bootstrap-loading.spec.ts:106 — protected components and page requests never render before auth resolves | Failed | Current source / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/bootstrap-loading-protecte-7de89-render-before-auth-resolves/test-failed-1.png) | Prerequisite failed; downstream assertions unverified |
| bootstrap-loading.spec.ts:114 — lazy route 375: registered composition inside real shell with stable surroundings | Failed | Current source / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/bootstrap-loading-lazy-rou-5f557-ll-with-stable-surroundings/test-failed-1.png) | Prerequisite failed; downstream assertions unverified |
| bootstrap-loading.spec.ts:114 — lazy route 1280: registered composition inside real shell with stable surroundings | Failed | Current source / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/bootstrap-loading-lazy-rou-a7886-ll-with-stable-surroundings/test-failed-1.png) | Prerequisite failed; downstream assertions unverified |
| bundle-budget.spec.ts:4 — production entry and eager dependency closure stay within the fixed plus 10% budget | Passed | Retained dist / no API (static check) | Assertions and JSON result | Current-source/real-backend verification remains open |
| bundle-budget.spec.ts:10 — registry guard rejects an eager page import and accepts the restored metadata | Passed | Retained dist / no API (static check) | Assertions and JSON result | Current-source/real-backend verification remains open |
| directory-loading.spec.ts:8 — /principal/teachers 375px light: real controls and screenshots | Failed | Current source / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/directory-loading--princip-cc7d3-al-controls-and-screenshots/test-failed-1.png) | Prerequisite failed; downstream assertions unverified |
| directory-loading.spec.ts:8 — /principal/teachers 375px dark: real controls and screenshots | Failed | Current source / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/directory-loading--princip-ff641-al-controls-and-screenshots/test-failed-1.png) | Prerequisite failed; downstream assertions unverified |
| directory-loading.spec.ts:8 — /principal/teachers 1280px light: real controls and screenshots | Failed | Current source / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/directory-loading--princip-8f388-al-controls-and-screenshots/test-failed-1.png) | Prerequisite failed; downstream assertions unverified |
| directory-loading.spec.ts:8 — /principal/teachers 1280px dark: real controls and screenshots | Failed | Current source / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/directory-loading--princip-5d545-al-controls-and-screenshots/test-failed-1.png) | Prerequisite failed; downstream assertions unverified |
| directory-loading.spec.ts:8 — /principal/teachers/1 375px light: real controls and screenshots | Failed | Current source / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/directory-loading--princip-31990-al-controls-and-screenshots/test-failed-1.png) | Prerequisite failed; downstream assertions unverified |
| directory-loading.spec.ts:8 — /principal/teachers/1 375px dark: real controls and screenshots | Failed | Current source / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/directory-loading--princip-2eb34-al-controls-and-screenshots/test-failed-1.png) | Prerequisite failed; downstream assertions unverified |
| directory-loading.spec.ts:8 — /principal/teachers/1 1280px light: real controls and screenshots | Failed | Current source / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/directory-loading--princip-9f233-al-controls-and-screenshots/test-failed-1.png) | Prerequisite failed; downstream assertions unverified |
| directory-loading.spec.ts:8 — /principal/teachers/1 1280px dark: real controls and screenshots | Failed | Current source / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/directory-loading--princip-8c07e-al-controls-and-screenshots/test-failed-1.png) | Prerequisite failed; downstream assertions unverified |
| directory-loading.spec.ts:8 — /principal/students 375px light: real controls and screenshots | Failed | Current source / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/directory-loading--princip-f7569-al-controls-and-screenshots/test-failed-1.png) | Prerequisite failed; downstream assertions unverified |
| directory-loading.spec.ts:8 — /principal/students 375px dark: real controls and screenshots | Failed | Current source / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/directory-loading--princip-23185-al-controls-and-screenshots/test-failed-1.png) | Prerequisite failed; downstream assertions unverified |
| directory-loading.spec.ts:8 — /principal/students 1280px light: real controls and screenshots | Failed | Current source / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/directory-loading--princip-8cfc6-al-controls-and-screenshots/test-failed-1.png) | Prerequisite failed; downstream assertions unverified |
| directory-loading.spec.ts:8 — /principal/students 1280px dark: real controls and screenshots | Failed | Current source / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/directory-loading--princip-eab43-al-controls-and-screenshots/test-failed-1.png) | Prerequisite failed; downstream assertions unverified |
| directory-loading.spec.ts:8 — /principal/students/class/1 375px light: real controls and screenshots | Failed | Current source / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/directory-loading--princip-7d3f8-al-controls-and-screenshots/test-failed-1.png) | Prerequisite failed; downstream assertions unverified |
| directory-loading.spec.ts:8 — /principal/students/class/1 375px dark: real controls and screenshots | Failed | Current source / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/directory-loading--princip-d0265-al-controls-and-screenshots/test-failed-1.png) | Prerequisite failed; downstream assertions unverified |
| directory-loading.spec.ts:8 — /principal/students/class/1 1280px light: real controls and screenshots | Failed | Current source / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/directory-loading--princip-8c9de-al-controls-and-screenshots/test-failed-1.png) | Prerequisite failed; downstream assertions unverified |
| directory-loading.spec.ts:8 — /principal/students/class/1 1280px dark: real controls and screenshots | Failed | Current source / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/directory-loading--princip-e5507-al-controls-and-screenshots/test-failed-1.png) | Prerequisite failed; downstream assertions unverified |
| directory-loading.spec.ts:8 — /principal/students/grade/1 375px light: real controls and screenshots | Failed | Current source / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/directory-loading--princip-8672d-al-controls-and-screenshots/test-failed-1.png) | Prerequisite failed; downstream assertions unverified |
| directory-loading.spec.ts:8 — /principal/students/grade/1 375px dark: real controls and screenshots | Failed | Current source / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/directory-loading--princip-a600b-al-controls-and-screenshots/test-failed-1.png) | Prerequisite failed; downstream assertions unverified |
| directory-loading.spec.ts:8 — /principal/students/grade/1 1280px light: real controls and screenshots | Failed | Current source / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/directory-loading--princip-ac098-al-controls-and-screenshots/test-failed-1.png) | Prerequisite failed; downstream assertions unverified |
| directory-loading.spec.ts:8 — /principal/students/grade/1 1280px dark: real controls and screenshots | Failed | Current source / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/directory-loading--princip-05ed5-al-controls-and-screenshots/test-failed-1.png) | Prerequisite failed; downstream assertions unverified |
| directory-loading.spec.ts:8 — /parent/enrolled-children 375px light: real controls and screenshots | Failed | Current source / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/directory-loading--parent--f396b-al-controls-and-screenshots/test-failed-1.png) | Prerequisite failed; downstream assertions unverified |
| directory-loading.spec.ts:8 — /parent/enrolled-children 375px dark: real controls and screenshots | Failed | Current source / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/directory-loading--parent--24d41-al-controls-and-screenshots/test-failed-1.png) | Prerequisite failed; downstream assertions unverified |
| directory-loading.spec.ts:8 — /parent/enrolled-children 1280px light: real controls and screenshots | Failed | Current source / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/directory-loading--parent--76fc8-al-controls-and-screenshots/test-failed-1.png) | Prerequisite failed; downstream assertions unverified |
| directory-loading.spec.ts:8 — /parent/enrolled-children 1280px dark: real controls and screenshots | Failed | Current source / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/directory-loading--parent--3539a-al-controls-and-screenshots/test-failed-1.png) | Prerequisite failed; downstream assertions unverified |
| directory-loading.spec.ts:8 — /parent 375px light: real controls and screenshots | Failed | Current source / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/directory-loading--parent--a7215-al-controls-and-screenshots/test-failed-1.png) | Prerequisite failed; downstream assertions unverified |
| directory-loading.spec.ts:8 — /parent 375px dark: real controls and screenshots | Failed | Current source / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/directory-loading--parent--fe8f6-al-controls-and-screenshots/test-failed-1.png) | Prerequisite failed; downstream assertions unverified |
| directory-loading.spec.ts:8 — /parent 1280px light: real controls and screenshots | Failed | Current source / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/directory-loading--parent--5eb3c-al-controls-and-screenshots/test-failed-1.png) | Prerequisite failed; downstream assertions unverified |
| directory-loading.spec.ts:8 — /parent 1280px dark: real controls and screenshots | Failed | Current source / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/directory-loading--parent--be47b-al-controls-and-screenshots/test-failed-1.png) | Prerequisite failed; downstream assertions unverified |
| directory-loading.spec.ts:40 — principal directory auto-column classification requires observed variation | Failed | Current source / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/directory-loading-principa-0083d-requires-observed-variation/test-failed-1.png) | Prerequisite failed; downstream assertions unverified |
| query-pilot-acceptance.spec.ts:8 — simulated acceptance 375 light: filters, schedule, cache, offline and retry | Failed | Current source / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/query-pilot-acceptance-sim-cd22a-ule-cache-offline-and-retry/test-failed-1.png) | Prerequisite failed; downstream assertions unverified |
| query-pilot-acceptance.spec.ts:8 — simulated acceptance 375 dark: filters, schedule, cache, offline and retry | Failed | Current source / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/query-pilot-acceptance-sim-6d5a9-ule-cache-offline-and-retry/test-failed-1.png) | Prerequisite failed; downstream assertions unverified |
| query-pilot-acceptance.spec.ts:8 — simulated acceptance 1280 light: filters, schedule, cache, offline and retry | Failed | Current source / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/query-pilot-acceptance-sim-2cdc7-ule-cache-offline-and-retry/test-failed-1.png) | Prerequisite failed; downstream assertions unverified |
| query-pilot-acceptance.spec.ts:8 — simulated acceptance 1280 dark: filters, schedule, cache, offline and retry | Failed | Current source / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/query-pilot-acceptance-sim-b9ed5-ule-cache-offline-and-retry/test-failed-1.png) | Prerequisite failed; downstream assertions unverified |
| query-pilot-blockers.spec.ts:38 — offline initial request stops loading and resumes once without queued retries | Failed | Current source / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/query-pilot-blockers-offli-7b83c-once-without-queued-retries/test-failed-1.png) | Prerequisite failed; downstream assertions unverified |
| query-pilot-blockers.spec.ts:55 — offline cached directory keeps real rows and uses the existing error/retry UI | Failed | Current source / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/query-pilot-blockers-offli-a4b72-the-existing-error-retry-UI/test-failed-1.png) | Prerequisite failed; downstream assertions unverified |
| query-pilot-blockers.spec.ts:76 — a stale cached query paused offline retains data and refreshes once on reconnect | Failed | Current source / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/query-pilot-blockers-a-sta-851fe-refreshes-once-on-reconnect/test-failed-1.png) | Prerequisite failed; downstream assertions unverified |
| query-pilot-blockers.spec.ts:95 — late teachers 401 expires auth even after the other endpoint's 500 | Failed | Current source / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/query-pilot-blockers-late--bb1f0-er-the-other-endpoint-s-500/test-failed-1.png) | Prerequisite failed; downstream assertions unverified |
| query-pilot-blockers.spec.ts:108 — teachers 403 remains a permission error without expiring auth | Failed | Current source / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/query-pilot-blockers-teach-d7c02-error-without-expiring-auth/test-failed-1.png) | Prerequisite failed; downstream assertions unverified |
| query-pilot-blockers.spec.ts:95 — late year 401 expires auth even after the other endpoint's 500 | Failed | Current source / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/query-pilot-blockers-late--91993-er-the-other-endpoint-s-500/test-failed-1.png) | Prerequisite failed; downstream assertions unverified |
| query-pilot-blockers.spec.ts:108 — year 403 remains a permission error without expiring auth | Failed | Current source / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/query-pilot-blockers-year--42b88-error-without-expiring-auth/test-failed-1.png) | Prerequisite failed; downstream assertions unverified |
| query-pilot-blockers.spec.ts:118 — both endpoint failures show an error and recover through one explicit retry | Failed | Current source / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/query-pilot-blockers-both--2d183--through-one-explicit-retry/test-failed-1.png) | Prerequisite failed; downstream assertions unverified |
| query-pilot-blockers.spec.ts:135 — old 401 after an early 500 cannot expire a new session during switch | Failed | Current source / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/query-pilot-blockers-old-4-2f39c-a-new-session-during-switch/test-failed-1.png) | Prerequisite failed; downstream assertions unverified |
| query-pilot-blockers.spec.ts:135 — old 401 after an early 500 cannot expire a new session during logout-login | Failed | Current source / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/query-pilot-blockers-old-4-a2c24-session-during-logout-login/test-failed-1.png) | Prerequisite failed; downstream assertions unverified |
| query-pilot.spec.ts:5 — real directory UI retries errors and reuses cache after schedule navigation | Failed | Current source / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/query-pilot-real-directory-04d9e-e-after-schedule-navigation/test-failed-1.png) | Prerequisite failed; downstream assertions unverified |
| query-pilot.spec.ts:64 — authentication bootstrap must finish before requests start | Failed | Current source / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/query-pilot-authentication-a107e-inish-before-requests-start/test-failed-1.png) | Prerequisite failed; downstream assertions unverified |
| query-pilot.spec.ts:74 — preview and auth readiness suppress requests; fresh navigation deduplicates; expiry refetches | Failed | Current source / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/query-pilot-preview-and-au-5e921-duplicates-expiry-refetches/test-failed-1.png) | Prerequisite failed; downstream assertions unverified |
| query-pilot.spec.ts:96 — loading, errors, explicit retries and empty results | Failed | Current source / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/query-pilot-loading-errors-ee853-t-retries-and-empty-results/test-failed-1.png) | Prerequisite failed; downstream assertions unverified |
| query-pilot.spec.ts:115 — account switching cancels old work and discards cached identity data | Failed | Current source / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/query-pilot-account-switch-5565d-scards-cached-identity-data/test-failed-1.png) | Prerequisite failed; downstream assertions unverified |
| query-pilot.spec.ts:145 — teacher profile and schedule school-year caches remain independent | Failed | Current source / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/query-pilot-teacher-profil-f7d41-r-caches-remain-independent/test-failed-1.png) | Prerequisite failed; downstream assertions unverified |
| query-pilot.spec.ts:169 — logout and same-account login do not reuse directory data | Failed | Current source / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/query-pilot-logout-and-sam-6fdbf-do-not-reuse-directory-data/test-failed-1.png) | Prerequisite failed; downstream assertions unverified |
| query-pilot.spec.ts:183 — 401 expires the active session; 403 preserves auth and never retries automatically | Failed | Current source / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/query-pilot-401-expires-th-e3991-never-retries-automatically/test-failed-1.png) | Prerequisite failed; downstream assertions unverified |
| query-pilot.spec.ts:197 — a different role cannot fetch the principal directory | Failed | Current source / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/query-pilot-a-different-ro-b2f5e-tch-the-principal-directory/test-failed-1.png) | Prerequisite failed; downstream assertions unverified |
| role-bundles.spec.ts:11 — public login requests no protected role code | Passed | Retained dist / mocked API | Assertions and JSON result | Current-source/real-backend verification remains open |
| role-bundles.spec.ts:19 — TEACHER login requests only its own role code | Passed | Retained dist / mocked API | Assertions and JSON result | Current-source/real-backend verification remains open |
| role-bundles.spec.ts:19 — ADMIN login requests only its own role code | Passed | Retained dist / mocked API | Assertions and JSON result | Current-source/real-backend verification remains open |
| role-bundles.spec.ts:19 — PRINCIPAL login requests only its own role code | Passed | Retained dist / mocked API | Assertions and JSON result | Current-source/real-backend verification remains open |
| role-bundles.spec.ts:19 — PARENT login requests only its own role code | Passed | Retained dist / mocked API | Assertions and JSON result | Current-source/real-backend verification remains open |
| role-bundles.spec.ts:28 — a 1500ms role import uses bootstrap then the real shell and registered skeleton | Passed | Retained dist / mocked API | Assertions and JSON result | Current-source/real-backend verification remains open |
| role-bundles.spec.ts:50 — chart skeletons retain bars, line and radar while the heavy chart chunk is unavailable | Passed | Retained dist / mocked API | Assertions and JSON result | Current-source/real-backend verification remains open |
| user-details-loading.spec.ts:23 — user details 375 light: real field labels and actions | Failed | Current source / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/user-details-loading-user--628b8-al-field-labels-and-actions/test-failed-1.png) | Prerequisite failed; downstream assertions unverified |
| user-details-loading.spec.ts:23 — user details 375 dark: real field labels and actions | Failed | Current source / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/user-details-loading-user--8a661-al-field-labels-and-actions/test-failed-1.png) | Prerequisite failed; downstream assertions unverified |
| user-details-loading.spec.ts:23 — user details 1280 light: real field labels and actions | Failed | Current source / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/user-details-loading-user--d4f6f-al-field-labels-and-actions/test-failed-1.png) | Prerequisite failed; downstream assertions unverified |
| user-details-loading.spec.ts:23 — user details 1280 dark: real field labels and actions | Failed | Current source / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/user-details-loading-user--184b5-al-field-labels-and-actions/test-failed-1.png) | Prerequisite failed; downstream assertions unverified |
| user-details-loading.spec.ts:41 — ADMIN details preserve short and wrapping fields | Failed | Current source / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/user-details-loading-ADMIN-dd239-e-short-and-wrapping-fields/test-failed-1.png) | Prerequisite failed; downstream assertions unverified |
| user-details-loading.spec.ts:41 — PRINCIPAL details preserve short and wrapping fields | Failed | Current source / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/user-details-loading-PRINC-a0ef7-e-short-and-wrapping-fields/test-failed-1.png) | Prerequisite failed; downstream assertions unverified |
| user-details-loading.spec.ts:41 — PARENT details preserve short and wrapping fields | Failed | Current source / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/user-details-loading-PAREN-9f025-e-short-and-wrapping-fields/test-failed-1.png) | Prerequisite failed; downstream assertions unverified |
| user-details-loading.spec.ts:53 — user details error removes shapes and retries the account request | Failed | Current source / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/user-details-loading-user--83953-retries-the-account-request/test-failed-1.png) | Prerequisite failed; downstream assertions unverified |
| user-details-loading.spec.ts:65 — missing user uses the real not-found state only after the request | Failed | Current source / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/user-details-loading-missi-18383-tate-only-after-the-request/test-failed-1.png) | Prerequisite failed; downstream assertions unverified |
| user-details-loading.spec.ts:73 — teacher user details wait for the teacher ID mapping and preserve real profile controls | Failed | Current source / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/user-details-loading-teach-ef540-serve-real-profile-controls/test-failed-1.png) | Prerequisite failed; downstream assertions unverified |
### Retained-build responsive run

4 passed; 0 failed; 0 skipped; 19.6 seconds. JSON evidence: [results](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/retained-build-results.json).

| Test scenario | Status | Target / backend | Evidence | Remaining risk |
|---|---|---|---|---|
| query-pilot-acceptance.spec.ts:8 — simulated acceptance 375 light: filters, schedule, cache, offline and retry | Passed | Retained dist / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/retained-build/query-pilot-acceptance-sim-cd22a-ule-cache-offline-and-retry/attachments/loading-cf1989342bc7d348579a88d18ff892cf85dc71c6.png) | Current-source/real-backend verification remains open |
| query-pilot-acceptance.spec.ts:8 — simulated acceptance 375 dark: filters, schedule, cache, offline and retry | Passed | Retained dist / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/retained-build/query-pilot-acceptance-sim-6d5a9-ule-cache-offline-and-retry/attachments/loading-18cd6a06458365f2e0d3350f565c9355af6a2c68.png) | Current-source/real-backend verification remains open |
| query-pilot-acceptance.spec.ts:8 — simulated acceptance 1280 light: filters, schedule, cache, offline and retry | Passed | Retained dist / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/retained-build/query-pilot-acceptance-sim-2cdc7-ule-cache-offline-and-retry/attachments/loading-dba9fadadb10620a71ebc425c97e33a8c1fd0dec.png) | Current-source/real-backend verification remains open |
| query-pilot-acceptance.spec.ts:8 — simulated acceptance 1280 dark: filters, schedule, cache, offline and retry | Passed | Retained dist / mocked API | [screenshot](C:/Users/Mavys/Downloads/QED_System/QED_front_end/test-results/retained-build/query-pilot-acceptance-sim-b9ed5-ule-cache-offline-and-retry/attachments/loading-d18f5c2b609f84087a2047b0541042b56dfc4640.png) | Current-source/real-backend verification remains open |

### Retained-build observations (synthetic API data)

| Viewport | Theme | Load observation including screenshot (ms) | Teacher requests across entire workflow | Page errors | Unexpected console errors |
|---|---|---:|---:|---:|---:|
| 375 | Light | 680 | 4 | 0 | 0 |
| 375 | Dark | 683 | 4 | 0 | 0 |
| 1280 | Light | 1616 | 4 | 0 | 0 |
| 1280 | Dark | 690 | 4 | 0 | 0 |
