// src/shared/components/manage_password/ForceChangePasswordGate.tsx
import { useAuth } from "../../../features/auth/context/AuthContext";
import { ForceChangePasswordModal } from "./ForceChangePasswordModal";
import { useLocation } from "react-router-dom";

const PROTECTED_PATHS = ["/admin", "/teacher", "/parent", "/principal"]; // idagdag ang principal kung mayroon

export function ForceChangePasswordGate() {
  const { user, mustChangePassword } = useAuth();
  const location = useLocation();

  // 1. Walang user o hindi kailangan magpalit → huwag mag-render
  if (!user || !mustChangePassword) return null;

  // 2. Kung ang kasalukuyang path ay hindi protected → huwag mag-render
  const isProtected = PROTECTED_PATHS.some((path) =>
    location.pathname.startsWith(path)
  );
  if (!isProtected) return null;

  // 3. Kung nasa protected route at kailangan magpalit → ipakita ang modal
  return <ForceChangePasswordModal />;
}