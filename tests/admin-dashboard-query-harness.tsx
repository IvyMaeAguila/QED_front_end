import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../src/shared/query/queryClient";
import { AuthProvider, useAuth } from "../src/features/auth/context/authContext";
import { RoutePreviewContext } from "../src/shared/loading/RoutePreview";
import { useAdminDashboardQueries } from "../src/features/profiles/admin/pages/dashboard/hooks/useAdminDashboardQueries";
import type { UserProfile } from "../src/shared/profile/types/types";
export function Dashboard({ secondary = false }: { secondary?: boolean }) {
  const d = useAdminDashboardQueries();
  if (secondary) return <output data-testid="secondary">{JSON.stringify(d.counts.data)}</output>;
  return <section>
    {(["counts", "frequency", "audit"] as const).map(e => <div key={e}>
      <output data-testid={`${e}-data`}>{JSON.stringify(d[e].data) ?? ""}</output>
      <output data-testid={`${e}-error`}>{d[e].error?.message ?? ""}</output>
      <output data-testid={`${e}-loading`}>{String(d[e].loading)}</output>
      <button onClick={d[e].retry}>Retry {e}</button>
    </div>)}
    <output data-testid="period">{d.selectedPeriod}</output><output data-testid="filters">{JSON.stringify(d.filters)}</output>
    {(["weekly", "monthly", "yearly"] as const).map(p => <button key={p} onClick={() => d.setSelectedPeriod(p)}>{p}</button>)}
    <button onClick={() => d.setFilters(f => ({ ...f, page: 2 }))}>Page 2</button>
    <button onClick={() => d.setFilters({ page: 1, search: "Filtered", role: "TEACHER", action: "LOGIN", from: "2026-10-01", to: "2026-10-11" })}>Apply filters</button>
  </section>;
}
export function Harness() {
  const auth = useAuth();
  const [mounted, setMounted] = useState(true), [preview, setPreview] = useState(true), [secondary, setSecondary] = useState(false);
  return <>
    <output data-testid="auth">{auth.isLoading ? "pending" : auth.user?.id ?? "signed-out"}</output>
    <button onClick={() => setMounted(v => !v)}>Toggle dashboard</button><button onClick={() => setPreview(v => !v)}>Toggle preview</button>
    <button onClick={() => setSecondary(v => !v)}>Toggle observer</button>
    <button onClick={() => auth.setUser({ id: "2", role: "ADMIN", name: "Second", userName: "second" } as UserProfile)}>Switch account</button>
    {(["ADMIN", "PRINCIPAL", "TEACHER", "PARENT"] as const).map(role => <button key={role} onClick={() => auth.setUser({ id: "1", role, userName: "synthetic", name: role } as UserProfile)}>Switch {role}</button>)}
    <button onClick={() => void auth.login({ id: "1", role: "ADMIN" } as UserProfile)}>Login again</button><button onClick={auth.logout}>Logout</button>
    <QueryClientProvider client={queryClient}><RoutePreviewContext.Provider value={preview}>
      {mounted && <Dashboard key={`${auth.sessionScope}:${auth.user?.role}:${auth.user?.id}`}/>}{secondary && <Dashboard secondary/>}
    </RoutePreviewContext.Provider></QueryClientProvider>
  </>;
}
createRoot(document.getElementById("root")!).render(<StrictMode><AuthProvider><Harness/></AuthProvider></StrictMode>);
