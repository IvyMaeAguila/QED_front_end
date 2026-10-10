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
  loading?: boolean;
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
  loading = false,
}: GradeSheetSummaryProps) {
  return (
    <MiniStatRow panelBg={panelBg} panelBorder={panelBorder}>
      <MiniStat
        label="Total Students"
        loading={loading} region="grade-sheet-stat-Total Students"
        value={totalStudents.toString()}
        textPrimary={textPrimary}
        textMuted={textMuted}
        darkMode={darkMode}
        isFirst
      />
      <MiniStat
        label="Male"
        loading={loading} region="grade-sheet-stat-Male"
        value={maleCount.toString()}
        textPrimary={textPrimary}
        textMuted={textMuted}
        darkMode={darkMode}
      />
      <MiniStat
        label="Female"
        loading={loading} region="grade-sheet-stat-Female"
        value={femaleCount.toString()}
        textPrimary={textPrimary}
        textMuted={textMuted}
        darkMode={darkMode}
      />
    </MiniStatRow>
  );
}
