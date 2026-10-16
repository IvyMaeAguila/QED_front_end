import { SkeletonText } from "@shared/components/SkeletonLoading";
import { Users, GraduationCap, TrendingUp, AlertTriangle } from "lucide-react";
import { OverviewCard } from "../../../../shared/components/DashboardUI";
import type { OverviewData } from "../data/types";

interface OverviewCardsProps {
  loading?: boolean;
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
  loading = false,
}: OverviewCardsProps) {
  return (
    <div data-sk-region="principal-overview" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5">
      <OverviewCard loading={loading}
        label="Total Students" region="principal-kpi-total-students"
        value={loading ? <SkeletonText width="4ch" /> : overview.totalStudents.toLocaleString()}
        sub="Currently enrolled"
        icon={GraduationCap}
        showIcon={false}
        compact
        variant="spotlight"
        panelBg={panelBg}
        panelBorder={panelBorder}
        textPrimary={textPrimary}
        textMuted={textMuted}
        darkMode={darkMode}
      />
      <OverviewCard loading={loading}
        label="Total Teachers" region="principal-kpi-total-teachers"
        value={loading ? <SkeletonText width="3ch" /> : overview.totalTeachers.toString()}
        sub="Active teachers"
        icon={Users}
        showIcon={false}
        compact
        variant="gold"
        panelBg={panelBg}
        panelBorder={panelBorder}
        textPrimary={textPrimary}
        textMuted={textMuted}
        darkMode={darkMode}
      />
      <OverviewCard loading={loading}
        label="Overall Attendance" region="principal-kpi-overall-attendance"
        value={loading ? <SkeletonText width="4ch" /> : `${overview.attendance}%`}
        sub={<>{loading ? <SkeletonText width="6ch" className="inline-block align-top" /> : currentTermLabel} average</>}
        icon={TrendingUp}
        showIcon={false}
        compact
        trend={loading ? "flat" : overview.attendance >= 93 ? "up" : "down"}
        variant="primary"
        panelBg={panelBg}
        panelBorder={panelBorder}
        textPrimary={textPrimary}
        textMuted={textMuted}
        darkMode={darkMode}
      />
      <OverviewCard loading={loading}
        label="Academic Performance" region="principal-kpi-academic-performance"
        value={loading ? <SkeletonText width="4ch" /> : `${overview.academicPerf}%`}
        sub={<>{loading ? <SkeletonText width="6ch" className="inline-block align-top" /> : currentTermLabel} overall</>}
        icon={TrendingUp}
        showIcon={false}
        compact
        trend={loading ? "flat" : overview.academicPerf >= 82 ? "up" : "down"}
        variant="primary"
        panelBg={panelBg}
        panelBorder={panelBorder}
        textPrimary={textPrimary}
        textMuted={textMuted}
        darkMode={darkMode}
      />
      <OverviewCard loading={false}
        label="Needs Intervention" region="principal-kpi-needs-intervention"
        value={overview.needsIntervention.toString()}
        sub="Students flagged"
        icon={AlertTriangle}
        showIcon={false}
        compact
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
