import { useOutletContext } from "react-router-dom";
import { StatCards } from "./components/StatCards";
import { LoginFrequency } from "./components/LoginFrequency";
import { AuditLogs } from "./components/AuditLogs";
// import { PerformanceByGrade } from "./components/PerformanceByGrade";
import type { AdminThemeContext } from "../AdminLayout";

export function AdminDashboardHome() {
  const theme = useOutletContext<AdminThemeContext>();
  const { panelBg, panelBorder, textPrimary, textMuted } = theme;

  return (
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
  );
}