# Admin login analytics authorization correction

Date: 2026-10-11. Scope: backend security correction only. No TanStack Query
migration, frontend service/UI change, or deployment.

## Root cause and correction

GET `/api/analytics/login-frequency` previously ran `verifyToken` then the
statistics controller. JWT validity was checked, but the signed role was not.
Any authenticated identity could retrieve school-wide sign-in aggregates.

The route now runs an explicit Admin-only guard after the unchanged `verifyToken`
middleware and before the unchanged controller. Only a string JWT role whose
case-normalized value equals `ADMIN` proceeds. Case normalization follows existing
backend role-checking conventions. Principal, Teacher, Parent, unknown, missing,
empty, null, numeric, boolean, array, object and whitespace-padded role values
are denied. Query/body/header role fields are not consulted.

The denial response follows the existing audit-log Admin guard convention:
403 `{ success: false, message: "Administrator access is required." }`.
The existing authentication contract remains missing cookie = 401, and invalid,
expired, wrong-signature, unsigned or not-yet-active JWT = 403 with the existing
authentication message. Endpoint, method, period arguments, SQL, calculations,
date logic and successful Admin response schema are unchanged.

## Before-and-after evidence

The same 71 focused tests were executed before and after adding the guard.
Before: 30 passed / 41 failed. After: 71 passed / 0 failed. Pre-fix failures are
retained as evidence of the vulnerability, not suppressed final gate failures.

| Identity / request | Before | After | After controller / database calls |
| --- | --- | --- | --- |
| Missing authentication | 401 | 401 | 0 / 0 |
| Invalid/expired/wrong-signature/unsigned/not-active JWT | 403 | 403 | 0 / 0 |
| Signed Admin, lower-case admin or mixed-case AdMiN | 200 | 200 | 1 / 2 weekly/monthly; 1 / 1 yearly |
| Signed Principal, Teacher or Parent | 200 | 403 | 0 / 0 |
| Signed unknown/missing/malformed role | 200 | 403 | 0 / 0 |
| Signed Teacher with Admin query/body/header spoof | 200 | 403 | 0 / 0 |
| Signed string JWT payload without a role | 200 | 403 | 0 / 0 |
| Unauthorized invalid period | 400 | 403 | 0 / 0 |
| Authorized invalid period | 400 | 400 | 1 / 0 |

Role/authentication cases cover weekly, monthly and yearly. The unauthorized
invalid-period case proves authorization precedes even controller validation.
No unauthorized test reached the real controller or database double.

## Test isolation and authorized response goldens

`test/loginFrequencyAuthorization.test.js` uses the actual Express router,
cookie parser, JWT verification and controller over an ephemeral loopback HTTP
server. An inert database double is installed in the module cache BEFORE the
controller loads; no `.env`, database module initialization, production server,
real account or remote database is used. JWTs use synthetic identities and a
process-local random secret. Tokens/cookies are never printed or attached to
assertions. A wrapper counts calls while executing the actual controller logic.

The test freezes only Date at 2026-10-11 12:00 Manila and supplies deterministic
non-empty string-count fixtures. Identical authorized goldens passed before and
after the guard, checking the complete chart/summary, ordering, zero values,
numeric conversion, rounding, growth, peak labels and date-range SQL parameters.

| Period | Preserved golden results |
| --- | --- |
| Weekly | Mon=7, Sun=14, other days=0; daily average 3; growth 50%; peak Sun |
| Monthly | 31 days; day 1=11, day 5=7, day 11=14; daily average 2.9; growth 128.6%; peak 11 |
| Yearly | 12 months; Jan=10, Oct=30; monthly average 4; growth 100%; peak Oct |

Default weekly and uppercase WEEKLY retain the exact weekly contract. Invalid
Admin period retains the exact 400 message without database operations.
All authorized SQL calls remain SELECTs. No statistics implementation was changed.

## Regression verification

All required gates passed on the corrected checkout:

| Gate | Result | Verification boundary |
| --- | --- | --- |
| Existing isolated backend baseline | 165/165 | Existing Calendar authorization and grading/template fixtures |
| New focused security suite before guard | 30 passed / 41 failed | Intentional red vulnerability evidence |
| New focused security suite after guard | 71/71 | Actual local HTTP/router/JWT/controller; database double |
| Complete isolated backend suite after guard | 236/236 | All five backend test files; zero failures/skips |
| TypeScript `npx tsc -b` | Passed | Frontend compilation |
| Fresh `npm run build` | Passed | TypeScript, Vite and bundle guards |
| Complete existing source acceptance suite | 530/530, 10.1 minutes | Mocked browser APIs/auth plus local source/golden/bundle checks |
| Complete fresh-production acceptance suite | 231/231, 5.5 minutes | Newly built artifact; mocked browser APIs/auth |
| Explicit production bundle guard | Passed | Existing byte budgets and role-isolation checks unchanged |
| Backend router/test syntax and router whitespace checks | Passed | `node --check` and scoped `git diff --check` |

Both browser JSON reports contain zero unexpected failures, skipped tests or
flaky outcomes. Playwright retries and assertions were unchanged. The expected
41 pre-fix failures are the only test failures from this increment; no final
regression failure remains. Node emits the normal experimental MockTimers warning
for the test-only frozen Date API; it is not a test failure.

The backend suite includes the preserved 88 Calendar authorization and 77 grading/
template tests. The source suite includes Calendar service credential contracts
and the roster reload synchronization regressions. The complete frontend suites
retain Principal workflows and Teacher/Parent isolation checks. These mocked
frontend tests do not exercise the actual backend authorization guard; that proof
comes from the isolated real-HTTP security suite above.

Public eager gzip remains 133,384 bytes (budget 135,349); Admin eager download
beyond public remains 141,045 bytes (budget 151,512), both identical to the previous
verified blocker-checkpoint artifact. Existing public/role Query isolation guards
passed. No frontend code or dependencies changed. The bundle-audit hash remained
unchanged from the fresh build through both acceptance suites.

## Exact changed files

Backend checkout `C:/Users/Mavys/Downloads/QED_System/thesis_qed`:

1. `src/modules/authentication/loginfrequency.router.js` — seven-line Admin guard.
2. `test/loginFrequencyAuthorization.test.js` — 71 isolated security/contract tests.

Frontend checkout `C:/Users/Mavys/Downloads/QED_System/QED_front_end`:

3. `QED-ADMIN-ANALYTICS-AUTHORIZATION-VERIFICATION.md` — this report only.

Ignored evidence is retained under
`test-results/admin-analytics-security-verification/`. All 95 initially modified/
untracked frontend files and all 25 initially modified/untracked backend files
remain byte-identical. The only newly changed files are the three listed above.
Generated tracked screenshots were initially clean and restored after testing.
Calendar authorization, roster synchronization and the API toggle remain intact.
Both Git indexes are empty and both HEADs unchanged: no stage, commit, push or
deployment was performed.

## Remaining limits and stop boundary

This proves local backend routing/JWT/controller authorization with a mocked
database, not deployed real-account or real-database acceptance. Browser API/auth
responses in the frontend acceptance suites are mocked. Deployed cookie/CORS/TLS
behavior and installation of the backend fix require a separate release check.
Existing signed-role claim lifetime/revocation semantics remain unchanged; this
is not a system-wide security audit. The localhost/Render toggle is untouched;
the tested production-mode frontend artifact still uses the selected local API
configuration and is not a Render release artifact.

The historical Admin Dashboard migration report documents the original discovery;
this report records its narrowly authorized correction. No Admin Dashboard Query
migration is resumed. Stop after verification; no stage, commit, push or deployment.
