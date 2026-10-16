import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../src/features/auth/context/authContext';
import { queryClient } from '../src/shared/query/queryClient';
import { RoutePreviewContext } from '../src/shared/loading/RoutePreview';
import { usePrincipalGradeSheet } from '../src/features/profiles/principal/pages/gradebooks/hooks/usePrincipalGradeSheet';
import type { UserProfile } from '../src/shared/profile/types/types';
type Params = { gradeLevelId: number; sectionId?: number; gradingPeriodId?: number };
function Reader({ params, select }: { params: Params; select: (id: number) => void }) {
  const s = usePrincipalGradeSheet(params);
  useEffect(() => { if (params.gradingPeriodId === undefined && s.defaultGradingPeriodId !== null) select(s.defaultGradingPeriodId); }, [params.gradingPeriodId, s.defaultGradingPeriodId, select]);
  return <section data-testid="reader">
    <output data-testid="loading">{String(s.loading)}</output><output data-testid="error">{s.error ?? ''}</output>
    <output data-testid="data">{JSON.stringify(s.students)}</output><output data-testid="year">{s.schoolYear}</output>
    <output data-testid="section">{s.sectionName}</output><output data-testid="periods">{JSON.stringify(s.gradingPeriods)}</output>
    <output data-testid="not-found">{String(s.notFound)}</output><output data-testid="cached-offline">{String(s.cachedOffline)}</output>
    <button onClick={s.retry}>Retry</button>
  </section>;
}
function Harness() {
  const auth = useAuth(); const [mounted, setMounted] = useState(true), [preview, setPreview] = useState(true), [second, setSecond] = useState(false);
  const [params, setParams] = useState<Params>({ gradeLevelId: 1, sectionId: 11, gradingPeriodId: 1 });
  const account = (id: string, role = 'PRINCIPAL') => ({ id, role, userName: id, name: id }) as UserProfile;
  const select = (gradingPeriodId: number) => setParams(p => ({ ...p, gradingPeriodId }));
  return <><output data-testid="auth">{auth.isLoading ? 'pending' : auth.user?.id ?? 'signed-out'}</output>
    <button onClick={() => setPreview(v => !v)}>Toggle preview</button><button onClick={() => setMounted(v => !v)}>Toggle reader</button><button onClick={() => setSecond(v => !v)}>Second reader</button>
    {[1, 2].map(n => <button key={n} onClick={() => select(n)}>Term {n}</button>)}
    <button onClick={() => setParams(p => ({ ...p, gradingPeriodId: undefined }))}>Default term</button>
    <button onClick={() => setParams({ gradeLevelId: 2, gradingPeriodId: 1 })}>Unassigned grade</button>
    <button onClick={() => setParams(p => ({ ...p, sectionId: 12 }))}>Other section</button>
    <button onClick={() => auth.setUser(account('2'))}>Switch account</button>
    {['ADMIN', 'TEACHER', 'PARENT'].map(r => <button key={r} onClick={() => auth.setUser(account('1', r))}>Switch {r}</button>)}
    <button onClick={auth.logout}>Logout</button><button onClick={() => void auth.login(account('1'))}>Login</button>
    <RoutePreviewContext.Provider value={preview}>{mounted && <><Reader params={params} select={select} />{second && <Reader params={params} select={select} />}</>}</RoutePreviewContext.Provider>
  </>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><QueryClientProvider client={queryClient}><AuthProvider><Harness /></AuthProvider></QueryClientProvider></StrictMode>);
