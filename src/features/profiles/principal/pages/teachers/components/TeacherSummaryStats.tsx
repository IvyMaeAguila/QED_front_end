import { DoorOpen, GraduationCap, CalendarDays } from "lucide-react";
import { MiniStatRow, MiniStat } from "../../../../shared/components/DashboardUI";
import type { TeacherProfile } from "../data/types";

interface TeacherSummaryStatsProps {
  teacher: TeacherProfile;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
  darkMode: boolean;
}

export function TeacherSummaryStats({
  teacher,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
  darkMode,
}: TeacherSummaryStatsProps) {
  return (
    <MiniStatRow panelBg={panelBg} panelBorder={panelBorder}>
      <MiniStat
        label="Advisory"
        value={`${teacher.gradeLevel ?? ""} · ${teacher.advisorySection ?? ""}`}
        icon={GraduationCap}
        textPrimary={textPrimary}
        textMuted={textMuted}
        darkMode={darkMode}
        isFirst
      />
      <MiniStat
        label="Room"
        value={teacher.room ?? ""}
        icon={DoorOpen}
        textPrimary={textPrimary}
        textMuted={textMuted}
        darkMode={darkMode}
      />
      <MiniStat
        label="Total Classes"
        value={`${teacher.schedule.length} / week`}
        icon={CalendarDays}
        textPrimary={textPrimary}
        textMuted={textMuted}
        darkMode={darkMode}
      />
    </MiniStatRow>
  );
}
