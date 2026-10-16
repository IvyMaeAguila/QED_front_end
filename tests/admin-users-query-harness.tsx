import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../src/features/auth/context/authContext';
import { UsersProvider, useUsers } from '../src/features/profiles/admin/pages/usermanagement/context/UsersContext';
import { useUserQueries } from '../src/features/profiles/admin/pages/usermanagement/hooks/useUserQueries';
import { TeachersProvider } from '../src/features/profiles/admin/pages/classes/context/TeachersContext';
import { RoutePreviewContext } from '../src/shared/loading/RoutePreview';
import { queryClient } from '../src/shared/query/queryClient';
import type { UserProfile } from '../src/shared/profile/types/types';
export function Panel() {
  const u = useUsers(); const [result, setResult] = useState('');
  const input = { firstName: 'Created', lastName: 'Fixture', middleName: '', role: 'TEACHER' as const, email: 'created@example.invalid', contactNumber: '00000000000', status: 'Active' as const, gender: 'Male' as const };
  const write = (task: Promise<unknown>) => { setResult('pending'); void task.then(() => setResult('success'), error => setResult(error.message)); };
  return <section>
    <output data-testid="users-data">{JSON.stringify(u.users)}</output><output data-testid="users-loading">{String(u.loading)}</output>
    <output data-testid="users-error">{u.error ?? ''}</output><output data-testid="write-result">{result}</output>
    <output data-testid="principal">{JSON.stringify(u.getActivePrincipal())}</output>
    <button onClick={() => void u.refetchUsers()}>Retry users</button>
    <button onClick={() => write(u.addUser(input))}>Create Teacher</button>
    <button onClick={() => write(u.updateUser('1', 'PARENT', { ...input, role: 'PARENT', status: 'Active', firstName: 'Changed' }))}>Edit Parent</button>
    <button onClick={() => write(u.deleteUser('1', 'TEACHER'))}>Delete Teacher</button>
  </section>;
}
export function Activation() { useUserQueries(); return null; }
export function Harness() {
  const auth = useAuth(), navigate = useNavigate(), location = useLocation();
  const [mounted, setMounted] = useState(true), [preview, setPreview] = useState(true), [cache, setCache] = useState('');
  return <>
    <output data-testid="auth">{auth.isLoading ? 'pending' : auth.user?.id ?? 'signed-out'}</output>
    <output data-testid="location">{location.pathname}</output><output data-testid="cache">{cache}</output>
    <button onClick={() => navigate('/admin/users')}>Open users</button><button onClick={() => navigate('/admin/classes')}>Leave users</button>
    <button onClick={() => setMounted(v => !v)}>Toggle provider</button><button onClick={() => setPreview(v => !v)}>Toggle preview</button>
    <button onClick={() => setCache(JSON.stringify(queryClient.getQueryCache().getAll().map(q => ({ key: q.queryKey, data: q.state.data, invalidated: q.state.isInvalidated, observers: q.getObserversCount() }))))}>Inspect cache</button>
    <button onClick={() => { for (const resource of ['users', 'students', 'audit', 'frequency']) queryClient.setQueryData(['session', auth.sessionScope, 'ADMIN', String(auth.user?.id), 'admin', 'dashboard', resource], { fixture: true }); }}>Seed Dashboard</button>
    <button onClick={() => auth.setUser({ id: '2', role: 'ADMIN', name: 'Second', userName: 'second' } as UserProfile)}>Switch account</button>
    {(['ADMIN', 'TEACHER', 'PRINCIPAL', 'PARENT'] as const).map(role => <button key={role} onClick={() => auth.setUser({ id: '1', role, name: 'Fixture', userName: 'fixture' } as UserProfile)}>Switch {role}</button>)}
    <button onClick={() => void auth.login({ id: '1', role: 'ADMIN' } as UserProfile)}>Login again</button><button onClick={auth.logout}>Logout</button>
    <RoutePreviewContext.Provider value={preview}><TeachersProvider>{mounted && <UsersProvider>{location.pathname === '/admin/users' && <Activation/>}<Panel/></UsersProvider>}</TeachersProvider></RoutePreviewContext.Provider>
  </>;
}
const app = <AuthProvider><MemoryRouter initialEntries={['/admin/classes']}><Harness/></MemoryRouter></AuthProvider>;
// Exact-count lifecycle cases use a controlled single mount. A dedicated case
// and the actual Vite pages retain StrictMode cancellation-probe coverage.
createRoot(document.getElementById('root')!).render(new URL(location.href).searchParams.has('strict') ? <StrictMode>{app}</StrictMode> : app);
