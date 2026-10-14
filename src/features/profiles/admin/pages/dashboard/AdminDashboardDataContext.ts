import { createContext, useContext, type Dispatch, type SetStateAction } from "react";
import type { DashboardCounts } from "./services/totalCounts.service";
import type { LoginFrequencyPeriod, LoginFrequencyResponse } from "./services/loginFrequency.service";
import type { AuditLogFilters, AuditLogPage } from "./services/auditLogs.service";

// Preview/presentation contract only. No Query runtime in the eager Admin graph.
export const adminDashboardOfflineError = new Error("You are offline. Check your connection and try again.");
export interface DashboardReader<T> {
  data: T | undefined; loading: boolean; error: Error | null; retry: () => void; forbidden: boolean;
}
export const defaultAuditFilters: AuditLogFilters = { page: 1, search: "", role: "", action: "", from: "", to: "" };
export interface AdminDashboardData {
  counts: DashboardReader<DashboardCounts>;
  frequency: DashboardReader<LoginFrequencyResponse>;
  audit: DashboardReader<AuditLogPage>;
  selectedPeriod: LoginFrequencyPeriod;
  setSelectedPeriod: Dispatch<SetStateAction<LoginFrequencyPeriod>>;
  filters: AuditLogFilters;
  setFilters: Dispatch<SetStateAction<AuditLogFilters>>;
}
const pending = { data: undefined, loading: true, error: null, retry: () => {}, forbidden: false };
export const AdminDashboardDataContext = createContext<AdminDashboardData>({
  counts: pending, frequency: pending, audit: pending,
  selectedPeriod: "weekly", setSelectedPeriod: () => {}, filters: defaultAuditFilters, setFilters: () => {},
});
export const useAdminDashboardData = () => useContext(AdminDashboardDataContext);
