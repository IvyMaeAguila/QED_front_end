<!-- PART-C-REGRESSION -->
# Narrow Part A regression follow-up — 2026-10-10

Scope authorized by the latest user decision: fix Part A, isolate Add Subject ten times first, preserve every test assertion/threshold/timing, no data prefetch or other-role browser code, fixed bundle budgets, one additional full run only. Main/remotes/deployment untouched; branch codex/finish-loading-verification. Earlier pending-permission notes below are historical and superseded.

## Cold diagnosis

Ten separate CLI invocations each started a fresh Vite server and browser against an archive of untouched current commit 67a3c5b. Reporter only observed existing Playwright step times; no test/fixture edits and no tracing overhead in these ten. 9 passes, 1 failures: a real cold compilation slowdown produces a flaky pass/fail at the existing 5000ms assertion. Navigation-to-main times include the real navigation; failed values are censored at timeout, not successful first-render times. The first exploratory ten runs overlapped the throttled-login diagnostic, so they were repeated without another diagnostic running; original cold-current-* and startup-current-exploratory.json evidence is retained, not used as the final isolated result. Clean evidence: cold-clean-current-*; the final current startup sample was also remeasured alone.

| Run | Navigation s | Main assertion s | Navigation to main/end s | Result |
| --- | ---: | ---: | ---: | --- |
| 1 | 3.967 | 4.953 | 8.926 | passed |
| 2 | 3.521 | 4.923 | 8.450 | passed |
| 3 | 3.519 | 4.994 | 8.519 | passed |
| 4 | 3.606 | 4.939 | 8.553 | passed |
| 5 | 3.360 | 4.950 | 8.316 | passed |
| 6 | 3.369 | 5.010 (timeout) | 8.386 (censored) | failed |
| 7 | 3.026 | 4.937 | 7.968 | passed |
| 8 | 3.365 | 4.948 | 8.318 | passed |
| 9 | 3.484 | 4.955 | 8.445 | passed |
| 10 | 3.450 | 4.939 | 8.394 | passed |

Separate trace: 205 requests, 179 source-module requests; auth responses ~9ms, source transforms waited up to 2374ms. The dev graph recursively discovers uncompiled modules after auth. This source-transformation cost is development-environment-only; production serves built JS. Evidence: cold-current-trace.zip and cold-current.network. Production has a separate bandwidth/parse cost, not dismissed as a test issue.

Development fix: explicitly finish static source transforms before advertising HTML readiness. It neither executes protected components nor sends browser/page data requests. All four role roots are transformed server-side; the browser still receives only its authenticated role. Static imports are parsed from transformed JS, excluding dynamic controllers and optional libraries. This deliberately moves compilation into dev-server readiness; it is not a claim that total dev-server startup is free. Entire isolated CLI runs took 29.1s, 26.5s and 25.8s, including readiness. No fixture was changed. Final independent cold reruns: passed, navigation 0.880s + main wait 1.441s = 2.328s; passed, navigation 0.706s + main wait 0.315s = 1.028s; passed, navigation 0.708s + main wait 0.330s = 1.044s. Intermediate unsuccessful warmup approaches and their actual timings are retained in cold-fixed-*.json/txt.

## Production changes and full downloads

Role/static-dependency modulepreload already ran at the first successful auth response; built Vite dependency maps already included the full static closure. No page controller or page-data request was moved earlier. Production groups modules by their exact role audience sets and coalesces shared/public modules without duplicating them. Only source audit descriptions (regions) are omitted from runtime registry output; source classifications, registry load functions and all tests remain intact. Recharts/XLSX/ExcelJS remain outside every role eager closure. No layout, effect, route, API or calculation source file changed.

Entry before this fix: 338.746 raw / 101.957 gzip kB. After: 1.132 / 0.626 kB facade. The meaningful complete public eager closure is 395.536 / 123.044 before, 427.223 / 133.116 after. Its gzip grows within the unchanged 135349-byte ceiling; the entry ceiling remains 112153 bytes. A tiny facade does not represent the full initial download.

All sizes below are decimal kB, raw / calculated Node gzip level 6. The HTTP harness actually transfers uncompressed content. Eager totals exclude public code; first-skeleton request totals INCLUDE public code, controllers already requested, and optional chart code requested by that point. The latter inventory includes in-flight requests, not a claim that every response finished at that instant.

| Role | Eager beyond public before | Eager beyond public after | Scripts requested by skeleton before | Scripts requested by skeleton after |
| --- | ---: | ---: | ---: | ---: |
| Admin | 525.294 / 180.012 | 474.462 / 143.321 | 921.121 / 303.294 | 902.045 / 276.718 |
| Teacher | 580.949 / 193.035 | 528.674 / 158.379 | 977.985 / 316.911 | 957.408 / 292.335 |
| Principal | 416.263 / 141.842 | 369.205 / 114.445 | 1375.322 / 415.320 | 1383.195 / 410.239 |
| Parent | 517.673 / 162.968 | 469.391 / 142.774 | 913.526 / 286.255 | 897.000 / 276.180 |

Every role chunk, shared/vendor chunk, import edge and eager composition is listed in role-downloads-{current,fixed}.json. Actual first-skeleton requests, scripts AND CSS/images, are listed individually with byte sizes in role-network-{current,fixed}.json. Current network inventory was reproduced from an archive of unmodified commit 67a3c5b in a temporary directory (no checkout/main changes); its production build output is part-c-current-reconstruction-build.txt. Gzip/hash noise of a few bytes in the reconstructed build is retained honestly.

Largest pre-fix contributors: Teacher's full role preview graph (581kB beyond public), shared Header chunk (157kB, including registry/shared UI), Subject Records (54kB), Attendance Records (43kB); Parent Child Detail (128kB) and Pet Quiz (94kB); Principal Dashboard (46kB). After coalescing, Teacher's own eager chunk and the common role UI dominate. Principal also requests deferred Recharts after chart mount; it is not an eager role dependency. Complete per-file rankings are in the JSON inventories.

## Slow 4G / 4x CPU

Same harness/profile: 150ms RTT, 1.6Mbps download, 750kbps upload, 4x CPU, 320ms mocked teacher data response, three cold browser contexts, median. Login content is measured from navigation; skeleton/data from Login click. Original baseline is 417100a. Current remeasurement is 67a3c5b. Historical prior current measurements (startup-after.json) remain intact too.

| Version | Login content s | Teacher skeleton s | Teacher first data s |
| --- | ---: | ---: | ---: |
| before | 14.889 | 1.552 | 2.152 |
| current | 3.813 | 5.064 | 5.803 |
| fixed | 3.816 | 4.433 | 5.591 |

**Target not reached.** The measured achieved result is 4.433s / 5.591s; this is not claimed as an absolute mathematical optimum. Teacher still needs 528.674kB of real shared page compositions before its registered route skeleton can render. At 200000 bytes/s, that code alone has a 2.64s transfer lower bound, before latency, competition, parsing/evaluation at 4x CPU, bootstrap settling, and the lazy controller/data round trip. Those costs explain the remaining delay. A route-composition loading architecture change or production compression policy needs separate scope; neither was smuggled into this fix. No data prefetching was used.

## Verification

No new tests, fixture changes, assertion/timing/threshold edits, skips, deletions or weakened checks in this follow-up. Existing Add Subject case failed on current code in 1/10 clean independent starts and passed all final isolated reruns AND the full run. Existing seven bootstrap/lazy and two budget cases were used while iterating. Historical nine new Part A tests retain their recorded old-code/mutation proof in LOADING-BEFORE-COVERAGE.json.

Final full suite (one additional invocation, no retries): 2 failed; 601 passed (21.6m). Raw, unedited output: part-c-final-suite.txt. All 580 source/test/config and 13 tooling hashes were unchanged during the run. Two failures remain: loading.spec.ts variable text size 4 expected transient revealed but observed settled; teacher-subjects.spec.ts 375 dark measured a 6.671875px card Y shift against the unchanged <=1px limit. Neither was dismissed as a flake or fixed after the single authorized full run. Failure contexts are saved as part-c-failure-*.md. Frozen inputs and post-run comparison: part-c-input-freeze.txt / part-c-input-check.txt / part-c-tooling-check.json. Production build/guard: part-c-final-build.txt; final unchanged-app rebuild: part-c-post-verification-build.txt. Nine action/upload spinners and determinate graph are unchanged. Pet Quiz gameplay is preserved under the user's exact decision: “Preserve game animations; require zero remaining loading animations (recommended)”.

Uncertified: requested 1.5s-added teacher latency target; the two failed checks above (so no full-suite certification); real backend timing/data and deployed compression/network behavior; absolute optimal latency floor; late chart code arrival after data has loaded and dark radar preview visual parity from the previous report; exhaustive optional-region combinations. Teacher Subjects 375 dark loaded screenshot was not refreshed because its geometry assertion failed before capture. Full route inventory, classifications, spinner list, screenshot matrix and original mutation evidence below remain applicable; current route/screenshot results are part-c-route-status.json and part-c-screenshot-validation.json.

## Current route inventory

All 55 routes are registered and covered. One route has a failed geometry check; a shared variable-text primitive check also failed globally.

| Route | Result |
| --- | --- |
| /teacher/holistic | PASS |
| /teacher/attendance/records | PASS |
| /teacher/holistic/domain-trends | PASS |
| /principal/gradebooks/:grade | PASS |
| /admin/classes/new | PASS |
| /admin/classes/:classId/edit | PASS |
| /admin/subjects/new | PASS |
| /admin/students/new | PASS |
| /admin/students/:studentId/edit | PASS |
| /admin/users/new | PASS |
| /admin/users/:role/:userId/edit | PASS |
| /teacher/subjects/:subjectId | PASS |
| /principal/reports | PASS |
| /teacher/students/:studentId | PASS |
| /admin/users/:role/:userId | PASS |
| /admin/classes/:classId | PASS |
| /admin/subjects/:subjectId | PASS |
| /parent/students/:studentId/topics/:topicId/support | PASS |
| /parent/students/:studentId/topics/:topicId/courseware | PASS |
| /teacher/attendance | PASS |
| /principal/gradebooks | PASS |
| /teacher/advisory | PASS |
| /teacher/subjects/:subjectSectionId/students | PASS |
| / | PASS |
| /login | PASS |
| /admin/help | PASS |
| /principal/help | PASS |
| /teacher/help | PASS |
| /parent/help | PASS |
| /parent | PASS |
| /principal/students | PASS |
| /admin/calendar | PASS |
| /principal/calendar | PASS |
| /teacher/calendar | PASS |
| /parent/calendar | PASS |
| /principal/teachers/:teacherId | PASS |
| /admin/academic-year | PASS |
| /admin/subjects | PASS |
| /admin/students | PASS |
| /principal/teachers | PASS |
| /parent/enrolled-children | PASS |
| /admin | PASS |
| /admin/classes | PASS |
| /admin/users | PASS |
| /teacher/subjects | FAIL |
| /teacher | PASS |
| /teacher/holistic/:studentId | PASS |
| /principal | PASS |
| /teacher/grades | PASS |
| /principal/students/class/:classId | PASS |
| /principal/students/grade/:gradeId | PASS |
| /principal/holistic-performance-analytics | PASS |
| /teacher/subjects/:subjectId/records | PASS |
| /parent/students/:studentId | PASS |
| /parent/students/:studentId/topics/:topicId/quiz | PASS |

<!-- END-PART-C-REGRESSION -->

Final production rebuild passed (exit 0): loading-screenshots/audit/part-b-final-build.txt. Full-suite result remains 1 failed / 602 passed (17.6m); no second full run or regression fix was performed.

Git merge-tree dry-run passed (exit 0), main ref unchanged; it will also be checked after the evidence commit. All source/config/test hashes remain unchanged. The code builds, but full certification is blocked by the recorded cold Add Subject failure and pending user decision.

# Current Part A / Part B result — 2026-10-10

**Not fully certified: 602 passed, 1 failed (17.6m).** The sole failure is Add Subject, 375px light: the unchanged 5s assertion waiting for main timed out while the first role graph was being compiled. Its failure snapshot contains only Loading…. All subsequent Add Subject cases passed warm. This is a Part A cold-dev regression, not a merge conflict: merging local main changed no files. A decision is pending on authorizing its fix and one additional full run; neither has been performed.

Part A commit: ac3a860d627c50addc88221a8c158cbbe8b54f57. Backup branch backup/loading-before-main-sync points there. git merge main returned Already up to date. Conflicted files: none. Incoming/new main pages: none. Main remains cbc1623a72da35d159424d777d733a2824bdb5d6. No remotes, push or deployment were used. The sync verification commit contains only evidence/docs/screenshots.

Production build and fixed-budget guards passed (exit 0); targeted tests passed: 16 passed (25.4s). Full suite was executed exactly once, all 603 cases, one worker, zero retries/skips. Raw unedited output is loading-screenshots/audit/part-b-final-suite.txt; failure snapshot is part-b-add-subject-failure.md. All 580 source/test/config hashes and eight tooling hashes remained unchanged throughout. No test was skipped, deleted or weakened. The only existing bootstrap change was its explicitly approved fast-code fixture setup; every other byte and the held-controller zero-request assertion are exact (part-b-bootstrap-preservation.json).

## Bundle results

Entry: before 1708.984 raw / 481.009 gzip kB; after 338.746 raw / 101.957 gzip kB using Node gzip level 6. Vite prints 485.95→102.98 gzip kB. The after public eager closure is 395.536 raw / 123.044 gzip kB. Fixed ceilings: entry 112153 bytes, eager closure 135349 bytes. No protected views/heavy libraries enter the public eager graph.

Role chunks did not exist separately before: all four shells/views were in the old entry. After sizes below distinguish the small role facade from its full additional eager download, excluding the public graph. Shared compositions are eager dependencies, so facade bytes alone are not the role's total download.

| Role | Facade raw / gzip kB | Additional eager graph raw / gzip kB |
|---|---:|---:|
| ADMIN | 13.269 / 4.304 | 525.294 / 180.012 |
| TEACHER | 13.258 / 4.529 | 580.949 / 193.035 |
| PRINCIPAL | 6.622 / 2.389 | 416.263 / 141.842 |
| PARENT | 11.003 / 4.247 | 517.673 / 162.968 |

Recharts and XLSX are separate lazy chunks. Chart previews use the existing chart JSX/axes without waiting for Recharts. Login and session responses start only their named role's code import before profile/redirect completion. No page-data prefetch was introduced; page effects/calculations remain unchanged.

## Startup and before/after evidence

Three cold contexts per version; Slow 4G: latency 150ms, download 1600000bps, upload 750000bps; CPU 4x. Same uncompressed local production server and 320ms mock dashboard response latency in both versions. Values are median milliseconds, not deployed performance.

| Measurement | Before | After |
|---|---:|---:|
| Login navigation to first visible content | 14889.3 | 3802.5 |
| Teacher login to first page skeleton | 1551.7 | 4753.2 |
| Teacher login to first rendered data | 2152.1 | 6371.8 |

First data is **4219.7ms slower after login**, which is significant. The chosen no-prefetch design was not changed based on these numbers. Raw samples: startup-before.json/startup-after.json.

Nine new cases: public role isolation; teacher/admin/principal/parent role isolation (four); 1500ms role arrival; chart skeleton without heavy library; bundle budget; registry eager-import guard. The first eight fail actual baseline 417100a and pass fixed code. The registry family already accepted valid metadata; a real temporary eager TeacherLayout import makes its test fail, then byte-for-byte restoration passes. Logs: part-a-before-tests.txt (seven failures), part-a-budget-before-tests.txt (one failure/one pass), part-a-registry-mutation-test.txt (one failure), part-a-budget-restored-tests.txt (two passes), part-b-targeted-tests.txt (16 passes). Ledger: LOADING-BEFORE-COVERAGE.json.

## Current 55-route statuses

Every route remains registered; no route is omitted. PASS denotes associated suite checks, not certification of every optional field/state. Add Subject is explicitly marked with its cold-start failure.

| Route | Status |
|---|---|
| /teacher/holistic | PASS |
| /teacher/attendance/records | PASS |
| /teacher/holistic/domain-trends | PASS |
| /principal/gradebooks/:grade | PASS |
| /admin/classes/new | PASS |
| /admin/classes/:classId/edit | PASS |
| /admin/subjects/new | COVERED WITH FAILURE |
| /admin/students/new | PASS |
| /admin/students/:studentId/edit | PASS |
| /admin/users/new | PASS |
| /admin/users/:role/:userId/edit | PASS |
| /teacher/subjects/:subjectId | PASS |
| /principal/reports | PASS |
| /teacher/students/:studentId | PASS |
| /admin/users/:role/:userId | PASS |
| /admin/classes/:classId | PASS |
| /admin/subjects/:subjectId | PASS |
| /parent/students/:studentId/topics/:topicId/support | PASS |
| /parent/students/:studentId/topics/:topicId/courseware | PASS |
| /teacher/attendance | PASS |
| /principal/gradebooks | PASS |
| /teacher/advisory | PASS |
| /teacher/subjects/:subjectSectionId/students | PASS |
| / | PASS |
| /login | PASS |
| /admin/help | PASS |
| /principal/help | PASS |
| /teacher/help | PASS |
| /parent/help | PASS |
| /parent | PASS |
| /principal/students | PASS |
| /admin/calendar | PASS |
| /principal/calendar | PASS |
| /teacher/calendar | PASS |
| /parent/calendar | PASS |
| /principal/teachers/:teacherId | PASS |
| /admin/academic-year | PASS |
| /admin/subjects | PASS |
| /admin/students | PASS |
| /principal/teachers | PASS |
| /parent/enrolled-children | PASS |
| /admin | PASS |
| /admin/classes | PASS |
| /admin/users | PASS |
| /teacher/subjects | PASS |
| /teacher | PASS |
| /teacher/holistic/:studentId | PASS |
| /principal | PASS |
| /teacher/grades | PASS |
| /principal/students/class/:classId | PASS |
| /principal/students/grade/:gradeId | PASS |
| /principal/holistic-performance-analytics | PASS |
| /teacher/subjects/:subjectId/records | PASS |
| /parent/students/:studentId | PASS |
| /parent/students/:studentId/topics/:topicId/quiz | PASS |

## Screenshots and preserved indicators

67 groups / 536 expected screenshots exist, zero missing or incorrect dimensions. 534 refreshed during the full run. The two admin-add-subject-375-light skeleton/loaded captures remain from the earlier successful run because the cold case failed before capture. Detailed freshness: part-b-screenshot-validation.json. Current priority pages: Teacher dashboard, Teacher subject page, Admin dashboard/Audit Logs, Student holistic profile, Teacher gradebook, Principal dashboard charts, Parent child overview, and Pet Quiz. Existing contact sheets are historical; use current individual captures. The Principal dark chart frames were inspected after this run.

Nine action/upload spinners and the determinate graph are unchanged. Pet Quiz gameplay was preserved under the user's exact decision: “Preserve game animations; require zero remaining loading animations (recommended)”. Only loading animations must disappear after data settles.

## Still uncertified / next decision

The initial cold Add Subject case is failing and blocks full certification. The pending question asks whether Part A regressions may be fixed after the no-op sync, followed by one additional full run, or whether the original one-run limit should remain. Do not fix/rerun without that decision. Exhaustive optional/offscreen-region overlays/classification/line-cache paths, all late-library/data-arrival combinations, live backend/accounts, and deployed gzip/network timings remain uncertified. No new layout widths, truncation or page data prefetch were added to satisfy tests.

Git merge-tree dry-run and final verification commit are recorded separately after this report is saved. A clean merge means Git conflict-free only; this failing test still needs resolution before claiming ready.

Historical reports follow.

## Part B verification in progress — 2026-10-10

Part A committed ac3a860d627c50addc88221a8c158cbbe8b54f57. Backup/loading-before-main-sync points to that commit. git merge main returned Already up to date; no conflicts, no incoming pages. Main remains cbc1623a72da35d159424d777d733a2824bdb5d6. Post-sync production build including bundle guards passed; targeted checks: 16 passed (25.4s). Frozen 580 source/test/config inputs and separate tooling hashes. Starting full suite exactly once, expected 603 cases, one worker, zero retries. Raw output: loading-screenshots/audit/part-b-final-suite.txt. Do not edit source/tests/config or rerun the full suite. When complete, record the actual summary/failures, validate hashes/screenshots, update docs/evidence, commit the sync verification, and git merge-tree --write-tree main codex/finish-loading-verification. Do not switch to main, contact remotes, push or deploy.

# Current role-bundle verification — 2026-10-10

Part A implemented; production build and 16 targeted tests pass. Part B sync/full-suite verification pending. This section supersedes historical performance and manifest notes below; the full 55-route inventory remains applicable.

Entry decreased from 1708.984 raw / 481.009 gzip kB to 338.746 raw / 101.957 gzip kB using Node gzip level 6. Vite's printed gzip estimates are 485.95→102.98kB. Entry plus eager dependencies is 395.536 raw / 123.044 gzip kB. Fixed guard ceilings: 112153 entry gzip bytes and 135349 eager-closure gzip bytes. Registry eager imports are forbidden. Role details and download closures: loading-screenshots/audit/part-a-budget-restored.txt; baseline: bundle-before-size.json. Role facade sizes alone omit eagerly loaded compositions, so report both facade and extra eager download totals.

Slow 4G/4x CPU, three cold contexts, medians (ms): login visible 14889.3→3802.5; teacher login→first page skeleton 1551.7→4753.2; teacher login→first data 2152.1→6371.8. First data is 4219.7ms slower after login, a significant cost. The selected no-prefetch design is unchanged. Both runs serve uncompressed local production assets and mock APIs with the same 320ms dashboard delay; deployed gzip/real backend timings are uncertified. All raw samples and exact method are retained in startup-before.json/startup-after.json and scripts/measure-startup.mjs.

New tests: seven role/chart tests fail the actual baseline and pass restored code. Budget test fails the old entry and passes restored code. Registry guard already accepts correct baseline metadata; a temporary real eager import causes its test to fail, then restoration passes. Raw logs: part-a-before-tests.txt, part-a-budget-before-tests.txt, part-a-registry-mutation-test.txt, part-a-budget-restored-tests.txt and part-a-targeted-final.txt. The fast-bootstrap setup is the only approved existing-test change; all assertions, including zero page requests during a held controller import, remain intact.

Ownership exceptions are shared functionality, not role bundles: HelpSupport serves every role; TeacherSchedule is already used by both Admin UserView and Principal teacher profiles. Shared providers/types/images likewise do not imply loading another role's workspace. No other role's shell or exclusive view is requested in isolation tests.

Historical report follows.

# QED loading verification report

## Current follow-up — 2026-10-10

The two pending decisions are implemented. Known-role lazy routes render their registered real composition inside the unchanged role shell; unknown-role auth uses the sole named `QedBootstrapLoader` exception. Its logo fades opacity only after 200ms, remains at least 400ms once shown, is static under reduced motion and removes its entire gate before protected content mounts. QedLoader was deleted. All 55 registrations share 46 real layouts; extracted page logic/effects and the protected service/config files were verified unchanged.

Seven new bootstrap/lazy tests: original implementation **5 failed, 2 passed** (`loading-bootstrap-before.log`); final gate implementation **14 passed (36.0s)** (`loading-bootstrap-gate-final.log`, two repetitions). The original failures cover fast-bootstrap flashing, rotation, accessibility/minimum/cleanup and both lazy-shell viewport cases. Reduced motion and auth protection already passed originally; specific implementation mutations make each fail and restoration makes each pass. All **28 family mutation checks** reject their intended break and pass restored controls. Exact patches, failed titles, restored hashes and raw log paths are recorded in `loading-screenshots/audit/LOADING-BEFORE-COVERAGE.json`; the reproducible runner is `scripts/verify-loading-mutations.mjs`.

Nine action/upload spinners and the determinate graph remain. Pet Quiz gameplay is preserved under the user's exact decision: **“Preserve game animations; require zero remaining loading animations (recommended)”**.

Final production build: **passed (26.48s)** ([unedited output](C:/Users/Mavys/Downloads/QED_System/QED_front_end/loading-decision-build.log)). The single completed final suite: **594 passed (20.5m)** across 42 files, one worker, zero retries/skips ([unedited output](C:/Users/Mavys/Downloads/QED_System/QED_front_end/loading-decision-final-suite.log)). All 566 source/test/config hashes stayed unchanged. No test was deleted, skipped or weakened. The following three-run results are historical, preceding these changes. All authorized work is committed on `codex/finish-loading-verification`; no push or deployment.

```text
594 passed (20.5m)
```

| New test | Original implementation | Final implementation |
|---|---|---|
| Bootstrap below 200ms never flashes | Failed | Passed |
| Logo opacity only; no rotation | Failed | Passed |
| Reduced motion has no running animation | Passed; targeted mutation failed | Passed after restoration |
| Busy/status reveal, minimum 400ms and DOM cleanup | Failed | Passed; cleanup strengthened to remove entire gate |
| No protected render/request before auth resolves | Passed; targeted mutation failed | Passed after restoration |
| Real shell + registered lazy skeleton, 375px | Failed | Passed |
| Real shell + registered lazy skeleton, 1280px | Failed | Passed |

Screenshot validation: **67 groups, 536 main captures, no missing files or incorrect dimensions**. Eight priority pages were reviewed in the refreshed light/dark × 375px/1280px contact sheets in `loading-screenshots/review/priority-*.png`. This review does not certify the exhaustive optional/offscreen region gaps listed below.

The initial follow-up full run was stopped after exposing a real subject-provider fallback bug; its raw output is preserved in `loading-decision-provider-failure.log`. SubjectsSection now catches its lazy children inside the original providers. Add Subject page-data tests require a visible real shell and completed lazy handoff before their unchanged assertions. All eight cases pass twice (`loading-decision-provider-ready.log`: 16 passed, 46.8s). Earlier unsuccessful handoff probes remain preserved; none counts as final verification.

Admin checks subsequently exposed the same preview handoff race. `waitForDataRoute` now requires the unique real role shell plus absence of the route preview before page-data assertions; bootstrap/lazy tests deliberately omit it. The 37 affected test files are byte-for-byte identical to the pre-helper snapshot after removing only the added import/calls (`LOADING-TEST-READINESS.json`, 202 navigations). No original assertion or threshold was removed or changed. The admin/bootstrap targeted group passes all 34 cases (`loading-decision-handoff-verified.log`: 34 passed, 1.4m). The unsuccessful generic `main` selector probe is preserved; the helper uses the unique existing `.qed-account-ui` shell.

## Historical verification status

Production build passed (15.82s; [unedited build output](C:/Users/Mavys/Downloads/QED_System/QED_front_end/loading-production-build.log)). Three consecutive complete Chromium runs passed with 587 tests each, one worker and zero retries.

| Run | Real runner summary | Raw log |
|---|---|---|
| 1 | 587 passed (19.3m) | [Unedited full output](C:/Users/Mavys/Downloads/QED_System/QED_front_end/loading-final-suite-1.log) |
| 2 | 587 passed (19.5m) | [Unedited full output](C:/Users/Mavys/Downloads/QED_System/QED_front_end/loading-final-suite-2.log) |
| 3 | 587 passed (19.1m) | [Unedited full output](C:/Users/Mavys/Downloads/QED_System/QED_front_end/loading-final-suite-3.log) |

No tests were skipped, deleted or weakened to obtain these results. The suite contains no skip/fixme/only markers; its numerical limits remain unchanged. The student Review/Save test was strengthened after an earlier full run caught premature submission. A separate accessibility race is preserved in loading-full-suite-accessibility-race.log: its test now records initial accessibility facts in-browser and holds data until the revealed state is inspected. Production timing is unchanged; the 23-case behavior suite passed. A later third run was interrupted after a strict selector matched both copies during the advisory-roster cross-fade; loading-full-suite-attendance-transition-race.log preserves it. Attendance tests now wait for the parent transition and require one nested table. The 60-case repeated attendance check passed before restarting the final three runs. No numerical bound changed. A further parallel run exposed a fast-refetch fixture scheduling latency from the driver return rather than request interception. The five fixtures now time from the request, measure browser fetch duration below 200ms, and wait for the real request before checking settled state. A 220ms sample was correctly rejected; 30 repeated fast-refetch checks and all 111 checks across the five affected files passed with the configured single worker. Raw timing and failure logs are retained. Final verification uses that single-worker configuration. All 515 recorded source/test/config file hashes remained unchanged during this verification.

All 55 page-data route compositions are registered and connected. The current follow-up above resolves auth/bootstrap and the accepted before-evidence decisions. Exhaustive per-region certification gaps remain specifically identified below.

## Design-audit summary

The existing Inter typography, compact academic layouts, shared card/control radii, dark-maroon glass sidebar and metallic edge are preserved. Light page/card/border neutrals are #EFEFEF/#FFFFFF/#DDDDDD; dark equivalents are #181818/#242424/#444444. Skeleton base reuses the border token. Light shine mixes 60% base toward the white surface; dark shine uses 88%, with separate scoped overrides for colored surfaces. Text bars occupy 1lh; text/control/avatar radii are 4px/8px/50%, and blocks inherit the real component radius. Contrast limits remain 1.1–2.0 for base/surface and at least 1.03 for shine/surface.

Known headings, controls, labels, session identity and calendar content render immediately. Data-independent geometry is FIXED-SIZE; wrapping/optional fields and variable counts are VARIABLE; content-sized native tables are AUTO-COLUMN. Lists prefer page size, then the view cache, then 3–6 viewport-capped rows. Text prefers cached line count, then 2 name/address lines or 3 description lines. Pending columns prefer cached native widths, then header/typical metrics, then equal shares. Loaded table widths remain native. The route/region inventory below includes reasons and reservation sources; exhaustive per-region measurement gaps remain listed explicitly.

## Routes — 55 of 55 registered, screenshot matrix complete

Status means migrated page composition with real-route Chromium coverage; global audit gaps below still apply. Landing/help/new forms may have no unknown data displayed, so their real UI remains visible rather than inventing skeletons.

| # | Route | Status | Screenshot prefix | Region classes |
|---|---|---|---|---|
| 1 | `/` | Migrated; 8 captures present | `landing` | STATIC |
| 2 | `/login` | Migrated; 8 captures present | `login` | STATIC |
| 3 | `/admin` | Migrated; 8 captures present | `admin` | FIXED-SIZE, VARIABLE, AUTO-COLUMN |
| 4 | `/admin/students` | Migrated; 8 captures present | `admin-students` | AUTO-COLUMN, VARIABLE, FIXED-SIZE |
| 5 | `/admin/students/new` | Migrated; 8 captures present | `admin-student-new` | FIXED-SIZE, VARIABLE |
| 6 | `/admin/students/:studentId/edit` | Migrated; 8 captures present | `admin-student-edit` | FIXED-SIZE, VARIABLE |
| 7 | `/admin/users` | Migrated; 8 captures present | `admin-users` | AUTO-COLUMN, VARIABLE |
| 8 | `/admin/users/new` | Migrated; 8 captures present | `admin-user-new` | FIXED-SIZE, VARIABLE, STATIC |
| 9 | `/admin/users/:role/:userId` | Migrated; 8 captures present | `admin-user-details` | VARIABLE, STATIC |
| 10 | `/admin/users/:role/:userId/edit` | Migrated; 8 captures present | `admin-user-edit` | FIXED-SIZE, VARIABLE, STATIC |
| 11 | `/admin/classes` | Migrated; 8 captures present | `admin-classes` | VARIABLE |
| 12 | `/admin/classes/new` | Migrated; 8 captures present | `admin-class-new` | FIXED-SIZE, VARIABLE |
| 13 | `/admin/classes/:classId` | Migrated; 8 captures present | `admin-class-details` | VARIABLE, FIXED-SIZE, AUTO-COLUMN, STATIC |
| 14 | `/admin/classes/:classId/edit` | Migrated; 8 captures present | `admin-class-edit` | VARIABLE, FIXED-SIZE |
| 15 | `/admin/subjects` | Migrated; 8 captures present | `admin-subjects` | VARIABLE, FIXED-SIZE |
| 16 | `/admin/subjects/new` | Migrated; 8 captures present | `admin-add-subject` | FIXED-SIZE, VARIABLE |
| 17 | `/admin/subjects/:subjectId` | Migrated; 8 captures present | `subject-template` | VARIABLE, STATIC, FIXED-SIZE |
| 18 | `/admin/academic-year` | Migrated; 8 captures present | `admin-academic-year` | VARIABLE, AUTO-COLUMN |
| 19 | `/admin/calendar` | Migrated; 8 captures present | `admin-calendar` | VARIABLE |
| 20 | `/admin/help` | Migrated; 8 captures present | `admin-help` | STATIC |
| 21 | `/principal` | Migrated; 8 captures present | `principal-dashboard` | VARIABLE, FIXED-SIZE |
| 22 | `/principal/students` | Migrated; 8 captures present | `principal-students` | VARIABLE |
| 23 | `/principal/students/class/:classId` | Migrated; 8 captures present | `principal-students-class-1` | VARIABLE, AUTO-COLUMN |
| 24 | `/principal/students/grade/:gradeId` | Migrated; 8 captures present | `principal-students-grade-1` | VARIABLE, AUTO-COLUMN |
| 25 | `/principal/teachers` | Migrated; 8 captures present | `principal-teachers` | AUTO-COLUMN |
| 26 | `/principal/teachers/:teacherId` | Migrated; 8 captures present | `principal-teachers-1` | VARIABLE, FIXED-SIZE |
| 27 | `/principal/reports` | Migrated; 8 captures present | `principal-subject-analytics` | FIXED-SIZE, VARIABLE, STATIC |
| 28 | `/principal/holistic-performance-analytics` | Migrated; 8 captures present | `principal-holistic-analytics` | FIXED-SIZE, VARIABLE |
| 29 | `/principal/gradebooks` | Migrated; 8 captures present | `principal-gradebooks` | VARIABLE, FIXED-SIZE |
| 30 | `/principal/gradebooks/:grade` | Migrated; 8 captures present | `principal-grade-sheet` | VARIABLE, FIXED-SIZE, AUTO-COLUMN |
| 31 | `/principal/calendar` | Migrated; 8 captures present | `principal-calendar` | VARIABLE |
| 32 | `/principal/help` | Migrated; 8 captures present | `principal-help` | STATIC |
| 33 | `/teacher` | Migrated; 8 captures present | `teacher-dashboard` | VARIABLE, FIXED-SIZE |
| 34 | `/teacher/attendance` | Migrated; 8 captures present | `teacher-attendance` | VARIABLE, AUTO-COLUMN, FIXED-SIZE, STATIC |
| 35 | `/teacher/attendance/records` | Migrated; 8 captures present | `attendance-records` | VARIABLE, FIXED-SIZE |
| 36 | `/teacher/subjects` | Migrated; 8 captures present | `teacher-subjects` | VARIABLE, FIXED-SIZE |
| 37 | `/teacher/subjects/:subjectId` | Migrated; 8 captures present | `teacher-subject` | VARIABLE, AUTO-COLUMN, FIXED-SIZE, STATIC |
| 38 | `/teacher/subjects/:subjectId/records` | Migrated; 8 captures present | `teacher-subject-records` | AUTO-COLUMN, VARIABLE |
| 39 | `/teacher/subjects/:subjectSectionId/students` | Migrated; 8 captures present | `teacher-subject-class-list` | VARIABLE, AUTO-COLUMN, FIXED-SIZE |
| 40 | `/teacher/grades` | Migrated; 8 captures present | `teacher-grades` | AUTO-COLUMN, FIXED-SIZE, VARIABLE |
| 41 | `/teacher/holistic` | Migrated; 8 captures present | `holistic-overview` | AUTO-COLUMN, FIXED-SIZE, VARIABLE |
| 42 | `/teacher/holistic/:studentId` | Migrated; 8 captures present | `holistic-profile` | VARIABLE, FIXED-SIZE |
| 43 | `/teacher/holistic/domain-trends` | Migrated; 8 captures present | `domain-trends` | VARIABLE, FIXED-SIZE |
| 44 | `/teacher/students/:studentId` | Migrated; 8 captures present | `teacher-student-details` | VARIABLE, FIXED-SIZE, AUTO-COLUMN, STATIC |
| 45 | `/teacher/advisory` | Migrated; 8 captures present | `teacher-advisory-roster` | VARIABLE, AUTO-COLUMN, FIXED-SIZE |
| 46 | `/teacher/calendar` | Migrated; 8 captures present | `teacher-calendar` | VARIABLE |
| 47 | `/teacher/help` | Migrated; 8 captures present | `teacher-help` | STATIC |
| 48 | `/parent` | Migrated; 8 captures present | `parent` | STATIC, VARIABLE |
| 49 | `/parent/enrolled-children` | Migrated; 8 captures present | `parent-enrolled-children` | VARIABLE |
| 50 | `/parent/students/:studentId` | Migrated; 8 captures present | `parent-detail-overview` | VARIABLE, FIXED-SIZE, AUTO-COLUMN |
| 51 | `/parent/students/:studentId/topics/:topicId/support` | Migrated; 8 captures present | `topic-support` | STATIC |
| 52 | `/parent/students/:studentId/topics/:topicId/courseware` | Migrated; 8 captures present | `courseware` | VARIABLE, FIXED-SIZE, STATIC |
| 53 | `/parent/students/:studentId/topics/:topicId/quiz` | Migrated; 8 captures present | `parent-pet-quiz` | FIXED-SIZE, VARIABLE |
| 54 | `/parent/calendar` | Migrated; 8 captures present | `parent-calendar` | VARIABLE |
| 55 | `/parent/help` | Migrated; 8 captures present | `parent-help` | STATIC |

No route pattern is omitted. The parent detail route additionally covers all five tabs; Pet Quiz covers road/question/Match/Memory; teacher records covers assessment and holistic; gradebook covers parent visibility and history; attendance records covers month and summary. [Complete route/region reasons and eight-file matrix](C:/Users/Mavys/Downloads/QED_System/QED_front_end/loading-screenshots/audit/LOADING-ROUTES.json).

## Spinner inventory

The original discovery had 170 matches across 67 files, including false positives and action indicators. Every original match, line and outcome is retained in [LOADING-SPINNERS.json](C:/Users/Mavys/Downloads/QED_System/QED_front_end/loading-screenshots/audit/LOADING-SPINNERS.json).

| Original file | Original lines | Outcome |
|---|---|---|
| `src/features/profiles/admin/pages/classes/ClassFormPage.tsx` | 85, 517, 546, 647 | Shared form fields and existing schedule row renderer; LoadingFormValue masks only fetched selections. |
| `src/features/profiles/admin/pages/dashboard/components/AuditLogs.tsx` | 65, 108 | LoadingTable using real header/toolbar/row definitions; opacity-only stale rows on refetch. |
| `src/features/profiles/admin/pages/dashboard/components/LoginFrequency.tsx` | 106, 187, 277, 282 | Shared real chart frame with bar/text primitives; refresh icon remains static. |
| `src/features/profiles/admin/pages/studentrecords/components/StudentImportExportToolbar.tsx` | 383 | Preserved user-action/import/upload spinner; not a page-data loader. |
| `src/features/profiles/admin/pages/studentrecords/StudentFormPage.tsx` | 434, 472 | Real input/select shells with unknown value primitives. |
| `src/features/profiles/admin/pages/subjects/AcademicYearPage.tsx` | 129 | Shared school-year fields and native automatic-column term table. |
| `src/features/profiles/admin/pages/subjects/AddSubjectPage.tsx` | 332, 379, 494, 626 | Prerequisite value loading uses shared leaves in real controls; file parsing and Submit spinners preserved. |
| `src/features/profiles/admin/pages/subjects/AdminSubjectDetailPage.tsx` | 75, 76 | Real SubjectGradeTemplateSection with pending leaves. |
| `src/features/profiles/admin/pages/subjects/components/AssignTeacherModal.tsx` | 115 | Preserved user-action/import/upload spinner; not a page-data loader. |
| `src/features/profiles/admin/pages/subjects/components/EditSubjectModal.tsx` | 379, 465, 501 | Catalog selections and template fetch use shared pending leaves; error clears shapes and Retry refetches the same service. Save spinner preserved; both widths/themes verified. |
| `src/features/profiles/admin/pages/subjects/components/SubjectGradeTemplateSection.tsx` | 118 | Preserved user-action/import/upload spinner; not a page-data loader. |
| `src/features/profiles/admin/pages/usermanagement/UserManagementPage.tsx` | 40 | Shared desktop table and mobile account row renderer. |
| `src/features/profiles/parent/pages/dashboard/components/DailyUpdateCard.tsx` | 15, 29, 30 | Shared update rows with only fetched text/counts masked. |
| `src/features/profiles/parent/pages/dashboard/components/EventsCard.tsx` | 184 | Shared event rows with real section headings. |
| `src/features/profiles/parent/pages/dashboard/components/MockUpFrame.tsx` | 248, 271, 291 | Static illustrative mock-up bars, not a fetch loader; preserve real illustration. |
| `src/features/profiles/parent/pages/dashboard/ParentDashboardHome.tsx` | 29, 42 | Known session identity renders immediately; fetched totals/children use shared leaves. |
| `src/features/profiles/parent/pages/Student/Academic/components/ClassSchedule.tsx` | 71 | Original day-chip and schedule-list renderer with fetched subject/teacher/time leaves. |
| `src/features/profiles/parent/pages/Student/Academic/components/InterventionSupport.tsx` | 82 | Existing concern cards with text/control primitives; original navigation unchanged. |
| `src/features/profiles/parent/pages/Student/Academic/components/MissedActivities.tsx` | 78, 79 | Shared date-group and activity-row renderer with fetched leaves. |
| `src/features/profiles/parent/pages/Student/Academic/components/QuizLoading.tsx` | 4 | Deleted; real Pet Quiz story/road/question/bonus states render pending leaves. |
| `src/features/profiles/parent/pages/Student/Academic/components/QuizWidgets.tsx` | 39 | Gameplay current-question highlight, explicitly preserved by user. |
| `src/features/profiles/parent/pages/Student/Academic/CoursewareView.tsx` | 85, 86, 214, 215, 216, 217, 222, 224, 225 | Ad-hoc pulse blocks replaced with shared primitives in actual content/video wrappers. |
| `src/features/profiles/parent/pages/Student/Academic/PetQuizPage.tsx` | 10, 726, 734, 746, 748 | Shared LoadingRegion composing the real road, question and bonus renderers; gameplay animations preserved. |
| `src/features/profiles/parent/pages/Student/ChildDetailPage.tsx` | 21, 24, 27, 29, 30, 33, 36, 37, 40, 41, 42, 43, 47, 48, 94, 193 | Duplicate ProgressReportSkeleton removed; real identity, tabs and report components remain visible. |
| `src/features/profiles/parent/pages/Student/Holistic/HoisticWeeklyReportTab.tsx` | 57 | Actual WholeChildSnapshot/domain/subject renderer with pending data leaves. |
| `src/features/profiles/parent/pages/Student/Overview/components/AttendanceOverview.tsx` | 151, 167, 171, 172 | Actual ring, real semantic labels, counts and month control composed with shared primitives. |
| `src/features/profiles/parent/pages/Student/Overview/components/HolisticAverage.tsx` | 130 | Actual overall/domain/narrative frame; cached/typical wrapping fields. |
| `src/features/profiles/parent/pages/Student/Overview/components/PerformanceAnalytics.tsx` | 136 | Actual Recharts axes/viewport with line silhouette; unknown plot values only. |
| `src/features/profiles/parent/pages/Student/StudentProfile/StudentProfileTab.tsx` | 42 | Actual ProfileHeaderCard leaves with known identity/class retained and unknown avatar masked. |
| `src/features/profiles/principal/pages/dashboard/components/DashboardStatus.tsx` | 3, 7, 10, 13 | Obsolete duplicate dashboard skeleton removed. |
| `src/features/profiles/principal/pages/dashboard/PrincipalDashboardHome.tsx` | 7, 52 | Duplicate DashboardSkeleton removed; actual dashboard KPI/chart/ranking compositions. |
| `src/features/profiles/principal/pages/gradebooks/components/DashboardStatus.tsx` | 12 | Unused legacy gradebook status component deleted after confirming no imports; guard rejects restoration. |
| `src/features/profiles/principal/pages/gradebooks/PrincipalGradebooksPage.tsx` | 8, 14, 17, 18, 20, 21, 22, 25, 26, 27, 77 | Duplicate GradebooksSkeleton removed; shared real gradebook card renderer. |
| `src/features/profiles/principal/pages/gradebooks/PrincipalGradeSheetPage.tsx` | 21, 23, 26, 27, 29, 31, 120, 121, 186 | Duplicate ProgressReportSkeleton removed; real metadata/controls and grouped native table. |
| `src/features/profiles/principal/pages/reports/AnalyticsPage.tsx` | 70 | Real subject-performance charts, metrics, headings and selectors with unknown leaves. |
| `src/features/profiles/principal/pages/reports/HolisticPerformanceAnalyticsPage.tsx` | 71 | Actual metrics and heatmap rows; wrapping labels remain content-dependent. |
| `src/features/profiles/principal/pages/students/ClassListPage.tsx` | 29 | Actual class/grade header and shared directory table with pending data leaves. |
| `src/features/profiles/principal/pages/students/PrincipalStudentsPage.tsx` | 116 | Actual grade/section cards, count values and known filter shells. |
| `src/features/profiles/principal/pages/teachers/components/TeacherClassRosters.tsx` | 41 | Shared section roster rows in the original wrapper. |
| `src/features/profiles/principal/pages/teachers/PrincipalTeachersPage.tsx` | 21 | Shared teacher directory table with actual columns and known controls. |
| `src/features/profiles/principal/pages/teachers/TeacherSchedulePage.tsx` | 88 | Actual ProfileOverviewCard, schedule and roster renderers. |
| `src/features/profiles/teacher/pages/attendance/AttendanceCalendarSection.tsx` | 354, 355 | Actual month calendar; real dates/legend, pending status values. |
| `src/features/profiles/teacher/pages/attendance/AttendanceMonthSummarySection.tsx` | 210, 212 | Actual summary tiles and calendar; unknown counts/status values only. |
| `src/features/profiles/teacher/pages/attendance/TeacherAttendancePage.tsx` | 246, 248, 405, 407, 409 | Original roster/class controls; shared native table and unknown count/status leaves. |
| `src/features/profiles/teacher/pages/attendance/TeacherAttendanceRecordsPage.tsx` | 87, 88 | Actual record table/summary composition; known roster/date labels stay real. |
| `src/features/profiles/teacher/pages/dashboard/TeacherDashboardHome.tsx` | 210 | Actual weekly timetable with fetched sessions; known date/calendar/identity stay real. |
| `src/features/profiles/teacher/pages/grades/GradePage.tsx` | 321, 323, 359, 364, 481, 483 | Initial record checks/table loaders replaced with real gradebook composition; Submit Class Grades spinner preserved. |
| `src/features/profiles/teacher/pages/grades/ParentVisibilitySection.tsx` | 140, 152, 160 | Visibility data table uses shared loader; Show/Hide action spinners preserved. |
| `src/features/profiles/teacher/pages/holistic/HolisticDomainTrendsPage.tsx` | 412, 414 | Actual controls/domain metrics/line chart; pending fetched leaves. |
| `src/features/profiles/teacher/pages/holistic/HolisticOverviewPage.tsx` | 389 | Actual assessment roster and known labels/controls; native pending columns. |
| `src/features/profiles/teacher/pages/holistic/StudentHolisticProfilePage.tsx` | 314, 316 | Original identity/domain/subject layout with actual gauge and wrapping-field placeholders. |
| `src/features/profiles/teacher/pages/roster/AdvisoryRosterPage.tsx` | 8, 86 | Duplicate AdvisorySkeleton removed; actual roster composition. |
| `src/features/profiles/teacher/pages/roster/components/AdvisorySkeleton.tsx` | 3, 10 | Deleted duplicate layout; real AdvisoryRosterPage composes its own pending leaves. |
| `src/features/profiles/teacher/pages/subjects/detail/components/AddItemModal.tsx` | 237 | Known topic selector shell; LoadingFormValue masks only unknown selected value. |
| `src/features/profiles/teacher/pages/subjects/detail/components/TopicManagerModal.tsx` | 109 | Actual topic row renderer and known controls. |
| `src/features/profiles/teacher/pages/subjects/detail/HolisticRecordsPage.tsx` | 421, 427 | Actual multi-level weekly/domain headers and shared score-cell renderer. |
| `src/features/profiles/teacher/pages/subjects/detail/SubjectRecordsPage.tsx` | 411, 413 | Actual known roster/header and assessment score cells with shared loader. |
| `src/features/profiles/teacher/pages/subjects/SubjectClassListPage.tsx` | 185, 186 | Actual subject identity fields and shared directory table. |
| `src/features/profiles/teacher/pages/subjects/SubjectPage.tsx` | 154 | Shared actual grouped/flat subject-card renderer. |
| `src/routes/AppRouter.tsx` | 27, 86, 87, 146, 152 | Replaced by delayed unknown-role bootstrap gate and registered compositions inside known-role shells. |
| `src/routes/ProtectedRoute.tsx` | 7, 9 | Unused legacy file deleted after confirming no imports; active guard remains inside AppRouter. Guard rejects restoration. |
| `src/shared/calendar/CalendarPage.tsx` | 266 | Actual client calendar and shared event row renderer. |
| `src/shared/calendar/CalendarPageView.tsx` | 145 | Actual client calendar and shared event row renderer. |
| `src/shared/components/ConfirmationModal.tsx` | 63, 76 | False-positive discovery: loading flag controls action-modal close behavior, not a data spinner. |
| `src/shared/components/QedLoader.tsx` | 136, 146, 246, 251 | Deleted. Sole brand exception is the new opacity-only QedBootstrapLoader before auth resolves. |
| `src/shared/components/SkeletonLoading.tsx` | 3, 6 | Existing primitive extended into token-based text/avatar/image/control/block primitives. |
| `src/shared/notification/NotificationContext.tsx` | 23 | False-positive discovery: auth loading state only; this line renders no spinner. |

### Preserved runtime action/upload spinners

| File | Action |
|---|---|
| AddSubjectPage.loading-view.tsx | Parse selected spreadsheet; Submit subject (two spinners) |
| StudentImportExportToolbar.tsx | Save/import student records |
| AssignTeacherModal.tsx | Save teacher assignment |
| EditSubjectModal.tsx | Save subject changes |
| SubjectGradeTemplateSection.tsx | Upload/parse grade template |
| ParentVisibilitySection.tsx | Apply Show; Apply Hide (two spinners) |
| GradePage.loading-view.tsx | Submit Class Grades |

Nine runtime action/upload spinner placements remain. Other preserved progress text includes profile Saving..., report Preparing..., and quiz action states. Commented AddSubjectModal spinner code is inactive. Parent CircularProgress is a determinate data graph, not a loading spinner. Pet gameplay animations remain per the explicit decision.

### Other indicators still present

- `AppRouter.tsx`: QedBootstrapLoader only before authentication/gate settlement. Registered route composition after auth; no protected component or page request before auth resolves.
- The unused legacy ProtectedRoute and gradebook DashboardStatus loading components were deleted and are covered by the restoration guard.
- QedLoader component/style was removed. The named bootstrap exception has no rotating spinner.

## Before/after evidence

[Exact failed-case titles grouped by unedited baseline log](C:/Users/Mavys/Downloads/QED_System/QED_front_end/loading-screenshots/audit/LOADING-BEFORE-EVIDENCE.json) lists what was actually tested on original or pre-fix source.

- Final parent/quiz/records/obsolete-loader batch: **89 failed before**, in `loading-final-new-tests-before.log`. Current sources were restored in finally.
- Profile class/avatar cases: **4 failed before**, then **4 passed after**, both widths/themes. A real dark-surface contrast failure was retained and corrected without changing its numerical bound.
- Router-connection and active-primitive guards: **2 failed on original sources**, **2 passed on current sources**. These guards were strengthened because checking only registry keys or the new CSS file could pass while the old implementation remained active.
- Continue-to-Review and Edit Subject error/retry: **5 failed against original sources**, then the **19-case student-form/dialog batch passed**. The Save regression additionally failed on the pre-key-fix source with zero requests expected but one observed. Distinct Continue/Save keys prevent unintended submission; the unchanged payload is sent only by Save.
- Earlier before-code logs are listed below. Some are targeted representative cases rather than every test in that family; a test absent from the failed-case ledger has no individual before-fail certification. Earlier logs with passing cases are not represented as proof that those cases detected a defect.

| Baseline log | Actual summary |
|---|---|
| [loading-add-subject-before.log](C:/Users/Mavys/Downloads/QED_System/QED_front_end/loading-add-subject-before.log) | 1 failed |
| [loading-attendance-records-before.log](C:/Users/Mavys/Downloads/QED_System/QED_front_end/loading-attendance-records-before.log) | 2 failed |
| [loading-class-adviser-contrast-before.log](C:/Users/Mavys/Downloads/QED_System/QED_front_end/loading-class-adviser-contrast-before.log) | 1 failed; 1 passed (10.3s) |
| [loading-class-details-before.log](C:/Users/Mavys/Downloads/QED_System/QED_front_end/loading-class-details-before.log) | 1 failed |
| [loading-class-error-before.log](C:/Users/Mavys/Downloads/QED_System/QED_front_end/loading-class-error-before.log) | 1 failed |
| [loading-class-form-before.log](C:/Users/Mavys/Downloads/QED_System/QED_front_end/loading-class-form-before.log) | 1 failed |
| [loading-class-form-static-prefix-before.log](C:/Users/Mavys/Downloads/QED_System/QED_front_end/loading-class-form-static-prefix-before.log) | 1 failed |
| [loading-courseware-before.log](C:/Users/Mavys/Downloads/QED_System/QED_front_end/loading-courseware-before.log) | 1 failed |
| [loading-design-contract-before.log](C:/Users/Mavys/Downloads/QED_System/QED_front_end/loading-design-contract-before.log) | 6 failed; 2 passed (1.0m) |
| [loading-domain-trends-before.log](C:/Users/Mavys/Downloads/QED_System/QED_front_end/loading-domain-trends-before.log) | 1 failed |
| [loading-final-guards-before.log](C:/Users/Mavys/Downloads/QED_System/QED_front_end/loading-final-guards-before.log) | 2 failed |
| [loading-final-new-tests-before.log](C:/Users/Mavys/Downloads/QED_System/QED_front_end/loading-final-new-tests-before.log) | 89 failed |
| [loading-final-save-modal-before.log](C:/Users/Mavys/Downloads/QED_System/QED_front_end/loading-final-save-modal-before.log) | 5 failed |
| [loading-finishing-before.log](C:/Users/Mavys/Downloads/QED_System/QED_front_end/loading-finishing-before.log) | 3 failed; 2 passed (25.3s) |
| [loading-grade-sheet-term-before.log](C:/Users/Mavys/Downloads/QED_System/QED_front_end/loading-grade-sheet-term-before.log) | 2 failed |
| [loading-holistic-analytics-before.log](C:/Users/Mavys/Downloads/QED_System/QED_front_end/loading-holistic-analytics-before.log) | 1 failed |
| [loading-holistic-metric-width-before.log](C:/Users/Mavys/Downloads/QED_System/QED_front_end/loading-holistic-metric-width-before.log) | 1 failed |
| [loading-holistic-overview-before.log](C:/Users/Mavys/Downloads/QED_System/QED_front_end/loading-holistic-overview-before.log) | 1 failed |
| [loading-holistic-profile-before.log](C:/Users/Mavys/Downloads/QED_System/QED_front_end/loading-holistic-profile-before.log) | 1 failed |
| [loading-inline-flow-before.log](C:/Users/Mavys/Downloads/QED_System/QED_front_end/loading-inline-flow-before.log) | 1 failed |
| [loading-parent-detail-before.log](C:/Users/Mavys/Downloads/QED_System/QED_front_end/loading-parent-detail-before.log) | 1 failed |
| [loading-parent-profile-known-before.log](C:/Users/Mavys/Downloads/QED_System/QED_front_end/loading-parent-profile-known-before.log) | 4 failed |
| [loading-pet-quiz-before.log](C:/Users/Mavys/Downloads/QED_System/QED_front_end/loading-pet-quiz-before.log) | 1 failed |
| [loading-principal-dashboard-before.log](C:/Users/Mavys/Downloads/QED_System/QED_front_end/loading-principal-dashboard-before.log) | 1 failed |
| [loading-principal-grade-sheet-before.log](C:/Users/Mavys/Downloads/QED_System/QED_front_end/loading-principal-grade-sheet-before.log) | 1 failed |
| [loading-principal-spinner-guard-before.log](C:/Users/Mavys/Downloads/QED_System/QED_front_end/loading-principal-spinner-guard-before.log) | No parsed summary — inspect raw log |
| [loading-student-details-before.log](C:/Users/Mavys/Downloads/QED_System/QED_front_end/loading-student-details-before.log) | 1 failed |
| [loading-student-directory-classification-before.log](C:/Users/Mavys/Downloads/QED_System/QED_front_end/loading-student-directory-classification-before.log) | 1 failed; 4 passed (15.2s) |
| [loading-student-form-before.log](C:/Users/Mavys/Downloads/QED_System/QED_front_end/loading-student-form-before.log) | 1 failed |
| [loading-student-review-before.log](C:/Users/Mavys/Downloads/QED_System/QED_front_end/loading-student-review-before.log) | 1 failed |
| [loading-subject-analytics-before.log](C:/Users/Mavys/Downloads/QED_System/QED_front_end/loading-subject-analytics-before.log) | 1 failed |
| [loading-subject-edit-modal-before.log](C:/Users/Mavys/Downloads/QED_System/QED_front_end/loading-subject-edit-modal-before.log) | 4 failed |
| [loading-subject-holistic-records-before.log](C:/Users/Mavys/Downloads/QED_System/QED_front_end/loading-subject-holistic-records-before.log) | 1 failed |
| [loading-subject-records-before.log](C:/Users/Mavys/Downloads/QED_System/QED_front_end/loading-subject-records-before.log) | 1 failed |
| [loading-subject-template-before.log](C:/Users/Mavys/Downloads/QED_System/QED_front_end/loading-subject-template-before.log) | 1 failed |
| [loading-teacher-grades-before.log](C:/Users/Mavys/Downloads/QED_System/QED_front_end/loading-teacher-grades-before.log) | 1 failed |
| [loading-teacher-grades-final-errors-before.log](C:/Users/Mavys/Downloads/QED_System/QED_front_end/loading-teacher-grades-final-errors-before.log) | 2 failed |
| [loading-teacher-subject-before.log](C:/Users/Mavys/Downloads/QED_System/QED_front_end/loading-teacher-subject-before.log) | 1 failed |
| [loading-template-contrast-before.log](C:/Users/Mavys/Downloads/QED_System/QED_front_end/loading-template-contrast-before.log) | 1 failed; 1 passed (9.3s) |
| [loading-user-details-before.log](C:/Users/Mavys/Downloads/QED_System/QED_front_end/loading-user-details-before.log) | 1 failed |
| [loading-user-form-before.log](C:/Users/Mavys/Downloads/QED_System/QED_front_end/loading-user-form-before.log) | 1 failed |
| [loading-user-form-select-before.log](C:/Users/Mavys/Downloads/QED_System/QED_front_end/loading-user-form-select-before.log) | 1 failed |
| [loading-user-form-warning-before.log](C:/Users/Mavys/Downloads/QED_System/QED_front_end/loading-user-form-warning-before.log) | 2 failed |

### Individual evidence coverage

At the previous checkpoint, exact-title matching found **105 of 587 suite cases** in the actual individual before-failure ledger. This historical denominator includes behavior tests, static-page safeguards and negative controls; it is not a count of defective tests. The 482 other historical cases remain listed in [the evidence-coverage inventory](C:/Users/Mavys/Downloads/QED_System/QED_front_end/loading-screenshots/audit/LOADING-BEFORE-COVERAGE.json). The user subsequently accepted per-family mutation proof for unchanged/static and negative-control tests; all 28 recorded families fail under their deliberate mutation and pass restored controls. Seven new bootstrap/lazy cases have the separate evidence described above. Historical renamed cases remain in the raw logs.

## Screenshots and eight first-review pages

All 67 route/state screenshot groups have every required skeleton/loaded × 375/1280 × light/dark pair. The filename form is `<prefix>-<width>-<theme>-<state>.png`. [Screenshot folder](C:/Users/Mavys/Downloads/QED_System/QED_front_end/loading-screenshots); [Per-route file list](C:/Users/Mavys/Downloads/QED_System/QED_front_end/loading-screenshots/audit/LOADING-ROUTES.json). Fixed-overlay evidence is in `loading-screenshots/diff/`; shimmer phases in `loading-screenshots/phases/`. Contact-sheet review checks overall composition; it does not certify every offscreen field.

| Priority | Page | Route | Prefix |
|---|---|---|---|
| 1 | [Teacher Dashboard](C:/Users/Mavys/Downloads/QED_System/QED_front_end/loading-screenshots/teacher-dashboard-1280-light-loaded.png) | /teacher | teacher-dashboard |
| 2 | [Teacher Subject](C:/Users/Mavys/Downloads/QED_System/QED_front_end/loading-screenshots/teacher-subject-1280-light-loaded.png) | /teacher/subjects/1 | teacher-subject |
| 3 | [System Audit Logs (Admin dashboard)](C:/Users/Mavys/Downloads/QED_System/QED_front_end/loading-screenshots/admin-1280-light-loaded.png) | /admin | admin |
| 4 | [Student Holistic Profile](C:/Users/Mavys/Downloads/QED_System/QED_front_end/loading-screenshots/holistic-profile-1280-light-loaded.png) | /teacher/holistic/1 | holistic-profile |
| 5 | [Teacher Gradebook](C:/Users/Mavys/Downloads/QED_System/QED_front_end/loading-screenshots/teacher-grades-1280-light-loaded.png) | /teacher/grades | teacher-grades |
| 6 | [Principal Dashboard (bar/line/radar charts)](C:/Users/Mavys/Downloads/QED_System/QED_front_end/loading-screenshots/principal-dashboard-1280-light-loaded.png) | /principal | principal-dashboard |
| 7 | [Parent Student Detail (five tabs)](C:/Users/Mavys/Downloads/QED_System/QED_front_end/loading-screenshots/parent-detail-overview-1280-light-loaded.png) | /parent/students/1 | parent-detail-overview and tab variants |
| 8 | [Pet Quiz](C:/Users/Mavys/Downloads/QED_System/QED_front_end/loading-screenshots/parent-pet-quiz-1280-light-loaded.png) | /parent/students/1/topics/1/quiz | parent-pet-quiz and state variants |

## Not yet certified

- Auth/bootstrap and known-role fallback decisions are resolved; seven new tests plus targeted mutations provide their evidence. Original individual-test coverage is retained as historical evidence. The user accepted per-family mutation proof for unchanged/static and negative-control tests; all 28 checks passed their fail/restore protocol. This does not claim each individual test failed original code.
- Exhaustive per-region fixed overlays, classification-negative cases, repeat-cache checks and every wrapping-field line-cache path are not yet certified across all 55 routes. Current tests cover selected named leaves/frames per route and shared-engine behavior. Screenshot presence and all-pass tests cannot establish those missing assertions.
- The Edit Subject template branch is now verified through error/retry in both widths/themes; that does not certify every other optional dialog branch.
- Existing mobile heatmap/radar clipping is preserved under the agreed layout rule; no new internal scroll or forced dimensions were introduced.
- Browser fixtures control API latency and payloads; live production backend, real school accounts and deployment were not tested.
- The real route layouts are eager so their matching skeleton can render while the fetch controller is lazy. The entry bundle grew from 407.95 kB / 121.78 kB gzip to 1,708.98 kB / 485.95 kB gzip. Production network/startup performance is unmeasured; Vite reports large chunks and an ineffective dynamic LoginPanel import already referenced by Landing. This cost is explicitly uncertified.

## Documentation

[LOADING.md](C:/Users/Mavys/Downloads/QED_System/QED_front_end/LOADING.md) contains the tokens, primitives, region rules and single new-page rule. [LOADING-SPEC.md](C:/Users/Mavys/Downloads/QED_System/QED_front_end/LOADING-SPEC.md) retains the full specification and exact decisions. [DESIGN-AUDIT.md](C:/Users/Mavys/Downloads/QED_System/QED_front_end/DESIGN-AUDIT.md) records the migration findings/classifications. [LOADING-PROGRESS.md](C:/Users/Mavys/Downloads/QED_System/QED_front_end/LOADING-PROGRESS.md) records the remaining work and commands.

## Changed files and preservation

At the earlier checkpoint, 154 existing source files differed from the saved latest-spec snapshot (including deletions). [Historical exact file/status inventory](C:/Users/Mavys/Downloads/QED_System/QED_front_end/loading-screenshots/audit/LOADING-SOURCE-CHANGES.json) avoids attributing earlier theme edits to this loading work. The follow-up adds 46 shared views, the gate and registry fallback architecture, seven tests and mutation tooling. See LOADING-VIEW-PRESERVATION.json and LOADING-TEST-READINESS.json for exact preservation evidence. All authorized work is to be committed on `codex/finish-loading-verification`; no push or deployment. The two protected service/config files match the saved snapshot byte-for-byte.

## Historical raw runner summary

The complete, unedited output remains in [loading-final-suite-3.log](C:/Users/Mavys/Downloads/QED_System/QED_front_end/loading-final-suite-3.log). Its final summary is:

```text
587 passed (19.1m)
```

Screenshot file/header validation: [536 captures, zero missing or incorrect dimensions](C:/Users/Mavys/Downloads/QED_System/QED_front_end/loading-screenshots/audit/LOADING-SCREENSHOT-VALIDATION.json). [Contact sheets and labels](C:/Users/Mavys/Downloads/QED_System/QED_front_end/loading-screenshots/review) are saved for visual review. Retry tests intentionally inject failed API responses, which can produce console error lines in the unedited all-pass logs.
