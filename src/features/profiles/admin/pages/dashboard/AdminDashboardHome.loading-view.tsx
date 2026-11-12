import { useLoadingOutletContext as useOutletContext } from "@shared/loading/RoutePreview";
import { AuditLogs } from "./components/AuditLogs";
import { LoginFrequency } from "./components/LoginFrequency";
import { StatCards } from "./components/StatCards";
// import { PerformanceByGrade } from "./components/PerformanceByGrade";
import type { AdminThemeContext } from "../AdminLayout";

function useAdminDashboardHomeState(activity: boolean) {
  const theme = useOutletContext<AdminThemeContext>();
  const { panelBg, panelBorder, textPrimary, textMuted } = theme;

  return { content: ((
    <div className="flex flex-col gap-6">
      <h1 className={`qed-type-page-title ${textPrimary}`}>{activity ? "Account Activity" : "Dashboard"}</h1>
      {activity ? <>
        <LoginFrequency {...theme} />
        <AuditLogs {...theme} />
      </> : <StatCards
        panelBg={panelBg}
        panelBorder={panelBorder}
        textPrimary={textPrimary}
        textMuted={textMuted}
      />}
    </div>
  )), scope: {  } };
}

export type AdminDashboardHomeEffectScope = ReturnType<typeof useAdminDashboardHomeState>["scope"];
export type AdminDashboardHomeRouteProps = Record<string, never>;
export function AdminDashboardHomeComposition(props: { activity?: boolean; effects?: (scope: AdminDashboardHomeEffectScope) => import("react").ReactNode }) {
 const state = useAdminDashboardHomeState(props.activity ?? false);
 return <>{props.effects?.(state.scope)}{state.content}</>;
}

export function AdminAccountActivityComposition() {
  return <AdminDashboardHomeComposition activity />;
}
