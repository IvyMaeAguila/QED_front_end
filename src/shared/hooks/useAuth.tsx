import { useContext } from "react";
import { AuthContext } from "../../features/auth/context/authContext";

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
