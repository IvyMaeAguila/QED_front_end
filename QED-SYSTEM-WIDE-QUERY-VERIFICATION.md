# Accelerated TanStack Query migration — authorization checkpoint

Date: 2026-10-11. Deadline requested: 2026-10-12.

## Outcome and stop condition

No new application migration was implemented. The repository inventory exposed a
material authorization risk in the first recommended remaining boundary, shared
Calendar. The user explicitly instructed: “Stop for a material authorization,
data-integrity, destructive-operation, or academic-correctness risk.” This checkpoint
therefore stops implementation rather than migrating the Calendar writer contract
or silently changing backend authorization. Existing application behavior and all
previous uncommitted migrations are preserved.

This is a checked-in backend finding, not a live exploit or a claim that the Render
deployment was tested. No live Calendar requests or database operations were run.

## Confirmed Calendar authorization gap

The complete middleware chain inspected is:

- `../thesis_qed/server.js:39-40`: mounts the audit logger and API router; no global
  authentication middleware precedes the API router.
- `../thesis_qed/src/modules/shared/audit/auditLog.service.js:100-127`: records
  mutations after response completion and calls `next()`; it does not reject
  unauthenticated or forbidden requests.
- `../thesis_qed/src/routes/index.js:38`: mounts Calendar directly.
- `../thesis_qed/src/modules/shared/calendar/calendar.router.js:8-10,15-17`:
  POST, PUT and DELETE routes each register only their controller, without
  authentication or Admin/Principal authorization middleware.
- `../thesis_qed/src/modules/shared/calendar/calendar.controller.js`: handlers
  write directly to `school_calendar`; no `req.user` or role checks exist. Delete
  handlers issue SQL DELETE statements despite the frontend service's “soft delete”
  comment. No delete request was executed.
- `src/shared/calendar/CalendarPage.loading-view.tsx` hides management controls
  through `CALENDAR_MANAGER_ROLES`; this is presentation, not server enforcement.
- `src/shared/calendar/services/calendar.service.ts` does not explicitly include
  cross-origin authentication credentials in Calendar calls. Preserving those
  calls cannot establish authenticated server authorization.

Affected operations: POST `/api/calendar/activities`, PUT/DELETE
`/api/calendar/activities/:id`, POST `/api/calendar/holidays`, PUT/DELETE
`/api/calendar/holidays/:id`. Four GET readers are shared by the manager and
read-only Calendar pages across Admin, Principal, Teacher and Parent. Dashboard
Calendar consumers must also be mapped before introducing successful-write
invalidation.

Evidence: an isolated Node VM inspection loaded only the router source with inert
Express/controller stubs. All six write routes registered exactly one controller;
there were zero router-wide middleware registrations. No backend controller,
server, database connection or remote API was executed. Evidence is saved under
`test-results/system-migration-verification/calendar-authorization-inspection.json`.

Severity: material authorization/data-integrity risk for the checked-in server.
CORS and hidden UI controls do not replace authorization. External deployment
controls, if any, have not been established here.

## Inventory and architecture

`TANSTACK-QUERY-MIGRATION-ROADMAP.md` now contains the current account/module
matrix, next priorities and required mutation invalidation contracts. Historical
checkpoints are retained verbatim below the new section; their per-module approval
requirements are superseded by the latest system-wide authorization.

`QED-API-MIGRATION-INVENTORY.md` catalogs 55 service/transport files and their
resolved direct TypeScript consumers, including all 51 direct-fetch files in 518
frontend TS/TSX files. The additional network transport is the existing notification
Socket.IO client, covered in the roadmap. Transport wrappers are not counted as
one endpoint; catalog counts must not be interpreted as completion percentages.

| Boundary | Current migration status |
| --- | --- |
| Principal | Directory, student overview/rosters, teacher profile/schedule/class list, Dashboard, Analytics, Gradebooks overview and Grade Sheets migrated in prior verified increments. Calendar and shared account/notification boundaries remain unmigrated. |
| Admin | Not migrated; shared legacy teacher service only partially migrated for Principal consumers. |
| Teacher | Not migrated. |
| Parent | Not migrated. |
| Shared | Singleton/auth cleanup established; teacher transport partially migrated; Calendar/profile/notifications not migrated. Pure calculations, drafts and session authority are not cache migration targets. |

No query keys, freshness settings, mutation behavior, caches or invalidation code
were changed. Existing singleton session cleanup and Principal key families remain
intact. Future contracts are documented, not claimed as implemented: session/role/
user/resource/filter partitioning; independent guarded 401s and private 403s;
cancellation/offline recovery; success-only invalidation; retry:false for writes;
no optimistic grade release; retain drafts and cross-browser socket/poll semantics.

## Verification

| Check executed on unchanged application code | Result | Backend/data |
| --- | --- | --- |
| `npx tsc -b` | PASS | Static TypeScript compilation |
| `npm run build` | PASS | Fresh local-toggle artifact; includes bundle guards |
| Complete `playwright.acceptance.config.ts` source suite | **522 passed, 1 failed**, 12.4 minutes; no retries/skips | Mocked browser/API fixtures and source harnesses |
| Complete `playwright.acceptance-build.config.ts` fresh-production suite | **227/227 passed**, 6.1 minutes; no retries/skips | Newly built real frontend artifact, mocked APIs/authentication |
| Unchanged failed roster scenario, `--repeat-each=3` | **3/3 passed** | Mocked APIs; does not erase full-source failure |
| Isolated gradebook workflow/template/storage Node tests | **77/77 passed** | Existing isolated fixtures/database doubles, no live database |
| Router registration inspection | Six unguarded write registrations confirmed | Inert Express/controller stubs; no backend execution |
| Shared Calendar UI suite | **16/16 passed**, 58 seconds | Existing mocked fixtures, four roles, mobile/desktop, light/dark |

The complete source failure was
`tests/roster-query-acceptance.spec.ts:95`, scenario “roster grade 1280 light:
layout, filters, navigation, cache, offline and retry”. Reproduction command:
`npx playwright test --config playwright.acceptance.config.ts
--output=test-results/system-baseline-source`.
After stale navigation and reload with the endpoint set to return mocked HTTP 500,
the expected “Failed to fetch class list (500)” alert was not found within five
seconds. The failure snapshot contained only the global `Loading…` status, not
the roster view. Initial route setup uses `waitForDataRoute`; this reload path
does not. A route/bootstrap synchronization issue is a candidate explanation,
not a proven root cause. The source suite overlapped part of fresh-production
verification, so resource contention is another unproven variable. The unchanged
scenario passed all three targeted reruns. No test wait, timeout, request-count
assertion or application code was changed. The whole-checkout regression gate is
**not clean**; do not label this an established harmless flake or claim the failed
full run passed because targeted retries passed.

Fresh artifact gzip measurements (bytes): public entry 628; public eager closure
133,384 / cap 135,349; Admin eager beyond public 141,051 / cap 151,512;
Principal 138,521; Teacher 160,854; Parent 145,839. Public/non-Principal eager Query
isolation and role/heavy-library guards pass unchanged. No application changes
were made, so this checkpoint introduces no migration bundle increase. The
selected localhost build is a local acceptance artifact, not a Render release.

Full source, full production and repeated-run JSON reports are preserved under
`test-results/system-migration-verification`; standard suite JSON paths retain the
full-run reports. Logs, bundle measurements, router inspection and preservation
hash results are collected in the same ignored evidence directory. The failed
source screenshot and error context remain under
`test-results/system-baseline-source/roster-query-acceptance-ro-3263d-ion-cache-offline-and-retry`.
Live suites and the remote-fixture `gradebook-two-advisories` test were deliberately
not executed. No real-backend verification is claimed.

## Changes and preservation

Only these documentation files belong to this increment:

1. `TANSTACK-QUERY-MIGRATION-ROADMAP.md` — current matrix, priorities, architecture
   and the authorization checkpoint, prepended to the preserved historical text.
2. `QED-API-MIGRATION-INVENTORY.md` — new file-level service/transport catalog.
3. `QED-SYSTEM-WIDE-QUERY-VERIFICATION.md` — this report.

Ignored verification artifacts are under `test-results/system-migration-verification`
and the temporary directory `qed-system-migration-20261011`. No dependencies,
application/test assertions, backend code or database configuration were changed.
The API toggle remains the user's existing localhost selection with the Render
alternative commented; it must be selected appropriately before release.

The task began with 88 modified/untracked files snapshotted by SHA-256. The only
authorized extension to those files is the roadmap prefix: all other 87 files
are byte-for-byte unchanged, and the roadmap's complete historical suffix matches
its original SHA-256. Test-generated tracked screenshots started clean and are
restored after the suites; no pre-existing screenshots or unrelated changes are
discarded. Nothing is staged, committed, pushed or deployed.

## Required next action and production assessment

Resolve the Calendar authorization contract under explicit backend authorization,
or establish evidence of an existing enforcement layer before revisiting the
writer boundary. Required security acceptance: unauthenticated writes rejected;
Teacher/Parent writes rejected; authorized Admin/Principal writes allowed; exact
payload/CRUD behavior retained; frontend credentials, 401 expiration and 403
privacy exercised in an isolated environment. No destructive live-data test is
appropriate. Decide intentional deletion behavior separately from this migration.

After the serious-risk checkpoint is resolved, the next independent low-risk
migration is Admin dashboard counts/login frequency/audit logs, then coherent
Admin CRUD boundaries, Teacher readers/writers, Parent readers/visibility/progress,
and shared event invalidation as prioritized in the roadmap.

System-wide migration is incomplete and is not certified production-ready by this
checkpoint. The material Calendar authorization gap and unresolved full-source
roster failure block a clean release assessment. Passing frontend mocks cannot
establish backend authorization. No
authorized real-backend Principal/Admin/Teacher/Parent account was used, and no
real-backend verification is claimed. Existing xlsx vulnerability remains a
separate security follow-up; no dependency upgrade was attempted.
