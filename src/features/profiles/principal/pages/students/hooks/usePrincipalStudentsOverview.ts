import { useSyncExternalStore } from "react";
import { onlineManager, useQuery } from "@tanstack/react-query";
import { useAuth } from "@shared/hooks/useAuth";
import { useRoutePreview } from "@shared/loading/RoutePreview";
import { principalStudentKeys } from "@shared/query/queryClient";
import { QueryHttpError } from "@shared/http/QueryHttpError";
import type { GradeLevelSummary } from "../data/types";
import { getGradeLevels, getOverviewSchoolYear } from "../services/students.service";
import { studentsOfflineError } from "./studentsOfflineError";

interface UsePrincipalStudentsOverviewResult {
  gradeLevels: GradeLevelSummary[];
  totalStudents: number;
  schoolYear: string;
  loading: boolean;
  error: Error | null;
  retry: () => void;
}

const subscribeToConnection = (notify: () => void) => onlineManager.subscribe(notify);
const getOnline = () => onlineManager.isOnline();

export function usePrincipalStudentsOverview(): UsePrincipalStudentsOverviewResult {
  const { user, isLoading, sessionScope, expireSession } = useAuth();
  const preview = useRoutePreview();
  const online = useSyncExternalStore(subscribeToConnection, getOnline);
  const enabled = !preview && !isLoading && user?.role === "PRINCIPAL";
  const query = useQuery({
    queryKey: principalStudentKeys.overview(sessionScope, user?.role ?? "", String(user?.id ?? "")),
    enabled,
    queryFn: async ({ signal }) => {
      // Each endpoint must detect expiry even if its sibling rejects first.
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
      const [gradeLevels, schoolYear] = await Promise.all([
        guardSession(getGradeLevels(signal)), guardSession(getOverviewSchoolYear(signal)),
      ]);
      return { gradeLevels, schoolYear };
    },
  });
  const gradeLevels = enabled ? query.data?.gradeLevels ?? [] : [];
  return {
    gradeLevels,
    totalStudents: gradeLevels.reduce((sum, g) => sum + g.totalStudents, 0),
    schoolYear: enabled ? query.data?.schoolYear ?? "" : "",
    loading: !enabled || (online && !query.isPaused && query.data === undefined && (query.isPending || query.isFetching)),
    error: enabled ? !online || query.isPaused ? studentsOfflineError : !query.isFetching ? query.error : null : null,
    retry: () => { if (enabled && online && !query.isPaused && !query.isFetching) void query.refetch(); },
  };
}

