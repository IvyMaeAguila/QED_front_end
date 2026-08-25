import {
  Navigate,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useAuth } from "../features/auth/context/AuthContext";
import { AdminLayout } from "../features/profiles/admin/pages/AdminLayout";
import { AdminDashboardHome } from "../features/profiles/admin/pages/dashboard/AdminDashboardHome";
import { StudentsProvider } from "../features/profiles/admin/pages/studentrecords/context/StudentsContext";
import { StudentRecordsPage } from "../features/profiles/admin/pages/studentrecords/StudentRecordsPage";
import { StudentFormPage } from "../features/profiles/admin/pages/studentrecords/StudentFormPage";
import { UsersProvider } from "../features/profiles/admin/pages/usermanagement/context/UsersContext";
import { UserManagementPage } from "../features/profiles/admin/pages/usermanagement/UserManagementPage";
import { UserFormPage } from "../features/profiles/admin/pages/usermanagement/UserFormPage";
import { UserViewPage } from "../features/profiles/admin/pages/usermanagement/UserViewPage";
import { TeachersProvider } from "../features/profiles/admin/pages/classes/context/TeachersContext";
import { ClassesProvider } from "../features/profiles/admin/pages/classes/context/ClassesContext";
import { ClassesPage } from "../features/profiles/admin/pages/classes/ClassPage";
import { ClassFormPage } from "../features/profiles/admin/pages/classes/ClassFormPage";
import { ClassViewPage } from "../features/profiles/admin/pages/classes/ClassViewPage";
import LandingPage from "../features/Landing/LandingPage";
import { LoginPanel } from "../features/auth/LoginPanel";
// import { StudentDetailPage } from "../shared/components/StudentDetailPage";
import { ManageSubjectsPage } from "../features/profiles/admin/pages/subjects/ManageSubjectsPage";
import { CalendarPage } from "../features/profiles/admin/pages/calendar/CalendarPage";
import { HelpSupportPage } from "../features/profiles/admin/pages/help/HelpSupportPage";
import { SettingsProvider } from "../features/profiles/admin/pages/settings/context/SettingsContext";
import { TeacherSection } from "./TeacherSection";
import { TeacherDashboardHome } from "../features/profiles/teacher/pages/dashboard/TeacherDashboardHome";
import { TeacherCalendarPage } from "../features/profiles/teacher/pages/calendar/TeacherCalendarPage";
import { AdvisoryRosterPage } from "../features/profiles/teacher/pages/roster/AdvisoryRosterPage";
import { GradesPage } from "../features/profiles/teacher/pages/grades/GradePage";
import { SubjectsPage } from "../features/profiles/teacher/pages/subjects/SubjectPage";
import { ParentSection } from "./ParentSection";
import ParentDashboardHome from "../features/profiles/parent/pages/dashboard/ParentDashboardHome";
import { EnrolledChildrenPage } from "../features/profiles/parent/pages/EnrollledStudent/EnrolledChildrenPage";
import StudentDetailPage from "../features/profiles/parent/pages/Student/studentDetailPage";
import { CalendarPageView } from "../features/profiles/parent/pages/calendar/CalendarPageView";
import { SubjectDetailPage } from "../features/profiles/teacher/pages/subjects/detail/SubjectDetailPage";
import { SubjectRecordsPage } from "../features/profiles/teacher/pages/subjects/detail/SubjectRecordsPage";
import { HolisticOverviewPage } from "../features/profiles/teacher/pages/holistic/HolisticOverviewPage";
import { StudentHolisticProfilePage } from "../features/profiles/teacher/pages/holistic/StudentHolisticProfilePage";
import { HolisticDomainTrendsPage } from "../features/profiles/teacher/pages/holistic/HolisticDomainTrendsPage";
import { SubjectClassListPage } from "../features/profiles/teacher/pages/subjects/SubjectClassListPage";
import { AcademicYearPage } from "../features/profiles/admin/pages/subjects/AcademicYearPage";

// 🆕 Import ng ForceChangePasswordGate
import { ForceChangePasswordGate } from "../shared/components/manage_password/ForceChangePasswordGate";

function DebugRoute() {
  const location = useLocation();
  console.log("Current path being matched:", location.pathname);
  return null;
}

type Role = "ADMIN" | "PRINCIPAL" | "TEACHER" | "PARENT";

// ✅ In-update ang ProtectedRoute para isama ang gate
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <>
      {/* Lilitaw lang ang modal kung kinakailangan (nasa loob ng gate ang conditional) */}
      <ForceChangePasswordGate />
      {children}
    </>
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
  return (
    <SettingsProvider>
      <DebugRoute />
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
          <Route path="students/:studentId" element={<StudentDetailPage />} />
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
          <Route path="subjects" element={<ManageSubjectsPage />} />
          <Route path="subjects" element={<ManageSubjectsPage />} />
          <Route path="academic-year" element={<AcademicYearPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="help" element={<HelpSupportPage />} />
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
          <Route path="calendar" element={<TeacherCalendarPage />} />
          <Route path="help" element={<div>Help page</div>} />
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
          <Route
            path="students/:studentId"
            element={<StudentDetailPage />}
          />
          <Route path="calendar" element={<CalendarPageView />} />
        </Route>
      </Routes>
    </SettingsProvider>
  );
}