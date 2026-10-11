import { useSyncExternalStore } from "react";
import { onlineManager, useQuery } from "@tanstack/react-query";
import { useAuth } from "@shared/hooks/useAuth";
import { useRoutePreview } from "@shared/loading/RoutePreview";
import { directoryKeys } from "@shared/query/queryClient";
import { QueryHttpError } from "@shared/http/QueryHttpError";
import { directoryOfflineError } from "./directoryOfflineError";
import type { TeacherSummary } from "../data/types";
import { getTeachers, getDirectorySchoolYear } from "../services/teachers.service";

interface UseTeachersDirectoryResult {
  retry: () => void;
  teachers: TeacherSummary[];
  schoolYear: string;
  loading: boolean;
  error: Error | null;
}

const subscribeToConnection = (notify: () => void) => onlineManager.subscribe(notify);
const getOnline = () => onlineManager.isOnline();

export function useTeachersDirectory(): UseTeachersDirectoryResult {
  const { user, isLoading, sessionScope, expireSession } = useAuth();
  const preview = useRoutePreview();
  const online = useSyncExternalStore(subscribeToConnection, getOnline);
  const enabled = !preview && !isLoading && user?.role === "PRINCIPAL";
  const query = useQuery({
    queryKey: directoryKeys.session(sessionScope, user?.role ?? "", String(user?.id ?? "")),
    enabled,
    queryFn: async ({ signal }) => {
      // Attach to each request: Promise.all only exposes the first rejection.
      const guardSession = async <T,>(request: Promise<T>): Promise<T> => {
        try {
          return await request;
        } catch (error) {
          if (!signal.aborted && error instanceof QueryHttpError && error.status === 401) {
            expireSession(sessionScope);
          }
          throw error;
        }
      };
      const [teachers, schoolYear] = await Promise.all([
        guardSession(getTeachers(signal)), guardSession(getDirectorySchoolYear(signal)),
      ]);
      return { teachers, schoolYear };
    },
  });
  return {
    teachers: enabled ? query.data?.teachers ?? [] : [],
    schoolYear: enabled ? query.data?.schoolYear ?? "" : "",
    // Like the old cached hook, keep fresh/cached rows usable during refresh.
    loading: !enabled || (online && !query.isPaused && query.data === undefined && (query.isPending || query.isFetching)),
    error: enabled ? !online || query.isPaused ? directoryOfflineError : !query.isFetching ? query.error : null : null,
    // A paused query resumes once on reconnect. Don't enqueue duplicate retries.
    retry: () => { if (enabled && online && !query.isPaused && !query.isFetching) void query.refetch(); },
  };
}
