import { useAuth } from "../features/auth/context/AuthContext";
import { ParentLayout } from "../features/profiles/parent/pages/ParentLayout";
import { TeachersProvider } from "../features/profiles/admin/pages/classes/context/TeachersContext";
import { ParentDashboardProvider } from "../features/profiles/parent/pages/dashboard/context/ParentDashboardContext"; // ✅ idagdag, i-adjust path

export function ParentSection() {
  const { logout } = useAuth();

  return (
    <ParentDashboardProvider>
      <TeachersProvider>
        <ParentLayout onLogout={logout} />
      </TeachersProvider>
    </ParentDashboardProvider>
  );
}
