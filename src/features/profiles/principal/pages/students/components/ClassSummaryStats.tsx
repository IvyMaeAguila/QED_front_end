import { GraduationCap, Users, DoorOpen } from "lucide-react";
import { MiniStatRow, MiniStat } from "../../../../shared/components/DashboardUI";
import type { SectionInfo } from "../data/types";

interface ClassSummaryStatsProps {
  sectionInfo: SectionInfo;
  totalStudents: number;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
  darkMode: boolean;
}

export function ClassSummaryStats({
  sectionInfo,
  totalStudents,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
  darkMode,
}: ClassSummaryStatsProps) {
  return (
    <MiniStatRow panelBg={panelBg} panelBorder={panelBorder}>
      <MiniStat
        label="Section"
        value={sectionInfo.section}
        icon={GraduationCap}
        textPrimary={textPrimary}
        textMuted={textMuted}
        darkMode={darkMode}
        isFirst
      />
      <MiniStat
        label="Adviser"
        value={sectionInfo.adviser}
        icon={Users}
        textPrimary={textPrimary}
        textMuted={textMuted}
        darkMode={darkMode}
      />
      <MiniStat
        label="Room"
        value={sectionInfo.room}
        icon={DoorOpen}
        textPrimary={textPrimary}
        textMuted={textMuted}
        darkMode={darkMode}
      />
      <MiniStat label="Total Students" value={`${totalStudents}`} textPrimary={textPrimary} textMuted={textMuted} darkMode={darkMode} />
    </MiniStatRow>
  );
}
