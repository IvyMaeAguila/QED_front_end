import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "../src/features/auth/context/authContext";
import { queryClient } from "../src/shared/query/queryClient";
import { RoutePreviewContext } from "../src/shared/loading/RoutePreview";
import { usePrincipalDashboardData } from "../src/features/profiles/principal/pages/dashboard/hooks/usePrincipalDashboardData";
import type { UserProfile } from "../src/shared/profile/types/types";
const account = (id: string, role = "PRINCIPAL") => ({ id, role, name: id, userName: id }) as UserProfile;
function Dashboard({ secondary = false }: { secondary?: boolean }) {
  const state = usePrincipalDashboardData();
  if (secondary) return <output data-testid="secondary">{state.data?.overview.totalTeachers}</output>;
  return <section>
    <output data-testid="loading">{String(state.loading)}</output>
    <output data-testid="error">{state.error?.message ?? ""}</output>
    <output data-testid="data">{state.data ? JSON.stringify(state.data) : ""}</output>
    <output data-testid="year">{state.academicYear?.label ?? ""}</output>
    <output data-testid="year-error">{state.yearError?.message ?? ""}</output>
    <output data-testid="year-loading">{String(state.yearLoading)}</output>
    <output data-testid="ranking-term">{state.rankingTerm}</output>
    <button onClick={() => void state.refetch()}>Retry query</button><button onClick={state.retryYear}>Retry year</button>
    {(["Term 1", "Term 2", "Term 3"] as const).map(term => <button key={term} onClick={() => state.setRankingTerm(term)}>{term}</button>)}
  </section>;
}
function Harness() {
  const auth = useAuth();
  const [mounted, setMounted] = useState(true), [preview, setPreview] = useState(true), [secondary, setSecondary] = useState(false);
  return <>
    <output data-testid="auth">{auth.isLoading ? "pending" : auth.user?.id ?? "signed-out"}</output>
    <button onClick={() => setPreview(p => !p)}>Toggle preview</button>
    <button onClick={() => setMounted(p => !p)}>Toggle dashboard</button>
    <button onClick={() => setSecondary(p => !p)}>Toggle second observer</button>
    <button onClick={() => auth.setUser(account("2"))}>Switch account</button>
    {["ADMIN", "TEACHER", "PARENT"].map(role => <button key={role} onClick={() => auth.setUser(account("1", role))}>Switch {role}</button>)}
    <button onClick={() => void auth.login(account("1"))}>Login again</button><button onClick={auth.logout}>Logout</button>
    <RoutePreviewContext.Provider value={preview}>{mounted && <Dashboard/>}{secondary && <Dashboard secondary/>}</RoutePreviewContext.Provider>
  </>;
}
createRoot(document.getElementById("root")!).render(<StrictMode><QueryClientProvider client={queryClient}><AuthProvider><Harness/></AuthProvider></QueryClientProvider></StrictMode>);
