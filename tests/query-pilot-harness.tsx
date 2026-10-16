import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "../src/features/auth/context/authContext";
import { queryClient } from "../src/shared/query/queryClient";
import { RoutePreviewContext } from "../src/shared/loading/RoutePreview";
import { useTeachersDirectory } from "../src/features/profiles/principal/pages/teachers/hooks/useTeachersDirectory";
import type { UserProfile } from "../src/shared/profile/types/types";

const account = (id: string, role = "PRINCIPAL") => ({ id, role, name: id, userName: id }) as UserProfile;
function Directory() {
  const result = useTeachersDirectory();
  return <section>
    <output data-testid="loading">{String(result.loading)}</output>
    <output data-testid="error">{result.error?.message ?? ""}</output>
    <output data-testid="teachers">{result.teachers.map(t => t.fullName).join(",")}</output>
    <output data-testid="year">{result.schoolYear}</output>
    <button onClick={result.retry}>Retry query</button>
  </section>;
}
function Harness() {
  const auth = useAuth();
  const [originalScope] = useState(auth.sessionScope);
  const [mounted, setMounted] = useState(true);
  const [preview, setPreview] = useState(true);
  return <>
    <output data-testid="auth">{auth.isLoading ? "pending" : auth.user?.id ?? "signed-out"}</output>
    <output data-testid="scope">{auth.sessionScope}</output>
    <button onClick={() => setPreview(p => !p)}>Toggle preview</button>
    <button onClick={() => setMounted(p => !p)}>Toggle directory</button>
    <button onClick={() => auth.setUser(account("2"))}>Switch account</button>
    <button onClick={() => auth.setUser(account("1", "TEACHER"))}>Switch role</button>
    <button onClick={() => void auth.login(account("1"))}>Login again</button>
    <button onClick={auth.logout}>Logout</button>
    <button onClick={() => auth.expireSession(originalScope)}>Expire old session</button>
    <RoutePreviewContext.Provider value={preview}>{mounted && <Directory />}</RoutePreviewContext.Provider>
  </>;
}
createRoot(document.getElementById("root")!).render(
  <StrictMode><QueryClientProvider client={queryClient}><AuthProvider><Harness /></AuthProvider></QueryClientProvider></StrictMode>,
);
