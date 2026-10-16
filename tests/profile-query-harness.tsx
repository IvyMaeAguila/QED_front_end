import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "../src/features/auth/context/authContext";
import { queryClient } from "../src/shared/query/queryClient";
import { RoutePreviewContext } from "../src/shared/loading/RoutePreview";
import { usePrincipalTeacherProfile } from "../src/features/profiles/principal/pages/teachers/hooks/usePrincipalTeacherProfile";
import type { UserProfile } from "../src/shared/profile/types/types";

const account = (id: string, role = "PRINCIPAL") => ({ id, role, name: id, userName: id }) as UserProfile;
function Profile({ id, secondary = false }: { id?: string; secondary?: boolean }) {
  const state = usePrincipalTeacherProfile(id), result = state.schedule;
  if (secondary) return <output data-testid="secondary">{result.teacher?.fullName}</output>;
  return <section>
    <output data-testid="loading">{String(result.loading)}</output>
    <output data-testid="error">{result.error?.message ?? ""}</output>
    <output data-testid="profile">{result.teacher?.fullName ?? ""}</output>
    <output data-testid="students">{state.classRosters.flatMap(c => c.students.map(s => s.firstName)).join(",")}</output>
    <output data-testid="rosters-loading">{String(state.rostersLoading)}</output>
    <output data-testid="rosters-error">{String(state.rostersError)}</output>
    <output data-testid="year">{result.schoolYear}</output>
    <output data-testid="not-found">{String(result.notFound)}</output>
    <button onClick={result.retry}>Retry query</button><button onClick={state.retryRosters}>Retry rosters</button>
  </section>;
}
function Harness() {
  const auth = useAuth();
  const [mounted, setMounted] = useState(true), [preview, setPreview] = useState(true);
  const [id, setId] = useState<string | undefined>("1"), [secondary, setSecondary] = useState(false);
  return <>
    <output data-testid="auth">{auth.isLoading ? "pending" : auth.user?.id ?? "signed-out"}</output>
    <button onClick={() => setPreview(p => !p)}>Toggle preview</button>
    <button onClick={() => setMounted(p => !p)}>Toggle profile</button>
    <button onClick={() => setSecondary(p => !p)}>Toggle second observer</button>
    <button onClick={() => setId("1")}>Teacher 1</button><button onClick={() => setId("2")}>Teacher 2</button>
    <button onClick={() => setId(undefined)}>Missing target</button>
    <button onClick={() => auth.setUser(account("2"))}>Switch account</button>
    {["ADMIN", "TEACHER", "PARENT"].map(role => <button key={role} onClick={() => auth.setUser(account("1", role))}>Switch {role}</button>)}
    <button onClick={() => void auth.login(account("1"))}>Login again</button><button onClick={auth.logout}>Logout</button>
    <RoutePreviewContext.Provider value={preview}>{mounted && <Profile id={id}/>} {secondary && <Profile id={id} secondary/>}</RoutePreviewContext.Provider>
  </>;
}
createRoot(document.getElementById("root")!).render(<StrictMode><QueryClientProvider client={queryClient}><AuthProvider><Harness/></AuthProvider></QueryClientProvider></StrictMode>);
