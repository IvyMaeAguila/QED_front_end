import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../src/features/auth/context/authContext';
import { queryClient } from '../src/shared/query/queryClient';
import { RoutePreviewContext } from '../src/shared/loading/RoutePreview';
import { usePrincipalGradebooks } from '../src/features/profiles/principal/pages/gradebooks/hooks/usePrincipalGradebooks';
import type { UserProfile } from '../src/shared/profile/types/types';
function Reader() { const s = usePrincipalGradebooks(); return <section data-testid="reader"><output data-testid="loading">{String(s.loading)}</output><output data-testid="error">{s.error ?? ''}</output><output data-testid="data">{JSON.stringify(s.gradeLevels)}</output><output data-testid="year">{s.schoolYear}</output><button onClick={s.retry}>Retry</button></section>; }
function Harness() { const auth = useAuth(); const [mounted, setMounted] = useState(true), [preview, setPreview] = useState(true), [second, setSecond] = useState(false); const account = (id: string, role = 'PRINCIPAL') => ({ id, role, userName: id, name: id }) as UserProfile; return <><output data-testid="auth">{auth.isLoading ? 'pending' : auth.user?.id ?? 'signed-out'}</output><button onClick={() => setPreview(v => !v)}>Toggle preview</button><button onClick={() => setMounted(v => !v)}>Toggle reader</button><button onClick={() => setSecond(v => !v)}>Second reader</button><button onClick={() => auth.setUser(account('2'))}>Switch account</button>{['ADMIN', 'TEACHER', 'PARENT'].map(r => <button key={r} onClick={() => auth.setUser(account('1', r))}>Switch {r}</button>)}<button onClick={auth.logout}>Logout</button><button onClick={() => void auth.login(account('1'))}>Login</button><RoutePreviewContext.Provider value={preview}>{mounted && <><Reader />{second && <Reader />}</>}</RoutePreviewContext.Provider></>; }
createRoot(document.getElementById('root')!).render(<StrictMode><QueryClientProvider client={queryClient}><AuthProvider><Harness /></AuthProvider></QueryClientProvider></StrictMode>);
