// src/routes/ProtectedRoute.tsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../features/auth/context/AuthContext";
import { ForceChangePasswordGate } from "../shared/components/manage_password/ForceChangePasswordGate";

export function ProtectedRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <>
      <ForceChangePasswordGate /> {/* Dito nakalagay ang gate */}
      <Outlet />
    </>
  );
}