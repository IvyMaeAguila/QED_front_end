# Admin Dashboard read-only Query migration — blocked before implementation

Date: 2026-10-11. Scope: Admin Dashboard only.

## Mandatory stop: login-frequency server authorization

The request explicitly requires stopping on an unresolved security or authorization
issue and forbids backend authentication-contract changes in this increment.
Dependency analysis discovered that GET `/api/analytics/login-frequency` is an
Admin Dashboard-only frontend reader, but its backend route runs only `verifyToken`
before the controller. There is no role check in the router, controller or parent
route mount. The controller queries school-wide `login_logs`; it does not restrict
results to the authenticated user. This is a server authorization gap for the
Admin-only dashboard boundary. Query keys and frontend route guards cannot fix it.

Evidence locations in the separate backend checkout:

- `src/modules/authentication/loginfrequency.router.js:6`: JWT check followed
  directly by `getLoginFrequency`.
- `src/modules/authentication/loginfrequency.controller.js:3`: period validation
  and aggregation without a role/identity permission decision.
- `src/modules/authentication/loginfrequency.controller.js:49`: school-wide
  login-log aggregation, without an actor filter.
- `src/routes/index.js:29`: `/analytics` mounts that router without another guard.

An isolated probe exercised the actual Express router, cookie parser, JWT
verification and login-frequency controller over ephemeral loopback HTTP.
Only database execution was replaced with an inert double returning synthetic
empty/count fixtures. JWTs used a process-local random secret and synthetic
identities; no credentials, cookie values, real account, `.env`, production
server or remote database was accessed or printed.

| Identity | Status | Database-double calls | Chart and summary returned |
| --- | --- | --- | --- |
| No authentication | 401 | 0 | No |
| Admin | 200 | 2 | Yes |
| Principal | 200 | 2 | Yes |
| Teacher | 200 | 2 | Yes |
| Parent | 200 | 2 | Yes |

These are reproduced local backend-code results with a mocked database, not
deployed/real-database acceptance. The probe tested `period=weekly`; code inspection
shows monthly/yearly use the same unguarded route. No claim is made about direct
browser access to the Admin page or exposure of individual login records: the
confirmed exposure is school-wide aggregated sign-in metrics via the API.

## Dependency review before the stop

Reviewed the roadmap, invalidation map, API migration inventory, previous blocker
report, Principal Query hooks/client/session cleanup and actual Admin consumers.

| GET | Owner / direct consumer | Current behavior / proposed boundary |
| --- | --- | --- |
| `/api/user/totalUser` | `DashboardService.getUserCounts`, StatCards via combined counts | Manual effect; aggregate Promise.all; no AbortSignal or independent 401 handling |
| `/api/student/totalStudents` | `DashboardService.getTotalStudents`, StatCards via combined counts | Same aggregate; server implicitly selects active academic year |
| `/api/analytics/login-frequency?period=weekly\|monthly\|yearly` | getLoginFrequency, LoginFrequency | Local period selection; AbortSignal; existing 30-second refresh and explicit refresh/Retry; blocked by authorization gap |
| `/api/audit-logs?page&search&role&action&from&to&limit=20` | fetchAuditLogs, AuditLogs | Local search draft/applied filters/pagination; AbortSignal; explicit refresh/Retry; existing backend Admin role check |

These three service modules have no other direct frontend consumers. Their GETs
have no shared manual data cache. Login/audit services already support cancellation;
counts need signal propagation and independently observed authentication failures
if a later migration is authorized. Component loading/error state and effects
currently own reads; no existing Dashboard writer is part of this boundary.

Login-frequency dates are server-selected for the requested period, not academic
terms. Audit filters are server parameters; search drafts stay local. Counts have
implicit year context only for students, while user counts are school-wide. Do
not invent year/term API parameters. No dashboard school-year/term picker exists.

Excluded dependencies include auth/bootstrap, shared profile, notifications and
Admin layout context-provider reads (students/users/classes/teachers), which also
serve other Admin pages. No global shared-service migration is appropriate here.
Calendar and all Principal readers remain untouched.

The existing eager bundle guards prohibit Query in public, Admin, Teacher and
Parent eager closures. A resumed migration must isolate Admin Dashboard Query
execution behind its lazy page boundary while keeping preview composition free
of Query imports; weakening existing guards is not an acceptable alternative.
The current LoginFrequency 30-second refresh is existing behavior to preserve,
not permission to add polling elsewhere.

## Verification status

- Baseline `npx tsc -b`: passed.
- Complete source baseline started with 530 tests; three passed before the run
  was deliberately interrupted on confirmation of the authorization blocker.
  This is an incomplete run, not a full-suite pass or application test failure.
- Queued production baseline did not run after the interruption.
- No migration, post-change build, new Query keys, cache policies or before/after
  request-count claim exists because application implementation never began.
- The five local HTTP authorization probes completed successfully and demonstrated
  the access-policy gap above. No transient test failure was hidden or retried.
- Historical verified checkpoint remains 530/530 source twice, 231/231 production,
  165/165 isolated backend, and 16/16 Calendar UI in each mode. These are historical
  results, not newly executed gates for this aborted increment.

## Exact changes and preservation

Only this report is added in the repository. Probe source, sanitized results,
baseline logs and preservation evidence are ignored verification artifacts in
`test-results/admin-dashboard-verification/` and the task's temporary directory.
No application/test/bundle-guard/backend/dependency/API-toggle code was changed.
Existing modified/untracked files were hashed at entry and checked at exit.
Any generated tracked screenshots initially clean were restored after the aborted
baseline. Both Git indexes remain empty; nothing was committed, pushed or deployed.

## Required next step and production limits

Before resuming Admin Dashboard migration, establish the intended server role
policy and authorize a narrow backend correction for login-frequency, with tests
proving disallowed signed identities cannot query statistics. Admin-only is the
policy suggested by existing frontend ownership; Principal access needs an
explicit decision rather than silently broadening it. Preserve response contracts
and authenticated Admin behavior. No backend correction was attempted here.

Real-account/real-database acceptance and deployed cookie/CORS behavior remain
unverified. The existing manual localhost/Render toggle is unchanged. The next
migration remains Admin Dashboard after this blocker is resolved; no other module
was started. Stop for review.
