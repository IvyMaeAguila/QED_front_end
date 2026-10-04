import type { Student } from "../data/types";
import { StudentGroupTable } from "./StudentGroupTable";

interface GradeSheetTableProps {
  sectionName: string;
  termLabel: string;
  totalStudents: number;
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
  sectionName,
  termLabel,
  totalStudents,
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
    <section className={`overflow-hidden rounded-2xl border shadow-card ${panelBg} ${panelBorder}`}>
      <div className={`border-b px-4 py-3 text-[11px] font-bold uppercase tracking-wide ${panelBorder} ${textPrimary}`}>
        {sectionName} <span className={textMuted}>· {termLabel} · {totalStudents} students</span>
      </div>
      <StudentGroupTable
        groups={[
          ...(males.length > 0 ? [{ label: "Male" as const, students: males }] : []),
          ...(females.length > 0 ? [{ label: "Female" as const, students: females }] : []),
        ]}
        subjects={subjects}
        panelBg={panelBg}
        panelBorder={panelBorder}
        textPrimary={textPrimary}
        textMuted={textMuted}
        darkMode={darkMode}
      />
    </section>
  );
}
