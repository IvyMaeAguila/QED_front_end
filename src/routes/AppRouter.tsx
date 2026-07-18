import {
  Navigate,
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useAuth } from "../shared/AuthContext";
import { AdminLayout } from "../features/profiles/admin/pages/shared/AdminLayout";
import { AdminDashboardHome } from "../features/profiles/admin/pages/dashboard/AdminDashboardHome";
import { StudentsProvider } from "../features/profiles/admin/pages/studentrecords/context/StudentsContext";
import { StudentRecordsPage } from "../features/profiles/admin/pages/studentrecords/StudentRecordsPage";
import { StudentFormPage } from "../features/profiles/admin/pages/studentrecords/StudentFormPage";
import { StudentViewPage } from "../features/profiles/admin/pages/studentrecords/StudentViewPage";
import { UsersProvider } from "../features/profiles/admin/pages/usermanagement/context/UsersContext";
import { UserManagementPage } from "../features/profiles/admin/pages/usermanagement/UserManagementPage";
import { UserFormPage } from "../features/profiles/admin/pages/usermanagement/UserFormPage";
import { UserViewPage } from "../features/profiles/admin/pages/usermanagement/UserViewPage";
import LandingPage from "../features/Landing/LandingPage";
import { LoginPanel } from "../features/auth/LoginPanel";

function DebugRoute() {
  const location = useLocation();
  console.log("Current path being matched:", location.pathname);
  return null;
}

type Role = "ADMIN" | "PRINCIPAL" | "TEACHER" | "PARENT";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RoleRoute({
  allowed,
  children,
}: {
  allowed: Role[];
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  if (!user || !allowed.includes(user.role as Role)) {
    return <Navigate to={getRoleHome(user?.role as Role)} replace />;
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
  return (
    <StudentsProvider>
      <UsersProvider>
        <AdminLayout onLogout={() => console.log("Logging out...")} />
      </UsersProvider>
    </StudentsProvider>
  );
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <DebugRoute />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

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
          <Route path="students/:studentId" element={<StudentViewPage />} />
          <Route path="students/:studentId/edit" element={<StudentFormPage />} />

          <Route path="users" element={<UserManagementPage />} />
          <Route path="users/new" element={<UserFormPage />} />
          <Route path="users/:userId" element={<UserViewPage />} />
          <Route path="users/:userId/edit" element={<UserFormPage />} />
        </Route>
        <Route path="*" element={<div>404 Page Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
}