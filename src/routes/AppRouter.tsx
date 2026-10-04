import { lazy, Suspense } from "react";
import {
  Navigate,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useAuth } from "../features/auth/context/authContext";

import { AdminLayout } from "../features/profiles/admin/pages/AdminLayout";

import { StudentsProvider } from "../features/profiles/admin/pages/studentrecords/context/StudentsContext";

import { UsersProvider } from "../features/profiles/admin/pages/usermanagement/context/UsersContext";

import { TeachersProvider } from "../features/profiles/admin/pages/classes/context/TeachersContext";
import { ClassesProvider } from "../features/profiles/admin/pages/classes/context/ClassesContext";
import { SettingsProvider } from "../features/profiles/admin/pages/settings/context/SettingsContext";

import { TeacherSection } from "./TeacherSection";

import { ParentSection } from "./ParentSection";

import { PrincipalSection } from "./PrincipalSection";

import { ForceChangePasswordGate } from "../shared/components/manage_password/ForceChangePasswordGate";

import { QedSplash, QedLoader } from "../shared/components/QedLoader";

function DebugRoute() {
  const location = useLocation();
  console.log("Current path being matched:", location.pathname);
  return null;
}

const AdminDashboardHome = lazy(() => import("../features/profiles/admin/pages/dashboard/AdminDashboardHome").then((module) => ({ default: module.AdminDashboardHome })));
const StudentRecordsPage = lazy(() => import("../features/profiles/admin/pages/studentrecords/StudentRecordsPage").then((module) => ({ default: module.StudentRecordsPage })));
const StudentFormPage = lazy(() => import("../features/profiles/admin/pages/studentrecords/StudentFormPage").then((module) => ({ default: module.StudentFormPage })));
const UserManagementPage = lazy(() => import("../features/profiles/admin/pages/usermanagement/UserManagementPage").then((module) => ({ default: module.UserManagementPage })));
const UserFormPage = lazy(() => import("../features/profiles/admin/pages/usermanagement/UserFormPage").then((module) => ({ default: module.UserFormPage })));
const UserViewPage = lazy(() => import("../features/profiles/admin/pages/usermanagement/UserViewPage").then((module) => ({ default: module.UserViewPage })));
const ClassesPage = lazy(() => import("../features/profiles/admin/pages/classes/ClassPage").then((module) => ({ default: module.ClassesPage })));
const ClassFormPage = lazy(() => import("../features/profiles/admin/pages/classes/ClassFormPage").then((module) => ({ default: module.ClassFormPage })));
const ClassViewPage = lazy(() => import("../features/profiles/admin/pages/classes/ClassViewPage").then((module) => ({ default: module.ClassViewPage })));
const LandingPage = lazy(() => import("../features/Landing/LandingPage"));
const LoginPanel = lazy(() => import("../features/auth/LoginPanel").then((module) => ({ default: module.LoginPanel })));
const StudentDetailPage = lazy(() => import("../shared/components/StudentDetailPage").then((module) => ({ default: module.StudentDetailPage })));
const ManageSubjectsPage = lazy(() => import("../features/profiles/admin/pages/subjects/ManageSubjectsPage").then((module) => ({ default: module.ManageSubjectsPage })));
const CalendarPage = lazy(() => import("../shared/calendar/CalendarPage").then((module) => ({ default: module.CalendarPage })));
const HelpSupportPage = lazy(() => import("../features/profiles/admin/pages/help/HelpSupportPage").then((module) => ({ default: module.HelpSupportPage })));
const TeacherDashboardHome = lazy(() => import("../features/profiles/teacher/pages/dashboard/TeacherDashboardHome").then((module) => ({ default: module.TeacherDashboardHome })));
const AdvisoryRosterPage = lazy(() => import("../features/profiles/teacher/pages/roster/AdvisoryRosterPage").then((module) => ({ default: module.AdvisoryRosterPage })));
const GradesPage = lazy(() => import("../features/profiles/teacher/pages/grades/GradePage").then((module) => ({ default: module.GradesPage })));
const SubjectsPage = lazy(() => import("../features/profiles/teacher/pages/subjects/SubjectPage").then((module) => ({ default: module.SubjectsPage })));
const ParentDashboardHome = lazy(() => import("../features/profiles/parent/pages/dashboard/ParentDashboardHome"));
const EnrolledChildrenPage = lazy(() => import("../features/profiles/parent/pages/EnrollledStudent/EnrolledChildrenPage").then((module) => ({ default: module.EnrolledChildrenPage })));
const ChildDetailPage = lazy(() => import("../features/profiles/parent/pages/Student/ChildDetailPage"));
const TopicSupportChoice = lazy(() => import("../features/profiles/parent/pages/Student/Academic/TopicSupportChoice"));
const CoursewareView = lazy(() => import("../features/profiles/parent/pages/Student/Academic/CoursewareView"));
const CalendarPageView = lazy(() => import("../shared/calendar/CalendarPageView").then((module) => ({ default: module.CalendarPageView })));
const SubjectDetailPage = lazy(() => import("../features/profiles/teacher/pages/subjects/detail/SubjectDetailPage").then((module) => ({ default: module.SubjectDetailPage })));
const SubjectRecordsPage = lazy(() => import("../features/profiles/teacher/pages/subjects/detail/SubjectRecordsPage").then((module) => ({ default: module.SubjectRecordsPage })));
const HolisticOverviewPage = lazy(() => import("../features/profiles/teacher/pages/holistic/HolisticOverviewPage").then((module) => ({ default: module.HolisticOverviewPage })));
const StudentHolisticProfilePage = lazy(() => import("../features/profiles/teacher/pages/holistic/StudentHolisticProfilePage").then((module) => ({ default: module.StudentHolisticProfilePage })));
const HolisticDomainTrendsPage = lazy(() => import("../features/profiles/teacher/pages/holistic/HolisticDomainTrendsPage").then((module) => ({ default: module.HolisticDomainTrendsPage })));
const SubjectClassListPage = lazy(() => import("../features/profiles/teacher/pages/subjects/SubjectClassListPage").then((module) => ({ default: module.SubjectClassListPage })));
const AcademicYearPage = lazy(() => import("../features/profiles/admin/pages/subjects/AcademicYearPage").then((module) => ({ default: module.AcademicYearPage })));
const PrincipalDashboardHome = lazy(() => import("../features/profiles/principal/pages/dashboard/PrincipalDashboardHome").then((module) => ({ default: module.PrincipalDashboardHome })));
const PrincipalStudentsPage = lazy(() => import("../features/profiles/principal/pages/students/PrincipalStudentsPage").then((module) => ({ default: module.PrincipalStudentsPage })));
const ClassListPage = lazy(() => import("../features/profiles/principal/pages/students/ClassListPage").then((module) => ({ default: module.ClassListPage })));
const PrincipalTeachersPage = lazy(() => import("../features/profiles/principal/pages/teachers/PrincipalTeachersPage").then((module) => ({ default: module.PrincipalTeachersPage })));
const TeacherSchedulePage = lazy(() => import("../features/profiles/principal/pages/teachers/TeacherSchedulePage").then((module) => ({ default: module.TeacherSchedulePage })));
const AnalyticsPage = lazy(() => import("../features/profiles/principal/pages/reports/AnalyticsPage").then((module) => ({ default: module.AnalyticsPage })));
const PrincipalGradebooksPage = lazy(() => import("../features/profiles/principal/pages/gradebooks/PrincipalGradebooksPage").then((module) => ({ default: module.PrincipalGradebooksPage })));
const PrincipalGradeSheetPage = lazy(() => import("../features/profiles/principal/pages/gradebooks/PrincipalGradeSheetPage").then((module) => ({ default: module.PrincipalGradeSheetPage })));
const HolisticPerformanceAnalyticsPage = lazy(() => import("../features/profiles/principal/pages/reports/HolisticPerformanceAnalyticsPage").then((module) => ({ default: module.HolisticPerformanceAnalyticsPage })));
const TeacherAttendancePage = lazy(() => import("../features/profiles/teacher/pages/attendance/TeacherAttendancePage").then((module) => ({ default: module.TeacherAttendancePage })));
const TeacherAttendanceRecordsPage = lazy(() => import("../features/profiles/teacher/pages/attendance/TeacherAttendanceRecordsPage").then((module) => ({ default: module.TeacherAttendanceRecordsPage })));
const PetQuizPage = lazy(() => import("../features/profiles/parent/pages/Student/Academic/PetQuizPage"));
const AddSubjectPage = lazy(() => import("../features/profiles/admin/pages/subjects/AddSubjectPage").then((module) => ({ default: module.AddSubjectPage })));
const SubjectsSection = lazy(() => import("../features/profiles/admin/pages/subjects/SubjectSection").then((module) => ({ default: module.SubjectsSection })));
const AdminSubjectDetailPage = lazy(() => import("../features/profiles/admin/pages/subjects/AdminSubjectDetailPage").then((module) => ({ default: module.AdminSubjectDetailPage })));

type Role = "ADMIN" | "PRINCIPAL" | "TEACHER" | "PARENT";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <QedLoader fill />;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <SettingsProvider>
      <ForceChangePasswordGate />
      {children}
    </SettingsProvider>
  );
}

function RoleRoute({
  allowed,
  children,
}: {
  allowed: Role[];
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const normalizedRole = user?.role?.toUpperCase() as Role;
  if (!user || !allowed.includes(normalizedRole)) {
    return <Navigate to={getRoleHome(normalizedRole)} replace />;
  }
  return <>{children}</>;
}

function LoginPage() {
  const navigate = useNavigate();
  return <LoginPanel open={true} onClose={() => navigate("/")} />;
}

export function getRoleHome(role?: Role): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "PRINCIPAL":
      return "/principal";
    case "TEACHER":
      return "/teacher";
    case "PARENT":
      return "/parent";
    default:
      return "/login";
  }
}

function AdminSection() {
  const { logout } = useAuth();

  return (
    <StudentsProvider>
      <UsersProvider>
        <TeachersProvider>
          <ClassesProvider>
            <AdminLayout onLogout={logout} />
          </ClassesProvider>
        </TeachersProvider>
      </UsersProvider>
    </StudentsProvider>
  );
}

export function AppRouter() {
  const { isLoading } = useAuth();

  return (
    <>
      <QedSplash loading={isLoading} />
      <DebugRoute />
      <Suspense fallback={<QedLoader fill />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* ADMIN */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <RoleRoute allowed={["ADMIN"]}>
                <AdminSection />
              </RoleRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboardHome />} />
          <Route path="students" element={<StudentRecordsPage />} />
          <Route path="students/new" element={<StudentFormPage />} />
          {/* <Route path="students/:studentId" element={<StudentDetailPage />} /> */}
          <Route
            path="students/:studentId/edit"
            element={<StudentFormPage />}
          />
          <Route path="users" element={<UserManagementPage />} />
          <Route path="users/new" element={<UserFormPage />} />
          <Route path="users/:role/:userId" element={<UserViewPage />} />
          <Route path="users/:role/:userId/edit" element={<UserFormPage />} />
          <Route path="classes" element={<ClassesPage />} />
          <Route path="classes/new" element={<ClassFormPage />} />
          <Route path="classes/:classId" element={<ClassViewPage />} />
          <Route path="classes/:classId/edit" element={<ClassFormPage />} />
          <Route path="subjects" element={<SubjectsSection />}>
            <Route index element={<ManageSubjectsPage />} />
            <Route path="new" element={<AddSubjectPage />} />
            <Route path=":subjectId" element={<AdminSubjectDetailPage />} />
          </Route>
          <Route path="academic-year" element={<AcademicYearPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="help" element={<HelpSupportPage audience="ADMIN" />} />
        </Route>

        {/* PRINCIPAL */}
        <Route
          path="/principal"
          element={
            <ProtectedRoute>
              <RoleRoute allowed={["PRINCIPAL"]}>
                <PrincipalSection />
              </RoleRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<PrincipalDashboardHome />} />
          <Route path="students" element={<PrincipalStudentsPage />} />
          <Route path="students/class/:classId" element={<ClassListPage />} />
          <Route path="students/grade/:gradeId" element={<ClassListPage />} />
          <Route path="teachers" element={<PrincipalTeachersPage />} />
          <Route path="teachers/:teacherId" element={<TeacherSchedulePage />} />
          <Route path="reports" element={<AnalyticsPage />} />
          <Route
            path="holistic-performance-analytics"
            element={<HolisticPerformanceAnalyticsPage />}
          />
          <Route path="gradebooks" element={<PrincipalGradebooksPage />} />
          <Route
            path="gradebooks/:grade"
            element={<PrincipalGradeSheetPage />}
          />
          <Route path="calendar" element={<CalendarPage viewerRole="PRINCIPAL" />} />
          <Route path="help" element={<HelpSupportPage audience="PRINCIPAL" />} />
        </Route>

        {/* TEACHER */}
        <Route
          path="/teacher"
          element={
            <ProtectedRoute>
              <RoleRoute allowed={["TEACHER"]}>
                <TeacherSection />
              </RoleRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<TeacherDashboardHome />} />
          <Route path="attendance" element={<TeacherAttendancePage />} />
          <Route
            path="attendance/records"
            element={<TeacherAttendanceRecordsPage />}
          />
          <Route path="subjects" element={<SubjectsPage />} />
          <Route path="subjects/:subjectId" element={<SubjectDetailPage />} />
          <Route
            path="subjects/:subjectId/records"
            element={<SubjectRecordsPage />}
          />
          <Route
            path="subjects/:subjectSectionId/students"
            element={<SubjectClassListPage />}
          />
          <Route path="grades" element={<GradesPage />} />
          <Route path="holistic" element={<HolisticOverviewPage />} />
          <Route
            path="holistic/:studentId"
            element={<StudentHolisticProfilePage />}
          />
          <Route
            path="holistic/domain-trends"
            element={<HolisticDomainTrendsPage />}
          />
          <Route path="students/:studentId" element={<StudentDetailPage />} />
          <Route path="advisory" element={<AdvisoryRosterPage />} />
          <Route path="calendar" element={<CalendarPageView />} />
          <Route path="help" element={<HelpSupportPage audience="TEACHER" />} />
        </Route>

        {/* PARENT */}
        <Route
          path="/parent"
          element={
            <ProtectedRoute>
              <RoleRoute allowed={["PARENT"]}>
                <ParentSection />
              </RoleRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<ParentDashboardHome />} />
          <Route path="enrolled-children" element={<EnrolledChildrenPage />} />
          <Route path="students/:studentId" element={<ChildDetailPage />} />
          <Route
            path="students/:studentId/topics/:topicId/support"
            element={<TopicSupportChoice />}
          />
          <Route
            path="students/:studentId/topics/:topicId/courseware"
            element={<CoursewareView />}
          />
          <Route
            path="students/:studentId/topics/:topicId/quiz"
            element={<PetQuizPage />}
          />
          <Route path="calendar" element={<CalendarPageView />} />
          <Route path="help" element={<HelpSupportPage audience="PARENT" />} />
        </Route>
      </Routes>
      </Suspense>
    </>
  );
}
