import { useCallback, useLayoutEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { onlineManager, useMutation, useQuery } from '@tanstack/react-query';
import { queryClient } from '@shared/query/queryClient';
import { useAuth } from '@shared/hooks/useAuth';
import { useRoutePreview } from '@shared/loading/RoutePreview';
import { UserService, type UserWritePayload, type UserWriteResult } from '../services/user-record.service';
import type { UsersContextValue, UsersSeed } from '../context/UsersContext';

export const adminUsersKeys = {
  all: (session: number, role: string, userId: string) => ['session', session, role, userId, 'admin', 'users'] as const,
  list: (session: number, role: string, userId: string) => [...adminUsersKeys.all(session, role, userId), 'list'] as const,
};
export const usersOfflineError = 'You are offline. Check your connection and try again.';
const subscribe = (notify: () => void) => onlineManager.subscribe(notify);
type Write = { kind: 'create' | 'update'; payload: UserWritePayload; id?: string } | { kind: 'delete'; id: string; role: string };
export function useAdminUsersQueries(seed: UsersSeed | undefined, isCurrent: () => boolean, onTeacherChanged: () => void): UsersContextValue {
  const { user, isLoading, sessionScope, expireSession } = useAuth(), preview = useRoutePreview();
  const online = useSyncExternalStore(subscribe, () => onlineManager.isOnline());
  const enabled = !preview && !isLoading && user?.role === 'ADMIN';
  useLayoutEffect(() => { onlineManager.setOnline(navigator.onLine); }, [sessionScope, enabled]);
  const key = useMemo(() => adminUsersKeys.list(sessionScope, user?.role ?? '', String(user?.id ?? '')), [sessionScope, user?.role, user?.id]);
  const expire = useCallback(() => { if (isCurrent()) expireSession(sessionScope); }, [isCurrent, expireSession, sessionScope]);
  const query = useQuery({ queryKey: key, enabled, staleTime: 30_000, gcTime: 5 * 60_000, retry: false,
    refetchOnWindowFocus: false, refetchOnReconnect: true, initialData: seed?.data, initialDataUpdatedAt: seed?.updatedAt,
    queryFn: ({ signal }) => UserService.getAllUsers({ signal, onUnauthorized: () => { if (!signal.aborted) expire(); } }),
  });
  const { mutateAsync } = useMutation({ retry: false, networkMode: 'always',
    mutationFn: async (write: Write) => {
      if (!enabled || !isCurrent()) throw new Error('Your session changed. Please sign in again.');
      if (!navigator.onLine) throw new Error(usersOfflineError);
      const options = { onUnauthorized: expire };
      if (write.kind === 'delete') return UserService.deleteUser(write.id, write.role, options);
      return write.kind === 'create' ? UserService.addUser(write.payload, options) : UserService.updateUser(write.id!, write.payload, options);
    },
    onSuccess: async (_data, write) => {
      if (!isCurrent()) return;
      if ((write.kind === 'delete' ? write.role : write.payload.role).toUpperCase() === 'TEACHER') onTeacherChanged();
      const dashboard = ['session', sessionScope, user?.role ?? '', String(user?.id ?? ''), 'admin', 'dashboard'];
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: key, exact: true }),
        queryClient.invalidateQueries({ queryKey: [...dashboard, 'users'] }),
        queryClient.invalidateQueries({ queryKey: [...dashboard, 'audit'] }),
      ]);
    },
  });
  const pending = useRef(new Map<string, Promise<UserWriteResult>>());
  const run = useCallback((write: Write) => {
    const identity = JSON.stringify(write), existing = pending.current.get(identity);
    if (existing) return existing;
    const promise = mutateAsync(write).then(result => {
      if (!isCurrent()) throw new Error('Your session changed. Please sign in again.');
      return result;
    }).finally(() => pending.current.delete(identity));
    pending.current.set(identity, promise);
    return promise;
  }, [mutateAsync, isCurrent]);
  const { isPaused, isFetching, refetch } = query;
  const refetchUsers = useCallback(async () => {
    if (enabled && isCurrent() && onlineManager.isOnline() && !isPaused && !isFetching) await refetch({ cancelRefetch: false });
  }, [enabled, isCurrent, isPaused, isFetching, refetch]);
  const forbidden = query.error !== null && 'status' in query.error && query.error.status === 403;
  const offline = enabled && (!online || query.isPaused);
  const users = useMemo(() => enabled && !forbidden ? query.data ?? [] : [], [enabled, forbidden, query.data]);
  const loading = !enabled || (!offline && (query.isPending || query.isFetching));
  const error = !enabled ? null : offline ? usersOfflineError : query.isFetching ? null : query.error?.message ?? null;
  return useMemo(() => ({ users, loading, error, forbidden, refetchUsers,
    getUser: (role: string, id: string) => users.find(u => u.id === id && u.role === role.toUpperCase()),
    getActivePrincipal: (excludeId?: string) => users.find(u => u.role === 'PRINCIPAL' && u.status === 'Active' && u.id !== excludeId),
    saveUser: (payload: UserWritePayload, id?: string) => run({ kind: id ? 'update' : 'create', id, payload }),
    addUser: async (payload: UserWritePayload) => (await run({ kind: 'create', payload })).data,
    updateUser: async (id: string, role: string, payload: UserWritePayload) => { await run({ kind: 'update', id, payload: { ...payload, role: role.toUpperCase() as UserWritePayload['role'] } }); },
    deleteUser: async (id: string, role: string) => { await run({ kind: 'delete', id, role }); },
    activateQueries: () => {},
  }), [users, loading, error, forbidden, refetchUsers, run]);
}
