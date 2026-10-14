import { useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { onlineManager, useQuery } from "@tanstack/react-query";
import { useAuth } from "@shared/hooks/useAuth";
import { useRoutePreview } from "@shared/loading/RoutePreview";
import { QueryHttpError } from "@shared/http/QueryHttpError";
import { principalDashboardKeys } from "@shared/query/queryClient";
import type { Term } from "../data/types";
import { fetchActiveAcademicYear, fetchActiveTerm, getPrincipalDashboardData } from "../services/principalDashboard.service";
import { dashboardOfflineError } from "./dashboardOfflineError";

const policy = { staleTime: 30_000, gcTime: 5 * 60_000 };
const subscribe = (notify: () => void) => onlineManager.subscribe(notify);
const getOnline = () => onlineManager.isOnline();
const forbidden = (error: unknown) => error instanceof QueryHttpError && error.status === 403;

export function usePrincipalDashboardData() {
  const { user, isLoading, sessionScope, expireSession } = useAuth();
  const preview = useRoutePreview();
  const online = useSyncExternalStore(subscribe, getOnline);
  const enabled = !preview && !isLoading && user?.role === "PRINCIPAL";
  const role = user?.role ?? "", userId = String(user?.id ?? "");
  const lifecycle = useRef({ mounted: false, sessionScope, enabled });
  useLayoutEffect(() => {
    const current = { mounted: true, sessionScope, enabled };
    lifecycle.current = current;
    // Route-scoped providers can miss online/offline events while unmounted.
    // Synchronize before Query observers subscribe and dispatch their requests.
    onlineManager.setOnline(navigator.onLine);
    return () => { current.mounted = false; };
  }, [sessionScope, enabled]);
  const options = (signal: AbortSignal) => ({ signal, onUnauthorized: () => expireSession(sessionScope) });
  const term = useQuery({
    ...policy, queryKey: principalDashboardKeys.term(sessionScope, role, userId), enabled,
    queryFn: ({ signal }) => fetchActiveTerm(options(signal)),
  });
  const year = useQuery({
    ...policy, queryKey: principalDashboardKeys.year(sessionScope, role, userId), enabled,
    queryFn: ({ signal }) => fetchActiveAcademicYear(options(signal)),
  });
  // Backend readers select the active context themselves. Resolve it before
  // snapshot reads, including stale remounts, to avoid old-context requests.
  const context = term.data;
  const today = new Date();
  const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const snapshot = useQuery({
    ...policy,
    queryKey: principalDashboardKeys.snapshot(sessionScope, role, userId, context?.schoolYearId ?? null, context?.id ?? null, context?.termNumber ?? null, date),
    enabled: enabled && !!context && !term.isFetching && !term.isPaused && !forbidden(term.error) && !forbidden(year.error),
    queryFn: ({ signal }) => getPrincipalDashboardData({ ...options(signal), activeTerm: context! }),
  });
  const denied = forbidden(term.error) || forbidden(year.error) || forbidden(snapshot.error);
  const data = enabled && !denied ? snapshot.data ?? null : null;
  const paused = term.isPaused || snapshot.isPaused;
  const offline = enabled && (!online || paused);
  const requestError = (!term.isFetching ? term.error : null) ?? (!term.isFetching && !snapshot.isFetching ? snapshot.error : null);
  const error = enabled ? denied ? (term.error ?? year.error ?? snapshot.error)
    : requestError ?? (offline ? dashboardOfflineError : null) : null;
  const fetching = term.isFetching || year.isFetching || snapshot.isFetching;
  const refetch = async () => {
    if (!enabled || !online || paused || year.isPaused || fetching) return;
    const [nextTerm, nextYear] = await Promise.all([term.refetch({ cancelRefetch: false }), year.refetch({ cancelRefetch: false })]);
    if (!lifecycle.current.mounted || !lifecycle.current.enabled || lifecycle.current.sessionScope !== sessionScope) return;
    if (!nextTerm.isSuccess || forbidden(nextYear.error)) return;
    // A changed context enables its own new snapshot key. Do not also refresh
    // the old key; unchanged context needs an explicit refresh, even if fresh.
    if (context && nextTerm.data.id === context.id && nextTerm.data.schoolYearId === context.schoolYearId && nextTerm.data.termNumber === context.termNumber) {
      void snapshot.refetch({ cancelRefetch: false });
    }
  };
  // User selection is local, stable across background refreshes, and isolated
  // from a different login/year. All three ranking terms arrive in one payload.
  const selectionScope = JSON.stringify([sessionScope, role, userId, context?.schoolYearId ?? null]);
  const [selection, setSelection] = useState<{ scope: string; term: Term } | null>(null);
  const rankingTerm = selection?.scope === selectionScope ? selection.term : data?.currentTerm ?? "Term 1";
  return {
    data,
    loading: !enabled || (online && !paused && !error && !data && (term.isPending || term.isFetching || snapshot.isPending || snapshot.isFetching)),
    error,
    rankingTerm,
    setRankingTerm: (value: Term) => setSelection({ scope: selectionScope, term: value }),
    refetch,
    academicYear: enabled && !denied ? year.data ?? null : null,
    yearLoading: !enabled || (online && !year.isPaused && !year.error && !year.data && year.isPending),
    yearError: enabled ? (!year.isFetching ? year.error : null) ?? (offline && !year.data ? dashboardOfflineError : null) : null,
    retryYear: () => { if (enabled && online && !year.isPaused && !year.isFetching) void year.refetch({ cancelRefetch: false }); },
  };
}
