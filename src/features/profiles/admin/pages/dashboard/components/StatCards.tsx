import { isTransientReadFailure } from "@shared/query/safeReadPolicy";
import { LoadingRegion } from "@shared/loading/LoadingRegion";
import { SkeletonText } from "@shared/components/SkeletonLoading";
import { statsConfig } from "../data/Dashboarddata";
import { useAdminDashboardData, adminDashboardOfflineError } from "../AdminDashboardDataContext";
import type { AdminThemeContext } from "../../AdminLayout";

export function StatCards(theme: AdminThemeContext) {
  const { counts: state } = useAdminDashboardData();
  const { data, loading, error, retry, forbidden } = state;
  const cachedOffline = !forbidden && data !== undefined &&
    (error === adminDashboardOfflineError || isTransientReadFailure(error));

  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4" data-sk-region="statcards-div-field-1">
      {statsConfig.map(({ key, label }) => (
        <div key={key} data-sk-fixed-region={`admin-stat-${label}`}>
          <div className={`flex h-full flex-col justify-center gap-1.5 rounded-table border px-4 py-3 shadow-card ${theme.panelBg} ${theme.panelBorder}`}>
            <p className={`qed-type-kpi-label uppercase tracking-wider ${theme.textMuted}`}>{key === "totalUsers" ? "Staff & parent accounts" : label}</p>
            <div className="qed-type-kpi leading-none tracking-tight text-maroon">
              {cachedOffline && <span role="alert" className="block text-sm">
                {error?.message}<button type="button" className="ml-2 font-semibold underline" onClick={retry}>Retry</button>
              </span>}
              <LoadingRegion key={String(forbidden)} as="span" loading={loading}
                error={cachedOffline ? null : error} retry={retry} skeleton={<SkeletonText width="3ch" />}>
                {error && !cachedOffline ? "—" : (data?.[key] ?? 0).toLocaleString()}
              </LoadingRegion>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
