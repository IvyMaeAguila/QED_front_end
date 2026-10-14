import { useAuth } from "../features/auth/context/authContext";
import { ParentLayout } from "../features/profiles/parent/pages/ParentLayout";
import { ParentDashboardProvider } from "../features/profiles/parent/pages/dashboard/context/ParentDashboardContext";

export function ParentSection() {
  const { logout, user, sessionScope } = useAuth();

  return (
      <ParentDashboardProvider key={`${sessionScope}:${user?.role}:${user?.id}`}>
          <ParentLayout onLogout={logout} />
      </ParentDashboardProvider>
  );
}
