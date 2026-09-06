import { ChevronRight } from "lucide-react";
import students from "../../../../../../shared/images/students.jpg";
import type { GradeLevelSummary } from "../data/types";

interface GradeLevelCardProps {
  gradeLevel: GradeLevelSummary;
  onViewClassList: (grade: string) => void;
  panelBg: string;
  panelBorder: string;
  textPrimary: string;
  textMuted: string;
  darkMode: boolean;
}

export function GradeLevelCard({
  gradeLevel,
  onViewClassList,
  panelBg,
  panelBorder,
  textPrimary,
  textMuted,
  darkMode,
}: GradeLevelCardProps) {
  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col border"
      style={{ backgroundColor: panelBg, borderColor: panelBorder }}
    >
      {/* Rich media area */}
      <div
        className="h-40 flex items-center justify-center overflow-hidden"
        style={{ backgroundColor: darkMode ? "var(--color-maroon-soft-dark)" : "var(--color-maroon-soft)" }}
      >
        <img src={students} alt="" className="h-full w-full object-cover" />
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col gap-1 flex-1">
        <h2 className={`text-lg font-black ${textPrimary}`}>{gradeLevel.grade}</h2>
        <p className={`text-sm font-semibold ${textMuted}`}>{gradeLevel.section}</p>

        <p className={`text-sm mt-2 ${textMuted}`}>
          {gradeLevel.totalStudents} student{gradeLevel.totalStudents === 1 ? "" : "s"} enrolled this school year.
        </p>

        <button
          onClick={() => onViewClassList(gradeLevel.grade)}
          className="mt-4 text-maroon text-xs font-bold uppercase tracking-wide flex items-center gap-1 hover:underline self-start"
        >
          View Class List <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
