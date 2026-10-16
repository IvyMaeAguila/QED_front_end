import { useLayoutEffect, useState, useSyncExternalStore } from "react";
import { onlineManager, useQuery, type UseQueryResult } from "@tanstack/react-query";
import { useAuth } from "@shared/hooks/useAuth";
import { useRoutePreview } from "@shared/loading/RoutePreview";
import { adminDashboardOfflineError, defaultAuditFilters, type AdminDashboardData, type DashboardReader } from "../AdminDashboardDataContext";
import { DashboardService } from "../services/totalCounts.service";
import { getLoginFrequency, LoginFrequencyServiceError, type LoginFrequencyPeriod } from "../services/loginFrequency.service";
import { fetchAuditLogs, type AuditLogFilters } from "../services/auditLogs.service";

export const adminDashboardKeys = {
  all: (generation: number, role: string, userId: string) => ["session", generation, role, userId, "admin", "dashboard"] as const,
  resource: (generation: number, role: string, userId: string, resource: "users" | "students" | "frequency" | "audit", ...filters: (string | number)[]) =>
    [...adminDashboardKeys.all(generation, role, userId), resource, ...filters] as const,
};
const subscribe = (notify: () => void) => onlineManager.subscribe(notify);
const getOnline = () => onlineManager.isOnline();
const denied = (error: unknown) => error instanceof Error && "status" in error && error.status === 403;

export function useAdminDashboardQueries(): AdminDashboardData {
  const { user, isLoading, sessionScope, expireSession } = useAuth();
  const preview = useRoutePreview();
  const online = useSyncExternalStore(subscribe, getOnline);
  const enabled = !preview && !isLoading && user?.role === "ADMIN";
  useLayoutEffect(() => {
    // This route-scoped provider can miss network events while unmounted.
    // Reconcile before Query observers subscribe or dispatch requests.
    onlineManager.setOnline(navigator.onLine);
  }, [sessionScope, enabled]);
  const [selectedPeriod, setSelectedPeriod] = useState<LoginFrequencyPeriod>("weekly");
  const [filters, setFilters] = useState<AuditLogFilters>(defaultAuditFilters);
  const key = (resource: "users" | "students" | "frequency" | "audit", ...params: (string | number)[]) =>
    adminDashboardKeys.resource(sessionScope, user?.role ?? "", String(user?.id ?? ""), resource, ...params);
  const options = { enabled, staleTime: 30_000, gcTime: 5 * 60_000, retry: false as const,
    refetchOnWindowFocus: false, refetchOnReconnect: true };
  const expire = (signal: AbortSignal) => () => { if (!signal.aborted) expireSession(sessionScope); };
  const users = useQuery({ ...options, queryKey: key("users"),
    queryFn: ({ signal }) => DashboardService.getUserCounts({ signal, onUnauthorized: expire(signal) }) });
  const students = useQuery({ ...options, queryKey: key("students"),
    queryFn: ({ signal }) => DashboardService.getTotalStudents({ signal, onUnauthorized: expire(signal) }) });
  const frequency = useQuery({ ...options, queryKey: key("frequency", selectedPeriod),
    refetchInterval: enabled ? 30_000 : false, refetchIntervalInBackground: true,
    queryFn: ({ signal }) => getLoginFrequency(selectedPeriod, signal, expire(signal)) });
  const audit = useQuery({ ...options, queryKey: key("audit", filters.page, filters.search, filters.role, filters.action, filters.from, filters.to, 20),
    queryFn: ({ signal }) => fetchAuditLogs(filters, signal, expire(signal)) });
  function reader<T>(query: UseQueryResult<T, Error>): DashboardReader<T> {
    const offline = enabled && (!online || query.isPaused);
    return {
      data: enabled && !denied(query.error) ? query.data : undefined,
      loading: !enabled || (!offline && (query.isPending || query.isFetching)),
      error: !enabled ? null : offline ? adminDashboardOfflineError : query.isFetching ? null : query.error,
      forbidden: denied(query.error),
      retry: () => { if (enabled && online && !query.isPaused && !query.isFetching) void query.refetch({ cancelRefetch: false }); },
    };
  }
  const u = reader(users), s = reader(students);
  const countsError = u.error ?? s.error;
  const forbidden = u.forbidden || s.forbidden;
  const counts = {
    data: !forbidden && u.data !== undefined && s.data !== undefined ? { ...u.data, totalStudents: s.data } : undefined,
    loading: !countsError && (u.loading || s.loading), error: countsError, forbidden,
    retry: () => {
      u.retry(); s.retry();
    },
  };
  const login = reader(frequency);
  if (login.error && login.error !== adminDashboardOfflineError && !(login.error instanceof LoginFrequencyServiceError)) {
    login.error = new Error("Nagka-error sa pagkuha ng login frequency.");
  }
  return { counts, frequency: login, audit: reader(audit), selectedPeriod, setSelectedPeriod, filters, setFilters };
}
