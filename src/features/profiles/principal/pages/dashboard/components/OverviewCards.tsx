import { Users, GraduationCap, TrendingUp, AlertTriangle } from "lucide-react";
import { OverviewCard } from "../../../../shared/components/DashboardUI";
import type { OverviewData } from "../data/types";

interface OverviewCardsProps {
  overview: OverviewData;
  currentTermLabel: string;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
  darkMode: boolean;
}

export function OverviewCards({
  overview,
  currentTermLabel,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
  darkMode,
}: OverviewCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5">
      <OverviewCard
        label="Total Students"
        value={overview.totalStudents.toLocaleString()}
        sub="Currently enrolled"
        icon={GraduationCap}
        variant="spotlight"
        panelBg={panelBg}
        panelBorder={panelBorder}
        textPrimary={textPrimary}
        textMuted={textMuted}
        darkMode={darkMode}
      />
      <OverviewCard
        label="Total Teachers"
        value={overview.totalTeachers.toString()}
        sub="Active teachers"
        icon={Users}
        variant="gold"
        panelBg={panelBg}
        panelBorder={panelBorder}
        textPrimary={textPrimary}
        textMuted={textMuted}
        darkMode={darkMode}
      />
      <OverviewCard
        label="Overall Attendance"
        value={`${overview.attendance}%`}
        sub={`${currentTermLabel} average`}
        icon={TrendingUp}
        trend={overview.attendance >= 93 ? "up" : "down"}
        variant="primary"
        panelBg={panelBg}
        panelBorder={panelBorder}
        textPrimary={textPrimary}
        textMuted={textMuted}
        darkMode={darkMode}
      />
      <OverviewCard
        label="Academic Performance"
        value={`${overview.academicPerf}%`}
        sub={`${currentTermLabel} overall`}
        icon={TrendingUp}
        trend={overview.academicPerf >= 82 ? "up" : "down"}
        variant="primary"
        panelBg={panelBg}
        panelBorder={panelBorder}
        textPrimary={textPrimary}
        textMuted={textMuted}
        darkMode={darkMode}
      />
      <OverviewCard
        label="Needs Intervention"
        value={overview.needsIntervention.toString()}
        sub="Students flagged"
        icon={AlertTriangle}
        trend={overview.needsIntervention <= 35 ? "up" : "down"}
        variant="alert"
        panelBg={panelBg}
        panelBorder={panelBorder}
        textPrimary={textPrimary}
        textMuted={textMuted}
        darkMode={darkMode}
      />
    </div>
  );
}
