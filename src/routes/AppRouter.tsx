import { useEffect } from "react";
import { Navigate, Routes, Route, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/context/authContext";
import LandingPage from "../features/Landing/LandingPage";
import { LoginPanel } from "../features/auth/LoginPanel";
import { QedBootstrapLoader } from "../shared/loading/QedBootstrapLoader";
import { preloadRole, retryRole, useRoleModule } from "./roleModules";
import type { Role } from "./roleModules";

export function getRoleHome(role?: Role): string {
  return role && ["ADMIN", "TEACHER", "PRINCIPAL", "PARENT"].includes(role) ? `/${role.toLowerCase()}` : "/login";
}
function ProtectedRoute({ role }: { role: Role }) {
  const { user, isLoading } = useAuth();
  const knownRole = user?.role?.toUpperCase() as Role | undefined;
  const state = useRoleModule(knownRole === role ? role : undefined);
  // Session responses normally start the import earlier; this also supports an existing auth context.
  useEffect(() => { if (!isLoading && knownRole === role) preloadRole(role); }, [isLoading, knownRole, role]);
  const loading = isLoading || (!!user && knownRole === role && !state.View && !state.error);
  return <QedBootstrapLoader loading={loading}>
    {!user ? <Navigate to="/login" replace/> : knownRole !== role ? <Navigate to={getRoleHome(knownRole)} replace/>
      : state.error ? <div role="alert">Unable to load this workspace. <button onClick={() => retryRole(role)}>Retry</button></div>
      : state.View ? <state.View/> : null}
  </QedBootstrapLoader>;
}
function LoginPage() {
  const navigate = useNavigate();
  return <LoginPanel open={true} onClose={() => navigate("/")}/>;
}
export function AppRouter() {
  return <Routes>
    <Route path="/" element={<LandingPage/>}/>
    <Route path="/login" element={<LoginPage/>}/>
    <Route path="/admin/*" element={<ProtectedRoute role="ADMIN"/>}/>
    <Route path="/teacher/*" element={<ProtectedRoute role="TEACHER"/>}/>
    <Route path="/principal/*" element={<ProtectedRoute role="PRINCIPAL"/>}/>
    <Route path="/parent/*" element={<ProtectedRoute role="PARENT"/>}/>
  </Routes>;
}
