import { useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { onlineManager, useQuery } from "@tanstack/react-query";
import { useAuth } from "@shared/hooks/useAuth";
import { useRoutePreview } from "@shared/loading/RoutePreview";
import { QueryHttpError } from "@shared/http/QueryHttpError";
import { principalAnalyticsKeys, principalStudentKeys } from "@shared/query/queryClient";
import { getRosterAcademicYear } from "../../students/services/students.service";
import { getTermOptions, type AnalyticsRequestOptions } from "../services/reports.service";
import { analyticsOfflineError } from "./analyticsOfflineError";

const dataPolicy = { staleTime: 30_000, gcTime: 5 * 60_000 };
const lookupPolicy = { staleTime: 5 * 60_000, gcTime: 10 * 60_000 };
const subscribe = (notify: () => void) => onlineManager.subscribe(notify);
const getOnline = () => onlineManager.isOnline();
const forbidden = (error: unknown) => error instanceof QueryHttpError && error.status === 403;

// Only the two Principal Analytics readers own this adapter. UI selections and
// all numeric/chart transforms remain in their existing hooks/components.
export function useAnalyticsReads<T, F>(
  resource: "subjects" | "holistic", filters: string[],
  readData: (options: AnalyticsRequestOptions) => Promise<T>,
  filterResource: "grades" | "views", readFilters: (options: AnalyticsRequestOptions) => Promise<F>,
) {
  const { user, isLoading, sessionScope, expireSession } = useAuth();
  const preview = useRoutePreview();
  const online = useSyncExternalStore(subscribe, getOnline);
  const enabled = !preview && !isLoading && user?.role === "PRINCIPAL";
  const role = user?.role ?? "", userId = String(user?.id ?? "");
  const requestScope = JSON.stringify([sessionScope, role, userId, resource, ...filters]);
  const lifecycle = useRef({ mounted: false, enabled, requestScope });
  useLayoutEffect(() => {
    const current = { mounted: true, enabled, requestScope };
    lifecycle.current = current;
    // A route-scoped provider can miss events while absent.
    onlineManager.setOnline(navigator.onLine);
    return () => { current.mounted = false; };
  }, [enabled, requestScope]);
  const options = (signal: AbortSignal): AnalyticsRequestOptions => ({ signal, onUnauthorized: () => expireSession(sessionScope) });
  const year = useQuery({
    ...dataPolicy, queryKey: principalStudentKeys.rosterYear(sessionScope, role, userId), enabled,
    queryFn: async ({ signal }) => {
      // Avoid dispatch from the immediately cancelled StrictMode mount.
      await Promise.resolve(); signal.throwIfAborted();
      try { return await getRosterAcademicYear(signal); }
      catch (error) {
        if (!signal.aborted && error instanceof QueryHttpError && error.status === 401) expireSession(sessionScope);
        throw error;
      }
    },
  });
  const yearId = year.data?.id ?? null;
  const [contextCheck, setContextCheck] = useState({ selection: requestScope, updatedAt: year.dataUpdatedAt, refresh: false });
  if (contextCheck.selection !== requestScope) {
    setContextCheck({ selection: requestScope, updatedAt: year.dataUpdatedAt, refresh: year.data !== undefined && year.isStale });
  }
  const needsContextRefresh = contextCheck.refresh && contextCheck.updatedAt === year.dataUpdatedAt;
  const refetchYear = year.refetch;
  useLayoutEffect(() => {
    // A term/view change is another server read even while this route remains
    // mounted. Resolve stale implicit year context before enabling its new key.
    if (enabled && contextCheck.refresh) void refetchYear({ cancelRefetch: false });
  }, [contextCheck, enabled, refetchYear]);
  const key = (name: "terms" | "grades" | "views" | "subjects" | "holistic", ...params: string[]) => principalAnalyticsKeys.resource(sessionScope, role, userId, yearId, name, ...params);
  // Endpoints choose active year internally. Revalidate stale context before
  // dispatching reads, rather than fetching under an obsolete year key.
  const ready = enabled && yearId !== null && !needsContextRefresh && !year.isFetching && !year.isPaused && !year.error;
  const terms = useQuery({ ...lookupPolicy, queryKey: key("terms"), enabled: ready, queryFn: ({ signal }) => getTermOptions(options(signal)) });
  const filterOptions = useQuery({ ...lookupPolicy, queryKey: key(filterResource), enabled: ready, queryFn: ({ signal }) => readFilters(options(signal)) });
  const dataKey = key(resource, ...filters);
  const result = useQuery({
    ...dataPolicy, queryKey: dataKey, enabled: ready, queryFn: ({ signal }) => readData(options(signal)),
    // Retain the previous term/view during its loading transition, as before.
    // Never borrow a placeholder across a session, role, user or school year.
    placeholderData: (previous, previousQuery) => online && previousQuery && JSON.stringify(previousQuery.queryKey.slice(0, 7)) === JSON.stringify(dataKey.slice(0, 7)) ? previous : undefined,
  });
  const queries = [result, terms, filterOptions, year];
  const permissionError = queries.find(q => forbidden(q.error))?.error;
  const fetching = queries.some(q => q.isFetching), paused = queries.some(q => q.isPaused);
  const offline = enabled && (!online || paused);
  const requestError = !year.isFetching ? queries.find(q => !q.isFetching && q.error)?.error : null;
  const error = enabled ? permissionError ?? (offline ? analyticsOfflineError : requestError ?? null) : null;
  const visible = enabled && !permissionError;
  const hasData = visible && result.data !== undefined;
  const retry = async () => {
    if (!enabled || !online || paused || fetching) return;
    const next = await year.refetch({ cancelRefetch: false });
    if (!lifecycle.current.mounted || !lifecycle.current.enabled || lifecycle.current.requestScope !== requestScope || !next.isSuccess) return;
    // New context enables its own new keys; unchanged context needs explicit
    // refresh of all three original report requests, including fresh lookups.
    if (next.data.id === yearId) {
      void terms.refetch({ cancelRefetch: false });
      void filterOptions.refetch({ cancelRefetch: false });
      void result.refetch({ cancelRefetch: false });
    }
  };
  return {
    data: visible ? result.data : undefined,
    terms: visible ? terms.data : undefined,
    filters: visible ? filterOptions.data : undefined,
    loading: !enabled || (online && !paused && !error && (fetching || year.isPending || terms.isPending || filterOptions.isPending || result.isPending)),
    error, retry: () => { void retry(); }, cachedOffline: offline && hasData && error === analyticsOfflineError,
    dataScope: JSON.stringify([sessionScope, role, userId, yearId]),
  };
}
