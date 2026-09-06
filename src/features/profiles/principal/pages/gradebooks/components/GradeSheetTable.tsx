import { ClipboardList } from "lucide-react";
import { SectionCard } from "../../../../shared/components/DashboardUI";
import type { Student } from "../data/types";
import { StudentGroupTable } from "./StudentGroupTable";

interface GradeSheetTableProps {
  subjects: string[];
  males: Student[];
  females: Student[];
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
  darkMode: boolean;
}

export function GradeSheetTable({
  subjects,
  males,
  females,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
  darkMode,
}: GradeSheetTableProps) {
  return (
    <SectionCard
      title="Grade Sheet"
      icon={ClipboardList}
      panelBg={panelBg}
      panelBorder={panelBorder}
      textPrimary={textPrimary}
      darkMode={darkMode}
    >
      <div className="flex flex-col gap-8">
        <StudentGroupTable
          label="Male"
          students={males}
          subjects={subjects}
          panelBg={panelBg}
          panelBorder={panelBorder}
          textPrimary={textPrimary}
          textMuted={textMuted}
        />
        <StudentGroupTable
          label="Female"
          students={females}
          subjects={subjects}
          panelBg={panelBg}
          panelBorder={panelBorder}
          textPrimary={textPrimary}
          textMuted={textMuted}
        />
      </div>
    </SectionCard>
  );
}
