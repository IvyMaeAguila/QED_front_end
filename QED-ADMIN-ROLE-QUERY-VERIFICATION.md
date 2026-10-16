# QED Admin role — Phase 3 verification

Date: 2026-10-14. ADMIN AUTOMATED CHECKPOINT PASSED: source 1,256/1,256, fresh-production 685/685, isolated backend 1,307/1,307. Stopped for user review. This is not unconditional production deployment approval. Evidence directory: C:/Users/Mavys/AppData/Local/Temp/qed-admin-phase3-20261013.

## Module completion checklist

| Boundary | Final implementation | Focused verification |
| --- | --- | --- |
| Dashboard | Existing four Query readers retained; original 30-second login-frequency polling | Existing acceptance/goldens retained in full gates |
| User Management/provisioning | Existing Query implementation retained; confirmed Teacher-change signal and deferred profile composition connected | Existing acceptance/goldens retained; repeated offline/edit pair 10/10 |
| Student Records | List/CRUD/form options/sequential Excel imports migrated | 43/43 student/form, 2/2 actual import tests |
| Classes | List/detail/CRUD/form options migrated | 34/34 existing, 23/23 Query |
| Subjects/Sections/assignments | Independent grade-scoped reads/writes migrated | 20/20 existing, 34/34 Query |
| Assessments | Reads plus explicit non-retried coalesced default initialization mutation | Subject suite preserves labels/weights and initialization behavior |
| Academic Year/Terms | Active/all-year/term reads and existing writes migrated | 18/18 actual-app tests |
| Grade Templates | Subject-ID metadata/upload migrated | Parser/preview/export/calculations preserved; existing template and new subject tests |
| Calendar | Four reads/six writes migrated for Admin | 23/23 Admin + 16/16 shared UI |
| Notifications | Admin background list, polling/focus/socket and receipts migrated | 15/15 focused cases; no Bell added to Admin header |
| Admin Teacher profile/schedule/advisory | Previously deferred owned reader migrated | 22/22 hook + 12/12 actual profile |
| Help/theme/auth bootstrap/account actions/binary exports | Not appropriate as independent Query resources | Existing implementations retained |

Actual Admin routes and shared consumers were inspected. Commented student-detail route and unused settings/schoolYear.service and SubjectsTeachersContext declarations are not fabricated as features. Teacher adapters and standalone legacy fallback consumers remain supported. Parent is outside scope.

## Keys, policies, dependencies

A = ['session', generation, 'ADMIN', String(authUserId), 'admin']. Existing centralized QueryClient and auth cleanup are reused; session-keyed boundaries prevent old callbacks/data affecting new accounts. Auth initialization and route-preview disable requests. Reads propagate AbortSignal, independently detect 401 and guard the captured session generation. 403 suppresses private cached projections without logging out.

| Suffix after A | Existing transport / server parameters | Freshness |
| --- | --- | --- |
| students/list | /api/student/allStudents | 30 seconds |
| student-options/grades; student-options/sections/gradeId | /api/gradeLevel/getGradeLevels; getSectionByGrade?gradeLevelId= | Grades 5 minutes; sections 30 seconds |
| classes/list; teachers/list | Existing class list and Teacher lookup transports | 30 seconds |
| class-options/grades, teachers/all, sections/grade/excludeClassId, subjects/grade | Existing class form endpoints with exact server parameters | Grades 5 minutes; others 30 seconds |
| sections/grade/gradeId; sections/used-by-classes | /api/section/getSections/:grade; sectionIdsUsedByClasses | 30 seconds |
| subjects/catalog/grade/gradeId; subjects/assignments/grade/gradeId | /api/subject/getSubjectsByGrade/:grade; getSubjectSectionsByGrade/:grade | 30 seconds |
| subjects/assessments | /api/subject/ | 5 minutes |
| academic-year/active, all, terms/yearId | /api/academic-year/getAcademicYear; getAllSy; getTerms/:yearId | 30 seconds |
| templates/subjectId | /api/subject/getActiveGradeTemplate/:subjectId | 5 minutes; cached null retained |
| teachers/profile/yearId/teacherId | Existing stateless Teacher profile transport | 5 minutes; existing Admin 404 error semantics retained |
| students/roster/yearId/class/classId | Existing class-list transport | 30 seconds; null/404 cached semantics retained |
| calendar/activities, holidays, all-activities, all-holidays | Four existing Calendar GETs | 30 seconds |
| notifications | Existing authenticated-user ownership transport, role-derived Admin key | 30 seconds; existing poll/focus/socket behavior |

Inactive GC is five minutes. New ordinary readers retry:false, focus:false, reconnect:true; bounded explicit Retry coalesces. No new polling. Existing Dashboard and Notification refresh policies remain. Profiles wait for validated active-year context; all actual endpoint parameters appear in keys. No invented term/year filters. Forms, modal selections and drafts remain local.

Query-free shared bootstrap providers retain their existing startup contract. Lazy activation synchronously retires/cancels manual readers, adopts successful authorized data with its original timestamp, and clears the retired local cache. No competing manual cache after handoff. Failed/forbidden seeds are excluded. Shared legacy profile Map remains for accounted-for consumers; new Admin reader bypasses it via stateless transport.

Paused offline reads stop loading, preserve authorized cached rows and recover on reconnect. Writes are not queued offline. Cold background Notification Query activation is deferred until online. Fully offline first-load of uncached JavaScript is not an offline-installable-app claim.

All suitable writes use central mutations with retry:false. Exact payloads/contracts retained; captured-session checks prevent old writes publishing into a new account. No optimistic grade publication. Existing subject status-toggle UI behavior retained. Confirmed-only invalidation:

- Student: students/classes/dashboard students/audit; original UI refresh or confirmed import append, no per-row list refetch.
- Classes: classes/options/students/teachers/sections/subjects/audit; confirmed deletion patches list.
- Sections: confirmed section patches/options invalidation; active assignments/classes/students refresh renamed labels.
- Subject/assessment: matching catalog/assignment/option/template/audit dependencies; explicit coalesced assessment initializer is never a queryFn.
- Template: replace confirmed subject metadata, invalidate assignments/options/audit; parser/export unchanged.
- Academic Year: year/subject/options/template/audit; original full reload retained. Terms replace returned year-specific rows and refresh active year; exact three-term behavior unchanged.
- Calendar: corresponding kind/all-kind and audit only. Notification: confirmed receipt flags/list invalidation.
- Confirmed Teacher-user edit signals refetchTeachers(true) to invalidate lookup/profile/class dependencies. Ordinary lookup Retry preserves fresh offline profile cache.

See TANSTACK-QUERY-INVALIDATION-MAP.md. Dependencies are same-session; no claim of live cross-browser invalidation.

## Narrow security corrections

Audit reproduced missing management authorization: before correction 65/264 passed and 199 failed. Four routers now use existing verifyToken + requireAdmin on 15 management writes. Subject/template metadata GETs require authentication while required cross-role reads remain. Template authorization precedes multipart parsing. No controllers, SQL, schemas, grading, statistics or import/export logic changed.

Focused actual local Express router/JWT/controller tests with isolated database doubles pass 264/264. Missing/invalid/expired/reset JWTs, non-Admin/malformed/spoofed roles and authorized success contracts are covered. Denied writes execute zero controller/database operations. Complete isolated backend: 1,307/1,307, zero skips. Earlier Calendar, notification ownership, student access, academic management and provisioning security implementations are preserved.

## Verification ledger

Inherited Teacher checkpoint: source 1,018, production 559, backend 1,043 passing (prior evidence). Phase 3 pre-edit baseline: 114/114 focused Admin browser tests, zero retries; TypeScript passed.

Focused logs: admin-students-browser-third.log (43), admin-classes-existing-browser.log (34), admin-classes-query-browser.log (23), admin-subjects-existing-browser.log (20), admin-subjects-query-browser-third.log (34), admin-year-browser-final.log (18), admin-calendar-browser-first.log (39), admin-profile-browser-first.log (22), admin-profile-import-browser-second.log (12 profile passes plus two failing import fixtures), admin-notification-import-browser-final.log (15 notification passes plus two failing import fixtures), admin-student-import-browser-fourth.log (2), admin-users-cross-module-repeat-final.log (10), admin-management-security-after.log (264), admin-backend-full-first.log (1,307).

First complete source PASSED 1,256/1,256 in 34.4 minutes (admin-source-full-third.log and admin-source-first-success-results.json). Final sequential source, after both test-synchronization corrections and the final rebuild, PASSED 1,256/1,256 in 28.1 minutes (admin-source-full-fifth.log and admin-source-final-results.json). Final fresh-production PASSED 685/685 in 15.9 minutes (admin-production-full-second.log and admin-production-final-results.json). Both final browser gates have zero retries, failures, skips or flaky results. Source adds 177 new cases and 61 existing Admin cases to the inherited 1,018; production adds 65 new cases and the same 61 to the inherited 559. Corrected repeated tests: Dashboard source 10/10; analytics source 10/10; combined production 30/30, zero retries. Final TypeScript + fresh production build + unchanged static bundle guard PASSED (admin-build-final-fourth.log). All 119 artifact files are byte-identical to those used for the corrected production repeats (artifact-equivalence.json) and remained unchanged throughout the final production gate (admin-final-gate-summary.json). Complete isolated backend rerun PASSED 1,307/1,307 (admin-backend-full-final.log). All five changed/new backend JavaScript files pass node --check. Final new Query/helper/test scoped lint PASSED (admin-scoped-lint-final.log); existing context Fast Refresh diagnostics remain. Full repository ESLint remains nonzero: 159 errors and 20 warnings (admin-lint-final-second.json); unchanged files match entry hashes and changed-file diagnostics match committed-code rules/messages after removing the two newly introduced mapper-export errors. This is not a clean global lint claim.

The two introduced cosmetic EOF blank lines in StudentFormPage.tsx and grade-section.service.ts were removed before the final rebuild; trimmed program text is identical. Whole-checkout git diff --check still reports unchanged prior Principal/holistic whitespace findings. Unrelated prior whitespace was not edited. No full-repository static-cleanliness claim is made.

Browser APIs/auth/sockets are mocked. Full configs retain all inherited cases, add new Admin tests and 61 existing Admin form/detail cases previously outside full match lists. Zero retries, existing single-worker conditions; no assertion/budget weakening.

## Exploratory failures and corrections

All exploratory logs are retained; failures are not counted as final passes.

| Run | Observed result / cause / correction |
| --- | --- |
| Backend characterization | 65 pass, 199 fail; genuine missing guards; focused correction 264/264 |
| Students first/second | 34/10, 36/7; generated seeded-record alias syntax error, outgoing bootstrap duplicate reads and auth readiness; corrected alias, synchronous retirement/auth gate; final 43/43 |
| Year iterations | 11/5, 11/5, 15/1, 16/0, final 18/0; wrong navigation/dialog/returned-ID fixture assumptions, canceled StrictMode probe vs completed request, transition clones; exact target cancellation/event-state synchronization retained |
| Subjects | 23/10 including harness syntax and genuine missing mounted Query provider for reconnect; then 33/0. Separate section-sync 0/1 reproduced stale labels; mounted central provider and confirmed active invalidation; final 34/34 |
| Notifications first | Interrupted after five failures from copied Teacher Bell assumption; remaining tests not executed. Admin has no Bell; tested actual unchanged background flow |
| Notifications iterations | 9/2, 9/2, 10/1, then 11/0; 401 redirect canceled body completion, socket-double callback race, nonreactive harness readiness; response/auth sync, independent listener Set and reactive readiness corrected. Four new receipt/cold-offline cases passed (15 total) |
| Profile initial | Five TS errors from wrong relative import, corrected. Legacy completed-read count 2 failed once against deduplicated new path 1; assertion now exactly one completed read with separately identified StrictMode canceled probe, no loose count range |
| Users offline iterations | 12/1, repeat 3/3, 5/1, sanitized repeat 4/1; installed Playwright async waitForFunction predicate treated Promise as truthy. Sanitized lifecycle traces showed lazy imports occurred after offline switch; awaited expect.poll(page.evaluate(...)) fixed synchronization; repeat 10/10 |
| Profile/import | 11/3 then 12/2; genuine read-only Retry invalidated fresh profile; explicit confirmed-write flag fixed it. Import fixtures had wrong formatted-name order and transition-clone matches |
| Notification/import | 15/2; synthetic LRN duplicated existing record, correctly rejected by preserved validation. Unique LRNs yield import 2/2; no validation weakened |
| Lint/extraction | New map exports introduced two Fast Refresh errors. Moved both pure mapping bodies verbatim to serverRowMappers.ts. First source run intentionally interrupted after 139 reported passes to correct them |
| Extraction editing failure | CRLF-sensitive removal left duplicate declarations: nine TS errors, same source-startup errors. Corrected exact declaration ranges. Second source attempt interrupted before tests; third fresh build passed. Both failed/interrupted logs retained |
| First complete production gate | 683 passed / 2 failed in 21.7 minutes. Admin Dashboard offline-transition failed after source passed. Its negative heading assertion did not establish that the Classes lazy Query adapter had loaded. Five unmodified production repeats passed, so no flakiness dismissal was made. Controlled pending-school-chunk reproduction failed 3/3 with the identical missing alert; sanitized evidence shows AdminSchoolQueries requested in classes phase, failed offline with ERR_INTERNET_DISCONNECTED, and emitted a dynamic-import page error. Added actual classes/list and teachers/list active-idle synchronization before offline, preserving every original cache/data/request-count assertion. Corrected source repeat 10/10 and production repeat 10/10. No application change or test retry increase |
| Principal analytics fast timing failure | Second first-production failure was existing fast term-refetch test: real 60ms sleep did not guarantee API delivery/React completion below LoadingRegion's unchanged 200ms deadline; captured phases were waiting, dimmed, swapping, settled. Slow path/business calculations were correct. Replaced fast path's real sleep with controlled clock, exact active-reader idle synchronization and bounded completion ticks; added explicit elapsed-time assertion below 200ms. Original no-dimmed/no-revealed and geometry assertions retained; slow-path assertions untouched. No Principal application change |
| Fake-clock exploration | Initial zero-tick completion flush stalled waiting: 5 fast failures / 5 slow passes. Corrected to 1ms notification ticks with a strict elapsed-time deadline; source repeat 10/10 (five each) and production repeat 20/20 (ten each), zero retries |
| Diagnostic setup | First external controlled-test attempt failed module resolution before tests (file URL in CommonJS-transpiled temporary spec); corrected temporary imports. This is not a passing test run |
| Overlapping source restart | Dev-server readiness exceeded the unchanged 60-second limit before any tests executed. Owned child servers terminated through normal teardown; user-owned server preserved. Normal shared-output cleanup removed the first Dashboard failure screenshot; original failure log and separate controlled characterization screenshots/evidence remain. Final commands use separate external artifact directories and sequential gates; no retry/timeout increase |

No arbitrary delay, increased test retries, concealed failure or weakened security/cancellation/count assertion was used. Request evidence contains sanitized paths/phases/status/lifecycle only, not cookies, credentials or private response data.

## Performance and release limitations

Retained Teacher artifact baseline: public eager closure 134,060 gzip bytes; Admin eager beyond public 146,271. Final fresh build: public 134,411 (+351, 0.26%); Admin 150,387 (+4,116, 2.81%). Fixed budgets remain 135,349 /151,512, leaving 938 /1,125 bytes headroom. Entry gzip is 629 bytes, below 112,153. Static guards unchanged; Query remains outside public and Admin-layout eager graphs, activating behind authenticated lazy boundaries. Real-backend latency was not measured. Admin profile completes one request versus the legacy path's two; fresh bootstrap handoff adds no completed GET when successful seed data exists. New import tests prove two sequential writes with no per-row list refetch; no invented before/after performance numbers for unmeasured endpoints.

No real-backend acceptance, representative MySQL persistence/transaction, email delivery or live socket verification is claimed. Existing xlsx vulnerability remains a separate follow-up; no unrelated dependency upgrade. The manual localhost/Render toggle is unchanged, with localhost active by instruction. Switch the existing toggle to Render and rebuild before release; this is not currently a Render-ready artifact. Controlled characterization confirms that disconnecting while an uncached lazy JavaScript chunk is in flight can reject the import and blank the application until reload. This is distinct from Query/API offline recovery after required code has loaded; application-wide chunk-load recovery/service-worker behavior was not redesigned in this increment.

## Exact changed files and preservation audit

Snapshots before Phase 3 cover both Git HEAD/status and all tracked/nonignored file hashes. The final hash comparison below identifies this increment separately from pre-existing uncommitted work. No deletion, stage, commit, push or deploy. Generated screenshots/diffs are retained and listed separately. Prior security fixes and direct Principal/Teacher/Parent application code, API config, dependencies/locks, QueryClient/auth cleanup and educational calculations are preserved; shared adapter changes and two acceptance synchronization corrections are explicitly inventoried below. Both moved row-mapping function bodies are identical to their original committed bodies (admin-protected-check.json).

The eligible Admin page boundaries are complete, including the deferred Teacher profile dependency. Auth-owned/shared account operations, Query-free compatibility bootstrap, legacy fallbacks for accounted-for consumers, local drafts/calculations and binary exports deliberately retain their existing implementation. Parent is not migrated. Recommended next increment is a read-only Parent dependency inventory, followed by its eligible readers only after user approval. No further module or Git operation has started.

<!-- GENERATED PHASE3 INVENTORY -->

### frontend: C:\Users\Mavys\Downloads\QED_System\QED_front_end

HEAD unchanged: true; staged paths: none; removed paths: 0; protected changes: 0; unchanged entry files: 2063.

Files changed/added by this increment (89):

- QED-ADMIN-ROLE-QUERY-VERIFICATION.md
- QED-API-MIGRATION-INVENTORY.md
- TANSTACK-QUERY-INVALIDATION-MAP.md
- TANSTACK-QUERY-MIGRATION-ROADMAP.md
- playwright.acceptance-build.config.ts
- playwright.acceptance.config.ts
- playwright.admin-focused.config.ts
- src/features/profiles/admin/pages/classes/ClassFormPage.loading-view.tsx
- src/features/profiles/admin/pages/classes/ClassFormPage.tsx
- src/features/profiles/admin/pages/classes/ClassPage.tsx
- src/features/profiles/admin/pages/classes/ClassViewPage.tsx
- src/features/profiles/admin/pages/classes/context/ClassesContext.tsx
- src/features/profiles/admin/pages/classes/context/TeachersContext.tsx
- src/features/profiles/admin/pages/classes/services/classes.service.ts
- src/features/profiles/admin/pages/studentrecords/StudentFormPage.loading-view.tsx
- src/features/profiles/admin/pages/studentrecords/StudentFormPage.tsx
- src/features/profiles/admin/pages/studentrecords/StudentRecordsPage.tsx
- src/features/profiles/admin/pages/studentrecords/components/StudentImportExportToolbar.tsx
- src/features/profiles/admin/pages/studentrecords/context/StudentsContext.tsx
- src/features/profiles/admin/pages/studentrecords/services/grade-section.service.ts
- src/features/profiles/admin/pages/studentrecords/services/student-record.service.ts
- src/features/profiles/admin/pages/subjects/AcademicYearPage.loading-view.tsx
- src/features/profiles/admin/pages/subjects/AcademicYearPage.tsx
- src/features/profiles/admin/pages/subjects/AddSubjectPage.loading-view.tsx
- src/features/profiles/admin/pages/subjects/AddSubjectPage.tsx
- src/features/profiles/admin/pages/subjects/AdminSubjectDetailPage.tsx
- src/features/profiles/admin/pages/subjects/ManageSubjectsPage.loading-view.tsx
- src/features/profiles/admin/pages/subjects/ManageSubjectsPage.tsx
- src/features/profiles/admin/pages/subjects/SubjectSection.tsx
- src/features/profiles/admin/pages/subjects/components/EditSubjectModal.tsx
- src/features/profiles/admin/pages/subjects/components/SubjectGradeTemplateSection.tsx
- src/features/profiles/admin/pages/subjects/context/SectionsContext.tsx
- src/features/profiles/admin/pages/subjects/context/SubjectSectionsContext.tsx
- src/features/profiles/admin/pages/subjects/context/SubjectsCatalogContext.tsx
- src/features/profiles/admin/pages/subjects/context/gradeLevelsContext.tsx
- src/features/profiles/admin/pages/subjects/services/academicyear.service.ts
- src/features/profiles/admin/pages/subjects/services/section.service.ts
- src/features/profiles/admin/pages/subjects/services/subject.service.ts
- src/features/profiles/admin/pages/subjects/services/subjectGradeTemplate.service.ts
- src/features/profiles/admin/pages/subjects/types/serverRowMappers.ts
- src/features/profiles/admin/pages/usermanagement/UserViewPage.loading-view.tsx
- src/features/profiles/admin/pages/usermanagement/UsersQueryDriver.tsx
- src/features/profiles/admin/query/AdminCalendarQueries.tsx
- src/features/profiles/admin/query/AdminNotificationActivation.tsx
- src/features/profiles/admin/query/AdminSchoolProvider.tsx
- src/features/profiles/admin/query/AdminSchoolQueries.tsx
- src/features/profiles/admin/query/AdminSessionBoundary.tsx
- src/features/profiles/admin/query/AdminStudentsProvider.tsx
- src/features/profiles/admin/query/AdminStudentsQueries.tsx
- src/features/profiles/admin/query/AdminSubjectOperations.tsx
- src/features/profiles/admin/query/AdminSubjectsQueries.tsx
- src/features/profiles/admin/query/AdminTeacherProfileQueries.tsx
- src/features/profiles/admin/query/AdminTeacherSchedule.tsx
- src/features/profiles/admin/query/adminQueryScope.ts
- src/features/profiles/admin/query/useAdminFetch.ts
- src/features/profiles/admin/query/useAdminReader.ts
- src/features/profiles/admin/query/useAdminTeacherProfile.ts
- src/features/profiles/admin/query/useAdminWriter.ts
- src/routes/roles/AdminRoutes.tsx
- src/shared/calendar/CalendarPage.tsx
- src/shared/http/ApiRequestOptions.ts
- src/shared/notification/AuthenticatedNotificationQueries.tsx
- src/shared/notification/NotificationContext.tsx
- tests/admin-dashboard-acceptance.spec.ts
- tests/admin-remaining-calendar-acceptance.spec.ts
- tests/admin-remaining-classes-harness.tsx
- tests/admin-remaining-classes.html
- tests/admin-remaining-classes.spec.ts
- tests/admin-remaining-notification-acceptance.spec.ts
- tests/admin-remaining-notification-harness.tsx
- tests/admin-remaining-notification.html
- tests/admin-remaining-notification.spec.ts
- tests/admin-remaining-profile-acceptance.spec.ts
- tests/admin-remaining-profile-harness.tsx
- tests/admin-remaining-profile.html
- tests/admin-remaining-profile.spec.ts
- tests/admin-remaining-student-import-acceptance.spec.ts
- tests/admin-remaining-students-harness.tsx
- tests/admin-remaining-students.html
- tests/admin-remaining-students.spec.ts
- tests/admin-remaining-subjects-harness.tsx
- tests/admin-remaining-subjects.html
- tests/admin-remaining-subjects.spec.ts
- tests/admin-remaining-year-acceptance.spec.ts
- tests/admin-users-acceptance.spec.ts
- tests/fixtures/adminStudents.ts
- tests/fixtures/adminUsers.ts
- tests/fixtures/queryLifecycle.ts
- tests/subject-analytics-loading.spec.ts

Generated screenshot/diff artifacts (308); existing artifacts regenerated by the unchanged capture routines, retained for review:

- loading-screenshots/admin-add-subject-1280-dark-loaded.png
- loading-screenshots/admin-add-subject-1280-dark-skeleton.png
- loading-screenshots/admin-add-subject-1280-light-loaded.png
- loading-screenshots/admin-add-subject-1280-light-skeleton.png
- loading-screenshots/admin-add-subject-375-dark-loaded.png
- loading-screenshots/admin-add-subject-375-dark-skeleton.png
- loading-screenshots/admin-add-subject-375-light-loaded.png
- loading-screenshots/admin-add-subject-375-light-skeleton.png
- loading-screenshots/admin-calendar-1280-dark-loaded.png
- loading-screenshots/admin-calendar-1280-dark-skeleton.png
- loading-screenshots/admin-calendar-1280-light-loaded.png
- loading-screenshots/admin-calendar-1280-light-skeleton.png
- loading-screenshots/admin-calendar-375-dark-loaded.png
- loading-screenshots/admin-calendar-375-dark-skeleton.png
- loading-screenshots/admin-calendar-375-light-loaded.png
- loading-screenshots/admin-calendar-375-light-skeleton.png
- loading-screenshots/admin-class-details-1280-dark-loaded.png
- loading-screenshots/admin-class-details-1280-dark-skeleton.png
- loading-screenshots/admin-class-details-1280-light-loaded.png
- loading-screenshots/admin-class-details-1280-light-skeleton.png
- loading-screenshots/admin-class-details-375-dark-loaded.png
- loading-screenshots/admin-class-details-375-dark-skeleton.png
- loading-screenshots/admin-class-details-375-light-loaded.png
- loading-screenshots/admin-class-details-375-light-skeleton.png
- loading-screenshots/admin-class-edit-1280-dark-loaded.png
- loading-screenshots/admin-class-edit-1280-dark-skeleton.png
- loading-screenshots/admin-class-edit-1280-light-loaded.png
- loading-screenshots/admin-class-edit-1280-light-skeleton.png
- loading-screenshots/admin-class-edit-375-dark-loaded.png
- loading-screenshots/admin-class-edit-375-dark-skeleton.png
- loading-screenshots/admin-class-edit-375-light-loaded.png
- loading-screenshots/admin-class-edit-375-light-skeleton.png
- loading-screenshots/admin-class-new-1280-dark-loaded.png
- loading-screenshots/admin-class-new-1280-dark-skeleton.png
- loading-screenshots/admin-class-new-1280-light-loaded.png
- loading-screenshots/admin-class-new-1280-light-skeleton.png
- loading-screenshots/admin-class-new-375-dark-loaded.png
- loading-screenshots/admin-class-new-375-dark-skeleton.png
- loading-screenshots/admin-class-new-375-light-loaded.png
- loading-screenshots/admin-class-new-375-light-skeleton.png
- loading-screenshots/admin-student-edit-1280-dark-loaded.png
- loading-screenshots/admin-student-edit-1280-dark-skeleton.png
- loading-screenshots/admin-student-edit-1280-light-loaded.png
- loading-screenshots/admin-student-edit-1280-light-skeleton.png
- loading-screenshots/admin-student-edit-375-dark-loaded.png
- loading-screenshots/admin-student-edit-375-dark-skeleton.png
- loading-screenshots/admin-student-edit-375-light-loaded.png
- loading-screenshots/admin-student-edit-375-light-skeleton.png
- loading-screenshots/admin-student-new-1280-dark-loaded.png
- loading-screenshots/admin-student-new-1280-dark-skeleton.png
- loading-screenshots/admin-student-new-1280-light-loaded.png
- loading-screenshots/admin-student-new-1280-light-skeleton.png
- loading-screenshots/admin-student-new-375-dark-loaded.png
- loading-screenshots/admin-student-new-375-dark-skeleton.png
- loading-screenshots/admin-student-new-375-light-loaded.png
- loading-screenshots/admin-student-new-375-light-skeleton.png
- loading-screenshots/admin-user-details-1280-dark-skeleton.png
- loading-screenshots/admin-user-details-1280-light-skeleton.png
- loading-screenshots/admin-user-details-375-dark-skeleton.png
- loading-screenshots/admin-user-details-375-light-skeleton.png
- loading-screenshots/attendance-records-1280-dark-skeleton.png
- loading-screenshots/attendance-records-1280-light-loaded.png
- loading-screenshots/attendance-records-1280-light-skeleton.png
- loading-screenshots/attendance-records-375-dark-skeleton.png
- loading-screenshots/attendance-records-375-light-skeleton.png
- loading-screenshots/attendance-summary-1280-dark-skeleton.png
- loading-screenshots/attendance-summary-1280-light-skeleton.png
- loading-screenshots/attendance-summary-375-dark-skeleton.png
- loading-screenshots/attendance-summary-375-light-loaded.png
- loading-screenshots/attendance-summary-375-light-skeleton.png
- loading-screenshots/diff/admin-class-details-1280-dark.json
- loading-screenshots/diff/admin-class-details-1280-dark.png
- loading-screenshots/diff/admin-class-details-1280-light.json
- loading-screenshots/diff/admin-class-details-1280-light.png
- loading-screenshots/diff/admin-class-details-375-dark.json
- loading-screenshots/diff/admin-class-details-375-dark.png
- loading-screenshots/diff/admin-class-details-375-light.json
- loading-screenshots/diff/admin-class-details-375-light.png
- loading-screenshots/diff/admin-class-edit-1280-dark.json
- loading-screenshots/diff/admin-class-edit-1280-dark.png
- loading-screenshots/diff/admin-class-edit-1280-light.json
- loading-screenshots/diff/admin-class-edit-1280-light.png
- loading-screenshots/diff/admin-class-edit-375-dark.json
- loading-screenshots/diff/admin-class-edit-375-dark.png
- loading-screenshots/diff/admin-class-edit-375-light.json
- loading-screenshots/diff/admin-class-edit-375-light.png
- loading-screenshots/diff/admin-student-edit-1280-dark.json
- loading-screenshots/diff/admin-student-edit-1280-dark.png
- loading-screenshots/diff/admin-student-edit-1280-light.json
- loading-screenshots/diff/admin-student-edit-1280-light.png
- loading-screenshots/diff/admin-student-edit-375-dark.json
- loading-screenshots/diff/admin-student-edit-375-dark.png
- loading-screenshots/diff/admin-student-edit-375-light.json
- loading-screenshots/diff/admin-student-edit-375-light.png
- loading-screenshots/diff/attendance-record-cells-1280-light.png
- loading-screenshots/diff/attendance-summary-375-light.png
- loading-screenshots/diff/domain-trends-1280-light.png
- loading-screenshots/diff/domain-trends-375-dark.png
- loading-screenshots/diff/holistic-overview-1280-dark.png
- loading-screenshots/diff/holistic-overview-1280-light.png
- loading-screenshots/diff/holistic-overview-375-dark.png
- loading-screenshots/diff/holistic-overview-375-light.png
- loading-screenshots/diff/principal-grade-sheet-1280-dark.png
- loading-screenshots/diff/principal-grade-sheet-1280-light.png
- loading-screenshots/diff/principal-grade-sheet-375-dark.png
- loading-screenshots/diff/principal-grade-sheet-375-light.png
- loading-screenshots/diff/teacher-grades-1280-light.png
- loading-screenshots/diff/teacher-grades-375-light.png
- loading-screenshots/domain-trends-1280-dark-loaded.png
- loading-screenshots/domain-trends-1280-dark-skeleton.png
- loading-screenshots/domain-trends-1280-light-loaded.png
- loading-screenshots/domain-trends-1280-light-skeleton.png
- loading-screenshots/domain-trends-375-dark-loaded.png
- loading-screenshots/domain-trends-375-dark-skeleton.png
- loading-screenshots/domain-trends-375-light-skeleton.png
- loading-screenshots/holistic-overview-1280-dark-loaded.png
- loading-screenshots/holistic-overview-1280-dark-skeleton.png
- loading-screenshots/holistic-overview-1280-light-loaded.png
- loading-screenshots/holistic-overview-1280-light-skeleton.png
- loading-screenshots/holistic-overview-375-dark-loaded.png
- loading-screenshots/holistic-overview-375-dark-skeleton.png
- loading-screenshots/holistic-overview-375-light-loaded.png
- loading-screenshots/holistic-overview-375-light-skeleton.png
- loading-screenshots/holistic-profile-1280-dark-skeleton.png
- loading-screenshots/holistic-profile-1280-light-skeleton.png
- loading-screenshots/holistic-profile-375-dark-skeleton.png
- loading-screenshots/holistic-profile-375-light-skeleton.png
- loading-screenshots/parent-1280-dark-loaded.png
- loading-screenshots/parent-1280-dark-skeleton.png
- loading-screenshots/parent-1280-light-loaded.png
- loading-screenshots/parent-1280-light-skeleton.png
- loading-screenshots/parent-375-dark-loaded.png
- loading-screenshots/parent-375-dark-skeleton.png
- loading-screenshots/parent-375-light-loaded.png
- loading-screenshots/parent-375-light-skeleton.png
- loading-screenshots/parent-calendar-1280-dark-loaded.png
- loading-screenshots/parent-calendar-1280-dark-skeleton.png
- loading-screenshots/parent-calendar-1280-light-loaded.png
- loading-screenshots/parent-calendar-1280-light-skeleton.png
- loading-screenshots/parent-calendar-375-dark-loaded.png
- loading-screenshots/parent-calendar-375-dark-skeleton.png
- loading-screenshots/parent-calendar-375-light-loaded.png
- loading-screenshots/parent-calendar-375-light-skeleton.png
- loading-screenshots/parent-enrolled-children-1280-dark-skeleton.png
- loading-screenshots/parent-enrolled-children-1280-light-skeleton.png
- loading-screenshots/parent-enrolled-children-375-dark-skeleton.png
- loading-screenshots/parent-enrolled-children-375-light-skeleton.png
- loading-screenshots/phases/class-adviser-dark-0.png
- loading-screenshots/phases/class-adviser-dark-25.png
- loading-screenshots/phases/class-adviser-dark-50.png
- loading-screenshots/phases/class-adviser-dark-75.png
- loading-screenshots/phases/class-adviser-light-0.png
- loading-screenshots/phases/class-adviser-light-25.png
- loading-screenshots/phases/class-adviser-light-50.png
- loading-screenshots/phases/class-adviser-light-75.png
- loading-screenshots/phases/domain-trend-line-dark-0.png
- loading-screenshots/phases/domain-trend-line-dark-25.png
- loading-screenshots/phases/domain-trend-line-dark-50.png
- loading-screenshots/phases/domain-trend-line-dark-75.png
- loading-screenshots/phases/domain-trend-line-light-0.png
- loading-screenshots/phases/domain-trend-line-light-25.png
- loading-screenshots/phases/domain-trend-line-light-50.png
- loading-screenshots/phases/domain-trend-line-light-75.png
- loading-screenshots/principal-calendar-1280-dark-loaded.png
- loading-screenshots/principal-calendar-1280-dark-skeleton.png
- loading-screenshots/principal-calendar-1280-light-loaded.png
- loading-screenshots/principal-calendar-1280-light-skeleton.png
- loading-screenshots/principal-calendar-375-dark-loaded.png
- loading-screenshots/principal-calendar-375-dark-skeleton.png
- loading-screenshots/principal-calendar-375-light-loaded.png
- loading-screenshots/principal-calendar-375-light-skeleton.png
- loading-screenshots/principal-grade-sheet-1280-dark-loaded.png
- loading-screenshots/principal-grade-sheet-1280-dark-skeleton.png
- loading-screenshots/principal-grade-sheet-1280-light-loaded.png
- loading-screenshots/principal-grade-sheet-1280-light-skeleton.png
- loading-screenshots/principal-grade-sheet-375-dark-loaded.png
- loading-screenshots/principal-grade-sheet-375-dark-skeleton.png
- loading-screenshots/principal-grade-sheet-375-light-loaded.png
- loading-screenshots/principal-grade-sheet-375-light-skeleton.png
- loading-screenshots/principal-gradebooks-1280-dark-loaded.png
- loading-screenshots/principal-gradebooks-1280-dark-skeleton.png
- loading-screenshots/principal-gradebooks-1280-light-loaded.png
- loading-screenshots/principal-gradebooks-1280-light-skeleton.png
- loading-screenshots/principal-gradebooks-375-dark-loaded.png
- loading-screenshots/principal-gradebooks-375-dark-skeleton.png
- loading-screenshots/principal-gradebooks-375-light-loaded.png
- loading-screenshots/principal-gradebooks-375-light-skeleton.png
- loading-screenshots/principal-holistic-analytics-1280-dark-skeleton.png
- loading-screenshots/principal-holistic-analytics-1280-light-skeleton.png
- loading-screenshots/principal-holistic-analytics-375-dark-skeleton.png
- loading-screenshots/principal-holistic-analytics-375-light-skeleton.png
- loading-screenshots/principal-students-1280-dark-loaded.png
- loading-screenshots/principal-students-1280-dark-skeleton.png
- loading-screenshots/principal-students-1280-light-loaded.png
- loading-screenshots/principal-students-1280-light-skeleton.png
- loading-screenshots/principal-students-375-dark-loaded.png
- loading-screenshots/principal-students-375-dark-skeleton.png
- loading-screenshots/principal-students-375-light-skeleton.png
- loading-screenshots/principal-students-class-1-1280-dark-skeleton.png
- loading-screenshots/principal-students-class-1-1280-light-skeleton.png
- loading-screenshots/principal-students-class-1-375-dark-loaded.png
- loading-screenshots/principal-students-class-1-375-dark-skeleton.png
- loading-screenshots/principal-students-class-1-375-light-skeleton.png
- loading-screenshots/principal-students-grade-1-1280-dark-skeleton.png
- loading-screenshots/principal-students-grade-1-1280-light-skeleton.png
- loading-screenshots/principal-students-grade-1-375-dark-skeleton.png
- loading-screenshots/principal-students-grade-1-375-light-skeleton.png
- loading-screenshots/principal-subject-analytics-1280-dark-skeleton.png
- loading-screenshots/principal-subject-analytics-1280-light-skeleton.png
- loading-screenshots/principal-subject-analytics-375-dark-skeleton.png
- loading-screenshots/principal-subject-analytics-375-light-skeleton.png
- loading-screenshots/principal-teachers-1-1280-dark-skeleton.png
- loading-screenshots/principal-teachers-1-1280-light-loaded.png
- loading-screenshots/principal-teachers-1-1280-light-skeleton.png
- loading-screenshots/principal-teachers-1-375-dark-skeleton.png
- loading-screenshots/principal-teachers-1-375-light-skeleton.png
- loading-screenshots/principal-teachers-1280-dark-loaded.png
- loading-screenshots/principal-teachers-1280-dark-skeleton.png
- loading-screenshots/principal-teachers-1280-light-loaded.png
- loading-screenshots/principal-teachers-1280-light-skeleton.png
- loading-screenshots/principal-teachers-375-dark-skeleton.png
- loading-screenshots/principal-teachers-375-light-skeleton.png
- loading-screenshots/subject-template-1280-dark-skeleton.png
- loading-screenshots/subject-template-1280-light-skeleton.png
- loading-screenshots/subject-template-375-dark-skeleton.png
- loading-screenshots/subject-template-375-light-skeleton.png
- loading-screenshots/teacher-advisory-roster-1280-dark-skeleton.png
- loading-screenshots/teacher-advisory-roster-1280-light-skeleton.png
- loading-screenshots/teacher-advisory-roster-375-dark-loaded.png
- loading-screenshots/teacher-advisory-roster-375-dark-skeleton.png
- loading-screenshots/teacher-advisory-roster-375-light-skeleton.png
- loading-screenshots/teacher-attendance-1280-dark-loaded.png
- loading-screenshots/teacher-attendance-1280-dark-skeleton.png
- loading-screenshots/teacher-attendance-1280-light-loaded.png
- loading-screenshots/teacher-attendance-1280-light-skeleton.png
- loading-screenshots/teacher-attendance-375-dark-loaded.png
- loading-screenshots/teacher-attendance-375-dark-skeleton.png
- loading-screenshots/teacher-attendance-375-light-loaded.png
- loading-screenshots/teacher-attendance-375-light-skeleton.png
- loading-screenshots/teacher-calendar-1280-dark-loaded.png
- loading-screenshots/teacher-calendar-1280-dark-skeleton.png
- loading-screenshots/teacher-calendar-1280-light-loaded.png
- loading-screenshots/teacher-calendar-1280-light-skeleton.png
- loading-screenshots/teacher-calendar-375-dark-loaded.png
- loading-screenshots/teacher-calendar-375-dark-skeleton.png
- loading-screenshots/teacher-calendar-375-light-loaded.png
- loading-screenshots/teacher-calendar-375-light-skeleton.png
- loading-screenshots/teacher-dashboard-1280-dark-loaded.png
- loading-screenshots/teacher-dashboard-1280-dark-skeleton.png
- loading-screenshots/teacher-dashboard-1280-light-loaded.png
- loading-screenshots/teacher-dashboard-1280-light-skeleton.png
- loading-screenshots/teacher-dashboard-375-dark-loaded.png
- loading-screenshots/teacher-dashboard-375-dark-skeleton.png
- loading-screenshots/teacher-dashboard-375-light-loaded.png
- loading-screenshots/teacher-dashboard-375-light-skeleton.png
- loading-screenshots/teacher-grades-1280-dark-skeleton.png
- loading-screenshots/teacher-grades-1280-light-loaded.png
- loading-screenshots/teacher-grades-1280-light-skeleton.png
- loading-screenshots/teacher-grades-375-dark-skeleton.png
- loading-screenshots/teacher-grades-375-light-loaded.png
- loading-screenshots/teacher-grades-375-light-skeleton.png
- loading-screenshots/teacher-grades-Parent-Visibility-1280-dark-skeleton.png
- loading-screenshots/teacher-grades-Parent-Visibility-1280-light-skeleton.png
- loading-screenshots/teacher-grades-Parent-Visibility-375-dark-skeleton.png
- loading-screenshots/teacher-grades-Parent-Visibility-375-light-loaded.png
- loading-screenshots/teacher-grades-Parent-Visibility-375-light-skeleton.png
- loading-screenshots/teacher-grades-Submission-History-1280-dark-skeleton.png
- loading-screenshots/teacher-grades-Submission-History-1280-light-skeleton.png
- loading-screenshots/teacher-grades-Submission-History-375-dark-loaded.png
- loading-screenshots/teacher-grades-Submission-History-375-dark-skeleton.png
- loading-screenshots/teacher-grades-Submission-History-375-light-loaded.png
- loading-screenshots/teacher-grades-Submission-History-375-light-skeleton.png
- loading-screenshots/teacher-student-details-1280-dark-loaded.png
- loading-screenshots/teacher-student-details-1280-dark-skeleton.png
- loading-screenshots/teacher-student-details-1280-light-skeleton.png
- loading-screenshots/teacher-student-details-375-dark-skeleton.png
- loading-screenshots/teacher-student-details-375-light-loaded.png
- loading-screenshots/teacher-student-details-375-light-skeleton.png
- loading-screenshots/teacher-subject-1280-dark-loaded.png
- loading-screenshots/teacher-subject-1280-dark-skeleton.png
- loading-screenshots/teacher-subject-1280-light-loaded.png
- loading-screenshots/teacher-subject-1280-light-skeleton.png
- loading-screenshots/teacher-subject-375-dark-skeleton.png
- loading-screenshots/teacher-subject-375-light-skeleton.png
- loading-screenshots/teacher-subject-class-list-1280-dark-loaded.png
- loading-screenshots/teacher-subject-class-list-1280-dark-skeleton.png
- loading-screenshots/teacher-subject-class-list-1280-light-loaded.png
- loading-screenshots/teacher-subject-class-list-1280-light-skeleton.png
- loading-screenshots/teacher-subject-class-list-375-dark-loaded.png
- loading-screenshots/teacher-subject-class-list-375-dark-skeleton.png
- loading-screenshots/teacher-subject-class-list-375-light-skeleton.png
- loading-screenshots/teacher-subject-holistic-1280-dark-loaded.png
- loading-screenshots/teacher-subject-holistic-1280-dark-skeleton.png
- loading-screenshots/teacher-subject-holistic-1280-light-skeleton.png
- loading-screenshots/teacher-subject-holistic-375-dark-skeleton.png
- loading-screenshots/teacher-subject-holistic-375-light-skeleton.png
- loading-screenshots/teacher-subject-holistic-records-1280-dark-skeleton.png
- loading-screenshots/teacher-subject-holistic-records-1280-light-skeleton.png
- loading-screenshots/teacher-subject-holistic-records-375-dark-skeleton.png
- loading-screenshots/teacher-subject-holistic-records-375-light-loaded.png
- loading-screenshots/teacher-subject-holistic-records-375-light-skeleton.png
- loading-screenshots/teacher-subject-records-1280-dark-skeleton.png
- loading-screenshots/teacher-subject-records-1280-light-skeleton.png
- loading-screenshots/teacher-subject-records-375-dark-skeleton.png
- loading-screenshots/teacher-subject-records-375-light-loaded.png
- loading-screenshots/teacher-subject-records-375-light-skeleton.png
- loading-screenshots/teacher-subjects-375-light-loaded.png
- loading-screenshots/teacher-subjects-375-light-skeleton.png

### backend: C:\Users\Mavys\Downloads\QED_System\thesis_qed

HEAD unchanged: true; staged paths: none; removed paths: 0; protected changes: 0; unchanged entry files: 182.

Files changed/added by this increment (5):

- src/modules/admin/classes-management/classManagement.router.js
- src/modules/admin/section-management/section.router.js
- src/modules/admin/subject-management/subjectGradeTemplate.router.js
- src/modules/admin/subject-management/subjectManagement.router.js
- test/adminManagementAuthorization.test.js
