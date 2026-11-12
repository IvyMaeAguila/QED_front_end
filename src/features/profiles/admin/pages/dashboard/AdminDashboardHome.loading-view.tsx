import { useLoadingOutletContext as useOutletContext } from "@shared/loading/RoutePreview";
import type { ReactNode } from "react";
import { AdminOverviewSkeleton } from "./components/AdminOverviewSkeleton";
import { AuditLogs } from "./components/AuditLogs";
import { LoginFrequency } from "./components/LoginFrequency";
import { StatCards } from "./components/StatCards";
import type { AdminThemeContext } from "../AdminLayout";

function useAdminDashboardHomeState(activity: boolean, overview: ReactNode) {
  const theme = useOutletContext<AdminThemeContext>();
  const { textPrimary } = theme;

  return { content: ((
    <div className="flex flex-col gap-6">
      {activity ? <>
        <h1 className={`qed-type-page-title ${textPrimary}`}>Account Activity</h1>
        <LoginFrequency {...theme} />
        <AuditLogs {...theme} />
      </> : <>
        <StatCards {...theme} />
        {overview ?? <AdminOverviewSkeleton {...theme} />}
      </>}
    </div>
  )), scope: {  } };
}

export type AdminDashboardHomeEffectScope = ReturnType<typeof useAdminDashboardHomeState>["scope"];
export type AdminDashboardHomeRouteProps = Record<string, never>;
export function AdminDashboardHomeComposition(props: { activity?: boolean; overview?: ReactNode; effects?: (scope: AdminDashboardHomeEffectScope) => import("react").ReactNode }) {
 const state = useAdminDashboardHomeState(props.activity ?? false, props.overview);
 return <>{props.effects?.(state.scope)}{state.content}</>;
}

export function AdminAccountActivityComposition() {
  return <AdminDashboardHomeComposition activity />;
}
