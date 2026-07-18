import { useOutletContext } from "react-router-dom";
import { StatCards } from "./components/StatCards";
import { DailyLoginFrequency } from "./components/DailyLoginFrequency";
import { PerformanceByGrade } from "./components/PerformanceByGrade";
import type { AdminThemeContext } from "../shared/AdminLayout";

export function AdminDashboardHome() {
  const theme = useOutletContext<AdminThemeContext>();

  return (
    <>
      <StatCards panelBg={theme.panelBg} panelBorder={theme.panelBorder} textPrimary={theme.textPrimary} />
      <DailyLoginFrequency {...theme} />
      <PerformanceByGrade {...theme} />
    </>
  );
}