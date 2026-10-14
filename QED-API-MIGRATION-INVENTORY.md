# Parent role phase 4 — automated checkpoint verified (2026-10-14)

Historical Admin baseline: source 1256/1256, production 685/685, backend 1307/1307. Phase 4 baseline: TypeScript and 51 existing mocked Parent-detail tests passed.

| Actual Parent boundary | Status | Scope |
| --- | --- | --- |
| Dashboard / Enrolled Children / linking | Migrated | Shared list/daily readers; explicit verification/confirmation mutations; successful authoritative invalidation |
| Student profile | Migrated and secured | Linked-child read; Admin-only core profile editing enforced on server |
| Overview / narrative / attendance | Migrated | Year prerequisite; preserved narrative refresh and local month/year selection |
| Academic schedule / missed activities / intervention flags | Migrated | Cancellable reads; no competing service Maps |
| Progress report / visibility / holistic / attendance summary | Migrated | Four independent readers; local term selection and existing transforms preserved |
| Weekly holistic | Migrated | Child/year/term-scoped reader |
| Courseware / Pet quiz | Migrated with side-effect safeguards | Content/state Query reads; explicit generation/submission mutations; no automatic write retries or background generation replay |
| Calendar / Dashboard events | Migrated | Four independent GETs; shared event keys; Parent remains read-only |
| Notifications | Existing implementation reused | Same centralized Query driver, ownership, sockets, 30-second polling, focus and receipts |
| Help / theme / drafts / calculations / PDF export / support choices | Not appropriate | Local/static/imperative behavior retained |
| Authentication / account bootstrap | Auth-owned | Existing architecture retained; not a fabricated Query module |

The query-free Parent facade hands bootstrap timestamps/data to lazy Query readers and retires bootstrap requests. No independent Notification cache exists. Full results and exact file inventory are recorded in QED-PARENT-ROLE-QUERY-VERIFICATION.md. Parent checkpoint passed: source 1,384/1,384; fresh-production 813/813; isolated backend 1,657/1,657. Zero browser retries, failures, skips or flaky outcomes. This current checkpoint supersedes older Parent pending entries retained below as history. STOPPED FOR REVIEW; no release phase or additional migration begun.

# Admin audit update — 2026-10-14

Actual Admin routes and shared consumers are accounted for. Completed remaining eligible server-state boundaries: Students list/CRUD/import and grade/section options; Classes list/CRUD/assignment form options; Subjects catalog/assignments/sections/assessment operations; Academic Year/Terms; Grade Template metadata/upload; Calendar four reads/six writes; background notification list/read receipts; Admin-owned Teacher profile/schedule/advisory rosters. Dashboard and User Management are retained, with only the existing confirmed Teacher-change callback and deferred profile composition connected to the new Admin adapters. Final automated gates passed: source 1,256/1,256, fresh-production 685/685, isolated backend 1,307/1,307. See QED-ADMIN-ROLE-QUERY-VERIFICATION.md for failures investigated, exact scope, preservation and release limitations. Stopped for user review; no Parent migration started.

No live database, production account or credential is used. Shared bootstrap providers retain their Query-free startup contract, then retire their manual readers/cache when the lazy Admin owner activates. Teacher adapters and legacy fallback consumers are retained. Authentication/profile bootstrap and shared account actions remain auth-owned; Help/theme/drafts/calculations and binary downloads are not independent Query resources. Unused settings/schoolYear.service and SubjectsTeachersContext declarations are not fabricated as modules. No Parent migration is included. Historical inventories below are preserved.

# Teacher audit update — 2026-10-13

All currently consumed Teacher page API boundaries are implemented and the automated checkpoint passed (source1,018/1,018; fresh-production559/559; isolated backend1,043/1,043): Dashboard, subjects/rosters, advisory selection, authorized student/profile schedules, attendance, advisory grades/submission/history/visibility, holistic overview/profile/domain trends, subject detail/records/weights/topics, weekly holistic, read-only Calendar and notifications. QED-TEACHER-QUERY-VERIFICATION.md is the current evidence record. Browser APIs are mocked; real-backend/MySQL acceptance is unverified. Authentication/bootstrap/profile editing remain shared authority; local drafts/calculations/exports are not migrated. No Parent or additional Admin module is included. Historical inventory rows below reflect their original audit date, not current Teacher completion status. Stopped for review.

# Principal audit update — 2026-10-12

Actual PrincipalRoutes and shared consumers inspected. All existing Principal
page readers were already migrated except shared Calendar. Principal Calendar
now owns four GET Query keys and six non-retried mutations through a lazy adapter.
Principal notifications use a lazy Query driver for the existing list/poll/focus/
socket and mark-read operations; other roles retain legacy behavior. The shared
transports accept optional signals/401 callbacks without changing existing calls.

Account profile is read only by AuthProvider; ProfileMenu derives auth state.
Help is static; there is no extra Principal student-profile or report route.
Unused Admin Students/Teachers/Classes provider wrappers were removed from the
Principal section, not migrated or changed for other accounts. Their shared
StudentDetail consumer is not reachable from PrincipalRoutes.

Current verification is recorded in QED-PRINCIPAL-COMPLETION-VERIFICATION.md.
Final checkpoint 2026-10-13: source 705/705, fresh-production 340/340 and isolated
backend 517/517. Applicable Principal readers/writers are complete; auth-owned
bootstrap/profile/session operations retain their existing shared authority.
Directory cached-403 projection and global notification-facade lifecycle were
hardened without changing prior query policies or other roles' readers.
Browser APIs are mocked; real-backend release acceptance is still outstanding.
No claim of full-system completion: Teacher, remaining Admin, Parent and their
shared services remain at the historical inventory status below.

---

# QED API migration inventory — 2026-10-11

Updated User Management checkpoint, 2026-10-12: the existing Admin user-list GET
feeds a lazy session-scoped Query; details/conflict are derived, not separate
requests. POST addUser, PUT editUser/:id and PATCH deleteUser/:id now invalidate
the list plus affected Dashboard users/audit only on success. The eager provider
retains its Query-free bootstrap until a timestamp-preserving ownership handoff.
The unused getUserById transport remains unchanged. No backend or other account
was migrated. See QED-ADMIN-USERS-QUERY-VERIFICATION.md. Earlier snapshots follow.

Updated checkpoint, 2026-10-12: ONLY the four Admin Dashboard GET consumers are
migrated. Their directly owned transports now feed useAdminDashboardQueries;
the older Calendar stop below describes the original inventory snapshot. Existing
Admin providers/writers and all other account classifications remain unchanged.
See QED-ADMIN-DASHBOARD-QUERY-MIGRATION-VERIFICATION.md for coverage and risks.

Static inventory of every frontend file containing a direct `fetch()` call and every `*.service.ts` module, including transport wrappers and pure service helpers. This is not an endpoint security audit or a claim of runtime test coverage. Direct consumers below are resolved TypeScript imports; route lazy-loading and transitive consumers also matter. No credentials or environment-file contents were read for this catalog.

The current account/module classification and priorities are in TANSTACK-QUERY-MIGRATION-ROADMAP.md. Migration stopped at the material Calendar authorization checkpoint documented in QED-SYSTEM-WIDE-QUERY-VERIFICATION.md. No application code was migrated in this increment.

Coverage: 518 TS/TSX files scanned; 51 direct-fetch files; 55 transport/service files catalogued.

| Transport/service file | Direct fetch sites | Migration classification | Direct consumers |
| --- | ---: | --- | --- |
| `src/features/auth/services/authentication.service.ts` | 9 | Not appropriate for cached queries: bootstrap/session transitions; writes may later use guarded mutations | `src/features/auth/context/authContext.tsx`<br>`src/features/auth/LoginPanel.loading-view.tsx`<br>`src/features/profiles/admin/pages/usermanagement/UserFormPage.loading-view.tsx`<br>`src/shared/components/manage_password/ForceChangePasswordModal.tsx`<br>`src/shared/components/manage_password/ForgotPasswordModal.tsx`<br>`src/shared/components/manage_password/OtpVerificationModal.tsx`<br>`src/shared/components/manage_password/ResetPasswordModal.tsx`<br>`src/shared/profile/components/ProfileMenu.tsx` |
| `src/features/profiles/admin/pages/classes/services/classes.service.ts` | 9 | Not migrated | `src/features/profiles/admin/pages/classes/ClassFormPage.loading-view.tsx`<br>`src/features/profiles/admin/pages/classes/context/ClassesContext.tsx`<br>`src/features/profiles/admin/pages/subjects/context/gradeLevelsContext.tsx` |
| `src/features/profiles/admin/pages/dashboard/services/auditLogs.service.ts` | 1 | Migrated, Dashboard reader only | `src/features/profiles/admin/pages/dashboard/hooks/useAdminDashboardQueries.ts` |
| `src/features/profiles/admin/pages/dashboard/services/loginFrequency.service.ts` | 1 | Migrated, Dashboard reader only | `src/features/profiles/admin/pages/dashboard/hooks/useAdminDashboardQueries.ts` |
| `src/features/profiles/admin/pages/dashboard/services/totalCounts.service.ts` | 2 | Migrated, Dashboard readers only; legacy combined wrapper retained | `src/features/profiles/admin/pages/dashboard/hooks/useAdminDashboardQueries.ts` |
| `src/features/profiles/admin/pages/settings/services/schoolYear.service.ts` | 1 | Not migrated | No direct static import found; inspect exports/lazy references |
| `src/features/profiles/admin/pages/studentrecords/services/grade-section.service.ts` | 2 | Not migrated | `src/features/profiles/admin/pages/studentrecords/components/StudentImportExportToolbar.tsx`<br>`src/features/profiles/admin/pages/studentrecords/StudentFormPage.loading-view.tsx` |
| `src/features/profiles/admin/pages/studentrecords/services/student-record.service.ts` | 4 | Not migrated | `src/features/profiles/admin/pages/studentrecords/components/StudentImportExportToolbar.tsx`<br>`src/features/profiles/admin/pages/studentrecords/context/StudentsContext.tsx`<br>`src/features/profiles/admin/pages/studentrecords/StudentFormPage.loading-view.tsx` |
| `src/features/profiles/admin/pages/subjects/services/academicyear.service.ts` | 5 | Not migrated | `src/features/profiles/admin/pages/subjects/AcademicYearPage.loading-view.tsx`<br>`src/features/profiles/admin/pages/subjects/AddSubjectPage.loading-view.tsx`<br>`src/features/profiles/admin/pages/subjects/components/EditSubjectModal.tsx`<br>`src/features/profiles/admin/pages/subjects/components/EditTermDatesModal.tsx`<br>`src/features/profiles/principal/pages/dashboard/services/principalDashboard.service.ts`<br>`src/features/profiles/principal/pages/teachers/services/teachers.service.ts` |
| `src/features/profiles/admin/pages/subjects/services/gradeTemplateParser.service.ts` | 0 | Not appropriate for direct Query replacement: calculation/parser or cache helper; inspect owning reader | `src/features/profiles/admin/pages/subjects/AddSubjectPage.loading-view.tsx`<br>`src/features/profiles/admin/pages/subjects/components/EditSubjectModal.tsx`<br>`src/features/profiles/admin/pages/subjects/components/SubjectGradeTemplateSection.tsx` |
| `src/features/profiles/admin/pages/subjects/services/section.service.ts` | 5 | Not migrated | `src/features/profiles/admin/pages/subjects/context/SectionsContext.tsx` |
| `src/features/profiles/admin/pages/subjects/services/subject.service.ts` | 10 | Not migrated | `src/features/profiles/admin/pages/subjects/AddSubjectPage.loading-view.tsx`<br>`src/features/profiles/admin/pages/subjects/context/SubjectsCatalogContext.tsx`<br>`src/features/profiles/admin/pages/subjects/context/SubjectSectionsContext.tsx`<br>`src/features/profiles/admin/pages/subjects/ManageSubjectsPage.loading-view.tsx` |
| `src/features/profiles/admin/pages/subjects/services/subjectGradeTemplate.service.ts` | 2 | Not migrated | `src/features/profiles/admin/pages/subjects/AddSubjectPage.loading-view.tsx`<br>`src/features/profiles/admin/pages/subjects/AdminSubjectDetailPage.loading-view.tsx`<br>`src/features/profiles/admin/pages/subjects/components/EditSubjectModal.tsx`<br>`src/features/profiles/admin/pages/subjects/components/SubjectGradeTemplateSection.tsx` |
| `src/features/profiles/admin/pages/subjects/services/teacher.service.ts` | 1 | Not migrated | `src/features/profiles/admin/pages/classes/context/TeachersContext.tsx`<br>`src/features/profiles/admin/pages/subjects/context/TeachersContext.tsx` |
| `src/features/profiles/admin/pages/usermanagement/services/user-record.service.ts` | 5 | Partially migrated: actual list reader + create/update/delete mutations verified; unused getUserById retained | `src/features/profiles/admin/pages/usermanagement/context/UsersContext.tsx` (Query-free bootstrap handoff)<br>`src/features/profiles/admin/pages/usermanagement/hooks/useAdminUsersQueries.ts` (lazy owner) |
| `src/features/profiles/admin/pages/usermanagement/UserFormPage.loading-view.tsx` | 1 | Not migrated | `src/features/profiles/admin/pages/usermanagement/UserFormPage.tsx`<br>`src/routes/roles/AdminViews.tsx` |
| `src/features/profiles/parent/pages/dashboard/services/dashboard.service.ts` | 2 | Not migrated | `src/features/profiles/parent/hooks/useUserProfile.ts`<br>`src/features/profiles/parent/pages/dashboard/context/ParentDashboardContext.tsx` |
| `src/features/profiles/parent/pages/EnrollledStudent/services/enrolledStudent.service.ts` | 3 | Not migrated | `src/features/profiles/parent/pages/dashboard/context/ParentDashboardContext.tsx` |
| `src/features/profiles/parent/pages/Student/Academic/service/classSchedule.service.ts` | 1 | Not migrated | `src/features/profiles/parent/pages/Student/Academic/context/classSchedule.context.tsx` |
| `src/features/profiles/parent/pages/Student/Academic/service/courseware.service.ts` | 1 | Not migrated | `src/features/profiles/parent/pages/Student/Academic/CoursewareView.loading-view.tsx` |
| `src/features/profiles/parent/pages/Student/Academic/service/intervention.service.ts` | 1 | Not migrated | `src/features/profiles/parent/pages/Student/Academic/components/InterventionSupport.tsx` |
| `src/features/profiles/parent/pages/Student/Academic/service/missedActivities.service.ts` | 1 | Not migrated | `src/features/profiles/parent/pages/Student/Academic/context/missedActivities.context.tsx` |
| `src/features/profiles/parent/pages/Student/Academic/service/petQuiz.service.ts` | 7 | Not migrated | `src/features/profiles/parent/pages/Student/Academic/components/EDJourneyIntro.tsx`<br>`src/features/profiles/parent/pages/Student/Academic/components/LevelSelect.tsx`<br>`src/features/profiles/parent/pages/Student/Academic/components/QuizModals.tsx`<br>`src/features/profiles/parent/pages/Student/Academic/components/QuizRound.tsx`<br>`src/features/profiles/parent/pages/Student/Academic/components/QuizShared.tsx`<br>`src/features/profiles/parent/pages/Student/Academic/components/RoundResult.tsx`<br>`src/features/profiles/parent/pages/Student/Academic/PetQuizPage.loading-view.tsx` |
| `src/features/profiles/parent/pages/Student/Holistic/service/weeklyHolistic.service.ts` | 1 | Not migrated | `src/features/profiles/parent/pages/Student/Holistic/HoisticWeeklyReportTab.tsx` |
| `src/features/profiles/parent/pages/Student/Overview/service/attendance.service.ts` | 1 | Not migrated | `src/features/profiles/parent/pages/Student/Overview/context/AttendanceOverviewContext.tsx` |
| `src/features/profiles/parent/pages/Student/Overview/service/holisticTermPerformance.service.ts` | 1 | Not migrated | `src/features/profiles/parent/pages/Student/Overview/context/HolisticAverageContext.tsx` |
| `src/features/profiles/parent/pages/Student/Overview/service/schoolYear.service.ts` | 1 | Not migrated | `src/features/profiles/parent/pages/Student/Overview/context/AttendanceOverviewContext.tsx`<br>`src/features/profiles/parent/pages/Student/Overview/context/SchoolYearContext.tsx` |
| `src/features/profiles/parent/pages/Student/Overview/service/studentTermPerformance.service.ts` | 1 | Not migrated | `src/features/profiles/parent/pages/Student/Overview/context/PerformanceAnalyticsContext.tsx` |
| `src/features/profiles/parent/pages/Student/ProgressReport/service/AttendanceSummary.service.ts` | 2 | Not migrated | `src/features/profiles/parent/pages/Student/ProgressReport/context/ProgressReportContext.tsx`<br>`src/features/profiles/parent/pages/Student/ProgressReport/utils/transformAttendance.ts` |
| `src/features/profiles/parent/pages/Student/ProgressReport/service/GradeVisibility.service.ts` | 1 | Not migrated | `src/features/profiles/parent/pages/Student/ProgressReport/context/ProgressReportContext.tsx` |
| `src/features/profiles/parent/pages/Student/ProgressReport/service/HolisticPerformance.service.ts` | 1 | Not migrated | `src/features/profiles/parent/pages/Student/ProgressReport/context/ProgressReportContext.tsx`<br>`src/features/profiles/parent/pages/Student/ProgressReport/utils/TransformHolisticPerformance.ts` |
| `src/features/profiles/parent/pages/Student/ProgressReport/service/TermPerformance.service.ts` | 1 | Not migrated | `src/features/profiles/parent/pages/Student/ProgressReport/context/ProgressReportContext.tsx` |
| `src/features/profiles/parent/pages/Student/StudentProfile/service/StudentProfile.service.ts` | 2 | Not migrated | `src/features/profiles/parent/pages/Student/StudentProfile/context/StudentProfileContext.tsx` |
| `src/features/profiles/principal/pages/dashboard/services/principalDashboard.service.ts` | 1 | Migrated and verified (prior checkpoints) | `src/features/profiles/principal/pages/dashboard/hooks/usePrincipalDashboardData.ts` |
| `src/features/profiles/principal/pages/gradebooks/services/gradebooks.service.ts` | 3 | Migrated and verified (prior checkpoints) | `src/features/profiles/principal/pages/gradebooks/hooks/usePrincipalGradebooks.ts`<br>`src/features/profiles/principal/pages/gradebooks/hooks/usePrincipalGradeSheet.ts` |
| `src/features/profiles/principal/pages/reports/services/reports.service.ts` | 1 | Migrated and verified (prior checkpoints) | `src/features/profiles/principal/pages/reports/hooks/useAnalyticsReads.ts`<br>`src/features/profiles/principal/pages/reports/hooks/useHolisticAnalytics.ts`<br>`src/features/profiles/principal/pages/reports/hooks/useSubjectAnalytics.ts` |
| `src/features/profiles/principal/pages/students/services/students.service.ts` | 5 | Migrated and verified (prior checkpoints) | `src/features/profiles/principal/pages/gradebooks/hooks/usePrincipalGradebooks.ts`<br>`src/features/profiles/principal/pages/gradebooks/hooks/usePrincipalGradeSheet.ts`<br>`src/features/profiles/principal/pages/gradebooks/services/gradebooks.service.ts`<br>`src/features/profiles/principal/pages/reports/hooks/useAnalyticsReads.ts`<br>`src/features/profiles/principal/pages/students/hooks/useClassList.ts`<br>`src/features/profiles/principal/pages/students/hooks/usePrincipalStudentsOverview.ts`<br>`src/features/profiles/principal/pages/teachers/hooks/usePrincipalTeacherProfile.ts`<br>`src/features/profiles/principal/pages/teachers/TeacherSchedulePage.loading-view.tsx` |
| `src/features/profiles/principal/pages/teachers/services/principalTeacherProfile.service.ts` | 1 | Migrated and verified (prior checkpoints) | `src/features/profiles/principal/pages/teachers/hooks/usePrincipalTeacherProfile.ts` |
| `src/features/profiles/principal/pages/teachers/services/teachers.service.ts` | 3 | Partially migrated: Principal directory; Admin profile/schedule legacy cache retained | `src/features/profiles/principal/pages/teachers/hooks/useTeacherSchedule.ts`<br>`src/features/profiles/principal/pages/teachers/hooks/useTeachersDirectory.ts` |
| `src/features/profiles/teacher/pages/attendance/services/attendance.service.ts` | 1 | Not migrated | `src/features/profiles/teacher/pages/attendance/AttendanceCalendarSection.tsx`<br>`src/features/profiles/teacher/pages/attendance/AttendanceMonthSummarySection.tsx`<br>`src/features/profiles/teacher/pages/attendance/components/AdvisorySectionTabs.tsx`<br>`src/features/profiles/teacher/pages/attendance/services/useSelectedAdvisorySection.service.ts`<br>`src/features/profiles/teacher/pages/attendance/TeacherAttendancePage.loading-view.tsx` |
| `src/features/profiles/teacher/pages/attendance/services/useSelectedAdvisorySection.service.ts` | 0 | Not migrated | `src/features/profiles/teacher/pages/attendance/TeacherAttendancePage.loading-view.tsx`<br>`src/features/profiles/teacher/pages/attendance/TeacherAttendanceRecordsPage.loading-view.tsx`<br>`src/features/profiles/teacher/pages/holistic/HolisticDomainTrendsPage.loading-view.tsx`<br>`src/features/profiles/teacher/pages/holistic/HolisticOverviewPage.loading-view.tsx`<br>`src/features/profiles/teacher/pages/roster/AdvisoryRosterPage.loading-view.tsx` |
| `src/features/profiles/teacher/pages/dashboard/services/dashboard.service.ts` | 6 | Not migrated | `src/features/profiles/teacher/pages/dashboard/components/timetable.ts`<br>`src/features/profiles/teacher/pages/dashboard/components/TodayAgenda.tsx`<br>`src/features/profiles/teacher/pages/dashboard/components/WeeklySchedule.tsx`<br>`src/features/profiles/teacher/pages/dashboard/TeacherDashboardHome.loading-view.tsx` |
| `src/features/profiles/teacher/pages/grades/services/gradePage.service.ts` | 1 | Not migrated | `src/features/profiles/teacher/pages/grades/GradePage.loading-view.tsx`<br>`src/features/profiles/teacher/pages/grades/ParentVisibilitySection.tsx` |
| `src/features/profiles/teacher/pages/holistic/services/advisoryholisticdevelopment.service.ts` | 0 | Not migrated | No direct static import found; inspect exports/lazy references |
| `src/features/profiles/teacher/pages/holistic/services/holistic.service.ts` | 2 | Not migrated | `src/features/profiles/teacher/pages/holistic/HolisticDomainTrendsPage.loading-view.tsx`<br>`src/features/profiles/teacher/pages/holistic/HolisticOverviewPage.loading-view.tsx`<br>`src/features/profiles/teacher/pages/holistic/services/advisoryholisticdevelopment.service.ts`<br>`src/features/profiles/teacher/pages/holistic/StudentHolisticProfilePage.loading-view.tsx`<br>`src/features/profiles/teacher/pages/subjects/detail/HolisticRecordsPage.tsx` |
| `src/features/profiles/teacher/pages/holistic/services/holisticTrends.service.ts` | 1 | Not migrated | `src/features/profiles/teacher/pages/holistic/HolisticDomainTrendsPage.loading-view.tsx`<br>`src/features/profiles/teacher/pages/holistic/services/advisoryholisticdevelopment.service.ts` |
| `src/features/profiles/teacher/pages/roster/services/advisory.service.ts` | 1 | Not migrated | No direct static import found; inspect exports/lazy references |
| `src/features/profiles/teacher/pages/subjects/services/subjectClassList.service.ts` | 1 | Not migrated | `src/features/profiles/teacher/pages/subjects/SubjectClassListPage.loading-view.tsx` |
| `src/features/profiles/teacher/pages/subjects/services/subjectDetailCache.service.ts` | 0 | Not migrated | `src/features/profiles/teacher/pages/subjects/detail/SubjectDetailPage.loading-view.tsx` |
| `src/features/profiles/teacher/pages/subjects/services/subjectGradeTemplate.service.ts` | 3 | Not migrated | `src/features/profiles/teacher/pages/subjects/detail/AssessmentRecordsPage.tsx`<br>`src/features/profiles/teacher/pages/subjects/detail/SubjectDetailPage.loading-view.tsx`<br>`src/features/profiles/teacher/pages/subjects/detail/SubjectRecordsPage.loading-view.tsx` |
| `src/features/profiles/teacher/pages/subjects/services/subjectGrading.service.ts` | 1 | Not migrated | `src/features/profiles/teacher/pages/grades/GradePage.loading-view.tsx`<br>`src/features/profiles/teacher/pages/subjects/detail/AssessmentRecordsPage.tsx`<br>`src/features/profiles/teacher/pages/subjects/detail/components/AddItemModal.tsx`<br>`src/features/profiles/teacher/pages/subjects/detail/components/TopicManagerModal.tsx`<br>`src/features/profiles/teacher/pages/subjects/detail/SubjectDetailPage.loading-view.tsx`<br>`src/features/profiles/teacher/pages/subjects/detail/SubjectRecordsPage.loading-view.tsx` |
| `src/features/profiles/teacher/pages/subjects/services/subjects.service.ts` | 1 | Not migrated | `src/features/profiles/teacher/pages/subjects/SubjectPage.loading-view.tsx` |
| `src/shared/calendar/services/calendar.service.ts` | 10 | Not migrated; authorization checkpoint blocks read/write increment | `src/features/profiles/parent/pages/dashboard/components/EventsCard.tsx`<br>`src/shared/calendar/CalendarPage.loading-view.tsx`<br>`src/shared/calendar/CalendarPageView.loading-view.tsx` |
| `src/shared/notification/Notification.service.ts` | 1 | Not migrated | `src/shared/notification/NotificationBell.tsx`<br>`src/shared/notification/NotificationContext.tsx` |
| `src/shared/profile/service/profile.service.ts` | 1 | Not migrated | `src/features/auth/context/authContext.tsx` |

## Phase 2 implementation checkpoint — blocked shared student authorization boundary

Completed Teacher-owned Query boundaries: Dashboard (five independent GETs), My Subjects, subject class roster, read-only Calendar snapshot (four GETs), and Notifications (GET plus confirmed mark/read-all mutations). These are implemented and module-tested; Teacher role completion is NOT claimed. The remaining advisory, attendance, assessment, grades/submission/visibility, holistic, topic/intervention and shared student-profile boundaries remain on their existing implementations.

Shared authorization blocker reproduced with actual local Express/JWT/student controllers and a synthetic database double: all four roles received200 from allStudents, viewStudent/:id and allGrade; Teacher and Parent also executed the soft-delete UPDATE successfully. No live DB or real records were accessed. Router has verifyToken without role guards; controllers do not enforce student ownership. TeacherSection currently relies on Admin Students/Classes/Teachers providers, including the school-wide student list. A narrow page migration cannot safely establish the missing cross-role policy. Asked user to confirm write policy and Teacher/Parent read ownership before changing this boundary. Existing vulnerable routes are unchanged; production readiness is blocked.

Calendar/academic management/notification security corrections and all prior migrations are preserved. The six academic management routes now enforce the explicitly approved Admin-only policy;112 focused and629 complete isolated backend tests pass. Pending shared student policy is separate from that completed correction.

## Teacher role current inventory (2026-10-13; supersedes earlier blocked entry)

The student authorization policy was approved, implemented and verified; that question is resolved. All currently consumed Teacher page API boundaries are implemented with Query readers/mutations: Dashboard, subjects/rosters, advisory selection, core student reader, profile schedule metadata, attendance daily/history, advisory gradebook/submission/history/visibility, holistic overview/profile/domain trends, subject detail/assessment records/grading rules/topics, weekly holistic, Calendar reads, and notifications. Final automated gates passed: source1,018/1,018, fresh-production559/559, isolated backend1,043/1,043. See QED-TEACHER-QUERY-VERIFICATION.md for real-backend limitations and preservation evidence. Stopped for review.

Global authentication/profile/bootstrap services remain authoritative and outside this role increment. UI state, calculations, drafts and file-download/export actions are not Query server state. Unused Teacher service declarations (teacherAdvisory/roster, advisory holistic aggregation, unused subject submission-status reader, unused active-template-safe reader) and backend-only mastery/intervention features are not fabricated or reported migrated. Admin classes/teachers/student provider defaults remain their original implementation; only Teacher adapters provide Query snapshots. Parent modules are not migrated.

The Teacher schedule adapters call the existing class/staff metadata GET contracts only for a currently authorized student's profile, retaining only that class's schedule and referenced teachers in Query/context state. Core student ownership is enforced on the backend, not by these frontend projections. No class/staff write authorization policy or endpoint contract was changed in this increment.
