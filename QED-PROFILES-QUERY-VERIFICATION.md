# Principal teacher profile and schedule Query checkpoint

Date: 2026-10-11. Ready for review; stop before another module.
HEAD remains `174588a13cccdffa2fafc3bafccbbed214b192de`.
No staging, commit, push, deployment, dependency changes or backend/database edits.

## Dependency analysis and selected boundary

Reviewed the roadmap, invalidation map and roster verification report before
implementation. Existing uncommitted overview/roster migrations remain in place.
Selected one coherent boundary: Principal teacher identity, schedules, advisory
assignments and advisory class-list reads. These share one teacher detail API
response plus year and roster dependencies.

There is no Principal student-profile route or reader in this checkout.
`PrincipalRoutes.tsx` exposes the Students Overview and class/grade roster pages;
their student tables do not supply a student-profile activation handler.
Creating a new profile page would be feature work, not migration of an existing
reader. No student-profile page was invented or migrated across roles.

| Resource / consumers inspected | Finding and action |
| --- | --- |
| Principal teacher detail route and `PrincipalViews.tsx` preview | Now use `PrincipalTeacherProfilePage.tsx`, a scoped provider using the existing singleton and a dedicated Query hook |
| Admin `UserViewPage.loading-view.tsx` | Embeds the old `TeacherSchedulePage.tsx` after resolving user-to-teacher ID; preserved this import, prerequisites, actions, legacy hook, effects and service caches |
| `teachers.service.ts` profile Map and school-year cache | Used by legacy teacher schedule hook/Admin. Retained byte-for-byte. Principal Query uses a separate uncached transport and neither reads nor writes these caches |
| Principal Teachers Directory | Uses existing raw teacher-list and directory-year functions; unchanged, with previous cache/session tests still passing |
| `students.service.ts` class-list details and active-year ID | Already stateless from the approved roster migration. Reused unchanged, with the same session/year/class keys to deduplicate profile and class-route reads |
| Shared student detail | `src/shared/components/StudentDetailPage.loading-view.tsx` is routed under Teacher and consumes existing student/classes/teachers contexts. Admin's detail route is commented out. Not routed under Principal; unchanged |
| Parent student profiles | `StudentProfileContext.tsx`/`StudentProfile.service.ts` own linked-student GET and editable fields; separate reader/writer boundary, unchanged |
| Teacher dashboard, subjects and advisory schedules | Separate frontend services; backend `teacherSchedule.service.js` is shared with Principal but was only inspected, never modified or invoked against the database |
| Parent class schedule | Separate Academic service/context; unchanged |
| Other school-year readers | Admin academic-year service/settings, Principal dashboard/gradebooks and Parent contexts remain on their existing transports/policies; no speculative cache removal or invalidation |

The shared presentation now accepts an optional server-state snapshot. Its
legacy branch still invokes the existing hook/effects; its Principal branch
renders the externally supplied Query state without invoking the legacy hook.
It contains no TanStack import. Principal preview and actual route both use the
new adapter; Admin continues its original branch. This prevents Query from
entering Admin's eager graph. The legacy cache is not a competing layer in the
Principal reader because that reader bypasses it completely; a regression test
seeds the legacy cache and proves the two owners remain independent.

## Implemented behavior

New profile key:
`['session', generation, role, userId, 'principal', 'teachers', 'profile', yearId, teacherId]`.
Profile responses include schedule/advisories. Shared active-year and per-class
roster keys are reused exactly as documented in the invalidation map. Active
year resolves first, then profile, then unique advisory classes in parallel.
The advisory Map is metadata deduplication, not a server-response cache.

Profile freshness is 30 seconds with five-minute inactive GC, matching roster
membership. QueryClient defaults remain unchanged: no automatic retry, focus
refresh, completed-query reconnect refetch, persistence or polling. Fresh
navigation reuses cache; stale remount refreshes. Top-level Retry refetches year,
profile and known class lists. Class-list Retry refetches current class-list
queries. Offline/paused/pending Retry does not queue duplicate requests. No
write mutations or new socket/event invalidation were added.

Every year/profile/class request consumes AbortSignal and independently handles
401 through the existing session-generation expiration guard. A sibling 500
cannot mask a later 401. Cancelled or old-session responses cannot expire a new
session. Year/profile 403 hides cached profile metadata; class-list 403 hides
cached advisory rosters. Authentication remains active on 403. Ordinary roster
failures preserve successful sections and the existing partial-failure message.

404 is cached successful null for the Principal profile and class lists. The
profile uses the existing Teacher Not Found component and back navigation;
the legacy Admin transport's error behavior is unchanged. Empty schedules and
advisories retain existing empty messages. Offline initial work stops loading;
paused work resumes on reconnect; cached profile, schedule and rosters remain
visible beneath a LoadingRegion offline notice. Cached profile Not Found also
remains visible offline. Preview/auth readiness and non-Principal roles cannot
start the new private reads. Existing auth cleanup clears Query data on session
changes; no authentication code was changed.

Presentation markup, tabs, grouping/count calculations, avatars, schedule
formatting and responsive styling remain unchanged apart from the existing
error/retry pattern displaying an offline notice with cached content.

## Files created or changed in THIS increment

Relative to `C:/Users/Mavys/Downloads/QED_System/QED_front_end`:

| File | Purpose |
| --- | --- |
| `src/features/profiles/principal/pages/teachers/PrincipalTeacherProfilePage.tsx` | Principal-only Query adapter/provider |
| `src/features/profiles/principal/pages/teachers/hooks/usePrincipalTeacherProfile.ts` | Profile/year/advisory queries, loading/errors/retry/cancellation/session isolation |
| `src/features/profiles/principal/pages/teachers/services/principalTeacherProfile.service.ts` | Uncached abortable profile GET with typed HTTP errors and null 404 |
| `src/features/profiles/principal/pages/teachers/TeacherSchedulePage.loading-view.tsx` | Shared presentation state injection; preserve legacy branch; cached-offline notices |
| `src/shared/query/queryClient.ts` | Add teacher profile key factory, preserving earlier keys/defaults/cleanup |
| `src/routes/roles/PrincipalViews.tsx` | Select Principal adapter for route preview |
| `src/shared/loading/routeSkeletons.ts` | Select Principal adapter in the existing lazy route loader |
| `tests/profile-query.html` | Browser hook harness entry |
| `tests/profile-query-harness.tsx` | Real auth/client/hook with target/session/preview controls |
| `tests/profile-query.spec.ts` | 27 targeted regression tests |
| `tests/profile-query-acceptance.spec.ts` | Eight actual-route acceptance workflows/screenshots/metrics |
| `playwright.acceptance.config.ts` | Include new source suites |
| `playwright.acceptance-build.config.ts` | Include new production UI suite |
| `TANSTACK-QUERY-MIGRATION-ROADMAP.md` | Record selected boundary and absent Principal student-profile reader |
| `TANSTACK-QUERY-INVALIDATION-MAP.md` | Record new key/dependencies and future writer invalidations |
| `QED-PROFILES-QUERY-VERIFICATION.md` | This report |

Earlier overview/roster application code, their tests and verification reports
were not rewritten. API configuration, general/live Playwright configuration,
gradebook/live tests, legacy teacher hook/service/effects were checked against
their starting SHA256 values and remain byte-for-byte unchanged. No Admin,
Teacher, Parent, authentication or package source file was modified. Existing
tests regenerate tracked `loading-screenshots/`; only these generated changes
were restored. New test screenshots/JSON remain ignored under `test-results/`.

## Executed verification

All API browser scenarios below are MOCKED with synthetic records. No real
backend/account/cookie/database verification is claimed. No live/destructive
tests ran; no accounts or database fixtures were created.

| Phase / command | Result |
| --- | --- |
| Baseline `npm run build` (TypeScript, Vite, unchanged bundle guard) | PASS |
| Baseline `npx playwright test --config playwright.acceptance.config.ts` | 137/137 PASS, 4.1 minutes |
| Baseline `npx playwright test --config playwright.acceptance-build.config.ts` against baseline build | 68/68 PASS, 2.2 minutes |
| Post-change `npx tsc -b --pretty false` | PASS |
| Targeted new suites | 35/35 PASS |
| Full post-change source acceptance/regression suite | 172/172 PASS, 6.1 minutes |
| Final fresh `npm run build` after the full source suite | PASS, including TypeScript and fixed bundle guards |
| Final production-artifact browser suite immediately after fresh build | 76/76 PASS, 2.7 minutes |
| Final diff whitespace/scope and staged-files checks | PASS; index empty |

The 35 new cases consist of 27 hook/session/transport tests and eight UI tests.
Production repeats the eight UI cases alongside the 68 previous production
checks; totals are executions, not unique test counts. No assertions were
disabled, retries enabled or bundle caps increased. The first targeted run had
one test-selector failure: Students is a link, not a button. Corrected that
selector without changing application code; clean targeted/full runs passed.

Coverage includes readiness/preview/missing target; initial loading and empty
advisories/schedules; null 404 reuse/recovery; fresh navigation/stale refresh;
duplicate advisory/observer deduplication; rapid teacher switching; actual year
ID changes without old-year placeholders; initial and cached offline recovery;
500 errors/explicit retry; independent endpoint 401 after sibling 500; 403;
late old-session 401 after switch/logout-login; same-account fresh login and
new-account key isolation; cancellation of pending year/profile/class work;
other-role denial; legacy Admin-cache bypass; shared class-route cache reuse;
partial advisory errors and all-failure recovery.

Four responsive workflows cover 375/1280 pixels and light/dark themes. They
exercise tabs, schedule content, back/return navigation, offline cached data,
stale return and failure/retry. Each captures loading/loaded/cached-offline/error
screenshots and checks page errors, filtered console errors and a quiet request
interval. Each fresh-production workflow asserts exactly four profile requests
over initial load, stale return, failed reload and recovery; fresh navigation,
offline retries and reconnect with fresh data add none. Mobile dark loaded and
desktop dark cached-offline screenshots were visually inspected; no layout/style
regression observed. Existing teacher-directory, roster, overview, bootstrap,
role isolation and Admin detail/mapping/control tests all remain green.

Evidence: `test-results/acceptance-results.json`,
`test-results/fresh-build-results.json`, and profile workflow screenshot/metric
attachments in `test-results/` and `test-results/fresh-build/`.

## Bundle and network impact

Existing gzip-level-6 bundle checker, unchanged caps:

| Eager download | Baseline bytes | Final bytes | Delta |
| --- | ---: | ---: | ---: |
| Entry alone | 629 | 626 | -3 |
| Public closure | 133384 | 133383 | -1 |
| Admin beyond public | 140680 | 141053 | +373 (about 0.27%) |
| Principal beyond public | 130977 | 133702 | +2725 (about 2.08%) |
| Teacher beyond public | 160840 | 160856 | +16 |
| Parent beyond public | 145822 | 145832 | +10 |

Public closure remains below 135349 bytes and Admin below 151512. No Query
modules enter public/Admin/Teacher/Parent eager graphs. Admin's small increase
comes from the shared presentation adapter; Principal owns the new query logic
and useQueries support. Browser role-isolation tests also pass. Initial cold
profile loading adds a serial active-year step compared with the previous
parallel profile/year calls; a warm shared year avoids that step. Advisory GETs
remain parallel and are reused with class-route queries within freshness.
No loops/duplicate production profile requests were observed in tested paths.
Real-backend latency/throughput was not measured; bundle and deterministic
request counts are not proof of live performance equivalence.

## Remaining risks and next checkpoint

1. Real Principal authentication, live permissions, cookies and production data
   remain unverified. Mocked acceptance cannot replace authorized backend tests.
2. Backend profile/schedule/roster GETs select active year internally and expose
   no year filter. Client keys cannot make a year rollover atomic across GETs.
3. No new mutation/event subscriptions were added. A mounted page refreshes via
   explicit Retry; stale remount is the automatic boundary. Another browser's
   writes are not immediately synchronized. Future class/adviser/schedule/user
   and year writers must bind the documented profile/roster invalidations.
4. Admin's legacy profile/year caches retain their pre-existing lifetime/session
   behavior intentionally. This increment improves Principal only; removing or
   changing those caches requires the Admin reader/writer migration and tests.
5. The preserved manual API toggle still selects `http://localhost:7400`.
   The tested production-mode artifact is for local acceptance, not deployment.
   Select `https://thesis-qed-1.onrender.com` through the established workflow and
   rebuild/verify before preparing a production commit. No config change here.
6. Previously identified xlsx security findings remain a separate follow-up;
   no dependency upgrades/audit remediation or academic business changes here.

No remaining implementation/test blocker was found in executed coverage. This
increment is ready for review, not automatic commit/deployment. Recommended next
Principal boundary after separate approval: the read-only Dashboard, retaining
its aggregation transforms and selected-term state; then analytics. No remaining
Principal student-profile reader exists to migrate. Admin/Teacher/Parent profile
consumers require their own approved reader/writer increments. Stop here.
