import { useLoadingOutletContext as useOutletContext } from "@shared/loading/RoutePreview";
import { AuditLogs } from "./components/AuditLogs";
import { LoginFrequency } from "./components/LoginFrequency";
import { StatCards } from "./components/StatCards";
// import { PerformanceByGrade } from "./components/PerformanceByGrade";
import type { AdminThemeContext } from "../AdminLayout";

function useAdminDashboardHomeState() {
  const theme = useOutletContext<AdminThemeContext>();
  const { panelBg, panelBorder, textPrimary, textMuted } = theme;

  return { content: ((
    <div className="flex flex-col gap-6">
      <StatCards
        panelBg={panelBg}
        panelBorder={panelBorder}
        textPrimary={textPrimary}
        textMuted={textMuted}
      />
      <LoginFrequency {...theme} />
      <AuditLogs {...theme} />
    </div>
  )), scope: {  } };
}

export type AdminDashboardHomeEffectScope = ReturnType<typeof useAdminDashboardHomeState>["scope"];
export type AdminDashboardHomeRouteProps = Record<string, never>;
export function AdminDashboardHomeComposition(props: object & { effects?: (scope: AdminDashboardHomeEffectScope) => import("react").ReactNode }) {
 const state = useAdminDashboardHomeState();
 return <>{props.effects?.(state.scope)}{state.content}</>;
}
