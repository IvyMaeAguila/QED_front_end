import { useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { onlineManager, useQuery } from "@tanstack/react-query";
import { useAuth } from "@shared/hooks/useAuth";
import { useRoutePreview } from "@shared/loading/RoutePreview";
import { QueryHttpError } from "@shared/http/QueryHttpError";
import { principalGradebookKeys, principalStudentKeys } from "@shared/query/queryClient";
import { getRosterAcademicYear } from "../../students/services/students.service";
import { fetchGradingPeriods, fetchPrincipalGradebook, type PrincipalGradebookParams } from "../services/gradebooks.service";

const policy = { staleTime: 30_000, gcTime: 5 * 60_000 };
const offlineError = "You're offline. Check your connection and try again.";
const subscribe = (notify: () => void) => onlineManager.subscribe(notify);
const getOnline = () => onlineManager.isOnline();
const forbidden = (error: unknown) => error instanceof QueryHttpError && error.status === 403;
type SheetParams = Omit<PrincipalGradebookParams, "gradingPeriodId"> & { gradingPeriodId?: string | number };

// Principal read boundary only: grade transforms and all writers stay unchanged.
export function usePrincipalGradeSheet(params: SheetParams, requested = true) {
  const { gradeLevelId, gradingPeriodId, sectionId } = params;
  const { user, isLoading, sessionScope, expireSession } = useAuth();
  const preview = useRoutePreview();
  const online = useSyncExternalStore(subscribe, getOnline);
  const enabled = requested && !preview && !isLoading && user?.role === "PRINCIPAL";
  const role = user?.role ?? "", userId = String(user?.id ?? "");
  const requestScope = JSON.stringify([sessionScope, role, userId, gradeLevelId, sectionId ?? null, gradingPeriodId ?? null]);
  const lifecycle = useRef({ mounted: false, enabled, requestScope });
  const retrying = useRef<string | null>(null);
  useLayoutEffect(() => {
    const current = { mounted: true, enabled, requestScope };
    lifecycle.current = current;
    onlineManager.setOnline(navigator.onLine);
    return () => { current.mounted = false; };
  }, [enabled, requestScope]);
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
  const [yearCheck, setYearCheck] = useState({ selection: requestScope, updatedAt: year.dataUpdatedAt, refresh: false });
  if (yearCheck.selection !== requestScope) {
    setYearCheck({ selection: requestScope, updatedAt: year.dataUpdatedAt, refresh: year.data !== undefined && year.isStale });
  }
  const needsYear = yearCheck.refresh && yearCheck.updatedAt === year.dataUpdatedAt;
  const refetchYear = year.refetch;
  useLayoutEffect(() => {
    if (enabled && needsYear) void refetchYear({ cancelRefetch: false });
  }, [enabled, needsYear, refetchYear]);
  // Active year is implicit at both endpoints. Revalidate stale context before
  // dependent reads on navigation or term changes, without inventing API args.
  const yearReady = enabled && yearId !== null && !needsYear && !year.isFetching && !year.isPaused && !year.error;
  const periods = useQuery({
    ...policy, queryKey: principalGradebookKeys.periods(sessionScope, role, userId, yearId, gradeLevelId, sectionId), enabled: yearReady,
    queryFn: ({ signal }) => fetchGradingPeriods({ gradeLevelId, sectionId }, signal, () => expireSession(sessionScope)),
  });
  const periodScope = JSON.stringify([requestScope, yearId]);
  const [periodCheck, setPeriodCheck] = useState({ selection: periodScope, updatedAt: periods.dataUpdatedAt, refresh: false });
  if (periodCheck.selection !== periodScope) {
    setPeriodCheck({ selection: periodScope, updatedAt: periods.dataUpdatedAt, refresh: periods.data !== undefined && periods.isStale });
  }
  const needsPeriods = periodCheck.refresh && periodCheck.updatedAt === periods.dataUpdatedAt;
  const refetchPeriods = periods.refetch;
  useLayoutEffect(() => {
    if (yearReady && needsPeriods) void refetchPeriods({ cancelRefetch: false });
  }, [yearReady, needsPeriods, refetchPeriods]);
  const contextReady = yearReady && !needsPeriods && periods.data !== undefined && !periods.isFetching && !periods.isPaused && !periods.error;
  const key = principalGradebookKeys.sheet(sessionScope, role, userId, yearId, gradeLevelId, sectionId, gradingPeriodId);
  const sheet = useQuery({
    ...policy, queryKey: key, enabled: contextReady && gradingPeriodId !== undefined,
    queryFn: ({ signal }) => fetchPrincipalGradebook({ gradeLevelId, sectionId, gradingPeriodId: gradingPeriodId! }, signal, () => expireSession(sessionScope)),
    // Retain the original slow-term transition only within this authorization,
    // year, grade and section. Another term is never cached offline content.
    placeholderData: (previous, previousQuery) => online && previousQuery && JSON.stringify(previousQuery.queryKey.slice(0, 10)) === JSON.stringify(key.slice(0, 10)) ? previous : undefined,
  });
  const queries = [year, periods, sheet];
  const permissionError = queries.find(q => forbidden(q.error))?.error;
  const fetching = queries.some(q => q.isFetching), paused = queries.some(q => q.isPaused);
  const offline = enabled && (!online || paused);
  const requestError = !year.isFetching && !periods.isFetching ? queries.find(q => !q.isFetching && q.error)?.error : null;
  const error = enabled ? permissionError?.message ?? (offline ? offlineError : requestError?.message ?? null) : null;
  const visible = enabled && !permissionError;
  const data = visible ? sheet.data : undefined;
  const periodsLoading = !enabled || (online && !paused && !error && (year.isPending || year.isFetching || needsYear || periods.isPending || periods.isFetching || needsPeriods));
  const loading = !enabled || (online && !paused && !error && (periodsLoading || (gradingPeriodId !== undefined && (sheet.isPending || sheet.isFetching))));
  const retry = async () => {
    if (!enabled || !online || paused || fetching || retrying.current === requestScope) return;
    retrying.current = requestScope;
    const current = () => lifecycle.current.mounted && lifecycle.current.enabled && lifecycle.current.requestScope === requestScope;
    try {
      const nextYear = await year.refetch({ cancelRefetch: false });
      if (!current() || !nextYear.isSuccess || nextYear.data.id !== yearId) return;
      const nextPeriods = await periods.refetch({ cancelRefetch: false });
      if (!current() || !nextPeriods.isSuccess || gradingPeriodId === undefined) return;
      await sheet.refetch({ cancelRefetch: false });
    } finally {
      if (retrying.current === requestScope) retrying.current = null;
    }
  };
  return {
    students: data?.students ?? [], subjects: data?.subjects ?? [],
    schoolYear: data ? year.data?.label ?? "" : "", sectionName: data?.sectionName ?? null,
    loading, error, notFound: data === null, ready: data != null,
    retry: () => { void retry(); }, retryPeriods: () => { void retry(); },
    gradingPeriods: visible ? periods.data?.periods ?? [] : [], periodsLoading,
    periodError: enabled && !offline && !year.isFetching && !periods.isFetching ? periods.error?.message ?? null : null,
    defaultGradingPeriodId: visible && contextReady ? periods.data?.defaultGradingPeriodId ?? null : null,
    cachedOffline: offline && visible && sheet.data !== undefined && !sheet.isPlaceholderData && error === offlineError,
    dataScope: JSON.stringify([sessionScope, role, userId, yearId, String(gradeLevelId), sectionId ?? null]),
  };
}
