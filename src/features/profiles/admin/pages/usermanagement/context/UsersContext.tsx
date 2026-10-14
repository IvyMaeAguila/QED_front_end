import { createContext, lazy, Suspense, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@shared/hooks/useAuth';
import { useRoutePreview } from '@shared/loading/RoutePreview';
import type { Role, UserAccount, UserStatus } from '../types/user';
import { UserService, type UserWritePayload, type UserWriteResult } from '../services/user-record.service';

export type NewUserInput = Omit<UserAccount, 'id' | 'lastLogin'>;
export type UserUpdateInput = NewUserInput;
export interface UsersContextValue {
  users: UserAccount[]; loading: boolean; error: string | null; forbidden: boolean;
  refetchUsers: () => Promise<void>;
  getUser: (role: string, id: string) => UserAccount | undefined;
  getActivePrincipal: (excludeId?: string) => UserAccount | undefined;
  addUser: (input: NewUserInput) => Promise<UserAccount>;
  updateUser: (id: string, role: string, input: UserUpdateInput) => Promise<void>;
  deleteUser: (id: string, role: string) => Promise<void>;
  saveUser: (input: UserWritePayload, id?: string) => Promise<UserWriteResult>;
  activateQueries: () => void;
}
export interface UsersSeed { data?: UserAccount[]; updatedAt?: number }
export interface UsersQueryDriverProps {
  seed?: UsersSeed;
  publish: (value: UsersContextValue | undefined) => void;
  isCurrent: () => boolean;
}
const QueryDriver = lazy(() => import('../UsersQueryDriver'));
const UsersContext = createContext<UsersContextValue | undefined>(undefined);
const emptyUsers: UserAccount[] = [];
const unavailable = async (): Promise<never> => { throw new Error('User Management is not ready. Please try again.'); };

export function UsersProvider({ children }: { children: ReactNode }) {
  const { sessionScope, user } = useAuth();
  // Reset the facade and page drafts at an authorization boundary, not at refresh.
  return <SessionUsersProvider key={`${sessionScope}:${user?.role}:${user?.id}`}>{children}</SessionUsersProvider>;
}
function SessionUsersProvider({ children }: { children: ReactNode }) {
  const { user, isLoading, sessionScope, expireSession } = useAuth();
  const preview = useRoutePreview(), location = useLocation();
  const userRoute = /^\/admin\/users(?:\/|$)/.test(location.pathname);
  const ready = !preview && !isLoading && user?.role === 'ADMIN';
  const [legacy, setLegacy] = useState<{ users: UserAccount[]; loading: boolean; error: string | null; updatedAt?: number }>({ users: emptyUsers, loading: true, error: null });
  const [retired, setRetired] = useState(false), [requested, setRequested] = useState(false);
  const [seed, setSeed] = useState<UsersSeed>(), [bridge, setBridge] = useState<UsersContextValue>();
  const [attempt, setAttempt] = useState(0);
  const current = useRef(false);
  useLayoutEffect(() => { current.current = true; return () => { current.current = false; }; }, []);
  const isCurrent = useCallback(() => current.current, []);
  if (!userRoute && requested) setRequested(false);
  const activateQueries = useCallback(() => {
    if (!ready || !userRoute) return;
    if (!retired) {
      setSeed(legacy.updatedAt ? { data: legacy.users, updatedAt: legacy.updatedAt } : undefined);
      setLegacy({ users: emptyUsers, loading: false, error: null });
      setRetired(true);
    }
    setRequested(true);
  }, [ready, userRoute, retired, legacy]);
  const publish = useCallback((value: UsersContextValue | undefined) => {
    if (!current.current) return;
    setBridge(value);
    if (value) setSeed(undefined); // Query owns the data; no competing legacy cache.
  }, []);
  useEffect(() => {
    // Preserve the existing Query-free Dashboard startup read until ownership is
    // handed off. Direct User Management routes wait for their real page adapter.
    if (!ready || retired || userRoute) return;
    const controller = new AbortController();
    void UserService.getAllUsers({ signal: controller.signal, onUnauthorized: () => {
      if (current.current && !controller.signal.aborted) expireSession(sessionScope);
    } }).then(users => {
      if (!controller.signal.aborted && current.current) setLegacy({ users, loading: false, error: null, updatedAt: Date.now() });
    }, error => {
      if (!controller.signal.aborted && current.current) setLegacy({ users: emptyUsers, loading: false, error: error instanceof Error ? error.message : 'Failed to load users' });
    });
    return () => controller.abort();
  }, [ready, retired, userRoute, attempt, expireSession, sessionScope]);
  const fallback = useMemo<UsersContextValue>(() => {
    const users = ready && !retired ? legacy.users : emptyUsers;
    return {
      users, loading: isLoading || (ready && (userRoute || (!retired && legacy.loading))),
      error: !ready ? null : retired ? null : legacy.error, forbidden: false,
      refetchUsers: async () => { if (ready && !retired && !legacy.loading) { setLegacy(previous => ({ ...previous, loading: true, error: null })); setAttempt(value => value + 1); } },
      getUser: (role, id) => users.find(u => u.id === id && u.role === role.toUpperCase()),
      getActivePrincipal: excludeId => users.find(u => u.role === 'PRINCIPAL' && u.status === 'Active' && u.id !== excludeId),
      addUser: unavailable, updateUser: unavailable, deleteUser: unavailable, saveUser: unavailable, activateQueries,
    };
  }, [ready, retired, legacy, isLoading, userRoute, activateQueries]);
  return <UsersContext.Provider value={ready && userRoute && requested && bridge ? { ...bridge, activateQueries } : fallback}>
    {ready && userRoute && requested && <Suspense fallback={null}><QueryDriver seed={seed} publish={publish} isCurrent={isCurrent}/></Suspense>}
    {children}
  </UsersContext.Provider>;
}
export function useUsers() {
  const value = useContext(UsersContext);
  if (!value) throw new Error('useUsers must be used within a UsersProvider');
  return value;
}
export function principalConflict(role: Role, status: UserStatus, activePrincipal: UserAccount | undefined): UserAccount | undefined {
  if (role !== 'PRINCIPAL' || status !== 'Active') return undefined;
  return activePrincipal;
}
