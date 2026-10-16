# Calendar authorization and roster reload stabilization

Date: 2026-10-11. Scope: the two approved blockers only; no Query migration.

## Calendar backend authorization

All six POST/PUT/DELETE Calendar routes previously registered only a controller.
The server's audit middleware records requests but does not authenticate them.
The four public GET routes are intentionally unchanged in this targeted fix.

Each write now runs the existing cookie/JWT `verifyToken` middleware followed by
an explicit Admin/Principal role check before entering the unchanged controller.
Roles are normalized for case, matching existing backend authorization patterns;
missing, non-string and other roles are denied. Caller-provided body roles cannot
elevate a signed Teacher identity. No controller, SQL, schema, endpoint path,
successful payload/response, validation or not-found behavior was modified.

The existing authentication response contract is preserved: missing cookie is
401; invalid/expired JWT is 403; valid disallowed role is 403 with a Calendar
permission message. This fix does not change session lifetime or global auth
status semantics. JWT verification precedes every Calendar role decision.

The reused authentication middleware no longer logs token fragments or JWT
verification messages. Its decisions/statuses remain unchanged. Calendar service
writes now explicitly include cookies with `credentials: "include"`, required for
the existing frontend/API cross-origin workflow. Request bodies, mappings, errors
and all four reader calls are unchanged. No Calendar UI or Query hook was changed.

### Security verification method

`../thesis_qed/test/calendarAuthorization.test.js` starts an ephemeral loopback
Express server with the real Calendar router, real JWT verification, cookie
parser and real controllers. Only database access is replaced with an inert
double installed before controllers load. No `.env`, production server or real
database is loaded. JWTs use a process-local random test secret and synthetic
claims; token/cookie values are not logged. This is local HTTP backend-code
verification with a mocked database, **not deployed/real-database verification**.

The 88 checks cover all six endpoints with missing cookies, malformed/expired/
wrong-signature/unsigned tokens, signed Teacher/Parent/unknown/missing roles,
authorized Admin/Principal (both role cases), exact successful payload/response
contracts, no database calls on denial, 404 behavior, input validation, role
spoofing, no token logging and unchanged public GETs. Before the fix, 33 passed
and 55 failed, exposing the unguarded writes. After the fix, all 88 passed.

Three mocked browser service checks execute the actual frontend Calendar service
and verify six credentialed writes, exact bodies/mappings, one dispatch per
operation, existing 401/403 error messages, and unchanged four reader calls.
They do not claim that deployed CORS/cookie settings were exercised.

## Roster regression root cause and correction

The previous complete source run failed the unassigned-grade desktop/light test
at its post-reload 500-error assertion. Its screenshot contained only the global
bootstrap loader. That test waited for auth/lazy-route handoff on initial
navigation, but started its roster-error assertion immediately after reload.
Reload completes document loading; it does not imply that cookie-session/profile
restoration, lazy role code and route mounting have finished. The application
correctly prevents roster requests before authentication is ready.

A controlled investigation held `/api/auth/me` during the existing workflow's
reload. The historical error assertion failed exactly as before while the
bootstrap gate was pending. Sanitized evidence recorded `authSeen:true`,
`bootstrapPending:true`, and roster dispatch counts `beforeReload:3`,
`afterReload:3`: no new roster request had started. This establishes a test
synchronization defect at the auth/route boundary, rather than evidence of a
roster Query cache/error defect. The historical run had no auth timing trace,
so its precise latency source cannot be reconstructed; cold compilation or
resource contention need not be assumed to explain the invalid synchronization.

The existing test now calls `waitForDataRoute(page)` after reload, before the
unchanged exact 500-error assertion. Default timeouts, retries, payload fixtures,
fresh/stale cache assertions, cancellation accounting, explicit Retry behavior,
403/401 checks elsewhere and production exact request counts remain unchanged.
No application caching or loading code was modified.

Four new controlled browser cases hold either session restoration or profile
restoration, for both class and unassigned-grade routes. They prove zero roster
dispatch/data exposure during the held gate, then synchronize route readiness,
assert the exact 500 error and recover with an explicit Retry. The shared request
ledger correlates terminal HTTP events with Request identity. Each run requires
exactly two successful completions and one 500 completion; development probes
are allowed only as individually identified aborted requests. Production requires
zero aborts and exactly three dispatched GETs. No arbitrary sleeps were added.

### Exploratory failures retained

- Pre-fix backend security suite: 55 expected failures / 88, proving absent guards.
- First controlled reload probe: one diagnostic-only failure from incorrectly
  selecting a status by accessible name; the status text is content, not its
  accessible name. The probe was corrected; no application change was needed.
- Corrected controlled historical reload assertion: one intentional failure with
  authentication held and no new roster dispatch. Evidence is retained.

These are investigation results, not suppressed or retried final gate failures.

## Final verification

All final gates passed on the corrected checkout. Browser API/authentication
responses are deterministic mocks; none of these results claim real-backend
account acceptance. Playwright retries remain zero.

| Gate | Result | Verification boundary |
| --- | --- | --- |
| TypeScript `npx tsc -b` | Passed | Frontend compilation |
| Fresh `npm run build` | Passed | TypeScript, Vite, production bundle guards |
| Focused roster / Calendar transport source tests | 19/19 | Mocked browser APIs |
| Repeated affected roster + four controlled cases, source | 25/25 (5 repetitions; 1.8m) | Mocked browser APIs |
| Complete source suite, first run | 530/530 (15.5m) | Mocked browser APIs and local source/golden/bundle checks |
| Complete source suite, second run | 530/530 (15.4m) | Same conditions; no application edits between runs |
| Complete fresh-production suite | 231/231 (6.8m) | Newly built artifact; mocked browser APIs |
| Repeated affected roster + four controlled cases, production | 25/25 (5 repetitions; 1.1m) | Same fresh artifact; mocked browser APIs |
| Existing Calendar UI, source | 16/16 (1.4m) | Four roles, mobile/desktop, light/dark; mocked APIs |
| Existing Calendar UI, fresh production | 16/16 (29.5s) | Same four-role matrix; mocked APIs |
| Calendar authorization / controller contracts | 88/88 | Real local HTTP/JWT/controllers; database double |
| Existing backend grading/template tests | 77/77 | Isolated fixtures, no live academic data |
| Complete isolated backend suite, three consecutive runs | 165/165 each | Includes the 88 security and 77 existing grading/template checks |
| Targeted frontend ESLint and backend syntax checks | Passed | Changed service/tests/configurations and middleware/router |

The complete source/production and repeated-run JSON reports contain zero
unexpected failures, skipped tests or flaky outcomes. The final whole-checkout
regression gate is clean in these executed environments; repetition is evidence
of stability, not a guarantee against every future timing condition. Previously
completed Principal migrations passed the complete suites unchanged.

Public eager gzip remains 133,384 bytes (135,349 budget). Admin eager download
beyond public is 141,045 bytes (151,512 budget), down 6 bytes from the preserved
pre-fix artifact. Teacher/Principal/Parent corresponding sizes fell 4/8/8 bytes.
Existing role-isolation and bundle assertions passed unchanged. No Query imports
were added to Calendar or other accounts. No runtime performance benchmark was
performed; bundle and deterministic request-count evidence show no regression.

The frontend source hashes and production bundle-audit hash remained identical
from the fresh build through the final browser checks. Evidence, including all
exploratory failures, is retained in ignored `test-results/two-blockers-verification/`.

## Exact files changed in this increment

Backend (paths relative to `../thesis_qed`):

1. `src/modules/shared/calendar/calendar.router.js` — authenticate and authorize
   all six writes.
2. `src/modules/authentication/authentication.middleware.js` — remove token/JWT
   logging without changing verification or response behavior.
3. `test/calendarAuthorization.test.js` — isolated real-HTTP security/controller
   regression tests with database double.

Frontend (paths relative to this repository):

4. `src/shared/calendar/services/calendar.service.ts` — credentials on writes only.
5. `tests/roster-query-acceptance.spec.ts` — post-reload route-readiness gate.
6. `tests/roster-reload-synchronization.spec.ts` — four controlled lifecycle cases.
7. `tests/calendar-transport.spec.ts` — actual browser service contract checks.
8. `playwright.acceptance.config.ts` — include the new source regression tests.
9. `playwright.acceptance-build.config.ts` — include production reload regressions.
10. `TANSTACK-QUERY-MIGRATION-ROADMAP.md` — updated blocker checkpoint; historical
    content preserved.
11. `QED-MIGRATION-BLOCKERS-VERIFICATION.md` — this report.

Ignored logs/JSON/screenshots are verification artifacts, not application changes.
Initial modified/untracked files were hashed in both repositories. Of 90 initial
frontend files, only the four explicitly extended files changed: the two
acceptance configurations, existing roster acceptance test and roadmap. The other
86 stayed byte-identical. All 22 initially modified/untracked backend files stayed
byte-identical. Newly changed files match the seven remaining files listed above.
Generated tracked screenshots were initially clean and restored after testing.
The original roadmap below the new checkpoint remains byte-identical. Both Git
indexes remain empty; no stage, commit, push or deployment was performed.

## Remaining limits and release considerations

No authorized live account or real database was used. Deployment must deliver the
backend guard and frontend credential change together. Existing production
origin/cookie/TLS configuration must still be validated against the real backend;
the local mocked browser suites cannot prove it. Existing shared JWT policy uses
signed role claims until token expiry; account revocation and system-wide CSRF
protection were not expanded by this narrow fix. This is not an exhaustive audit
of unrelated endpoints. Existing Calendar deletion semantics are unchanged.

The manual localhost/Render API toggle is preserved; the fresh production-mode
artifact is built using the currently selected local endpoint for acceptance.
It is not a Render release artifact. The existing xlsx advisory remains a separate
security follow-up. No academic, intervention, parent-visibility or grading
calculations changed.

Stop after this checkpoint. The recommended next migration remains the independent
Admin dashboard readers, only after reviewing this report; no account or shared
Query migration is included here.
