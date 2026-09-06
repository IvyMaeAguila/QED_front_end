import { ClipboardList, Users } from "lucide-react";
import { MiniStat, MiniStatRow } from "../../../../shared/components/DashboardUI";

interface GradeSheetSummaryProps {
  totalStudents: number;
  maleCount: number;
  femaleCount: number;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
  darkMode: boolean;
}

export function GradeSheetSummary({
  totalStudents,
  maleCount,
  femaleCount,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
  darkMode,
}: GradeSheetSummaryProps) {
  return (
    <MiniStatRow panelBg={panelBg} panelBorder={panelBorder}>
      <MiniStat
        label="Total Students"
        value={totalStudents.toString()}
        icon={ClipboardList}
        textPrimary={textPrimary}
        textMuted={textMuted}
        darkMode={darkMode}
        isFirst
      />
      <MiniStat
        label="Male"
        value={maleCount.toString()}
        icon={Users}
        textPrimary={textPrimary}
        textMuted={textMuted}
        darkMode={darkMode}
      />
      <MiniStat
        label="Female"
        value={femaleCount.toString()}
        icon={Users}
        textPrimary={textPrimary}
        textMuted={textMuted}
        darkMode={darkMode}
      />
    </MiniStatRow>
  );
}
