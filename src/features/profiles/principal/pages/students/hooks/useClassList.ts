import { useSyncExternalStore } from "react";
import { onlineManager, useQuery } from "@tanstack/react-query";
import { useAuth } from "@shared/hooks/useAuth";
import { useRoutePreview } from "@shared/loading/RoutePreview";
import { QueryHttpError } from "@shared/http/QueryHttpError";
import { principalStudentKeys } from "@shared/query/queryClient";
import type { ClassList } from "../data/types";
import { getClassList, getUnassignedClassList, getRosterAcademicYear } from "../services/students.service";
import { rosterOfflineError } from "./rosterOfflineError";

export type ClassListTarget =
  | { type: "class"; id: number }
  | { type: "grade"; id: number };

interface UseClassListResult {
  classList: ClassList | null;
  schoolYear: string;
  loading: boolean;
  error: Error | null;
  notFound: boolean;
  retry: () => void;
}

const subscribeToConnection = (notify: () => void) => onlineManager.subscribe(notify);
const getOnline = () => onlineManager.isOnline();
// Membership is more dynamic than directory summaries. No polling or focus
// refresh: fresh returns reuse data; stale returns revalidate after 30 seconds.
const rosterPolicy = { staleTime: 30_000, gcTime: 5 * 60_000 };
const denied = (error: unknown) => error instanceof QueryHttpError && error.status === 403;

export function useClassList(target: ClassListTarget | undefined): UseClassListResult {
  const { user, isLoading, sessionScope, expireSession } = useAuth();
  const preview = useRoutePreview();
  const online = useSyncExternalStore(subscribeToConnection, getOnline);
  const authorized = !preview && !isLoading && user?.role === "PRINCIPAL";
  const enabled = authorized && !!target;
  const role = user?.role ?? "";
  const userId = String(user?.id ?? "");
  const guardSession = async <T,>(request: Promise<T>, signal: AbortSignal): Promise<T> => {
    try {
      return await request;
    } catch (error) {
      if (!signal.aborted && error instanceof QueryHttpError && error.status === 401) expireSession(sessionScope);
      throw error;
    }
  };
  const year = useQuery({
    ...rosterPolicy,
    queryKey: principalStudentKeys.rosterYear(sessionScope, role, userId),
    enabled,
    queryFn: ({ signal }) => guardSession(getRosterAcademicYear(signal), signal),
  });
  const roster = useQuery({
    ...rosterPolicy,
    queryKey: principalStudentKeys.roster(sessionScope, role, userId, year.data?.id ?? null, target?.type ?? "class", target?.id ?? null),
    enabled: enabled && !!year.data && !denied(year.error),
    queryFn: ({ signal }) => {
      if (!target) throw new Error("Missing class list target");
      return guardSession(target.type === "class" ? getClassList(target.id, signal) : getUnassignedClassList(target.id, signal), signal);
    },
  });
  const paused = year.isPaused || roster.isPaused;
  const fetching = year.isFetching || roster.isFetching;
  const permissionDenied = denied(year.error) || denied(roster.error);
  const data = enabled && !permissionDenied ? roster.data : undefined;
  // A settled endpoint failure must remain visible while its sibling is pending.
  const requestError = (!year.isFetching ? year.error : null) ?? (!roster.isFetching ? roster.error : null);
  const error = enabled ? !online || paused ? rosterOfflineError : requestError : null;
  const loading = !authorized || (enabled && online && !paused && !error && data === undefined && (year.isPending || roster.isPending || fetching));
  return {
    classList: data ?? null,
    schoolYear: enabled && !permissionDenied ? year.data?.label ?? "" : "",
    loading,
    error,
    notFound: authorized && !loading && (!target || (data === null && (!error || error === rosterOfflineError))),
    retry: () => {
      if (!enabled || !online || paused || fetching) return;
      void year.refetch();
      // Initial year failures recover through the dependent roster query.
      if (year.data && !denied(year.error)) void roster.refetch();
    },
  };
}
