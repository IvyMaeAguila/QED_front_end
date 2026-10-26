import {useReadFreshness} from '@shared/query/readFreshness';
import { useLayoutEffect, useRef, useSyncExternalStore } from "react";
import { onlineManager, useQuery } from "@tanstack/react-query";
import { useAuth } from "@shared/hooks/useAuth";
import { useRoutePreview } from "@shared/loading/RoutePreview";
import { QueryHttpError } from "@shared/http/QueryHttpError";
import { principalGradebookKeys, principalStudentKeys } from "@shared/query/queryClient";
import { getRosterAcademicYear } from "../../students/services/students.service";
import { fetchGradeLevelSummaries } from "../services/gradebooks.service";

const policy = { staleTime: 30_000, gcTime: 5 * 60_000 };
const offlineError = "You're offline. Check your connection and try again.";
const subscribe = (notify: () => void) => onlineManager.subscribe(notify);
const getOnline = () => onlineManager.isOnline();
const forbidden = (error: unknown) => error instanceof QueryHttpError && error.status === 403;

// Only the read-only overview is migrated. Grade-sheet/term readers and all
// grade computations stay in their existing owners.
export function usePrincipalGradebooks() {
  const { user, isLoading, sessionScope, expireSession } = useAuth();
  const preview = useRoutePreview();
  const online = useSyncExternalStore(subscribe, getOnline);
  const enabled = !preview && !isLoading && user?.role === "PRINCIPAL";
  const role = user?.role ?? "", userId = String(user?.id ?? "");
  const identity = JSON.stringify([sessionScope, role, userId]);
  const lifecycle = useRef({ mounted: false, enabled, identity });
  useLayoutEffect(() => {
    const current = { mounted: true, enabled, identity };
    lifecycle.current = current;
    // Providers are route-scoped and may miss browser connection events.
    onlineManager.setOnline(navigator.onLine);
    return () => { current.mounted = false; };
  }, [enabled, identity]);
  const year = useQuery({
    ...policy, queryKey: principalStudentKeys.rosterYear(sessionScope, role, userId), enabled,
    queryFn: async ({ signal }) => {
      await Promise.resolve(); signal.throwIfAborted();
      try { return await getRosterAcademicYear(signal); }
      catch (error) {
        if (!signal.aborted && error instanceof QueryHttpError && error.status === 401) expireSession(sessionScope);
        throw error;
      }
    },
  });
  const yearId = year.data?.id ?? null;
  // The summary endpoint chooses active year internally. Resolve stale context
  // first, rather than storing a new-year response under an old-year key.
  const summaries = useQuery({
    ...policy, queryKey: principalGradebookKeys.overview(sessionScope, role, userId, yearId),
    enabled: enabled && yearId !== null && !year.isFetching && !year.isPaused && !year.error,
    queryFn: ({ signal }) => fetchGradeLevelSummaries(signal, () => expireSession(sessionScope)),
  });
  const queries = [year, summaries];
  const permissionError = queries.find(q => forbidden(q.error))?.error;
  const fetching = queries.some(q => q.isFetching), paused = queries.some(q => q.isPaused);
  const offline = enabled && (!online || paused);
  const requestError = !year.isFetching ? queries.find(q => !q.isFetching && q.error)?.error : null;
  const error = enabled ? permissionError?.message ?? (offline ? offlineError : requestError?.message ?? null) : null;
  const visible = enabled && !permissionError;
  const retry = async () => {
    if (!enabled || !online || paused || fetching) return;
    const next = await year.refetch({ cancelRefetch: false });
    if (!lifecycle.current.mounted || !lifecycle.current.enabled || lifecycle.current.identity !== identity || !next.isSuccess) return;
    if (next.data.id === yearId) await summaries.refetch({ cancelRefetch: false });
  };
  useReadFreshness(JSON.stringify([identity,'gradebooks']), enabled, retry);
  return {
    gradeLevels: visible ? summaries.data ?? [] : [],
    schoolYear: visible ? year.data?.label ?? "" : "",
    loading: !enabled || (online && !paused && !error && (fetching || year.isPending || summaries.isPending)),
    error, retry: () => { void retry(); },
    cachedOffline: offline && visible && summaries.data !== undefined && error === offlineError,
    dataScope: JSON.stringify([sessionScope, role, userId, yearId]),
  };
}
