import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "../src/features/auth/context/authContext";
import { queryClient } from "../src/shared/query/queryClient";
import { RoutePreviewContext } from "../src/shared/loading/RoutePreview";
import { useClassList, type ClassListTarget } from "../src/features/profiles/principal/pages/students/hooks/useClassList";
import type { UserProfile } from "../src/shared/profile/types/types";

const account = (id: string, role = "PRINCIPAL") => ({ id, role, name: id, userName: id }) as UserProfile;
function Roster({ target, secondary = false }: { target?: ClassListTarget; secondary?: boolean }) {
  const result = useClassList(target);
  if (secondary) return <output data-testid="secondary">{result.classList?.roster.map(s => s.firstName).join(",")}</output>;
  return <section>
    <output data-testid="loading">{String(result.loading)}</output>
    <output data-testid="error">{result.error?.message ?? ""}</output>
    <output data-testid="students">{result.classList?.roster.map(s => s.firstName).join(",") ?? ""}</output>
    <output data-testid="class">{result.classList?.grade ?? ""}</output>
    <output data-testid="year">{result.schoolYear}</output>
    <output data-testid="not-found">{String(result.notFound)}</output>
    <button onClick={result.retry}>Retry query</button>
  </section>;
}
function Harness() {
  const auth = useAuth();
  const [originalScope] = useState(auth.sessionScope);
  const [mounted, setMounted] = useState(true);
  const [preview, setPreview] = useState(true);
  const [secondary, setSecondary] = useState(false);
  const [target, setTarget] = useState<ClassListTarget | undefined>({ type: "class", id: 1 });
  return <>
    <output data-testid="auth">{auth.isLoading ? "pending" : auth.user?.id ?? "signed-out"}</output>
    <button onClick={() => setPreview(p => !p)}>Toggle preview</button>
    <button onClick={() => setMounted(p => !p)}>Toggle roster</button>
    <button onClick={() => setSecondary(p => !p)}>Toggle second observer</button>
    <button onClick={() => setTarget({ type: "class", id: 1 })}>Class 1</button>
    <button onClick={() => setTarget({ type: "class", id: 2 })}>Class 2</button>
    <button onClick={() => setTarget({ type: "grade", id: 1 })}>Grade 1</button>
    <button onClick={() => setTarget(undefined)}>Missing target</button>
    <button onClick={() => auth.setUser(account("2"))}>Switch account</button>
    {["ADMIN", "TEACHER", "PARENT"].map(role => <button key={role} onClick={() => auth.setUser(account("1", role))}>Switch {role}</button>)}
    <button onClick={() => void auth.login(account("1"))}>Login again</button>
    <button onClick={auth.logout}>Logout</button>
    <button onClick={() => auth.expireSession(originalScope)}>Expire old session</button>
    <RoutePreviewContext.Provider value={preview}>
      {mounted && <Roster target={target} />}
      {secondary && <Roster target={target} secondary />}
    </RoutePreviewContext.Provider>
  </>;
}
createRoot(document.getElementById("root")!).render(
  <StrictMode><QueryClientProvider client={queryClient}><AuthProvider><Harness /></AuthProvider></QueryClientProvider></StrictMode>,
);
