# Principal class and unassigned-grade roster verification

Checkpoint: 2026-10-11. Ready for review; stop before another migration.
HEAD remains `174588a13cccdffa2fafc3bafccbbed214b192de`.
No staging, commit, push, deployment, backend/database changes or package changes.

## Scope and existing work

Reviewed the existing uncommitted Students Overview migration and its report.
Its hook, page, UI acceptance spec and harness were preserved byte-for-byte.
Its transport-only regression expectation was updated because roster service
caches have now been removed. Teachers Directory remains intact. No Admin,
Teacher, Parent or later Principal module was migrated.

Files created or extended in THIS increment (relative to the frontend root):

| File | Change |
| --- | --- |
| `src/features/profiles/principal/pages/students/hooks/useClassList.ts` | Replace manual state/effects with dependent session-scoped queries; preserve return interface |
| `src/features/profiles/principal/pages/students/hooks/rosterOfflineError.ts` | Shared offline error identity/message |
| `src/features/profiles/principal/pages/students/ClassListPage.loading-view.tsx` | Scoped singleton provider and existing LoadingRegion notices for offline cached data/null |
| `src/features/profiles/principal/pages/students/services/students.service.ts` | Stateless abortable roster/year transports; remove obsolete roster/year service caches |
| `src/shared/query/queryClient.ts` | Add active-year and class/grade roster key factories; keep defaults and auth cleanup unchanged |
| `tests/roster-query.html` | Hook harness entry |
| `tests/roster-query-harness.tsx` | Auth/session/preview/observer controls for deterministic tests |
| `tests/roster-query.spec.ts` | 27 hook, transport and session regressions |
| `tests/roster-query-acceptance.spec.ts` | 12 actual-route browser workflows, screenshots and sanitized metrics |
| `tests/students-query.spec.ts` | Replace obsolete competing-roster-cache expectation with stateless transport expectation |
| `playwright.acceptance.config.ts` | Include new hook and route suites |
| `playwright.acceptance-build.config.ts` | Include new route workflows against freshly built dist |
| `TANSTACK-QUERY-MIGRATION-ROADMAP.md` | Mark current checkpoint; preserve historical overview assessment |
| `TANSTACK-QUERY-INVALIDATION-MAP.md` | Implemented dependency/key graph plus separately labeled future writer/event plan |
| `QED-ROSTERS-QUERY-VERIFICATION.md` | This report |

Pre-existing API configuration, general Playwright config, live config/tests,
gradebook test, overview report and other overview files were not changed by
this increment. Existing tests regenerate tracked loading screenshots; those
generated changes were restored, while new screenshots remain ignored artifacts.

## Query and UI behavior

Keys begin with session generation, role and user ID. The active-year query
resolves the actual year ID before the initial roster request. Roster keys also
include year ID, class/grade discriminator and target ID; equal numeric class
and grade IDs cannot collide. No private persistence or old-year placeholder.

Roster/year freshness is 30 seconds with five-minute inactive retention. The
existing overview/directory five-minute policies remain unchanged. There is no
polling or focus refresh: fresh route returns reuse data; stale remounts refetch;
Retry refreshes explicitly. This is not a 30-second continuous synchronization
guarantee. No write mutation or event invalidation was added. See the invalidation
map for the success-only writer integrations requiring later approval.

Successful 404/null results are cached and preserve Not Found navigation;
an existing class with zero students remains an empty class. Search, gender
filter, headers, back navigation, LoadingRegion and maroon/gold themes remain.
Offline initial work stops showing loading, paused work resumes on reconnect,
and cached rows or cached Not Found remain visible with the existing error/retry
pattern. Offline or pending Retry cannot enqueue duplicate work.

Each request independently handles 401 through existing session expiration,
checks cancellation, and passes the owning session generation. A 403 keeps the
user signed in and hides cached private roster rows and metadata. Existing auth
cleanup cancels and clears query data on account/role/login/logout transitions.
Cancellation signals reach both fetch transports. Route previews and unresolved
authentication cannot start roster/year requests.

The shared teacher-profile class-list reader still calls `getClassList(id)` and
uses its existing local state/effects. Its teacher-profile and school-year caches
and schedule implementation were not modified. Removing the global roster Map
means this existing reader can perform a fresh GET on mount/retry instead of
reusing indefinitely cached class data. That network change is intentional to
avoid a competing, session-unscoped roster cache; it does not migrate this reader
to Query. Admin details reuse this reader; their bundle guards still pass.

## Executed verification

All browser API responses are MOCKED synthetic fixtures. No authorized account
or real-backend/database verification is claimed. No live/destructive tests ran.

| Command / check | Result |
| --- | --- |
| Baseline `npm run build` before edits | PASS, TypeScript/Vite/fixed bundle guards |
| Baseline `npx playwright test --config playwright.acceptance.config.ts` | 98/98 PASS |
| `npx tsc -b --pretty false` after implementation | PASS |
| Final `npx playwright test --config playwright.acceptance.config.ts` | 137/137 PASS, 3.9 minutes |
| Final fresh `npm run build` | PASS, TypeScript/Vite/fixed bundle guards |
| `npx playwright test --config playwright.acceptance-build.config.ts` immediately after fresh build | 68/68 PASS, 1.9 minutes |

The source suite includes all 27 new roster regressions and 12 new UI workflows,
plus the previous 98 tests. Production coverage repeats the 12 route workflows
and 56 existing build/browser checks; totals are executions, not unique cases.

Coverage: auth readiness/preview/invalid target; empty and cached-null responses;
loading/500/error/explicit retry; offline initial and cached recovery; 30-second
stale returns and fresh reuse; equal-ID separation and observer deduplication;
year changes; target-change/unmount cancellation; per-endpoint 401/403;
late old-session 401 after a sibling 500; account switching, logout/same-account
login and other-role isolation; existing overview, teacher directory, teacher
profile class list, schedules, Admin details, bootstrap and role bundles.

Eight new responsive workflows cover class/grade x 375/1280 pixels x light/dark.
Each captures loading, loaded, cached-offline and error screenshots, exercises
name/ID search and gender filtering, and checks console/page errors and a quiet
network interval. Fresh-production workflows each assert exactly four roster
requests over initial load, stale return, failed reload and explicit recovery,
with zero cancellations. Dev StrictMode cancellation is accounted for explicitly.
Inspected mobile light loaded and desktop dark cached-offline screenshots;
no layout/style regression observed. Artifacts and sanitized metrics are under
`test-results/`; JSON summaries are `acceptance-results.json` and
`fresh-build-results.json`.

An exploratory run failed the new stale-navigation checks because the test
returned immediately after the URL changed, before the overview rendered and
the old roster unmounted. Tests now explicitly await the Students heading and
absence of the Class List heading before returning. Request/freshness assertions
were retained; no application change or budget increase was used to hide this.
An existing screenshot timeout in that exploratory run did not recur in either
clean final suite. Final acceptance results above supersede exploratory runs.

## Bundle impact

Measured with the existing gzip-level-6 checker against this turn's baseline;
caps and forbidden dependency assertions were not changed.

| Eager download | Baseline bytes | Final bytes | Delta |
| --- | ---: | ---: | ---: |
| Entry alone | 627 | 629 | +2 |
| Public closure | 133381 | 133384 | +3 |
| Admin beyond public | 140812 | 140680 | -132 |
| Principal beyond public | 130489 | 130977 | +488 (about 0.37%) |
| Teacher beyond public | 160846 | 160840 | -6 |
| Parent beyond public | 145824 | 145822 | -2 |

Public closure remains below 135349 and Admin below 151512 bytes. TanStack Query
is absent from public/Admin/Teacher/Parent eager graphs. Browser role-isolation
tests pass. No measured uncontrolled request loops or duplicate production roster
GETs in tested workflows. Real-network latency/throughput was not benchmarked.

## Remaining limitations and approval checkpoint

1. Real Principal authentication, live authorization/cookie behavior and actual
   data remain unverified without an authorized account/backend acceptance run.
2. Initial roster loading now waits for the year ID (one serial network step).
   The existing backend roster endpoints choose the current year internally and
   accept no year filter; a backend year rollover between year and roster GETs
   cannot be made atomic by client keys. No backend changes were authorized.
3. Another browser's writes do not invalidate these queries in real time. There
   are no writers in these pages; future Admin/academic-writer migrations must
   bind the documented invalidation/event paths. A mounted page refreshes through
   explicit Retry; stale remount is the automatic freshness boundary.
4. The preserved manual API toggle currently selects `http://localhost:7400`.
   This local production-mode artifact is NOT deploy-ready. Select the intended
   `https://thesis-qed-1.onrender.com` URL through the established workflow before
   preparing/rebuilding a production commit; this task did not change API config.
5. The previously identified xlsx security issue remains a separate follow-up;
   no dependency upgrade or audit remediation was performed here.

No remaining deterministic implementation/test blocker was found. This increment
is ready for review within the coverage above. Do not infer system-wide migration,
academic correctness of unchanged modules, real-backend acceptance or deployment
approval from these read-only mocked tests. Stop for user approval before later
Principal profiles or any other role/resource migration.
