import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "../src/features/auth/context/authContext";
import { queryClient } from "../src/shared/query/queryClient";
import { RoutePreviewContext } from "../src/shared/loading/RoutePreview";
import { useSubjectAnalytics } from "../src/features/profiles/principal/pages/reports/hooks/useSubjectAnalytics";
import { useHolisticAnalytics } from "../src/features/profiles/principal/pages/reports/hooks/useHolisticAnalytics";
import type { UserProfile } from "../src/shared/profile/types/types";
const account = (id: string, role = "PRINCIPAL") => ({ id, role, name: id, userName: id }) as UserProfile;
function Subject() {
  const s = useSubjectAnalytics();
  return <section data-testid="subjects"><output data-testid="loading">{String(s.loading)}</output><output data-testid="error">{s.error?.message ?? ""}</output>
    <output data-testid="data">{JSON.stringify(s.wholeElementaryRanking)}</output><output data-testid="term">{s.term}</output><output data-testid="grade">{s.gradeFilter}</output>
    <output data-testid="options">{JSON.stringify([s.termOptions, s.gradeOptions])}</output>
    <button onClick={s.retry}>Retry subjects</button>{(["Term 1", "Term 2", "Term 3"] as const).map(t => <button key={t} onClick={() => s.setTerm(t)}>{t}</button>)}
    <button onClick={() => s.setGradeFilter("Grade 1")}>Grade 1</button>
  </section>;
}
function Holistic() {
  const s = useHolisticAnalytics();
  return <section data-testid="holistic"><output data-testid="loading">{String(s.loading)}</output><output data-testid="error">{s.error?.message ?? ""}</output>
    <output data-testid="data">{JSON.stringify(s.rows)}</output><output data-testid="term">{s.term}</output><output data-testid="view">{s.view}</output>
    <output data-testid="options">{JSON.stringify([s.termOptions, s.viewOptions])}</output>
    <button onClick={s.retry}>Retry holistic</button>{(["Term 1", "Term 2", "Term 3"] as const).map(t => <button key={t} onClick={() => s.setTerm(t)}>{t}</button>)}
    <button onClick={() => s.setView("By Subject")}>By Subject</button><button onClick={() => s.setView("By Grade Level")}>By Grade Level</button>
  </section>;
}
function Harness() {
  const auth = useAuth();
  const [mounted, setMounted] = useState(true), [preview, setPreview] = useState(true), [holistic, setHolistic] = useState(false), [secondary, setSecondary] = useState(false);
  return <><output data-testid="auth">{auth.isLoading ? "pending" : auth.user?.id ?? "signed-out"}</output>
    <button onClick={() => setPreview(p => !p)}>Toggle preview</button><button onClick={() => setMounted(p => !p)}>Toggle analytics</button>
    <button onClick={() => setHolistic(p => !p)}>Toggle holistic</button><button onClick={() => setSecondary(p => !p)}>Toggle second observer</button>
    <button onClick={() => auth.setUser(account("2"))}>Switch account</button>{["ADMIN", "TEACHER", "PARENT"].map(role => <button key={role} onClick={() => auth.setUser(account("1", role))}>Switch {role}</button>)}
    <button onClick={() => void auth.login(account("1"))}>Login again</button><button onClick={auth.logout}>Logout</button>
    <RoutePreviewContext.Provider value={preview}>{mounted && <><Subject/>{holistic && <Holistic/>}{secondary && <div data-testid="secondary"><Subject/></div>}</>}</RoutePreviewContext.Provider>
  </>;
}
createRoot(document.getElementById("root")!).render(<StrictMode><QueryClientProvider client={queryClient}><AuthProvider><Harness/></AuthProvider></QueryClientProvider></StrictMode>);
