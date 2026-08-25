// src/shared/components/ForceChangePasswordGate.tsx
import { useAuth } from "../../../features/auth/context/AuthContext"; // i-verify kung ito talaga ang alias mo, kung wala pang @features, gamitin ang relative path
import { ForceChangePasswordModal } from "@shared/components/manage_password/ForceChangePasswordModal";

export function ForceChangePasswordGate() {
  const { user, mustChangePassword } = useAuth();

  if (!user || !mustChangePassword) return null;

  return <ForceChangePasswordModal />;
}
