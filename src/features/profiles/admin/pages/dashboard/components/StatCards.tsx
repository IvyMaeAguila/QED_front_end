import { isTransientReadFailure } from "@shared/query/safeReadPolicy";
import { Users } from "lucide-react";
import { OverviewCard } from "../../../../shared/components/DashboardUI";
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
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4" data-sk-region="statcards-div-field-1">
      {statsConfig.map(({ key, label }, index) => (
        <div key={key} data-sk-fixed-region={`admin-stat-${label}`}>
          <OverviewCard {...theme} label={label} icon={Users} showIcon={false} compact
            variant={index === 0 ? "spotlight" : "primary"} sub={null}
            value={<>
              {cachedOffline && <span role="alert" className="block text-sm">
                {error?.message}<button type="button" className="ml-2 font-semibold underline" onClick={retry}>Retry</button>
              </span>}
              <LoadingRegion key={String(forbidden)} as="span" loading={loading}
                error={cachedOffline ? null : error} retry={retry} skeleton={<SkeletonText width="3ch" />}>
                {error && !cachedOffline ? "—" : (data?.[key] ?? 0).toLocaleString()}
              </LoadingRegion>
            </>}
          />
        </div>
      ))}
    </div>
  );
}
