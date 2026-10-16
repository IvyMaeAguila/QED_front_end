# Principal Students Overview: migration and verification

Date: 2026-10-11. Baseline HEAD remains
`174588a13cccdffa2fafc3bafccbbed214b192de`. No commit, staging, push or deployment.
See `TANSTACK-QUERY-MIGRATION-ROADMAP.md` for the system-wide audit and gated order.

## Implemented boundary

Only `/principal/students` grade/section summaries, enrollment totals and active
school-year label now use the existing centralized QueryClient. Student class
and unassigned-grade rosters, profiles, teacher schedules, dashboards, reports,
gradebooks, Admin, Teacher, Parent and intervention features were not migrated.
No backend, database, dependency or business-calculation changes were made.

The route composition supplies the existing singleton through its own provider,
so the public root does not import Query. The hook's return interface and total
calculation are unchanged. Search/filter state, cards, classes, colors, layout,
and navigation handlers are unchanged. The only additional presentation is the
existing LoadingRegion error/retry pattern for offline cached cards.

- Typed key: `['session', generation, role, userId, 'principal', 'students', 'overview']`.
- Five-minute staleTime and ten-minute inactive gcTime inherited from the pilot.
  This deliberately replaces the overview's former indefinite service cache.
- No automatic retries, polling, focus refetch or reconnect refetch of completed
  queries. Remounting stale data refreshes in the background; fresh returns reuse
  cache. Paused requests resume once when connectivity returns.
- Both GETs consume AbortSignal and preserve credentialed requests and endpoints.
  Retry clicks are ignored while fetching/paused/offline; no queued duplicates.
- Preview, auth readiness and Principal role gates suppress fetching and data.
- Each endpoint independently handles 401 using the existing session-generation
  guard; a later 401 cannot be masked by a sibling 500 or expire a new session.
  403 stays an ordinary error. Existing auth cleanup cancels and clears both
  migrated features on identity/session changes.
- Removed only the overview grade-level manual cache. The overview school-year
  request bypasses the unchanged roster school-year cache. Class Maps, fetched-ID
  Sets, cached-null/404 semantics and teacher profile/schedule caches are intact.
- No mutations were migrated; mutation invalidation is not applicable in this
  read-only increment. There is no new cross-browser synchronization mechanism.

## Exact files added or modified by this increment

All paths are relative to `C:/Users/Mavys/Downloads/QED_System/QED_front_end/`.

1. `src/shared/query/queryClient.ts` — overview key factory only.
2. `src/features/profiles/principal/pages/students/hooks/usePrincipalStudentsOverview.ts` — Query hook, same result interface.
3. `src/features/profiles/principal/pages/students/hooks/studentsOfflineError.ts` — offline error singleton (new).
4. `src/features/profiles/principal/pages/students/services/students.service.ts` — uncached cancellable overview GETs; remaining caches retained.
5. `src/features/profiles/principal/pages/students/PrincipalStudentsPage.loading-view.tsx` — route provider and cached offline alert.
6. `tests/students-query.html` — isolated browser harness entry (new).
7. `tests/students-query-harness.tsx` — real hook/auth/client under StrictMode (new).
8. `tests/students-query.spec.ts` — 16 targeted regression tests (new).
9. `tests/students-query-acceptance.spec.ts` — four responsive UI workflows (new).
10. `playwright.acceptance.config.ts` — includes new source tests.
11. `playwright.acceptance-build.config.ts` — includes new production UI tests.
12. `TANSTACK-QUERY-MIGRATION-ROADMAP.md` — audit and phased risk inventory (new).
13. `QED-STUDENTS-OVERVIEW-QUERY-VERIFICATION.md` — this report (new).

Pre-existing changes were preserved byte-for-byte (SHA-256 checked):
`src/config/api.config.ts`, `playwright.config.ts`, `playwright.live.config.ts`,
`tests/gradebook-two-advisories.spec.ts`, `tests/live/gradebook-live.spec.ts`.
No live/database-writing tests were run. Generated tracked loading screenshots
were restored after testing; new acceptance screenshots remain in ignored
`test-results/`. The Git index remains empty.

## Executed verification

| Execution | Result | Backend/evidence |
| --- | --- | --- |
| Baseline `npm run build` (includes `tsc -b`, Vite and bundle guard) | PASS | Local compilation; no backend |
| Baseline `npx playwright test --config playwright.acceptance.config.ts` | 78/78 PASS | Mocked API browser tests; before application edits |
| Initial targeted overview run | 14/14 PASS | Mocked API; two additional regression cases added afterward |
| Post-change `npx tsc -b --pretty false` | PASS | No backend |
| Post-change `npm run build` | PASS | Fresh artifact; guard budgets unchanged |
| Post-change complete source acceptance config | 98/98 PASS; 0 skipped, flaky or failed | 78 existing + 16 new hook regressions + 4 new UI workflows; `test-results/acceptance-results.json` |
| `npx playwright test --config playwright.acceptance-build.config.ts` | 56/56 PASS; 0 skipped, flaky or failed | Fresh post-change artifact, not retained build; 52 existing + 4 new UI workflows; `test-results/fresh-build-results.json` |
| Scope diff and whitespace review | PASS | Existing teacher pilot/auth/other-role/business files and dependency manifest/lock unchanged |

The complete source run took approximately 2.8 minutes; production acceptance
took approximately 1.4 minutes. These are suite durations, not application
performance benchmarks. API responses are mocked in ALL browser runs. The real
React application, router, auth context, fetch, QueryClient and browser execute;
no successful real-backend authentication/data-access verification is claimed.

### New regression coverage

| Scenario | Result / evidence |
| --- | --- |
| Preview and pending authentication | PASS: no overview request until permitted; label and total correct afterward |
| Initial loading, both requests 500, manual retry, empty response | PASS: loading resolves, error shown, single explicit retry, zero total/empty data |
| Fresh return and stale return after 301 seconds | PASS: fresh reuse; stale refresh bounded to one success plus any cancelled development probe |
| Offline initial load and repeated Retry | PASS: no indefinite loading/no requests; reconnect resumes each endpoint once |
| Stale cached overview offline/reconnect | PASS: records remain visible, no loading loop, one refresh on reconnect |
| Grades 500 followed by school-year 401 | PASS: session expires independently |
| School-year 500 followed by grades 401 | PASS: session expires independently |
| Grades 403 and school-year 403 (separate cases) | PASS: user stays signed in; no automatic retry |
| Old 401 during account switch and logout/login (separate cases) | PASS: newer session survives; new data wins |
| Account switch with pending successful reads | PASS: cancellation observed, old rows hidden; only new session key remains |
| Role switch and preview with cached results | PASS: no cached private records exposed/no unauthorized fetch |
| Logout with populated cache and same-account login | PASS: populated private data removed; fresh login fetches again |
| Repeated Retry while pending; last observer unmount | PASS: no duplicate requests; both HTTP requests abort |
| Unmigrated class/unassigned roster and year caches | PASS: caches still reuse data and cached 404/null independently of overview |
| 375/1280 widths, light/dark (four workflows, source and build) | PASS: loading, totals, school year, search, empty search, grade/section filters, assigned/unassigned roster navigation, fresh return, stale return, cached-offline alert and retries, 500 and recovery |

Existing suites also reverified teacher filtering/profile/schedule navigation,
teacher session isolation and both endpoint 401 paths, existing roster and
Parent loading layouts, auth bootstrap, user details, role bundle isolation and
fixed bundle budgets. Unchanged academic calculations, attendance editing,
holistic editing, parent grade visibility and quiz progression were not newly
exercised; their full business-rule tests are gates for their future phases.

### Browser and visual evidence

Each new UI workflow captures loading, loaded, cached-offline and error PNGs as
test attachments. Production copies are under `test-results/fresh-build/`.
Loaded mobile-light and desktop-dark screenshots and a mobile cached-offline
screenshot were visually inspected: existing maroon cards and controls remain;
the offline alert appears above usable cached cards. This is visual inspection
plus layout/control assertions, not a pixel-perfect historical screenshot diff.

Each new production workflow asserts exactly four grade-summary HTTP attempts:
initial success, one stale refresh, controlled reload 500, explicit retry success.
There are zero cancellations in production workflows and no extra requests on
fresh navigation, offline Retry, reconnect with fresh data, or a quiet observation
interval. Development StrictMode probes are allowed only when explicitly
cancelled; exactly one initial completed response is required. No page errors or
unexpected console errors occurred. Intentional HTTP 500 resource logs are
excluded from unexpected-console assertions. Sanitized request counters are
attached to each workflow. No secrets or real student records are captured.

## Measured bundle impact

Values use the existing guard's Node gzip level 6, in bytes; baseline and new
build use the SAME unchanged local API configuration. Budgets were not raised.

| Eager download | Baseline | New | Change | Budget |
| --- | ---: | ---: | ---: | ---: |
| Public entry closure | 133385 | 133381 | -4 | 135349 |
| Admin beyond public | 140818 | 140812 | -6 | 151512 |
| Principal beyond public | 130288 | 130489 | +201 (about 0.15%) | Existing structural guards |
| Teacher beyond public | 160845 | 160846 | +1 | Existing structural guards |
| Parent beyond public | 145827 | 145824 | -3 | Existing structural guards |

Public entry chunk is 627 gzip bytes against its 112153-byte budget. Graph and
production script-request tests confirm Query remains outside public, Admin,
Teacher and Parent eager dependencies. All four roles still avoid eagerly
loading chart/Excel libraries. Small non-Principal gzip changes reflect shared
chunk/import compression; there is no new TanStack dependency there. No material
bundle regression was found. There is no before/after real-backend latency or
large-dataset performance benchmark, so none is claimed.

## Remaining limits and recommendation

- No implementation/test blocker remains for this increment. It is ready for
  user code review and acceptance of the mocked-browser evidence.
- Real backend login, cookies/CORS, actual permissions/data shapes, multi-user
  updates and real data volume remain unverified without authorized credentials.
- The preserved working API config currently hardcodes `http://localhost:7400`
  with Render commented. The fresh build therefore contains localhost. This
  intentionally preserves the requested manual workflow; this artifact is NOT
  deployment-ready. Select `https://thesis-qed-1.onrender.com` before preparing a
  production commit/artifact, rebuild and reverify the deployed API contract.
- Unmigrated caches retain their existing limitations. Query does not make
  those caches session-safe or add socket synchronization automatically.
- Existing xlsx vulnerability remains a separate security follow-up; no audit
  remediation or unrelated dependency upgrade was attempted.
- Recommend class and unassigned-grade rosters next, subject to approval and
  explicit cached-null/404, session isolation and profile-navigation tests.
  No additional module or migration phase will proceed without approval.
