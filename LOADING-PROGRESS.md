# QED loading migration progress

Workspace: C:/Users/Mavys/Downloads/QED_System/QED_front_end

## Status
55/55 routes registered. Registration records migration, not complete per-region verification. Three final all-pass full-suite runs have NOT happened. Do not claim completion.

- Registered (final audit pending): `/`
- Registered (final audit pending): `/login`
- Registered (final audit pending): `/admin`
- Registered (final audit pending): `/admin/students`
- Registered (final audit pending): `/admin/students/new`
- Registered (final audit pending): `/admin/students/:studentId/edit`
- Registered (final audit pending): `/admin/users`
- Registered (final audit pending): `/admin/users/new`
- Registered (final audit pending): `/admin/users/:role/:userId`
- Registered (final audit pending): `/admin/users/:role/:userId/edit`
- Registered (final audit pending): `/admin/classes`
- Registered (final audit pending): `/admin/classes/new`
- Registered (final audit pending): `/admin/classes/:classId`
- Registered (final audit pending): `/admin/classes/:classId/edit`
- Registered (final audit pending): `/admin/subjects`
- Registered (final audit pending): `/admin/subjects/new`
- Registered (final audit pending): `/admin/subjects/:subjectId`
- Registered (final audit pending): `/admin/academic-year`
- Registered (final audit pending): `/admin/calendar`
- Registered (final audit pending): `/admin/help`
- Registered (final audit pending): `/principal`
- Registered (final audit pending): `/principal/students`
- Registered (final audit pending): `/principal/students/class/:classId`
- Registered (final audit pending): `/principal/students/grade/:gradeId`
- Registered (final audit pending): `/principal/teachers`
- Registered (final audit pending): `/principal/teachers/:teacherId`
- Registered (final audit pending): `/principal/reports`
- Registered (final audit pending): `/principal/holistic-performance-analytics`
- Registered (final audit pending): `/principal/gradebooks`
- Registered (final audit pending): `/principal/gradebooks/:grade`
- Registered (final audit pending): `/principal/calendar`
- Registered (final audit pending): `/principal/help`
- Registered (final audit pending): `/teacher`
- Registered (final audit pending): `/teacher/attendance`
- Registered (final audit pending): `/teacher/attendance/records`
- Registered (final audit pending): `/teacher/subjects`
- Registered (final audit pending): `/teacher/subjects/:subjectId`
- Registered (final audit pending): `/teacher/subjects/:subjectId/records`
- Registered (final audit pending): `/teacher/subjects/:subjectSectionId/students`
- Registered (final audit pending): `/teacher/grades`
- Registered (final audit pending): `/teacher/holistic`
- Registered (final audit pending): `/teacher/holistic/:studentId`
- Registered (final audit pending): `/teacher/holistic/domain-trends`
- Registered (final audit pending): `/teacher/students/:studentId`
- Registered (final audit pending): `/teacher/advisory`
- Registered (final audit pending): `/teacher/calendar`
- Registered (final audit pending): `/teacher/help`
- Registered (final audit pending): `/parent`
- Registered (final audit pending): `/parent/enrolled-children`
- Registered (final audit pending): `/parent/students/:studentId`
- Registered (final audit pending): `/parent/students/:studentId/topics/:topicId/support`
- Registered (final audit pending): `/parent/students/:studentId/topics/:topicId/courseware`
- Registered (final audit pending): `/parent/students/:studentId/topics/:topicId/quiz`
- Registered (final audit pending): `/parent/calendar`
- Registered (final audit pending): `/parent/help`

## Current work
55/55 route compositions registered. Parent five tabs and quiz road/question/bonus states migrated and targeted tests passed. Final source guard, every-region geometry/classification/cache assertions, all-new-test original-code evidence, bootstrap fallback and full-suite verification remain.

## Commands
Run in the workspace above, sequentially (Vite uses port 5187):

```powershell
npx tsc -p tsconfig.app.json --noEmit
npm run build *> loading-production-build.log
npx playwright test tests/directory-loading.spec.ts tests/holistic-analytics-loading.spec.ts
npx playwright test tests/subject-records-loading.spec.ts
npx playwright test *> loading-final-suite-1.log
npx playwright test *> loading-final-suite-2.log
npx playwright test *> loading-final-suite-3.log
```

Do not edit project source/tests/docs during Chromium runs: Tailwind watches these and Vite reloads. Do not run multiple suites simultaneously. Screenshots/test output folders are already excluded from Tailwind.

## Evidence
- loading-principal-remaining-verification.log: 40 passed, including class/grade lists and holistic analytics at both widths/themes.
- loading-subject-records-before.log: original assessment spinner hides Learners' Names.
- loading-subject-holistic-records-before.log: original holistic loader hides Learner's Name/domain headers.
- loading-subject-records-targeted.log: 13 passed before adding holistic/cache tests.
- loading-subject-records-expanded.log: 17 passed, native width fixture failed; long words now exercise actual min-content width.
- loading-subject-records-columns.log / columns-fixed.log / cache-diagnostic.log: real cache-width failures preserved.
- loading-subject-records-cache-fixed.log: strict <=2px repeat cache passes after percentage-width score bars stopped enlarging native columns.
- Original records sources are outside repo in C:/Users/Mavys/AppData/Local/Temp/*RecordsPage.tsx.before-final-loading. Do not re-run migration scripts: they are not idempotent.

## Next steps
1. Finish records branch retries, cached widths, refetch, classifications/overlays and register only after meaningful verification.
2. Migrate Parent student detail (identity context, Overview, Academic, Holistic, Progress Report, Profile) and Pet Quiz (initial state, questions, bonus games) using original layouts.
3. Remove remaining QedLoader route/auth fallbacks without hiding the real shell. Audit every action/upload spinner separately.
4. Complete every-region CLS/static/negative-classification/pixel/overlay coverage and before-fail evidence; do not weaken assertions.
5. Build and run the entire suite three times; preserve raw final log. Audit all 55 route statuses and screenshot matrix; update LOADING.md.

## Accepted decisions
See LOADING-SPEC.md for all exact numbers and the full source request. Existing variable-aligned static controls can move once solely due to their content-dependent sibling; keep fixed dimensions and no pre-swap movement. Existing mobile heatmap/radar clipping is preserved and reported. Fixed-only 2% overlay limit; variable geometry uses one-time resize rules.

## Preserve unrelated work
The repository has many preexisting theme/dashboard edits. Never overwrite src/config/api.config.ts or src/features/profiles/teacher/pages/subjects/services/subjectGradeTemplate.service.ts. No agents, commits or pushes are authorized here.

## Latest checkpoint
2026-10-09: all 55 compositions registered and connected. Production build passed before the final visual review (22.27s); final rebuild and three full runs are still required after that review. Test count is now 583 (40 files), including four profile known-class/avatar regressions. All four fail before and pass after; two strengthened static guards also fail on original sources. The 89-case last-route baseline fails on original sources and restores current code automatically.

Parent profile fixes and exact ring silhouette are complete. `loading-parent-profile-final.log` exposed dark avatar contrast (49 pass/2 fail); `loading-parent-profile-known-fixed.log` confirms the four corrected cases. No test was skipped, deleted or loosened for this fix.

Auth/bootstrap decision remains pending: static QED brand + neutral reservation in the original loader area, or preserve the existing branded spinner. Do not render protected page components before auth is resolved. Root Suspense and auth QedLoader remain, as does an unused legacy ProtectedRoute loading text. This is not certified complete.

Next: rebuild; run the full suite 3 consecutive times, address any failures, audit individual before-fail evidence and every-region overlays/classifications, then produce the requested 55-route/spinner/screenshot report. The earlier Current work/Next steps above are historical; use this checkpoint.

## Final verification restart
The 583-case complete run found a real Continue-to-Review premature submit (582 passed, 1 failed). The test was strengthened to require zero update requests before Save and exactly one afterward; the payload assertion is unchanged. Distinct button keys fix the DOM-reuse issue. Edit Subject template errors now clear shapes and offer Retry. Unused legacy ProtectedRoute/status loader files were removed after confirming no imports.

19 student-form/dialog cases passed. Five fail against restored original sources (loading-final-save-modal-before.log); restoration completed. Current total: 587 tests in 41 files. Next required command: production rebuild, then three consecutive full all-pass suites. Earlier failed/interrupted runs do not count.

## Accessibility timing checkpoint

The next complete run passed all 587 cases (9.5m), but the second run had 586 passes and one accessibility-test race. Preserve `loading-pre-accessibility-fix-pass.log` and `loading-full-suite-accessibility-race.log`; that sequence does not satisfy the required three consecutive passes. The test had several browser-driver round trips before inspecting a transient revealed state, so the 1200ms fake request could complete first. The harness now supports an explicit fetch-release gate and records initial aria-busy/hidden reservation/status facts in-browser. The accessibility test checks that exact initial record, checks the revealed status, then releases data and checks complete cleanup. No timing constant or numerical bound changed; no production behavior changed. Rebuild and restart three full runs after targeted verification. Auth/bootstrap and exhaustive evidence decisions remain pending.

## Attendance transition checkpoint

The controlled accessibility behavior suite passed all 23 cases. Production rebuild passed (13.86s). Two subsequent full runs passed all 587 cases (9.4m and 9.3m), preserved in `loading-pre-attendance-race-pass-1.log` and `loading-pre-attendance-race-pass-2.log`. The third run was interrupted after detecting a strict-selector race during the advisory roster cross-fade; preserve `loading-full-suite-attendance-transition-race.log`. It is incomplete and does not count as a full run. The Month/Summary screenshot tests now wait for the parent roster transition to settle before addressing nested loaders, and the Month test explicitly requires exactly one table. No `.first()` workaround, tolerance change, test deletion or production change was used. Next: repeated targeted attendance verification, production build, refresh final input hashes, restart three complete suites. Do not claim three passes until that sequence finishes.

## Fast-refetch fixture checkpoint — current

The 60-case repeated attendance check passed. Rebuild passed (13.32s), and two further full runs passed 587 cases (9.8m and 9.2m). These are preserved in `loading-pre-fast-fixture-pass-1.log` and `loading-pre-fast-fixture-pass-2.log`. The third run was interrupted after a fast-refetch fixture incorrectly scheduled its 60ms release after the driver action returned. Preserve `loading-full-suite-fast-refetch-fixture-race.log`; it is incomplete and does not count.

Five test fixtures now use `tests/fixtures/refetch.ts`, timing 60ms from request interception. A browser-side probe requires an actual completed request below 200ms before checking settlement, so the principal test cannot pass by reading the previous settled state. All original no-dim/no-reveal, geometry and payload assertions remain. The parallel probe correctly rejected a 220ms request, which was not a fast sample. Use the project's configured **one worker**, with zero retries, for final verification; numerical limits are unchanged.

`loading-fast-fixture-serial-verification.log`: 30 passed (six repetitions of five fast cases). `loading-refetch-files-final-verification.log`: all 111 tests in the five affected files passed, including slow/error/cache/payload cases. Earlier invalid-fixture/probe failures remain in the logs. Current total is still 587 tests across 41 files. Next: production rebuild, refresh input hashes, then three sequential full runs using `npx playwright test --reporter=line --workers=1`. No project edits while those suites run. Finalize the report only after three complete passes. Pending auth/bootstrap and exhaustive evidence decisions remain unchanged.


## Verified checkpoint — supersedes historical next steps

2026-10-10: all 55 route compositions registered and connected; the remaining six are migrated. Production build passed (15.82s). Three consecutive full Chromium suites passed: run 1: 587 passed (19.3m); run 2: 587 passed (19.5m); run 3: 587 passed (19.1m). No retries, skips or test exclusions. No tests were deleted or weakened to obtain those passes. Source/test/config hashes unchanged. All 67 screenshot state groups contain skeleton/loaded at 375px/1280px in light/dark (536 main captures).

Read LOADING-REPORT.md for all 55 statuses, full spinner inventory, raw logs, exact before-failure evidence, eight priority pages and explicit verification gaps. LOADING.md is current. LOADING-SPEC.md contains all rules and exact numbers.

Remaining: (1) resolve pending auth/bootstrap choice before changing QedLoader; (2) resolve before-failure rule for unchanged/static and negative-control tests; (3) finish individual before-failure evidence and exhaustive every-region overlays/classification/cache/line-cache assertions. Existing passing checks are not certification of missing assertions. Live backend/accounts/deployment remain unverified. Do not claim fully complete.

Build: npm run build. Full suite: npx playwright test --reporter=line --workers=1 (run sequentially three times after any further source/test change). Do not edit project files while a browser suite runs. Preserve loading-final-suite-*.log and all before/failure evidence. Preserve gameplay animations and action/upload indicators. Never overwrite src/config/api.config.ts or src/features/profiles/teacher/pages/subjects/services/subjectGradeTemplate.service.ts.
# Current follow-up — 2026-10-10

**Final verified state:** production build passed (26.48s). Full final suite: **594 passed (20.5m)**, 42 files, one worker, zero retries/skips. All 566 frozen source/test/config hashes unchanged. All 67 screenshot groups contain the eight required captures (536 main files), correct dimensions, zero missing. Four priority contact sheets covering the eight requested pages reviewed. All 28 mutation families rejected their deliberate break and passed restored controls. All authorized work committed locally on `codex/finish-loading-verification`; no push/deploy. The remaining uncertified items below are explicit limits, not pending user decisions. Final commands and real output are recorded in LOADING-REPORT.md and loading-decision-*.log.

This section supersedes historical pending decisions and commit restrictions below. Branch: `codex/finish-loading-verification`. User explicitly authorized committing everything, with no push or deployment.

All 55 routes have real registered fallbacks inside their role shells. Forty-six shared layouts preserve original page logic/effects. The unknown-role bootstrap has its 200ms/400ms opacity-only logo, static reduced motion, status/aria-busy timing, complete DOM removal and protected-render gate. Seven new tests: five fail original code, two already pass original code and have accepted mutation proofs. Final gate verification: 14 passed (36.0s), two repetitions of seven. All 28 mutation families failed with their exact deliberate break and passed restored controls. Nine action/upload spinners, determinate graph and Pet Quiz gameplay animations are preserved.

Commands: `npm run build`; `npx playwright test --reporter=line --workers=1` once. Current build/full-suite outputs: `loading-decision-build.log`, `loading-decision-final-suite.log`. Do not edit source/tests during the suite. Then validate refreshed screenshots and unchanged input hashes, update LOADING-REPORT.md, commit all authorized work and verify clean status. Do not push/deploy.

Still uncertified: exhaustive optional-region overlays/classification/cache/line-cache coverage across every region; live backend/accounts; production lazy-bundle performance. The full report retains the 55-route and screenshot inventory.

Subject-provider follow-up: first suite stopped after a real fallback context error; SubjectsSection now catches lazy children inside its original providers. Add Subject waits for visible main plus completed lazy handoff before existing checks. All eight cases passed twice (16 passed, 46.8s). Production rebuild passed (14.74s). Current complete suite contains 594 cases; source/test/config freeze covers 565 files. Entry gzip is 485.95 kB (previous 121.78 kB); startup/network performance remains unmeasured.

Final readiness checkpoint: shared helper now waits for the unique `.qed-account-ui` shell and no route preview before page-data checks. Bootstrap/lazy tests remain independent. All 37 test files retain every byte after removing only the added helper import/calls; audit JSON records proof. Admin/bootstrap targeted group: 34 passed (1.4m). Current freeze: 566 source/test/config files; pre-helper 565-file hashes are retained separately. No test deleted, skipped or tolerance changed.

