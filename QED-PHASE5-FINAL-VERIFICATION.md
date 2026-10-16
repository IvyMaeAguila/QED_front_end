# QED Phase 5 — final system-wide verification

Verification date: 2026-10-14, Asia/Manila. **AUTOMATED MIGRATION VERIFIED — stopped for user review.**

Frontend: `C:/Users/Mavys/Downloads/QED_System/QED_front_end`\
Backend: `C:/Users/Mavys/Downloads/QED_System/thesis_qed`\
Evidence: `C:/Users/Mavys/AppData/Local/Temp/qed-phase5-20261014-183741`

This report distinguishes new Phase 5 execution from historical checkpoints. The complete role browser suites mock APIs/authentication/sockets. Backend tests use isolated database or controller doubles, with SQLite SQL coverage where explicitly named. A separate disposable loopback cookie probe uses the actual extracted logout function, real Express serialization and Chromium; it does not use accounts, JWTs or a database. No live MySQL persistence, real-account login, email delivery, or real AI/intervention generation acceptance is claimed.

## 1. Entry audit and migration coverage

Read-only entry inspection covered both Git statuses, all four role verification reports, the migration inventory and invalidation map, actual route registries/compositions, shared contexts, transports, Query implementations, backend routers and relevant ownership controllers. The static source inventory records 590 TS/TSX files, their imports and Query/transport calls in `source-query-consumer-inventory.json`. Import/call presence alone does not establish an active legacy reader: route composition, injected readers and activation guards determine ownership.

Historical checkpoints, **not reruns**:

| Role checkpoint | Source | Fresh production | Isolated backend |
| --- | ---: | ---: | ---: |
| Principal | 705 | 340 | 517 |
| Teacher | 1,018 | 559 | 1,043 |
| Admin | 1,256 | 685 | 1,307 |
| Parent | 1,384 | 813 | 1,657 |

The inventory's current updates supersede its retained historical pending/blocker entries. No completed migration was replaced in Phase 5.

| Role | Actual active server-state boundaries | Classification |
| --- | --- | --- |
| Principal | Dashboard/context prerequisites; Teacher directory/profile/schedule/advisory rosters; student overview/class/unassigned rosters; academic/holistic analytics; gradebooks and sheets; Calendar; notifications | Verified complete at source audit; final regression results below |
| Teacher | Five Dashboard reads; subjects and subject rosters; advisory selection; authorized student profiles and schedule metadata; daily/history attendance; advisory grades, submission/history and Parent visibility; holistic overview/profile/trends; subject info/items/scores/weights/topics; weekly holistic; Calendar; notifications | Verified complete at source audit; calculations and local drafts retained |
| Admin | Dashboard/audit/login frequency; user management/provisioning; student CRUD/import/options; class CRUD/assignment/options; sections/catalog/subject assignments/assessment types; academic years and three terms; template metadata/upload; Teacher profiles/advisory rosters; Calendar; background notifications | Verified complete at source audit; bootstrap-to-Query handoff retained |
| Parent | Linked-child list/link verification/confirmation; daily updates; child profile; Overview academic/holistic/monthly attendance; schedules/missed activities/intervention flags; progress/visibility/holistic/attendance; weekly holistic; courseware/quiz; Calendar/Dashboard events; notifications | Verified complete at source audit; child/year identity and publication rules retained |

No remaining eligible, actively routed legacy server-state consumer was confirmed. No endpoint or missing feature was invented. Principal has no standalone attendance/intervention page: its existing Dashboard/report readers are the applicable consumers. Teacher intervention APIs without a matching current UI are backend-only coverage, not a newly migrated Teacher feature.

## 2. Remaining legacy consumers and exceptions

| Consumer / behavior | Evidence and active ownership | Classification |
| --- | --- | --- |
| AuthProvider, authentication/profile services, shared account actions | Authentication is authoritative; lightweight session cleanup bridge avoids eager Query imports | Intentional legacy compatibility |
| Admin Students/Classes/Teachers/Users bootstrap contexts | Successful seeds retain timestamps; lazy activation retires/cancels bootstrap reads and excludes failed/forbidden seeds | Intentional bootstrap compatibility; no concurrent cache after handoff |
| Parent Dashboard initial list/daily requests | Authenticated bootstrap hands seeds to lazy readers, then retires its requests; role provider is keyed by session/account | Intentional bootstrap compatibility |
| Notification legacy facade | Principal/Teacher activate authenticated drivers; Admin activation retires seed/poll/socket state; Parent does not run a competing legacy reader | Intentional compatibility, not a second active notification cache |
| `useTeacherSchedule`, `TeacherSchedulePage.tsx`, profile/year service caches | Actual Principal route registry points to `PrincipalTeacherProfilePage`; actual Admin profile uses `AdminTeacherSchedule` with injected server state | Retained fallback declarations; not active application migration gaps |
| Unused Admin school-year/settings and SubjectsTeachersContext; unused Teacher advisory/aggregation/service declarations | No current route consumer requiring another migration was established | Inactive compatibility declarations |
| Parent `useUserProfile` / `getUserData` | Hook declaration and service call remain, but no source consumer imports/calls the hook; the active account profile remains AuthProvider-owned | Inactive compatibility declaration |
| Binary template/report downloads, Excel/PDF exports and parsers | Imperative file operations and pure transforms | Not eligible Query server state |
| Selections, theme, month/term controls, unsaved scores, animation and game state | Local UI/business state | Intentional local state |
| Content/state GETs which may initialize or persist intervention content | Explicit generation/state safeguards; no automatic cancellation/replay of accepted writes | Intentional side-effect compatibility |
| Authenticated class/staff metadata reads | Teacher profile adapters retain only needed classes/staff in frontend state; backend contracts remain broadly authenticated | Intentional existing contract; separate data-minimization policy review remains |

The retained fallback profile/year caches are not session-keyed. They are not reached by the audited active Principal/Admin routes. Any future reactivation must use the established scoped readers or add equivalent isolation; their mere presence is not proof of current stale-data exposure.

## 3. Cross-role workflow verification

These results verify cooperating boundaries and preserved contracts with deterministic fixtures. They do **not** establish a real Admin write followed by another browser reading the same MySQL database. Cross-browser academic push invalidation is not implemented or assumed; normal refresh, remount, stale re-entry or existing reload behavior remains required.

| Workflow | Automated evidence / preserved behavior | Live status |
| --- | --- | --- |
| Admin → Teacher provisioning | `account-provisioning-acceptance`, isolated provisioning security; atomic role account/profile creation, failure truthfulness, one non-retried write; confirmed Teacher change refreshes lookup/profile/class dependencies | Unverified |
| Admin → Teacher classes, students, subjects and assignments | Admin classes/students/subjects fixtures verify exact payloads and confirmed invalidation; Teacher subject/advisory/student fixtures verify assigned roster readers and stale refresh | Unverified across one real database |
| Admin → Teacher years/terms, weights, templates | Admin year/subject/template fixtures and backend grading/template regressions; active-context prerequisites, three terms and established weights retained | Unverified against MySQL |
| Teacher → Principal assessment, submission, adviser synchronization | `gradebookWorkflow`, Teacher academic/grade readers and writer lifecycle, Principal gradebook/sheet goldens; submitted/pending distinctions, completeness and independent class/term behavior preserved | Unverified against MySQL |
| Teacher → Principal analytics/holistic/attendance/performance | Teacher holistic/attendance fixtures, Principal Dashboard/analytics goldens and existing backend calculations; refreshed responses use current scope | Unverified against MySQL |
| Teacher → Parent grades and recent graded activities | Parent daily/Overview/progress fixtures, visibility/backend workflow coverage; locked/unpublished data withheld, released term goldens retained | Unverified against MySQL |
| Teacher → Parent holistic/attendance/learning gaps | Parent child-scoped weekly/Overview/monthly/progress/schedule/missed/intervention readers; independent errors do not erase successful sections | Unverified against MySQL |
| Teacher → Parent intervention progress/completion | Parent courseware/quiz/action fixtures; exact payloads, denied child handling and confirmed completion/mastery invalidation; Teacher target authorization fixtures cover backend ownership | Live generation, assignment persistence and completion notifications unverified |
| Admin → Parent provisioning/linking/multiple children | Account provisioning and Parent action/lifecycle fixtures; actual ownership middleware fixtures use distinct auth and role IDs and unrelated children; profile/navigation cannot reuse another child's rows | Unverified against MySQL |
| Shared authentication, role routing and account switching | Bootstrap/query lifecycle tests, auth generation guards, private cache clearing, late 401/account-switch cases, direct invalid/expired/recovery JWT tests | Real cookie/login/logout acceptance outstanding |
| Shared notifications and Calendar | Four-role Calendar/notification fixtures, exact polling/focus/reconnect counts, confirmed receipts, ownership/socket authorization fixtures | Real Socket.IO and delivery outstanding |
| Shared remounts, academic transitions and offline recovery | Fresh/stale cache and year/term/child identity tests; cancellation, cached/uncached offline recovery and bounded Retry | Warm-code browser evidence; cold uncached JS remains a limitation |

Focused cross-role browser execution passed **100/100**, zero retries. Files: account provisioning, Admin classes, Teacher role, Principal grade sheets, Parent role and Parent actions. Focused security/grading execution passed **1,462/1,462** before the additional 16 route-composition tests; totals overlap the full backend suite and must not be added to it.

## 4. Security finding and narrow correction

**Confirmed high-severity issue, corrected:** Principal school-wide readers were not uniformly authorized. Three Dashboard attendance endpoints omitted `verifyToken`; other Dashboard, Reports, student roster and Teacher directory/profile routes authenticated JWTs but did not restrict the caller role. The controllers contained no compensating role check.

The pre-correction direct loopback HTTP matrix against actual Express routers/JWT middleware with inert controllers executed **396 cases: 164 passed, 232 failed**. This demonstrated requests reaching protected controller boundaries without the required authentication/role, without loading MySQL or accessing school data. It is vulnerability reproduction, not a passing gate.

The existing Principal grade-sheet router and approved core student policy establish Admin/Principal school-wide access. The smallest correction applies that policy to **22 existing GET endpoints** in four Principal routers through `requireSchoolRead.middleware.js`. It accepts canonical supported Admin/Principal roles, rejects malformed caller identities, and retains existing JWT 401/403 handling. Shared class/staff metadata routes used by Teacher adapters are unchanged. Controllers, SQL, response mapping, grade computation and endpoint URLs are unchanged.

Post-correction matrix passed **396/396**. An additional **16 tests** mount the real core student router before the Principal student router, matching the application's shared `/api/student` prefix: all four roles still reach their existing scoped core routes, while Principal school-wide paths enforce the new guard. The final focused route suite passed **412/412**. Controllers in these route tests are inert; they prove dispatch/authorization, not MySQL SQL or successful educational response content.

Existing isolated security suites additionally exercise Admin-only writes, assigned/advisory student scope, subject target membership, linked children, Admin-only profile editing, notification ownership, atomic provisioning/recovery, token purpose/expiration, socket room ownership and denied-request database-write counts. Browser fixtures verify cache privacy after 403, logout and account switching. No backend authorization was weakened to satisfy a frontend fixture.

The established database policy is one school per database, with no school/tenant discriminator in these contracts. The correction enforces that existing role scope; it does not claim multitenant isolation or add a tenant schema.

The already-running localhost backend was not restarted or modified through its process. New middleware was verified in isolated processes; no claim is made that the existing listener has loaded it.

**Confirmed shared authentication defect, corrected:** the logout handler declared `sameSite` twice. The unconditional `none` value overrode its intended environment-dependent setting. In a disposable loopback Express/Chromium probe, an HttpOnly synthetic session cookie survived a successful 200 logout response. The focused header suite reproduced two failures out of three environments: unset NODE_ENV and development failed; production's existing settings passed.

Exactly one duplicate option was removed. Logout now retains the same environment-dependent policy as login: local Lax/non-Secure; production None/Secure. Production settings and frontend auth/Query lifecycle are unchanged. The correction script first verified the controller matched its phase-entry hash, archived it, then preserved every other original byte, including prior uncommitted security work (`auth-controller-before.js`, `logout-cookie-correction.json`). After correction the policy suite passed **3/3** and the real Chromium probe confirmed the synthetic cookie was removed. All roles use this common session-cookie/logout transport; this is component-level cookie evidence, not real four-role account authentication or deployed acceptance.

The latest complete backend rerun after both corrections passed **2,072/2,072**. The source browser gate completed before the backend-only cookie correction; frontend code and all 502 built files remain byte-identical. Focused cookie checks and the latest full backend gate cover that last change. The complete production browser gate uses mocked APIs and does not independently prove the cookie correction.

## 5. QueryClient, keys, cancellation and invalidation

- Exactly **one QueryClient constructor** was found across 590 source files. The **49 provider wrappers** reuse that singleton at lazy module boundaries; they do not instantiate independent caches. No cache persistence is configured. Refactoring provider placement was unnecessary.
- Role keys include session generation, role and authentication-user identity. Resource keys append actual year/term/class/subject/student/child/filter dimensions when their contracts require them. Principal Directory's older prefix layout differs in naming but still contains generation/role/user. All-term Parent report readers appropriately keep local term selection outside the key; monthly attendance includes both calendar year and month.
- Auth login/logout/identity changes advance the session generation, cancel reads and clear the singleton. Captured-generation 401 handlers cannot expire a newer session. Keyed role/resource boundaries clear retained local projections. Parent child denials hide sibling cached child resources and reject late pre-denial results without canceling a peer's independent 401 handling.
- Ordinary reads propagate AbortSignal through existing transports. Accepted writes are not described as rolled back by cancellation. Generation/content initialization GET exceptions are documented above.
- Most active readers use 30-second freshness and five-minute GC. Subject detail/template/profile readers preserve five-minute freshness. Central defaults remain five-minute staleTime/ten-minute GC where not overridden. Intervention flags intentionally use staleTime zero. No universal policy rewrite was made.
- Automatic query retries remain disabled. Writes use explicit `retry:false`, offline rejection and no automatic replay of non-idempotent operations. Confirmed server responses drive invalidation/cache patches; no new optimistic grade, publication, linking or intervention-completion update was introduced.
- Admin writes invalidate their same-session class/student/subject/options/template/audit dependencies; Teacher writes invalidate relevant subject/advisory/attendance/holistic resources; Parent link confirmation invalidates list/daily readers and confirmed quiz completion invalidates the current child's intervention resources. Shared Calendar writes invalidate corresponding current/all resources. Notification receipts update confirmed flags and refresh only the owning list.
- Existing notification and Admin login-frequency 30-second polling remain. Other intervals found are presentation/local clocks. No extra academic polling was introduced. Legacy facade cleanup and lazy driver activation prevent parallel notification polls.

No further confirmed migration cache, cancellation, loading or invalidation defect was found in Phase 5. Error/empty/offline and stale-publication evidence is contained in the focused and complete browser reports, not inferred solely from these static observations.

## 6. Fresh build, bundle and network findings

Fresh TypeScript checking passed. Vite production build passed with `--emptyOutDir false`, preserving prior generated assets as instructed. The unchanged bundle guard passed; its limits were not edited.

A second fresh build with the report present was byte-identical across all **502** build files. Both final browser gates used that equivalent artifact for their build-dependent checks. `source-gate-artifact-provenance.json`, `report-build-equivalence.json` and `final-gate-summary.json` retain the comparisons; no build file changed during either complete browser gate.

| Measurement | Gzip bytes | Existing cap / interpretation |
| --- | ---: | --- |
| Entry `assets/index-zpqePgM2.js` | 628 | 112,153 cap |
| Public eager dependency closure | 134,514 | 135,349 cap; 835 bytes headroom |
| Admin eager download beyond public | 149,748 | 151,512 cap; 1,764 bytes headroom |
| Teacher eager beyond public | 168,619 | Measured, no new cap invented |
| Principal eager beyond public | 139,771 | Measured |
| Parent eager beyond public | 145,058 | Measured; Parent role chunk 96,396 |

These match the prior Parent checkpoint measurements; Phase 5 changes no frontend runtime source or dependency. The guard verifies public code excludes authenticated Query/page code, role eager graph isolation and heavy-library laziness. Runtime bundle/role tests are included in both complete browser gates.

Deterministic request ledgers cover fresh cache reuse, one stale refresh per resource, shared Calendar/Dashboard reads, cancellation versus completed StrictMode probes, single notification polling/focus refresh, failed-write non-invalidation and success-only refresh. These are fixture-measured request counts, not live network latency, throughput, CPU or database performance benchmarks. No additional performance improvement is claimed. Public/Admin budget headroom is small and remains a release-maintenance concern.

## 7. Newly executed automated gates

Final browser verification uses the existing single-worker configs, explicit `--retries=0`, unchanged assertions/timeouts/budgets and unique external output/report paths. No failing case is excluded.

| Gate | Phase 5 result | Evidence |
| --- | --- | --- |
| Focused cross-role source browser | 100/100 passed, zero retries | `focused-browser.json`, `.log`, `-gate.json` |
| Focused security/grading | 1,462/1,462 passed | `focused-security.log` |
| Final Principal authorization/shared-prefix tests | 412/412 passed | `principal-security-routing.log` |
| Complete source regression | **1,384/1,384 passed**, 93 files, 40.7 minutes; zero retries/failures/skips/flaky outcomes | `full-source.json`, `.log`, `-gate.json` |
| Fresh-production browser | **813/813 passed**, 64 files, 18.4 minutes; zero retries/failures/skips/flaky outcomes | `full-production.json`, `.log`, `-gate.json` |
| Complete isolated backend | **2,072/2,072 passed**, zero failures/skips/cancellations; earlier 2,053/2,053 and 2,069/2,069 before final test additions | `full-backend-latest.log`, `full-backend-latest-gate.json` |
| Focused logout cookie policy | **3/3 passed** after correction | `cookie-policy-after.log` |
| Disposable real Chromium cookie probe | Passed; synthetic HttpOnly cookie removed after actual handler's 200 response | `logout-cookie-after.json`; failed characterization in `logout-cookie-before.json` |
| TypeScript `tsc -b --pretty false` | Passed | `typescript.log`, `typescript-gate.json` |
| Fresh Vite production build | Passed twice; equivalent artifacts | `production-build.log`, `production-build-final.log`, respective `-gate.json` files |
| Existing bundle guards | Passed on both fresh builds; unchanged limits | `bundle-guards.log`, `bundle-guards-final.log` |
| Relevant Query scoped lint | 65 files, zero errors/warnings | `scoped-lint-results.json` |
| Changed/new backend scoped lint | All eight JS files, zero errors/warnings; standard recommended JS rules and Node globals via external config, no rule suppression or repository config edits | `backend-scoped-lint-latest-results.json`, `backend-scoped-lint.config.mjs` |
| Backend syntax checks | All eight changed/new JS files passed | `backend-syntax.log`, `cookie-syntax.log` |
| Global lint audit | 146 errors / 17 warnings; nonzero exit retained | `global-lint-results.json` |
| Dependency audits | Nonzero advisory findings retained, no upgrades | `*-dependency-audit.log`, `*-runtime-dependency-audit.log` |

Global lint is a release limitation, not a claimed passing gate. Frontend source is unchanged in this phase; these diagnostics were not introduced by Phase 5. Prior report counts are historical and differ from this new execution.

## 8. Real-backend acceptance and environment limits

Node/Express dependencies and the existing local listener on port 7400 are available. No local MySQL listener on 3306 or MySQL/MariaDB Windows service was found in the inspected environment. Backend `.env` points to a remote database, whose name does not establish testing/disposability. Real mail and AI configuration is present. No confirmed dedicated Phase 5 test accounts or disposable MySQL fixture environment was established.

Read-only local HTTP checks: unauthenticated `/api/auth/me` → **401**; unauthenticated `/api/student/allStudents` → **401**; deliberately invalid cookie on `/api/reports/term-options` → **403**. Only statuses/timing were retained in `live-readonly-connectivity.json`; response contents and credentials were not recorded. These prove local listener reachability/authentication rejection only.

The historical `scripts/testing/live-gradebook.js` opt-in fixture writes synthetic records into the configured database and later deletes them. Its existence and previous remote test report do not establish current authorization or a disposable database. It was not executed. The old live configuration also assumes an API environment override that the currently preserved literal API configuration does not honor. No API setting was changed to make this harness run.

Live tests requiring writes were stopped because the required isolation could not be established. No remote database connection, valid JWT use, actual login, fixture setup/cleanup, school-data write, mail delivery, AI generation, Render connection or production service acceptance was performed. Real MySQL SQL/transactions/persistence, four-role shared-data workflows, live cookie/CORS behavior, notification/socket transport and intervention delivery remain **unverified**.

The separate cookie probe writes only a synthetic cookie in an ephemeral browser context against its own disposable loopback server, then removes it. It executes the extracted current logout function without loading the authentication module's database/models. This safe component acceptance does not establish the configured backend's database isolation or replace the outstanding full login/JWT/CORS/session acceptance.

## 9. Exploratory failures and corrections

1. The new pre-fix authorization matrix failed 232/396 cases, establishing the actual missing guards. Four routers plus one small middleware correct the established policy. Post-fix 396/396 and expanded shared-prefix 412/412 passed. Failure and success logs are retained separately.
2. Initial external audit-runner dispatch of `npm.cmd` failed with Windows `spawn EINVAL`, before npm or application execution. Reissued via Node and npm's JavaScript CLI; audit JSON was obtained. This was tooling failure, not a passed/failed application test.
3. Early read-only `rg` commands used wildcard directory arguments unsupported by Windows rg. Corrected to directory searches with file globs. No files or assertions changed.
4. Global lint and dependency audits intentionally return nonzero for outstanding diagnostics/advisories; they are documented below, not suppressed.
5. Late authentication configuration review exposed the duplicate SameSite override. Actual Chromium cookie characterization failed (200 response, cookie retained); the isolated header suite returned 1 passed/2 failed. Removing only the duplicate override yielded cookie probe pass and 3/3 policy tests; latest complete backend 2,072/2,072 and eight-file scoped lint pass. The initial VM-based probe emitted a cross-realm Promise deprecation warning; wrapping its handler result in a native Promise corrected probe instrumentation without changing the application or assertions.

No browser assertion, retry count, test timeout or bundle budget was relaxed. Both complete role browser gates passed on their first Phase 5 execution with zero retries, failures, skips and flaky outcomes. The failed synthetic cookie characterization is retained as exploratory defect evidence and is not counted as a passing gate.

## 10. Exact Phase 5 source/test/document delta

Frontend:

- `QED-PHASE5-FINAL-VERIFICATION.md` — new report only.

Backend:

- `src/modules/authentication/authentication.controller.js` — remove one duplicate cookie option; all remaining prior bytes preserved.
- `src/modules/principal/requireSchoolRead.middleware.js` — new established Admin/Principal read guard.
- `src/modules/principal/dashboard/dashboard.router.js` — authenticate and authorize all existing Dashboard GETs.
- `src/modules/principal/Reports/reports.router.js` — authorize existing school-wide report GETs.
- `src/modules/principal/students/students.router.js` — authorize existing school-wide roster GETs.
- `src/modules/principal/teachers/teachers.router.js` — authorize existing directory/profile GETs.
- `test/principalReadAuthorization.test.js` — new direct HTTP/JWT authorization and shared-prefix regression matrix.
- `test/authenticationCookieLifecycle.test.js` — new actual-handler/Express cookie policy tests for unset, development and production environments.

Existing screenshot/diff tests regenerated **304** files under `loading-screenshots/`; no generated screenshot file was added or deleted. Exact phase-relative paths are recorded in `preservation-audit.json` and `generated-artifact-audit.json`, separately from the **nine** source/test/document changes (one frontend report, eight backend files). External scripts/logs/reports/backups live only in the evidence directory. Ignored TypeScript incremental cache paths/current metadata are recorded in the generated-artifact audit; phase-entry hashes for those compiler caches were not captured. No frontend runtime, existing test assertion/config, package/lock, database schema, academic formula or endpoint was changed.

## 11. Preservation and Git audit

Entry snapshot: **2,494 frontend paths** and **190 backend paths** captured, including tracked and nonignored untracked files and pre-existing missing paths. Entry status contained **1,029 frontend** and **87 backend** entries; both staging areas were empty. Status entries are existing working-tree changes, not Phase 5 file counts.

Prior screenshots, test-results, playwright reports and dist artifacts were copied into `preserved-artifacts/` before test/build execution. New browser output directories are unique and external. Production build preserves old assets with `--emptyOutDir false`; no generated directory was deleted. Fresh build hashes are saved in `fresh-build-before-browser.json` for final artifact-equivalence checking.

Final comparison **passed**: only the listed source/test/document changes and 304 regenerated screenshot/diff files differ from entry. No unexpected source change or new deletion was found; the pre-existing deletion of the old Teacher subject-detail cache remains preserved. Both HEADs and empty staging areas are unchanged. API configuration, both package/lock pairs, frontend AuthProvider, QueryClient, existing migration implementations and grading/holistic/intervention calculations match entry hashes. The backend authentication controller differs only by the documented cookie option removal; all its prior security work is otherwise byte-preserved.

Final Git status contains **1,034 frontend** and **94 backend** entries, including all prior uncommitted work and generated artifacts; these totals are not Phase 5 change counts. The exact status text is retained in the final manifests. Phase 5 source/test/document scope is the nine paths listed above.

All **1,311** original screenshot/diff paths remain, with originals backed up. All **46** prior test-results files, the prior playwright-report file and all **502** build files remain byte-identical to entry. External output paths preserve current test evidence without cleaning prior results. `frontend-before.json`, `backend-before.json`, corresponding `-after.json`, `preservation-audit.json` and `generated-artifact-audit.json` retain exact status/path/hash evidence.

Both repositories were inspected only with read-only Git commands. No stage, commit, push, reset, revert, clean, deployment or API toggle was performed. Owned browser verification servers exited; the original port-7400 listener/PID remains unchanged.

## 12. Outstanding release issues

| Severity / classification | Evidence and impact | Recommended action; not performed |
| --- | --- | --- |
| High — release blocker | Representative isolated MySQL and real four-role integration/auth/socket/mail/intervention acceptance are absent | Establish a specifically designated test database/accounts and verify real workflows before release |
| High — existing dependency security | `xlsx` 0.18.5 remains in both projects; prototype pollution and ReDoS advisories affect importing crafted files. npm reports no registry fix | Separately approve replacement/vendor upgrade and import/template regressions; do not blindly run audit fix. [Prototype pollution](https://github.com/advisories/GHSA-4r6h-8v6p-xvw6), [ReDoS](https://github.com/advisories/GHSA-5pgg-2g8v-p4x9) |
| High-priority review — additional dependency advisories | Full audits: frontend 12 (7 high, 4 moderate, 1 low); backend 10 (1 critical, 6 high, 3 moderate). Production-dependency-only audits: frontend 10 (6 high, 3 moderate, 1 low); backend 6 (1 critical, 2 high, 3 moderate). These are package findings, not proven reachable exploits | Review exact advisory paths/exposure in retained JSON, approve narrowly scoped updates separately |
| Critical advisory, conditional exposure | Backend `proxy-addr` advisory appears in runtime audit. Current source has no trust-proxy configuration; trusted-subnet exploitability/deployed proxy behavior was not established | Verify actual deployed trust-proxy settings and patch affected dependency through approved maintenance; do not equate registry severity with a demonstrated current exploit |
| High — configuration/security evidence gap | Local JWT secret is present but shorter than 32 characters; production secret entropy/rotation and deployed values are unverified. Secret values were never emitted | Confirm strong independently managed production secret and rotation plan; no secret or environment changes in this task |
| Medium — authentication/deployment acceptance outstanding | Cookie secure/SameSite behavior depends on NODE_ENV; local value is unset. The duplicate logout setting is corrected and local synthetic-cookie acceptance passes, but real account/deployed cookie clearing and role session behavior remain untested | Run authorized full browser authentication/session acceptance against the intended nonproduction deployment |
| Medium — rate limiting | Recovery has process-local limiting; login has no configured limiter and distributed/proxy enforcement was not established | Approve appropriate login/recovery deployment limits after proxy/account requirements are confirmed |
| Medium — CORS/environment | Server allows localhost:5173 and one fixed Vercel origin with credentials. Browser test servers on 127.0.0.1 use mocks and do not verify CORS | Validate intended origins, NODE_ENV, PORT, DB host/port/user/password/name, JWT secret, mail sender/key, storage and AI requirements in the designated environment |
| Medium — database reliability | Pool limit 2/unbounded waiting queue, existing one-time stale-session cleanup and SELECT retry; startup audit initialization may perform DDL | Load/connectivity/failover testing on disposable MySQL; do not start a normal backend against an unconfirmed database for testing |
| Medium — privacy policy follow-up | Shared authenticated class/staff metadata includes contact fields and counts; Teacher frontend projection does not narrow the server response. This contract predates Phase 5 and prior reports explicitly retain it | Confirm metadata visibility/minimization policy before any contract or scope redesign |
| Medium — lint debt | Newly measured 146 global errors/17 warnings; focused Query scope is clean | Plan separate lint cleanup; do not alter unrelated code or suppress rules here |
| Medium — API configuration / release artifact | `http://localhost:7400` remains active; Render URL remains commented. Fresh tested artifact targets localhost | Preserve for this review; use the user's separately authorized target-toggle/rebuild process before deployment |
| Low/medium — offline limitation | Uncached lazy JavaScript cannot be fetched offline; existing browser tests warm code before offline transitions | Document supported offline behavior; separately approve any offline-installable/PWA architecture |
| Low — bundle maintenance | Public 835-byte and Admin 1,764-byte gzip headroom | Continue existing limits and lazy loading; no budget increase |

Advisory exposure, production configuration and live-data correctness remain release decisions. This phase does not silently upgrade dependencies, rotate secrets, change infrastructure or declare production readiness.

`dependency-applicability.json` records installed vulnerable package nodes/advisories and matching fresh-build module IDs. React Router, DOMPurify, ExcelJS and xlsx have matching client chunks; several audit-listed build tools have no separate module match. Absence of a separate match does not prove absence of code embedded inside a prebundled library. The application is a client-rendered SPA; no SSR/RSC execution was found, and no trust-proxy setting or MySQL compression option was found in backend configuration. These observations narrow follow-up investigation; they do not constitute exploit tests or a dependency security clearance.

## 13. Final readiness classification

**AUTOMATED MIGRATION VERIFIED.**

Complete source **1,384/1,384**, fresh production **813/813**, latest isolated backend **2,072/2,072**, TypeScript, both fresh builds, unchanged bundle/role guards, relevant scoped lint and focused cookie acceptance pass. No unresolved observed automated migration defect remains. Principal authorization and local logout-cookie defects discovered in Phase 5 were corrected with narrowly scoped changes and focused/full affected verification.

Real-backend acceptance remains outstanding. **MIGRATION VERIFIED** and production readiness cannot be claimed from mocks, SQLite, isolated controller/database doubles or the limited synthetic-cookie probe. The release blockers and maintenance/security follow-ups above remain open.

Stop for user review. No deployment preparation or further migration phase is authorized by this report.
