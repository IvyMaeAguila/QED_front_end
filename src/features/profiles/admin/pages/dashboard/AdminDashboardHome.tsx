import { useOutletContext } from "react-router-dom";
import { StatCards } from "./components/StatCards";
import { LoginFrequency } from "./components/LoginFrequency";
import { PerformanceByGrade } from "./components/PerformanceByGrade";
import type { AdminThemeContext } from "../AdminLayout";

export function AdminDashboardHome() {
  const theme = useOutletContext<AdminThemeContext>();

  return (
    <>
      <StatCards panelBg={theme.panelBg} panelBorder={theme.panelBorder} textPrimary={theme.textPrimary} />
      <LoginFrequency {...theme} />
      <PerformanceByGrade {...theme} />
    </>
  );
}