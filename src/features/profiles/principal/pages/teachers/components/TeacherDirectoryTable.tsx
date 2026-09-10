import { Users, DoorOpen, ChevronRight, GraduationCap } from "lucide-react";
import { SectionCard } from "../../../../shared/components/DashboardUI";
import type { TeacherSummary } from "../data/types";

interface TeacherDirectoryTableProps {
  teachers: TeacherSummary[];
  onSelectTeacher: (teacherId: string) => void;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
  darkMode: boolean;
}

export function TeacherDirectoryTable({
  teachers,
  onSelectTeacher,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
  darkMode,
}: TeacherDirectoryTableProps) {
  return (
    <SectionCard
      title="Teacher Directory"
      icon={GraduationCap}
      action={
        <span
          className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full"
          style={{
            backgroundColor: darkMode ? "var(--color-gold-soft-dark)" : "var(--color-gold-soft)",
            color: "var(--color-gold-dark)",
          }}
        >
          <Users className="h-3.5 w-3.5" /> {teachers.length} Total Teachers
        </span>
      }
      panelBg={panelBg}
      panelBorder={panelBorder}
      textPrimary={textPrimary}
      darkMode={darkMode}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className={`pb-3 pr-4 text-left text-xs font-bold uppercase tracking-widest ${textMuted}`}>Full Name</th>
              <th className={`pb-3 pr-4 text-left text-xs font-bold uppercase tracking-widest ${textMuted}`}>Advisory &amp; Grade Level</th>
              <th className={`pb-3 pr-4 text-left text-xs font-bold uppercase tracking-widest ${textMuted}`}>Room</th>
              <th className="pb-3 pr-4"></th>
            </tr>
          </thead>
          <tbody>
            {teachers.map((t) => (
              <tr
                key={t.teacherId}
                onClick={() => onSelectTeacher(t.teacherId)}
                className="cursor-pointer transition-colors hover:bg-maroon/5"
                style={{ borderTop: `1px solid ${darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}` }}
              >
                <td className={`py-4 pr-4 font-bold ${textPrimary}`}>{t.fullName}</td>
                <td className={`py-4 pr-4 ${textPrimary}`}>
                  {t.gradeLevel && t.advisorySection
                    ? `${t.gradeLevel} \u00B7 ${t.advisorySection}`
                    : t.gradeLevel || t.advisorySection || ""}
                </td>
                <td className="py-4 pr-4">
                  {t.room && (
                    <span
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full"
                      style={{
                        backgroundColor: darkMode ? "var(--color-maroon-soft-dark)" : "var(--color-maroon-soft)",
                        color: "var(--color-maroon)",
                      }}
                    >
                      <DoorOpen className="h-3.5 w-3.5" /> {t.room}
                    </span>
                  )}
                </td>
                <td className="py-4 pr-4">
                  <span className="text-xs font-bold uppercase tracking-wide flex items-center gap-1 text-maroon">
                    View Schedule <ChevronRight className="h-3 w-3" />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}