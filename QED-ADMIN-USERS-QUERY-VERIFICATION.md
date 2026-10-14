# Admin User Management Query verification — 2026-10-12

## Scope and dependency decision

Only existing Admin User Management readers and their associated mutation
invalidation were migrated. The backend, security corrections, Principal
migrations, other accounts, API toggle and dependencies are unchanged.

Actual consumers were inspected before implementation. UsersProvider is eager
and Dashboard consumes its loading flag. Actual user pages are lazy. Putting
Query directly in that provider would violate the existing role/bundle guard.
The provider therefore keeps a Query-free bootstrap read on non-user routes until
the real lazy User Management page activates UsersQueryDriver. Completed bootstrap
data transfers with its original timestamp; the manual cache is then retired.
If bootstrap is still pending it is cancelled and Query owns the read. The facade
publishes the Query result, rather than maintaining an independent mutable cache.
The driver unmounts outside User Management, preserving cancellation and inactive
collection. Auth identity/generation remounts the facade and page drafts.

List, detail, edit seeding and active-Principal conflict checks use one list.
Role-table IDs collide, so detail lookup retains role AND ID. getUserById has no
actual consumer; it is preserved unchanged instead of inventing detail requests.
Search and role/status filters are local. There are no existing sorting or
pagination controls/API parameters; server order is preserved.

Admin Teacher details also use TeachersContext to map auth ID to Teacher ID and
the existing legacy profile/schedule cache. Successful Teacher writes clear that
profile cache and refresh the lookup; they do not migrate the shared reader,
remove school-year caching or change Principal's separate Query adapter.

## Keys, cache policy and requests

U = `['session', generation, role, String(userId), 'admin', 'users', 'list']`.
The only eligible GET is `/api/user/usersList`. There are no server filters,
academic-year or term parameters to add. Freshness is 30 seconds, inactive GC
five minutes, retry false, focus refetch false, reconnect true, no polling.
Refetch/Retry skips offline and in-flight requests; AbortSignal reaches fetch.
401 expiry occurs before body parsing with captured session and lifecycle guards.
403 hides cached private data without logging out. Offline requests settle the
loading UI, retain authorized cached records and resume when appropriate.

Existing centralized QueryClient/auth cleanup is reused. Query-dependent imports
exist behind UsersQueryDriver, not the eager Admin facade. Route previews and
unready/non-Admin authentication cannot activate reads or writers.

D = `['session', generation, role, String(userId), 'admin', 'dashboard']`.

| Confirmed successful request | Refresh/invalidation |
| --- | --- |
| POST `/api/user/addUser` | U (including derived details/conflict), D + users, D + audit prefix |
| PUT `/api/user/editUser/:id` (including status) | Same |
| PATCH `/api/user/deleteUser/:id` | Same |
| Teacher write in any of these | Also existing teacher-profile cache + TeachersContext lookup |
| Failed/offline/old-session write | None |

Mutations have retry false, no optimistic records and no queued offline writes.
Identical pending writes coalesce. The form preserves its existing exact payload,
one authorized provisioning POST, server-owned identity/password and truthful
credential-delivery feedback. Deletion waits for success before closing or
navigating and reports a failed request through the existing error/Retry pattern.
Student counts and frequency are unaffected. Other ClassesContext name projections
retain their legacy refresh behavior; the future Classes migration must map them.

## Request-count evidence (mocked APIs)

Counts below describe production request behavior. Baseline behavior comes from
the reviewed existing implementation and baseline UI goldens (not a saved
real-backend network capture). After counts are asserted by browser tests.
Development cancellation probes are separately correlated by Request identity,
not treated as successful reads.

| Scenario | Before | After |
| --- | --- | --- |
| Query-free Dashboard bootstrap → fresh Users | One provider list GET | One total; timestamp-preserving handoff adds zero |
| Fresh Users → other page → Users | Existing provider state reused | Zero additional list GETs |
| Stale return after 30 seconds | Legacy provider stayed unchanged until explicit refresh | Exactly one completed revalidation |
| Local search/role/status | Zero additional GETs | Zero; no request query parameters invented |
| Successful creation | One POST + one list refresh | One POST + one list refresh; no registration POST |
| Successful edit/status or deletion | Manual local update or form refetch | One write + one list refresh; no optimistic patch |
| Failed 403/409/500 mutation | Existing error contract | One write, zero list/count/audit invalidation |
| Concurrent identical creation | Form submit guard | One POST, additionally coalesced at mutation boundary |
| Teacher profile load/refresh in production | One legacy GET per uncached mount | One; lookup refreshed once after successful Teacher write |

The unchanged legacy schedule hook runs twice under development StrictMode and
does not deduplicate its profile promises. Both completed GETs are explicitly
asserted in source, versus one in production; this is a retained shared-reader
limitation, not an expansion of the migration. Migrated user Query and Dashboard
readers assert one completion plus identified cancellation probes in source, and
exactly one total request in production.

## Verification

Evidence: `C:\Users\Mavys\AppData\Local\Temp\qed-admin-users-query-20261012`.
Browser tests use deterministic mocked APIs/authentication; the actual browser,
React pages, auth lifecycle, QueryClient, router and production artifact run.
Backend tests use actual local routers/JWT/controllers with isolated database
doubles. No live database, accounts, credentials or email delivery were used.

| Gate | Before implementation | Final |
| --- | --- | --- |
| Complete isolated backend | 452/452 | 452/452 |
| Focused provisioning/recovery/delivery + grading/template | Included in baseline backend | 249/249 |
| Source acceptance | 597/597 | 646/646 final (original 645 retained + one new watcher guard); exploratory failures below |
| Fresh-production acceptance | 267/267 | 286/286 final (original 285 retained + new watcher guard); three earlier 285/285 runs passed |
| User UI goldens against original fresh build | 5/5 | Included in new suites |
| Query lifecycle harness | N/A | 30/30; repeated in full source |
| New production pages + UI goldens | N/A | 18/18 |
| Teacher refresh source repeats | N/A | 3/3, retries zero |
| Existing user-form loading/payload/contrast | Existing assertions retained | 17/17 |
| TypeScript + fresh build + unchanged bundle budgets | Pass | Pass |
| Backend syntax | Existing code unchanged | 11 existing auth/user-record/Calendar security files; pass |

New coverage: 30 source hook cases, 13 page workflows and five goldens. Page/golden
cases run in both source and fresh production. Security tests still prove
non-Admin denial, server-owned provisioning transactions and recovery protections.
The browser suite alone does not prove backend persistence or authorization.

Scoped lint: six errors and one warning remain in existing wrapper/context
patterns (export-star Fast Refresh, useUsers/principalConflict exports and form
ref mutation/dependencies). HEAD-source stdin lint reproduces those same findings;
the old UsersContext explicit-any error is removed. New query driver/hooks,
transport, modal and test files have no lint findings. No rules were suppressed.
The repository-wide lint debt remains outside this migration.

## Exploratory failures and corrections

All exploratory failures are retained in evidence logs; retries were not increased.

- `query-focused-1.log`: 18 failed / 11 passed. Exact raw-request assertions in a
  cold StrictMode harness counted a cancelled lifecycle probe. Controlled lifecycle
  cases now use a single mount; a dedicated StrictMode case and actual Vite pages
  separately assert successful and cancelled Request identities. Rerun 30/30.
- `pages-focused-1.log`: six failed / seven passed. Three used the wrong existing
  sidebar label (Manage Users); two sampled counts before real initial data arrived;
  one used button instead of menuitem for View. Correct locators and rendered-data/
  completed-request synchronization retain the original counts. No sleep added.
- `pages-production-1.log`: three failed / 23 passed (same deletion synchronization
  and menuitem issues); corrected production rerun 18/18.
- `focused-final.log`: one failed / 55 passed. It expected a single development
  legacy schedule GET, although the unchanged StrictMode hook runs twice.
- `teacher-refresh-repeat.log`: three failed. After distinguishing legacy profile
  reads, the new source Dashboard count assertion similarly counted cancelled
  Query probes. Request-ledger assertions now require one completed read and
  individually account for abortions, as existing Dashboard tests already do.
  Corrected repeat: three passed, zero retries.
- `source-final.log`: 644 passed / one failed, 15.1 minutes. The unchanged Admin
  Dashboard polling test read Date.now() across browser calls and paused one
  millisecond later. That deadline could already be past before Playwright acted
  (`Cannot fast-forward to the past`); no application timer or request assertion
  was involved in that failure. The test now freezes virtual time on the blank
  page before navigation, then observes completed initial requests and advances
  one virtual millisecond to drain Query's zero-delay notification queue. All
  existing 30-second interval, endpoint count and bounded-Retry assertions remain.
- `dashboard-poll-repeat.log`: the first stationary-clock correction failed 20/20
  because the initial Query notifications could not render while the clock was
  frozen. The explicit notification-queue drain above corrects that test setup;
  `dashboard-poll-correction-check.log` passed 1/1. No application code was changed.
  `dashboard-poll-repeat-final.log`: 20/20 passed in 1.2 minutes with zero retries,
  while the fresh full-source rerun ran concurrently. The full-source result is
  recorded above after completion. Dashboard implementation and polling unchanged.

No existing Directory, Dashboard, roster, grade, security, request-count or bundle
assertion was weakened. The extra Dashboard request batch was reproduced as a
development-server document reload; its correction is described below.

## Resumed regression investigation

The paused `source-final-current.log` stopped after 588 passed and one failure,
with the remaining cases interrupted at the user's request. The failure was the
Principal Dashboard 375px dark-mode workflow: active-term calls were two instead
of one after local ranking selection/modal closure, before navigation, offline
recovery or clock advancement. The saved failure had no Query lifecycle trace.
Its roughly four-second duration does not establish a stale-time expiration.

The next standalone full-source run captured a related Dashboard failure: all
eleven endpoints completed twice before the deliberate stale refresh. The
sanitized trace contained two document lifecycles and a new Query cache in each;
both active-term requests completed 200. This was a full browser-document reload,
not a same-cache retry or cancelled transport. It occurred immediately after the
verification report was edited while Vite was watching. Editing watched inputs
during that run contaminated verification and was a testing mistake.

A controlled local experiment then proved the trigger: after one completed
Dashboard batch, writing this report caused a Vite websocket `full-reload`, a new
document, and exactly two completed GET batches (`report-reload-probe.log`, 1/1).
The installed Tailwind/Vite source watcher treats these source/report inputs as
development dependencies. No authentication, cache freshness or retry change is
needed to address this test-environment interference. The original mobile failure
did not retain a navigation trace, so that individual historical event cannot be
reconstructed with certainty; the identical extra-request mechanism is now
reproduced and protected against.

Minimum correction: source acceptance's web-server child sets
`QED_ACCEPTANCE_STATIC=1`; `vite.config.ts` sets `server.watch=null` only under
that flag. Normal development retains default watching/HMR, production output
is unchanged, and explicit browser reloads/navigation/offline recovery still run.
An added configuration regression proves both watcher branches. All original
645 source cases and 285 production cases are retained; the new guard raises
those totals to 646 and 286 respectively. No request-count, assertion, bounded
retry, academic or security behavior was changed.

The after-fix controlled probe writes the same report, exercises ranking/modal
selection and away/back navigation, then verifies unchanged `performance.timeOrigin`,
zero Vite reloads and exactly one completed initial/fresh GET batch. It passed
1/1 (`report-reload-fixed-probe.log`).

Added opt-in `QED_DASHBOARD_DIAGNOSTICS=1` source-test instrumentation records:

- Path-only GET dispatches, cancellation and browser terminal events.
- Query resource keys, anonymous scope ordinals, observer additions/removals,
  fetch actions/status, data update timestamps/counts and stale state.
- Fixed action labels for ranking expansion/closure, menu and Retry.

No identity values, response bodies, headers, cookies, passwords or tokens are
recorded. The final helper observes the existing source QueryClient only after
the first application request, avoiding premature client imports. With the flag
unset it is a no-op; it never imports source modules into production.

Executed with one worker and zero retries:

| Resumed investigation / gate | Result |
| --- | --- |
| Original instrumented mobile dark workflow | 20/20 passed |
| Buffered diagnostics with 2x browser CPU slowdown | 20/20 passed |
| Extended original mobile dark workflow | 100/100 passed, 12.8 minutes |
| Full source with concurrent verification jobs | 643 passed / 2 failed, 17.8 minutes; Dashboard passed |
| New independent failures repeated unchanged | 40/40 passed, 1.0 minute |
| Standalone complete source before watcher correction | 644 passed / 1 failed, 13.1 minutes; captured two document lifecycles |
| Corrected mobile case + delayed-year case + watcher guard, repeated 20 times | 60/60 passed, 3.3 minutes, zero retries |
| Controlled report-write reproducer / corrected recovery probe | 1/1 / 1/1 passed |
| Isolated config guard + Holistic Analytics workflows, repeated three times | 33/33 passed, zero retries |
| Complete source after watcher correction and isolated config guard | 646/646 passed, 12.3 minutes; zero retries/skips/flaky results |
| Fresh TypeScript / production build / fixed bundle budgets | Passed |
| Fresh-production artifact acceptance after final fresh build | 286/286 passed, 6.6 minutes; zero retries/skips/flaky results |
| Final diagnostic helper and Dashboard acceptance ESLint | Passed |

The extended-run summary (`dashboard-lifecycle-summary.json`) contains 83 saved
sidecar artifacts; the early iterations attached buffered data directly instead.
Sixty-six sidecars include action markers: all show exactly one active-term fetch
before ranking expansion. Available transport ledgers show exactly four completed
200 active-term GETs across the full scenario (initial load, deliberate stale
return, reload and explicit Retry). No unexpected initial or total transport
count was found. Cache traces also show cancelled stale-remount Query attempts
that never dispatch HTTP, followed by one successful transport. These observations
describe passing executions, not the unexplained historical failure.

The final corrected full-source run retained 13 Dashboard lifecycle attachments
in `source-watch-fix-lifecycle`. Their summary reports zero Vite full reloads;
all four mobile/desktop light/dark ranking workflows have exactly one active-term
fetch before expansion. The unchanged original assertions also verified fresh
reuse, deliberate stale refresh, explicit reload, offline recovery and Retry.

Additional exploratory failures are retained:

- `dashboard-diagnostic.log`: zero tests executed because the temporary config's
  web-server working directory was wrong. Corrected temporary configuration;
  the next instrumented run passed 20/20.
- `dashboard-diagnostic-buffered.log`: a 4x CPU experiment exceeded the unchanged
  30-second scenario timeout late in the workflow. One timed-out case; the
  remaining planned cases were interrupted. It did not reproduce the original
  early extra active-term request. No test timeout or retry policy was increased.
- `source-resume-diagnostic.log/json`: 643/645 passed. Unchanged Analytics
  `fresh cached offline analytics survives unmounted connectivity events`
  failed its initial data assertion (`[]` instead of Term 1). Unchanged Grade
  Sheets `ordinary cached period failure followed by offline retains data with
  connection alert` did not show the expected periods-500 error after Retry.
  Both failed within the existing five-second assertions during a run with
  watched-input edits. Neither retained document-navigation evidence, so their
  individual root causes are not proven; resource pressure is not established.
  Repeating these two cases unchanged passed 40/40 with zero retries. No
  Analytics/Grade Sheet application or test code was edited in response.
- `source-resume-serial.log/json`: 644 passed / one failed. The delayed-year
  Dashboard case expected one initial batch but observed two completed batches
  for every endpoint; the attached two-document lifecycle led to the controlled
  reload reproducer above. This run was not clean and is retained in full.
- `dashboard-reload.log`: all 13 unchanged Dashboard acceptance workflows repeated
  five times without watched edits passed 65/65, before the watcher correction.
  This reinforces the environment diagnosis; it is not presented as the fix.
- `source-watch-fix-final.log` / `source-watch-fix-first.json`: 635 passed, one
  failed and ten not run. The newly added watcher guard initially imported Vite's
  configuration resolver inside the long-lived Playwright TS/ESM worker. A later
  Holistic Analytics file import failed before its first test (0ms) with Node's
  `Expected a string, an ArrayBuffer, or a TypedArray ... source ... load hook ...
  got null` error. This is a test-loader failure, not a passed or failed UI
  interaction. Vite installs Node module-resolution hooks; its config check now
  runs in a child Node process, preserving both exact watcher assertions and
  avoiding changes to the worker's loader or environment. The isolated guard and
  matching Holistic workflows subsequently passed 33/33 with zero retries;
  the full source gate was restarted with that correction. No Holistic code or
  assertions were changed.

Backend regressions were not repeated during this resumed, test-only increment:
backend source and authentication contracts are unchanged and hash-verified;
the preserved completed backend result is 452/452 and focused security/grading
result is 249/249. Browser APIs remain mocked. No real-backend claim is made.

## Bundle impact

Node zlib gzip bytes, same existing budgets and fresh build procedure:

| Measurement | Baseline | Final | Delta | Budget |
| --- | ---: | ---: | ---: | ---: |
| Public entry chunk | 628 | 627 | -1 | 112153 |
| Public eager closure | 133427 | 133425 | -2 | 135349 |
| Admin eager download beyond public | 141474 | 143232 | +1758 | 151512 |
| Principal eager download beyond public | 139444 | 139964 | +520 | Existing guards pass |
| Teacher eager download beyond public | 160955 | 160970 | +15 | Existing guards pass |
| Parent eager download beyond public | 145935 | 145951 | +16 | Existing guards pass |

UsersQueryDriver is a separate 5222-byte raw lazy chunk. No dependency was added
or upgraded. Query remains excluded from public/Admin/Teacher/Parent eager
closures by the unchanged guard. Small shared-chunk redistribution does not imply
other accounts were migrated. No real-network latency/CPU performance claim is made.

The resumed watcher/loader corrections have zero measured application bundle
impact: the bundle-audit measurements are identical before and after them.
The CSS asset also remains `index-9zY2i-Qt.css`, 190.50 kB / 30.96 kB gzip.
The final scoped ESLint check for all resumed code/config/test files passed;
the pre-existing broader lint debt described above remains unchanged.

## Exact files changed in this increment

All paths below are relative to `C:\Users\Mavys\Downloads\QED_System\QED_front_end`.
There are no backend edits. Files already dirty at entry retain their earlier work.

1. `src/features/profiles/admin/pages/usermanagement/context/UsersContext.tsx`
2. `src/features/profiles/admin/pages/usermanagement/hooks/useUserQueries.ts` (new)
3. `src/features/profiles/admin/pages/usermanagement/hooks/useAdminUsersQueries.ts` (new)
4. `src/features/profiles/admin/pages/usermanagement/UsersQueryDriver.tsx` (new)
5. `src/features/profiles/admin/pages/usermanagement/services/user-record.service.ts`
6. `src/features/profiles/admin/pages/usermanagement/UserManagementPage.tsx`
7. `src/features/profiles/admin/pages/usermanagement/UserManagementPage.loading-view.tsx`
8. `src/features/profiles/admin/pages/usermanagement/UserViewPage.tsx`
9. `src/features/profiles/admin/pages/usermanagement/UserViewPage.loading-view.tsx`
10. `src/features/profiles/admin/pages/usermanagement/UserFormPage.tsx`
11. `src/features/profiles/admin/pages/usermanagement/UserFormPage.loading-view.tsx`
12. `src/features/profiles/admin/pages/usermanagement/components/UsersTable.tsx`
13. `src/features/profiles/admin/pages/usermanagement/components/ConfirmDeleteUserModal.tsx`
14. `src/routes/roles/AdminRoutes.tsx` (provider nesting only)
15. `tests/fixtures/adminUsers.ts` (new)
16. `tests/admin-users-query.html` (new)
17. `tests/admin-users-query-harness.tsx` (new)
18. `tests/admin-users-query.spec.ts` (new)
19. `tests/admin-users-golden.spec.ts` (new)
20. `tests/admin-users-acceptance.spec.ts` (new)
21. `playwright.acceptance.config.ts`
22. `playwright.acceptance-build.config.ts`
23. `TANSTACK-QUERY-MIGRATION-ROADMAP.md`
24. `TANSTACK-QUERY-INVALIDATION-MAP.md`
25. `QED-API-MIGRATION-INVENTORY.md`
26. `QED-ADMIN-USERS-QUERY-VERIFICATION.md` (new)
27. `tests/admin-dashboard-query.spec.ts` (only source-test clock synchronization;
    all existing request/poll assertions retained, Dashboard implementation unchanged)
28. `tests/dashboard-query-acceptance.spec.ts` (opt-in diagnostic setup/attachment
    hooks only; original behavioral/count assertions unchanged)
29. `tests/fixtures/dashboardDiagnostics.ts` (new, sanitized opt-in diagnostics)
30. `vite.config.ts` (file watching disabled only for flagged source acceptance)
31. `tests/bundle-budget.spec.ts` (new acceptance/default watcher guard; existing
    budget and registry assertions unchanged)

## Limitations and checkpoint

Real MySQL transaction/persistence, real Teacher login after provisioning, email
delivery and deployed cookie/CORS behavior remain unverified here. No isolated
MySQL runtime or authorized private test accounts were available. Prior security
deployment requirements, including JWT secret rotation/restart, shared recovery
rate limiting for multi-instance deployment and the separate xlsx security
follow-up, remain unchanged. See the provisioning/recovery verification reports.
The manual localhost/Render API toggle is deliberately unchanged; select the
intended production endpoint through that workflow before a deployment build.

Cold offline navigation cannot fetch previously unavailable lazy JavaScript; the
offline-initial hook case warms code only, not data. No service worker was added.
Failed or lost-response writes are not automatically retried because the server
has no demonstrated idempotency key. A connectivity failure after server commit
requires checking authoritative records before manually submitting again.

## Final preservation audit and decision

`frontend-preservation-final.json` records 323 current Git-status entries:
31 task-scoped code/config/test/documentation files listed above, 179 generated
screenshot/diff artifacts, and 113 unrelated pre-existing dirty paths. There are
zero unexpected changed pre-existing files and zero unexpected new dirty paths.
Approved additions to previously dirty files retain their prior migration/security
work; the other existing hashes match the entry snapshot. The generated files
were retained without restoring or cleaning them. Their exact list is in
[generated-artifact-files.json](C:/Users/Mavys/AppData/Local/Temp/qed-admin-users-query-20261012/generated-artifact-files.json).
The full status, scope and preservation details are in
[frontend-preservation-final.json](C:/Users/Mavys/AppData/Local/Temp/qed-admin-users-query-20261012/frontend-preservation-final.json).

The backend's hashes, complete Git status and HEAD match entry exactly; the
preserved security corrections were not edited. See
[backend-preservation-final.json](C:/Users/Mavys/AppData/Local/Temp/qed-admin-users-query-20261012/backend-preservation-final.json).
Frontend HEAD is also unchanged. Both staging areas are empty. The API toggle's
SHA256 remains `CD1575285D7C5243F17D68FF960F38EBE983E813C14997D0FDDE59638E887C5D`.
No Git revert/reset/clean/stage/commit/push commands or deployment ran.

The latest complete source gate is 646/646 and the latest fresh-production gate
is 286/286, with zero retries, skips or flaky results. TypeScript, fresh production
build, fixed bundle budgets, role isolation and resumed scoped lint passed.
The regression checkpoint is ready for review. No current reproducible Query
regression remains in these gates. The historical failures without navigation
traces are retained above rather than retrospectively claimed as directly traced;
the development reload mechanism itself was causally reproduced and corrected.

Real MySQL persistence, real account/email delivery and deployed authentication
remain unverified, and the existing deployment/security follow-ups still apply.
This is not a live-backend or deployment-readiness certification. The recommended
next candidate remains Admin Student Records dependency analysis, as recorded in
the roadmap; it requires review/approval and was not started. STOP FOR REVIEW.
