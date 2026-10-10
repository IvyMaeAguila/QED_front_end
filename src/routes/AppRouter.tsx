import { lazy, Suspense } from "react";
import {
  Navigate,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useAuth } from "../features/auth/context/authContext";
import { routeSkeletons } from "../shared/loading/routeSkeletons";

import { AdminLayout } from "../features/profiles/admin/pages/AdminLayout";

import { StudentsProvider } from "../features/profiles/admin/pages/studentrecords/context/StudentsContext";

import { UsersProvider } from "../features/profiles/admin/pages/usermanagement/context/UsersContext";

import { TeachersProvider } from "../features/profiles/admin/pages/classes/context/TeachersContext";
import { ClassesProvider } from "../features/profiles/admin/pages/classes/context/ClassesContext";

import { TeacherSection } from "./TeacherSection";

import { ParentSection } from "./ParentSection";

import { PrincipalSection } from "./PrincipalSection";


import { QedBootstrapLoader } from "../shared/loading/QedBootstrapLoader";
import { RouteSkeleton } from "../shared/loading/RouteSkeleton";
import { SubjectsSection } from "../features/profiles/admin/pages/subjects/SubjectSection";

function DebugRoute() {
  const location = useLocation();
  console.log("Current path being matched:", location.pathname);
  return null;
}

const AdminDashboardHome = lazy(routeSkeletons["/admin"].load);
const StudentRecordsPage = lazy(routeSkeletons["/admin/students"].load);
const StudentFormPage = lazy(routeSkeletons["/admin/students/:studentId/edit"].load);
const UserManagementPage = lazy(routeSkeletons["/admin/users"].load);
const UserFormPage = lazy(routeSkeletons["/admin/users/:role/:userId/edit"].load);
const UserViewPage = lazy(routeSkeletons["/admin/users/:role/:userId"].load);
const ClassesPage = lazy(routeSkeletons["/admin/classes"].load);
const ClassFormPage = lazy(routeSkeletons["/admin/classes/:classId/edit"].load);
const ClassViewPage = lazy(routeSkeletons["/admin/classes/:classId"].load);
const LandingPage = lazy(routeSkeletons["/"].load);
const LoginPanel = lazy(routeSkeletons["/login"].load);
const StudentDetailPage = lazy(routeSkeletons["/teacher/students/:studentId"].load);
const ManageSubjectsPage = lazy(routeSkeletons["/admin/subjects"].load);
const CalendarPage = lazy(routeSkeletons["/admin/calendar"].load);
const HelpSupportPage = lazy(routeSkeletons["/admin/help"].load);
const TeacherDashboardHome = lazy(routeSkeletons["/teacher"].load);
const AdvisoryRosterPage = lazy(routeSkeletons["/teacher/advisory"].load);
const GradesPage = lazy(routeSkeletons["/teacher/grades"].load);
const SubjectsPage = lazy(routeSkeletons["/teacher/subjects"].load);
const ParentDashboardHome = lazy(routeSkeletons["/parent"].load);
const EnrolledChildrenPage = lazy(routeSkeletons["/parent/enrolled-children"].load);
const ChildDetailPage = lazy(routeSkeletons["/parent/students/:studentId"].load);
const TopicSupportChoice = lazy(routeSkeletons["/parent/students/:studentId/topics/:topicId/support"].load);
const CoursewareView = lazy(routeSkeletons["/parent/students/:studentId/topics/:topicId/courseware"].load);
const CalendarPageView = lazy(routeSkeletons["/teacher/calendar"].load);
const SubjectDetailPage = lazy(routeSkeletons["/teacher/subjects/:subjectId"].load);
const SubjectRecordsPage = lazy(routeSkeletons["/teacher/subjects/:subjectId/records"].load);
const HolisticOverviewPage = lazy(routeSkeletons["/teacher/holistic"].load);
const StudentHolisticProfilePage = lazy(routeSkeletons["/teacher/holistic/:studentId"].load);
const HolisticDomainTrendsPage = lazy(routeSkeletons["/teacher/holistic/domain-trends"].load);
const SubjectClassListPage = lazy(routeSkeletons["/teacher/subjects/:subjectSectionId/students"].load);
const AcademicYearPage = lazy(routeSkeletons["/admin/academic-year"].load);
const PrincipalDashboardHome = lazy(routeSkeletons["/principal"].load);
const PrincipalStudentsPage = lazy(routeSkeletons["/principal/students"].load);
const ClassListPage = lazy(routeSkeletons["/principal/students/class/:classId"].load);
const PrincipalTeachersPage = lazy(routeSkeletons["/principal/teachers"].load);
const TeacherSchedulePage = lazy(routeSkeletons["/principal/teachers/:teacherId"].load);
const AnalyticsPage = lazy(routeSkeletons["/principal/reports"].load);
const PrincipalGradebooksPage = lazy(routeSkeletons["/principal/gradebooks"].load);
const PrincipalGradeSheetPage = lazy(routeSkeletons["/principal/gradebooks/:grade"].load);
const HolisticPerformanceAnalyticsPage = lazy(routeSkeletons["/principal/holistic-performance-analytics"].load);
const TeacherAttendancePage = lazy(routeSkeletons["/teacher/attendance"].load);
const TeacherAttendanceRecordsPage = lazy(routeSkeletons["/teacher/attendance/records"].load);
const PetQuizPage = lazy(routeSkeletons["/parent/students/:studentId/topics/:topicId/quiz"].load);
const AddSubjectPage = lazy(routeSkeletons["/admin/subjects/new"].load);
const AdminSubjectDetailPage = lazy(routeSkeletons["/admin/subjects/:subjectId"].load);

type Role = "ADMIN" | "PRINCIPAL" | "TEACHER" | "PARENT";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  return <QedBootstrapLoader loading={isLoading}>{user ? children : <Navigate to="/login" replace />}</QedBootstrapLoader>;
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
  return (
    <>
      <DebugRoute />
      <Routes>
        <Route path="/" element={<Suspense fallback={<RouteSkeleton />}><LandingPage /></Suspense>} />
        <Route path="/login" element={<Suspense fallback={<RouteSkeleton />}><LoginPage /></Suspense>} />

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
      </Routes></>
  );
}







