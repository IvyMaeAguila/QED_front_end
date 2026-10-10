import { HolisticOverviewPageComposition } from "../../features/profiles/teacher/pages/holistic/HolisticOverviewPage.loading-view";
import { TeacherAttendanceRecordsPageComposition } from "../../features/profiles/teacher/pages/attendance/TeacherAttendanceRecordsPage.loading-view";
import { HolisticDomainTrendsPageComposition } from "../../features/profiles/teacher/pages/holistic/HolisticDomainTrendsPage.loading-view";
import { PrincipalGradeSheetPageComposition } from "../../features/profiles/principal/pages/gradebooks/PrincipalGradeSheetPage.loading-view";
import { ClassFormPageComposition } from "../../features/profiles/admin/pages/classes/ClassFormPage.loading-view";
import { AddSubjectPageComposition } from "../../features/profiles/admin/pages/subjects/AddSubjectPage.loading-view";
import { StudentFormPageComposition } from "../../features/profiles/admin/pages/studentrecords/StudentFormPage.loading-view";
import { UserFormPageComposition } from "../../features/profiles/admin/pages/usermanagement/UserFormPage.loading-view";
import { SubjectDetailPageComposition } from "../../features/profiles/teacher/pages/subjects/detail/SubjectDetailPage.loading-view";
import { AnalyticsPageComposition } from "../../features/profiles/principal/pages/reports/AnalyticsPage.loading-view";
import { StudentDetailPageComposition } from "../components/StudentDetailPage.loading-view";
import { UserViewPageComposition } from "../../features/profiles/admin/pages/usermanagement/UserViewPage.loading-view";
import { ClassViewPageComposition } from "../../features/profiles/admin/pages/classes/ClassViewPage.loading-view";
import { AdminSubjectDetailPageComposition } from "../../features/profiles/admin/pages/subjects/AdminSubjectDetailPage.loading-view";
import { TopicSupportChoiceComposition } from "../../features/profiles/parent/pages/Student/Academic/TopicSupportChoice.loading-view";
import { CoursewareViewComposition } from "../../features/profiles/parent/pages/Student/Academic/CoursewareView.loading-view";
import { TeacherAttendancePageComposition } from "../../features/profiles/teacher/pages/attendance/TeacherAttendancePage.loading-view";
import { PrincipalGradebooksPageComposition } from "../../features/profiles/principal/pages/gradebooks/PrincipalGradebooksPage.loading-view";
import { AdvisoryRosterPageComposition } from "../../features/profiles/teacher/pages/roster/AdvisoryRosterPage.loading-view";
import { SubjectClassListPageComposition } from "../../features/profiles/teacher/pages/subjects/SubjectClassListPage.loading-view";
import { LandingPageComposition } from "../../features/Landing/LandingPage.loading-view";
import { LoginPanelComposition } from "../../features/auth/LoginPanel.loading-view";
import { HelpSupportPageComposition } from "../../features/profiles/admin/pages/help/HelpSupportPage.loading-view";
import { ParentDashboardHomeComposition } from "../../features/profiles/parent/pages/dashboard/ParentDashboardHome.loading-view";
import { PrincipalStudentsPageComposition } from "../../features/profiles/principal/pages/students/PrincipalStudentsPage.loading-view";
import { CalendarPageComposition } from "../calendar/CalendarPage.loading-view";
import { CalendarPageViewComposition } from "../calendar/CalendarPageView.loading-view";
import { TeacherSchedulePageComposition } from "../../features/profiles/principal/pages/teachers/TeacherSchedulePage.loading-view";
import { AcademicYearPageComposition } from "../../features/profiles/admin/pages/subjects/AcademicYearPage.loading-view";
import { ManageSubjectsPageComposition } from "../../features/profiles/admin/pages/subjects/ManageSubjectsPage.loading-view";
import { StudentRecordsPageComposition } from "../../features/profiles/admin/pages/studentrecords/StudentRecordsPage.loading-view";
import { PrincipalTeachersPageComposition } from "../../features/profiles/principal/pages/teachers/PrincipalTeachersPage.loading-view";
import { EnrolledChildrenPageComposition } from "../../features/profiles/parent/pages/EnrollledStudent/EnrolledChildrenPage.loading-view";
import { AdminDashboardHomeComposition } from "../../features/profiles/admin/pages/dashboard/AdminDashboardHome.loading-view";
import { ClassesPageComposition } from "../../features/profiles/admin/pages/classes/ClassPage.loading-view";
import { UserManagementPageComposition } from "../../features/profiles/admin/pages/usermanagement/UserManagementPage.loading-view";
import { SubjectsPageComposition } from "../../features/profiles/teacher/pages/subjects/SubjectPage.loading-view";
import { TeacherDashboardHomeComposition } from "../../features/profiles/teacher/pages/dashboard/TeacherDashboardHome.loading-view";
import { StudentHolisticProfilePageComposition } from "../../features/profiles/teacher/pages/holistic/StudentHolisticProfilePage.loading-view";
import { PrincipalDashboardHomeComposition } from "../../features/profiles/principal/pages/dashboard/PrincipalDashboardHome.loading-view";
import { GradesPageComposition } from "../../features/profiles/teacher/pages/grades/GradePage.loading-view";
import { ClassListPageComposition } from "../../features/profiles/principal/pages/students/ClassListPage.loading-view";
import { HolisticPerformanceAnalyticsPageComposition } from "../../features/profiles/principal/pages/reports/HolisticPerformanceAnalyticsPage.loading-view";
import { SubjectRecordsPageComposition } from "../../features/profiles/teacher/pages/subjects/detail/SubjectRecordsPage.loading-view";
import { ChildDetailPageComposition } from "../../features/profiles/parent/pages/Student/ChildDetailPage.loading-view";
import { PetQuizPageComposition } from "../../features/profiles/parent/pages/Student/Academic/PetQuizPage.loading-view";

/** Eager shared layouts; fetch effects stay in the lazy route modules. */
export const routeViews = {
  HolisticOverviewPageComposition,
  TeacherAttendanceRecordsPageComposition,
  HolisticDomainTrendsPageComposition,
  PrincipalGradeSheetPageComposition,
  ClassFormPageComposition,
  AddSubjectPageComposition,
  StudentFormPageComposition,
  UserFormPageComposition,
  SubjectDetailPageComposition,
  AnalyticsPageComposition,
  StudentDetailPageComposition,
  UserViewPageComposition,
  ClassViewPageComposition,
  AdminSubjectDetailPageComposition,
  TopicSupportChoiceComposition,
  CoursewareViewComposition,
  TeacherAttendancePageComposition,
  PrincipalGradebooksPageComposition,
  AdvisoryRosterPageComposition,
  SubjectClassListPageComposition,
  LandingPageComposition,
  LoginPanelComposition,
  HelpSupportPageComposition,
  ParentDashboardHomeComposition,
  PrincipalStudentsPageComposition,
  CalendarPageComposition,
  CalendarPageViewComposition,
  TeacherSchedulePageComposition,
  AcademicYearPageComposition,
  ManageSubjectsPageComposition,
  StudentRecordsPageComposition,
  PrincipalTeachersPageComposition,
  EnrolledChildrenPageComposition,
  AdminDashboardHomeComposition,
  ClassesPageComposition,
  UserManagementPageComposition,
  SubjectsPageComposition,
  TeacherDashboardHomeComposition,
  StudentHolisticProfilePageComposition,
  PrincipalDashboardHomeComposition,
  GradesPageComposition,
  ClassListPageComposition,
  HolisticPerformanceAnalyticsPageComposition,
  SubjectRecordsPageComposition,
  ChildDetailPageComposition,
  PetQuizPageComposition,
};
