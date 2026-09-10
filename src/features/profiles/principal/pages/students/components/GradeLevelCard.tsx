import { ChevronRight } from "lucide-react";
import students from "../../../../../../shared/images/students.jpg";
import type { GradeLevelSummary } from "../data/types";

interface GradeLevelCardProps {
  gradeLevel: GradeLevelSummary;
  onViewClassList: (gradeLevel: GradeLevelSummary) => void;
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
      <div
        className="h-40 flex items-center justify-center overflow-hidden"
        style={{ backgroundColor: darkMode ? "var(--color-maroon-soft-dark)" : "var(--color-maroon-soft)" }}
      >
        <img src={students} alt="" className="h-full w-full object-cover" />
      </div>

      <div className="p-5 flex flex-col gap-1 flex-1">
        <h2 className={`text-lg font-black ${textPrimary}`}>
          {gradeLevel.grade && gradeLevel.section
            ? `${gradeLevel.grade} \u00B7 ${gradeLevel.section}`
            : gradeLevel.grade || gradeLevel.section || ""}
        </h2>
        <p className={`text-sm ${textMuted}`}>
          {gradeLevel.totalStudents} student{gradeLevel.totalStudents === 1 ? "" : "s"} enrolled this school year.
        </p>

        <button
          onClick={() => onViewClassList(gradeLevel)}
          className="mt-4 text-maroon text-xs font-bold uppercase tracking-wide flex items-center gap-1 hover:underline self-start"
        >
          View Class List <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}