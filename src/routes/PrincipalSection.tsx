import { useAuth } from "../features/auth/context/authContext";
import { PrincipalLayout } from "../features/profiles/principal/pages/PrincipalLayout";

export function PrincipalSection() {
  const { logout } = useAuth();

  return <PrincipalLayout onLogout={logout} />;
}
